import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import type { Database } from '../platform/db.js';
import type { AuthContext } from '../platform/http/auth.js';
import { sql } from '../platform/sql.js';
import type { ModuleDeps } from '../modules/shared.js';
import {
  CAMPUS_LOCATIONS,
  CATEGORIES,
  DEMO_LISTINGS,
  DEMO_PASSWORD,
  DEMO_USERS,
  HWG_INSTITUTION_ID,
} from './demo-data.js';

/** Stammdaten (immer, idempotent): Institution, Whitelist, Campus-Standorte, Kategorien. */
export async function seedBaseData(database: Database): Promise<void> {
  await database.tx(async ({ db }) => {
    await db.exec(sql`
      INSERT INTO identity.institution (id, name) VALUES (${HWG_INSTITUTION_ID},
        'Hochschule für Wirtschaft und Gesellschaft Ludwigshafen') ON CONFLICT (id) DO NOTHING`);
    // Whitelist ist Daten, nicht Code (REQ-ARCH-003)
    await db.exec(sql`
      INSERT INTO identity.allowed_domain (domain, institution_id, user_type) VALUES
        ('studmail.hwg-lu.de', ${HWG_INSTITUTION_ID}, 'student'),
        ('hwg-lu.de', ${HWG_INSTITUTION_ID}, 'staff')
      ON CONFLICT (domain) DO NOTHING`);
    for (const [sort, name] of CAMPUS_LOCATIONS.entries()) {
      await db.exec(sql`
        INSERT INTO listings.campus_location (institution_id, name, sort) VALUES (${HWG_INSTITUTION_ID}, ${name}, ${sort})
        ON CONFLICT (institution_id, name) DO NOTHING`);
    }
    for (const [sort, c] of CATEGORIES.entries()) {
      await db.exec(sql`
        INSERT INTO listings.category (slug, name, sort, has_study_attributes)
        VALUES (${c.slug}, ${c.name}, ${sort}, ${c.study ?? false}) ON CONFLICT (slug) DO NOTHING`);
    }
  });
}

/** Demo-Daten (REQ-DEMO-001), nur bei SEED_DEMO=true und nur in eine leere Datenbank. */
/**
 * Bei jedem Start im Demo-Modus: Demo-Konten auf die aktuelle Fassung der Rechtstexte heben, damit eine neue
 * Version (ADR-0015) bestehende Installationen nicht blockiert. Konten mit festgelegter alter Fassung (Tim, Testfall
 * für REQ-LEGAL-003) bleiben unverändert.
 */
export async function syncDemoLegalVersions(deps: ModuleDeps): Promise<void> {
  const { database, modules, logger } = deps;
  const created: string[] = [];
  const updated: string[] = [];
  for (const u of DEMO_USERS) {
    // Später ergänzte Demo-Konten (z. B. Tim) auch in bestehenden Installationen anlegen, ohne Anzeigen und Chats
    if (!(await database.db.one(sql`SELECT 1 FROM identity."user" WHERE email = ${u.email}`))) {
      await database.tx((tx) => modules.identity.createVerifiedUser(tx, { ...u, password: DEMO_PASSWORD }));
      created.push(u.email);
      continue;
    }
    if (u.termsVersion || u.privacyAckVersion) continue;
    if (await modules.identity.syncDemoLegalVersions(u.email)) updated.push(u.email);
  }
  if (created.length || updated.length) {
    logger.info({ created: created.length, updated: updated.length }, 'Demo-Konten mit aktuellen Rechtstexten abgeglichen');
  }
}

export async function seedDemoData(deps: ModuleDeps): Promise<void> {
  const { database, modules, logger } = deps;
  const { db } = database;
  if (await db.one(sql`SELECT 1 FROM identity."user" LIMIT 1`)) {
    logger.info('Demo-Daten bereits vorhanden, Seed übersprungen');
    return;
  }
  logger.info('Lege Demo-Daten an …');

  const users = new Map<string, AuthContext>();
  await database.tx(async (tx) => {
    for (const u of DEMO_USERS) {
      const id = await modules.identity.createVerifiedUser(tx, { ...u, password: DEMO_PASSWORD });
      users.set(u.key, {
        userId: id,
        role: u.role,
        institutionId: HWG_INSTITUTION_ID,
        displayName: u.displayName,
        sessionHash: 'seed',
        termsCurrent: true,
      });
    }
  });
  const user = (key: string) => users.get(key)!;

  const categories = new Map((await modules.listings.categories()).map((c) => [c.slug, c.id]));
  const locations = (await modules.listings.locations()).map((l) => l.id);
  const listingIds = new Map<string, string>();

  for (const [index, l] of DEMO_LISTINGS.entries()) {
    const category = CATEGORIES.find((c) => c.slug === l.category)!;
    const owner = user(l.owner);
    const imageIds: string[] = [];
    for (let i = 0; i < (l.images ?? 0); i++) {
      const [upload] = await modules.listings.upload(owner, [{ buffer: await demoImage(category.color, category.glyph, index + i) }]);
      imageIds.push(upload!.id);
    }
    const listing = await modules.listings.create(owner, {
      kind: l.kind,
      title: l.title,
      description: l.description,
      categoryId: categories.get(l.category)!,
      priceType: l.priceType,
      priceCents: l.price ? Math.round(l.price * 100) : null,
      condition: l.condition ?? null,
      locationIds: l.locations.map((i) => locations[i]!),
      attributes: l.attributes,
      imageIds,
    });
    listingIds.set(l.title, listing.id);
    // Realistische Zeitstempel; Ablauf 60 Tage nach Einstellen (eine Anzeige läuft bald ab)
    await db.exec(sql`
      UPDATE listings.listing SET created_at = now() - make_interval(days => ${l.daysAgo}),
        updated_at = now() - make_interval(days => ${l.daysAgo}),
        expires_at = CASE WHEN status = 'active' THEN now() + make_interval(days => ${60 - l.daysAgo}) ELSE expires_at END
      WHERE id = ${listing.id}`);
  }

  // Beispielkonversationen
  const chat = async (from: string, conversationId: string, body: string) =>
    modules.messaging.send(user(from), conversationId, body, randomUUID());

  const statistik = listingIds.get('Statistik-Buch Bamberg/Baur/Krapp')!;
  const c1 = await modules.messaging.start(user('lea'), statistik, 'Hallo Ben, ist das Statistik-Buch noch zu haben?', randomUUID());
  await chat('ben', c1.conversationId, 'Hi Lea, ja, ist noch da! Wann passt es dir am Hauptcampus?');
  await chat('lea', c1.conversationId, 'Morgen nach der Vorlesung um 12 Uhr vor der Mensa?');
  await chat('ben', c1.conversationId, 'Passt, bis morgen!');
  await modules.messaging.deal(user('ben'), c1.conversationId, { action: 'reserve' });

  const stuhl = listingIds.get('Schreibtischstuhl, höhenverstellbar')!;
  const c2 = await modules.messaging.start(user('mia'), stuhl, 'Hallo! Würdest du 25 € für den Stuhl nehmen?', randomUUID());
  await chat('lea', c2.conversationId, 'Hi Mia, 30 € und er gehört dir.');

  const fahrrad = listingIds.get('Fahrrad 28 Zoll, 7-Gang')!;
  const c3 = await modules.messaging.start(user('ben'), fahrrad, 'Hi Sara, kann ich das Rad mal Probe fahren?', randomUUID());
  const spam = await chat('sara', c3.conversationId, 'Klar! Überweis mir vorab 50 € auf DE89 3704 0044 0532 0130 00, dann reserviere ich es.');

  // Offene Meldung (REQ-DEMO-001); die Anzeige mit „Klausurlösungen“ liegt zusätzlich per Wortfilter in der Moderation
  await modules.trust.report(user('ben'), {
    targetType: 'message',
    targetId: spam.id,
    reason: 'fraud',
    details: 'Verlangt Vorkasse per Überweisung, bevor ich das Rad gesehen habe.',
  });

  logger.info(
    { users: DEMO_USERS.length, listings: DEMO_LISTINGS.length },
    `Demo-Daten angelegt. Login z. B. lea@studmail.hwg-lu.de / ${DEMO_PASSWORD}`,
  );
}

const glyphs: Record<string, string> = {
  books: '<rect x="420" y="300" width="360" height="70" rx="8"/><rect x="450" y="380" width="320" height="70" rx="8" opacity=".85"/><rect x="400" y="460" width="380" height="70" rx="8" opacity=".7"/><rect x="440" y="540" width="330" height="70" rx="8" opacity=".85"/>',
  screen: '<rect x="380" y="280" width="440" height="280" rx="20"/><rect x="570" y="560" width="60" height="70"/><rect x="480" y="625" width="240" height="24" rx="12"/>',
  chair: '<rect x="470" y="250" width="260" height="220" rx="30"/><rect x="450" y="480" width="300" height="50" rx="20"/><rect x="585" y="530" width="30" height="110"/><rect x="480" y="630" width="240" height="22" rx="11"/>',
  shirt: '<path d="M480 260 L420 300 L360 380 L430 430 L460 400 L460 660 L740 660 L740 400 L770 430 L840 380 L780 300 L720 260 Q600 330 480 260 Z"/>',
  bike: '<circle cx="450" cy="540" r="110" fill="none" stroke="#fff" stroke-width="22"/><circle cx="750" cy="540" r="110" fill="none" stroke="#fff" stroke-width="22"/><path d="M450 540 L560 380 L700 380 L750 540 M560 380 L620 540 L700 380" fill="none" stroke="#fff" stroke-width="20"/>',
  ball: '<circle cx="600" cy="450" r="190"/><path d="M420 400 Q600 480 780 400 M600 260 Q520 450 600 640" fill="none" stroke-width="16" opacity=".5" stroke="#000"/>',
  pot: '<rect x="400" y="360" width="400" height="260" rx="40"/><rect x="360" y="330" width="480" height="40" rx="20"/><rect x="560" y="280" width="80" height="40" rx="15"/>',
  ticket: '<path d="M360 330 H840 V410 A40 40 0 0 0 840 490 V570 H360 V490 A40 40 0 0 0 360 410 Z"/>',
  bulb: '<circle cx="600" cy="400" r="150"/><rect x="540" y="530" width="120" height="90" rx="15"/><rect x="555" y="625" width="90" height="30" rx="12"/>',
  star: '<path d="M600 250 L655 400 L815 405 L690 500 L735 655 L600 565 L465 655 L510 500 L385 405 L545 400 Z"/>',
};

/** Erzeugt ein schlichtes Platzhalterbild (offline, ohne Schriftarten). */
async function demoImage(color: string, glyph: string, seed: number): Promise<Buffer> {
  const angle = (seed * 47) % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900">
    <defs><linearGradient id="g" gradientTransform="rotate(${angle} .5 .5)">
      <stop offset="0" stop-color="${color}"/><stop offset="1" stop-color="${color}" stop-opacity=".55"/></linearGradient></defs>
    <rect width="1200" height="900" fill="url(#g)"/>
    <circle cx="${150 + ((seed * 131) % 900)}" cy="${120 + ((seed * 71) % 600)}" r="${80 + (seed % 5) * 30}" fill="#fff" opacity=".08"/>
    <g fill="#fff">${glyphs[glyph] ?? glyphs.star}</g></svg>`;
  return sharp(Buffer.from(svg)).jpeg({ quality: 85 }).toBuffer();
}
