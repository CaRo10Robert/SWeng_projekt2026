import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { integrationAvailable, PASSWORD, startHarness, type Client, type Harness } from '../../../test/integration/harness.js';

type Member = Client & { userId: string; email: string };

/** Multipart-Body für /uploads (light-my-request kennt kein FormData). */
function multipart(files: { name: string; type: string; data: Buffer }[]) {
  const boundary = `----cm${Date.now()}`;
  const parts = files.map((f) =>
    Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="files"; filename="${f.name}"\r\nContent-Type: ${f.type}\r\n\r\n`),
      f.data,
      Buffer.from('\r\n'),
    ]),
  );
  return {
    payload: Buffer.concat([...parts, Buffer.from(`--${boundary}--\r\n`)]),
    headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
  };
}

describe.skipIf(!integrationAvailable)('Integration listings und search (PostgreSQL)', () => {
  let h: Harness;
  let meta: { categories: { id: string; slug: string }[]; locations: { id: string }[] };
  let lea: Member;
  let ben: Member;

  const body = (extra: Record<string, unknown> = {}) => ({
    kind: 'offer',
    title: 'Statistik-Buch Fahrmeir',
    description: 'Gut erhaltenes Lehrbuch mit wenigen Notizen.',
    categoryId: meta.categories[0]!.id,
    priceType: 'fixed',
    priceCents: 1500,
    condition: 'good',
    locationIds: [meta.locations[0]!.id],
    ...extra,
  });

  beforeAll(async () => {
    h = await startHarness();
  });
  afterAll(async () => h?.close());
  beforeEach(async () => {
    await h.reset();
    lea = await h.member('lea@studmail.hwg-lu.de');
    ben = await h.member('ben@studmail.hwg-lu.de');
    meta = (await lea.call('GET', '/meta')).data;
  });

  async function upload(client: Member, data: Buffer, type = 'image/png') {
    const form = multipart([{ name: 'foto.png', type, data }]);
    const res = await h.app.inject({
      method: 'POST',
      url: '/api/v1/uploads',
      payload: form.payload,
      headers: { ...form.headers, cookie: client.cookie, 'x-campusmarkt-csrf': '1' },
    });
    return { status: res.statusCode, data: res.json() };
  }

  it('Anzeige mit Bild anlegen, ansehen; Bild wird neu kodiert und ohne Metadaten ausgeliefert', async () => {
    const png = await sharp({ create: { width: 64, height: 48, channels: 3, background: '#3366cc' } }).png().toBuffer();
    const up = await upload(lea, png);
    expect(up.status).toBe(201);
    const created = await lea.call('POST', '/listings', body({ imageIds: up.data.uploads.map((u: { id: string }) => u.id) }));
    expect(created.status).toBe(201);
    expect(created.data.status).toBe('active');
    await h.jobs.drain();
    const detail = await ben.call('GET', `/listings/${created.data.id}`);
    expect(detail.status).toBe(200);
    expect(detail.data.images).toHaveLength(1);
    const image = await ben.call('GET', `/media/${detail.data.images[0].id}/md`);
    expect(image.status).toBe(200);
    expect(await h.client().call('GET', `/media/${detail.data.images[0].id}/md`).then((r) => r.status)).toBe(401);
  });

  it('[AT-LST-003-3] [AT-SEC-007-4] JPEG mit GPS-EXIF: ausgelieferte Bilder in allen Größen ohne Metadaten', async () => {
    const jpeg = await sharp({ create: { width: 800, height: 600, channels: 3, background: '#cc6633' } })
      .jpeg()
      .withExif({
        IFD0: { Make: 'Testkamera', Copyright: 'Lea Muster' },
        IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '49/1 28/1 3000/100', GPSLongitudeRef: 'E', GPSLongitude: '8/1 26/1 1500/100' },
      })
      .toBuffer();
    // Vorbedingung: das Testbild trägt wirklich Standort und Kamera
    const input = await sharp(jpeg).metadata();
    expect(input.exif?.toString('latin1')).toContain('Testkamera');
    expect(input.exif?.length).toBeGreaterThan(50);

    const up = await upload(lea, jpeg, 'image/jpeg');
    expect(up.status).toBe(201);
    const created = await lea.call('POST', '/listings', body({ imageIds: up.data.uploads.map((u: { id: string }) => u.id) }));
    await h.jobs.drain();
    const imageId = (await ben.call('GET', `/listings/${created.data.id}`)).data.images[0].id as string;

    for (const size of ['sm', 'md', 'lg']) {
      const res = await h.app.inject({ method: 'GET', url: `/api/v1/media/${imageId}/${size}`, headers: { cookie: ben.cookie } });
      expect(res.statusCode, `Größe ${size}`).toBe(200);
      const meta = await sharp(res.rawPayload).metadata();
      expect(meta.exif, `Größe ${size}: EXIF`).toBeUndefined();
      expect(meta.xmp, `Größe ${size}: XMP`).toBeUndefined();
      expect(meta.iptc, `Größe ${size}: IPTC`).toBeUndefined();
      expect(res.rawPayload.toString('latin1')).not.toContain('Testkamera');
      expect(res.rawPayload.toString('latin1')).not.toContain('Lea Muster');
    }
  });

  it('Upload ohne gültige Bildsignatur wird abgelehnt (415)', async () => {
    expect((await upload(lea, Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'), 'image/png')).status).toBe(415);
  });

  it('Validierung: Preis, Übergabeort, ISBN', async () => {
    expect((await lea.call('POST', '/listings', body({ priceCents: 1_000_001 }))).status).toBe(422);
    expect((await lea.call('POST', '/listings', body({ locationIds: [] }))).status).toBe(422);
    const book = meta.categories.find((c) => c.slug.includes('buch') || c.slug.includes('book')) ?? meta.categories[0]!;
    expect((await lea.call('POST', '/listings', body({ categoryId: book.id, attributes: { isbn: 'keine-isbn' } }))).status).toBe(422);
  });

  it('Zustandsmodell: pausieren, reaktivieren, bearbeiten, löschen; Fremde dürfen nicht ändern', async () => {
    const { data } = await lea.call('POST', '/listings', body());
    // Fremde erfahren nicht einmal, ob die Anzeige ihnen gehören könnte (404 statt 403, QS-2)
    expect([403, 404]).toContain((await ben.call('POST', `/listings/${data.id}/status`, { action: 'pause' })).status);
    expect((await lea.call('POST', `/listings/${data.id}/status`, { action: 'pause' })).data.status).toBe('paused');
    expect((await lea.call('POST', `/listings/${data.id}/status`, { action: 'reserve' })).status).toBe(409);
    expect((await lea.call('POST', `/listings/${data.id}/status`, { action: 'resume' })).data.status).toBe('active');
    expect((await lea.call('PATCH', `/listings/${data.id}`, { title: 'Statistik-Buch, 3. Auflage' })).data.title).toBe('Statistik-Buch, 3. Auflage');
    expect([403, 404]).toContain((await ben.call('PATCH', `/listings/${data.id}`, { title: 'Übernommen' })).status);
    expect((await lea.call('DELETE', `/listings/${data.id}`)).status).toBe(204);
    expect((await ben.call('GET', `/listings/${data.id}`)).status).toBe(404);
  });

  it('Inhaltsprüfung: verbotene Begriffe landen in der Moderation statt in der Suche', async () => {
    const held = await lea.call('POST', '/listings', body({ title: 'Verkaufe Klausurlösungen', description: 'Alle Lösungen.' }));
    expect(held.status).toBe(201);
    expect(held.data.status).toBe('in_review');
    const search = await ben.call('GET', `/listings?q=${encodeURIComponent('Klausurlösungen')}`);
    expect(search.data.items.map((i: { id: string }) => i.id)).not.toContain(held.data.id);
  });

  it('[AT-SRCH-002] Filterkombinationen und Sortierungen liefern passende Treffer in richtiger Reihenfolge', async () => {
    const [cat1, cat2] = meta.categories;
    const created = [
      await lea.call('POST', '/listings', body({ title: 'Taschenrechner Casio', priceCents: 900, categoryId: cat1!.id })),
      await lea.call('POST', '/listings', body({ title: 'Taschenrechner TI-84', priceCents: 4500, categoryId: cat1!.id, condition: 'new' })),
      await lea.call('POST', '/listings', body({ title: 'Schreibtischlampe', priceType: 'free', priceCents: undefined, categoryId: cat2!.id })),
      await lea.call('POST', '/listings', body({ title: 'Suche Taschenrechner', kind: 'wanted', priceType: 'negotiable', priceCents: 500, categoryId: cat1!.id })),
    ];
    expect(created.map((c) => [c.status, c.data.code])).toEqual(created.map(() => [201, undefined]));
    const ids = async (query: string) => ((await ben.call('GET', `/listings?${query}`)).data.items as { id: string }[]).map((i) => i.id);
    const [casio, ti, lampe, gesuch] = created.map((c) => c.data.id as string);

    expect(new Set(await ids('q=Taschenrechner'))).toEqual(new Set([casio, ti, gesuch]));
    expect(await ids(`q=Taschenrechner&kind=offer&sort=price_asc`)).toEqual([casio, ti]);
    expect(await ids(`q=Taschenrechner&kind=offer&sort=price_desc`)).toEqual([ti, casio]);
    expect(await ids(`categoryId=${cat1!.id}&minPriceCents=1000&maxPriceCents=5000`)).toEqual([ti]);
    expect(await ids(`categoryId=${cat1!.id}&condition=new`)).toEqual([ti]);
    expect(await ids('priceType=free')).toEqual([lampe]);
    expect(await ids('kind=wanted')).toEqual([gesuch]);
    expect((await ids('sort=newest'))[0]).toBe(gesuch);
    expect(await ids('q=Fahrrad')).toEqual([]);
  });

  it('[AT-SRCH-006] Blockierung in beide Richtungen und Sperre blenden Anzeigen aus', async () => {
    const leaListing = (await lea.call('POST', '/listings', body({ title: 'Kaffeemaschine' }))).data.id;
    const benListing = (await ben.call('POST', '/listings', body({ title: 'Kaffeebohnen' }))).data.id;
    const found = async (c: Member, q: string) =>
      ((await c.call('GET', `/listings?q=${q}`)).data.items as { id: string }[]).map((i) => i.id);
    expect(await found(ben, 'Kaffeemaschine')).toContain(leaListing);
    expect((await lea.call('PUT', `/users/${ben.userId}/block`)).status).toBe(204);
    // Ben sieht Leas Anzeige nicht mehr, Lea sieht Bens nicht mehr
    expect(await found(ben, 'Kaffeemaschine')).not.toContain(leaListing);
    expect(await found(lea, 'Kaffeebohnen')).not.toContain(benListing);
    expect((await lea.call('DELETE', `/users/${ben.userId}/block`)).status).toBe(204);
    expect(await found(ben, 'Kaffeemaschine')).toContain(leaListing);
    // Gesperrte Anbieter erscheinen nicht in der Suche
    const mia = await h.member('mia@studmail.hwg-lu.de');
    const mod = await h.staff('mod@hwg-lu.de', 'moderator');
    await lea.call('POST', '/reports', { targetType: 'user', targetId: ben.userId, reason: 'fraud', details: 'Integrationstest' });
    const banCase = ((await mod.call('GET', '/moderation/cases?status=open')).data as { id: string; targetId: string }[]).find((c) => c.targetId === ben.userId);
    const ban = await mod.call('POST', `/moderation/cases/${banCase!.id}/decision`, {
      decision: 'ban', reason: 'Wiederholter Betrug mit Vorkasse, Konto gesperrt.', ruleRef: 'terms_member_duties',
    });
    expect(ban.status).toBe(204);
    expect(await found(mia, 'Kaffeebohnen')).not.toContain(benListing);
  });

  it('[AT-LST-011] die 31. aktive Anzeige wird abgelehnt, auch bei gleichzeitigen Anfragen', async () => {
    const parallel = await Promise.all(
      Array.from({ length: 33 }, (_, i) => lea.call('POST', '/listings', body({ title: `Anzeige Nummer ${i + 1}` }))),
    );
    const accepted = parallel.filter((r) => r.status === 201);
    const rejected = parallel.filter((r) => r.status === 422);
    expect(accepted).toHaveLength(30);
    expect(rejected).toHaveLength(3);
    expect(rejected.every((r) => r.data.code === 'listing_limit')).toBe(true);
    const [{ n }] = await h.sql(`SELECT count(*)::int AS n FROM listings.listing WHERE status = 'active'`);
    expect(n).toBe(30);
  });

  it('Merkliste: hinzufügen, anzeigen, entfernen', async () => {
    const id = (await lea.call('POST', '/listings', body())).data.id;
    expect((await ben.call('PUT', `/listings/${id}/favorite`)).status).toBe(204);
    expect((await ben.call('GET', '/me/favorites')).data.map((i: { id: string }) => i.id)).toContain(id);
    expect((await ben.call('DELETE', `/listings/${id}/favorite`)).status).toBe(204);
    expect((await ben.call('GET', '/me/favorites')).data).toHaveLength(0);
  });

  it('[AT-LST-013] Erneuerung alle 14 Tage: Hinweis, automatische Pause, Löschung; Erneuern und Reaktivieren; Abgrenzungen; idempotent', async () => {
    const id = async (title: string) => (await lea.call('POST', '/listings', body({ title }))).data.id as string;
    const row = async (listingId: string) =>
      (await h.sql(`SELECT status, paused_reason, reminder_sent_at, expires_at FROM listings.listing WHERE id = $1`, [listingId]))[0];
    const due = await id('Tag 14 erreicht');
    const grace = await id('Hinweis vor 25 Stunden');
    const autoOld = await id('Seit 49 Stunden automatisch pausiert');
    const autoFresh = await id('Seit 47 Stunden automatisch pausiert');
    const ownLong = await id('Seit 91 Tagen selbst pausiert');
    const ownShort = await id('Seit 89 Tagen selbst pausiert');
    const reserved = await id('Reserviert über die Frist');
    const hidden = await id('Ausgeblendet über die Frist');
    const legacy = await id('Abgelaufene Bestandsanzeige');

    await h.sql(`UPDATE listings.listing SET expires_at = now() - interval '1 minute' WHERE id = ANY($1::uuid[])`, [[due, grace, reserved, hidden]]);
    await h.sql(`UPDATE listings.listing SET reminder_sent_at = now() - interval '25 hours' WHERE id = $1`, [grace]);
    await h.sql(`UPDATE listings.listing SET status = 'paused', paused_reason = 'auto', status_changed_at = now() - interval '49 hours' WHERE id = $1`, [autoOld]);
    await h.sql(`UPDATE listings.listing SET status = 'paused', paused_reason = 'auto', status_changed_at = now() - interval '47 hours' WHERE id = $1`, [autoFresh]);
    for (const [listingId, days] of [[ownLong, 91], [ownShort, 89]] as const) {
      await lea.call('POST', `/listings/${listingId}/status`, { action: 'pause' });
      await h.sql(`UPDATE listings.listing SET status_changed_at = now() - make_interval(days => $2) WHERE id = $1`, [listingId, days]);
    }
    await h.sql(`UPDATE listings.listing SET status = 'reserved' WHERE id = $1`, [reserved]);
    await h.sql(`UPDATE listings.listing SET hidden = true WHERE id = $1`, [hidden]);
    await h.sql(`UPDATE listings.listing SET status = 'expired' WHERE id = $1`, [legacy]);

    const stats = await h.modules.listings.maintenance();
    await h.jobs.drain();
    expect(stats).toMatchObject({ reminders: 1, expired: 3, autoDeleted: 1 });

    // Tag 14: weiterhin aktiv und für andere sichtbar, Hinweis gesetzt
    expect(await row(due)).toMatchObject({ status: 'active', paused_reason: null });
    expect((await row(due)).reminder_sent_at).not.toBeNull();
    expect((await ben.call('GET', `/listings/${due}`)).status).toBe(200);
    // Tag 15: automatisch pausiert, für andere 404, beim Anbieter mit Löschdatum
    expect(await row(grace)).toMatchObject({ status: 'paused', paused_reason: 'auto' });
    expect((await ben.call('GET', `/listings/${grace}`)).status).toBe(404);
    const mine = (await lea.call('GET', '/me/listings')).data as { id: string; autoDeleteAt: string | null; renewBy: string | null }[];
    const deleteAt = new Date(mine.find((c) => c.id === grace)!.autoDeleteAt!).getTime();
    expect(Math.abs(deleteAt - (Date.now() + 2 * 86_400_000))).toBeLessThan(60_000);
    expect(new Date(mine.find((c) => c.id === due)!.renewBy!).getTime()).toBeGreaterThan(Date.now() + 23 * 3_600_000);
    // Tag 17: gelöscht; nach 47 Stunden noch nicht
    expect((await row(autoOld)).status).toBe('deleted');
    expect(await row(autoFresh)).toMatchObject({ status: 'paused', paused_reason: 'auto' });
    // Eigene Pause: nach 90 Tagen wie automatisch pausiert, vorher unverändert
    expect(await row(ownLong)).toMatchObject({ status: 'paused', paused_reason: 'auto' });
    expect(await row(ownShort)).toMatchObject({ status: 'paused', paused_reason: 'owner' });
    // Reserviert und ausgeblendet: Frist ruht; abgelaufene Bestandsanzeige wird automatisch pausiert
    expect((await row(reserved)).status).toBe('reserved');
    expect((await row(reserved)).reminder_sent_at).toBeNull();
    expect((await row(hidden)).reminder_sent_at).toBeNull();
    expect(await row(legacy)).toMatchObject({ status: 'paused', paused_reason: 'auto' });

    // Idempotent: zweiter Lauf ändert nichts
    expect(await h.modules.listings.maintenance()).toMatchObject({ reminders: 0, expired: 0, autoDeleted: 0 });

    // Erneuern (aktiv) und Reaktivieren (automatisch pausiert): neue 14-Tage-Frist; nur der Anbieter
    expect((await ben.call('POST', `/listings/${due}/status`, { action: 'extend' })).status).toBe(404);
    expect((await lea.call('POST', `/listings/${due}/status`, { action: 'extend' })).data.status).toBe('active');
    expect((await lea.call('POST', `/listings/${grace}/status`, { action: 'resume' })).data.status).toBe('active');
    for (const listingId of [due, grace]) {
      const r = await row(listingId);
      expect(r).toMatchObject({ status: 'active', paused_reason: null, reminder_sent_at: null });
      expect(new Date(r.expires_at).getTime()).toBeGreaterThan(Date.now() + 13.9 * 86_400_000);
    }
    expect((await ben.call('GET', `/listings/${grace}`)).status).toBe(200);
  });

  it('[AT-LST-013-2] je Übergang genau eine Benachrichtigung an den Anbieter, E-Mail nur ohne Abbestellung, keine bei eigener Aktion', async () => {
    const kinds = async () => ((await lea.call('GET', '/me/notifications')).data.items as { kind: string }[]).map((n) => n.kind);
    const listingId = (await lea.call('POST', '/listings', body({ title: 'Benachrichtigte Anzeige' }))).data.id as string;
    const mails = () => h.mail.to(lea.email).filter((m) => m.text.includes('Benachrichtigte Anzeige'));

    await h.sql(`UPDATE listings.listing SET expires_at = now() - interval '1 minute' WHERE id = $1`, [listingId]);
    await h.modules.listings.maintenance();
    await h.jobs.drain();
    expect(await kinds()).toEqual(['listing_renewal_due']);
    expect(mails()).toHaveLength(1);

    // E-Mails abbestellt: die Benachrichtigung in der App kommt trotzdem
    await lea.call('PATCH', '/me', { notificationPrefs: { newMessage: true, listingExpiry: false } });
    await h.sql(`UPDATE listings.listing SET reminder_sent_at = now() - interval '25 hours' WHERE id = $1`, [listingId]);
    await h.modules.listings.maintenance();
    await h.jobs.drain();
    expect(await kinds()).toEqual(['listing_auto_paused', 'listing_renewal_due']);
    expect(mails()).toHaveLength(1);

    // Eigene Aktion (Reaktivieren, Pausieren): keine Benachrichtigung
    await lea.call('POST', `/listings/${listingId}/status`, { action: 'resume' });
    await lea.call('POST', `/listings/${listingId}/status`, { action: 'pause' });
    await h.jobs.drain();
    expect(await kinds()).toHaveLength(2);

    // Löschung nach automatischer Pause
    await h.sql(`UPDATE listings.listing SET paused_reason = 'auto', status_changed_at = now() - interval '49 hours' WHERE id = $1`, [listingId]);
    await h.modules.listings.maintenance();
    await h.jobs.drain();
    expect((await kinds())[0]).toBe('listing_deleted');
    expect(await kinds()).toHaveLength(3);
  });

  it('[AT-LST-008] [AT-PRIV-003] Szenario mit vorgestellter Zeit: Rückfall der Reservierung, Löschfristen für Anzeigen und Konten (Laufzeit aktiver Anzeigen seit R2: AT-LST-013)', async () => {
    const id = async (title: string) => (await lea.call('POST', '/listings', body({ title }))).data.id as string;
    const status = async (listingId: string) =>
      (await h.sql(`SELECT status FROM listings.listing WHERE id = $1`, [listingId]))[0]?.status as string | undefined;
    const reserved = await id('Seit 31 Tagen reserviert');
    const reservedFresh = await id('Seit 29 Tagen reserviert');
    const completedOld = await id('Seit 31 Tagen abgegeben');
    const completedFresh = await id('Seit 29 Tagen abgegeben');

    // Reservierung über den Deal-Kern (REQ-CHAT-011), damit der Rückfall den offenen Deal aufheben muss
    const reserve = async (listingId: string) => {
      const conv = (await ben.call('POST', '/conversations', { listingId, body: 'Reservierst du mir das?', clientMsgId: randomUUID() })).data.conversationId as string;
      expect((await lea.call('POST', `/conversations/${conv}/deal`, { action: 'reserve' })).status).toBe(200);
      return conv;
    };
    const conv = await reserve(reserved);
    await reserve(reservedFresh);

    await h.sql(`UPDATE listings.listing SET status_changed_at = now() - interval '31 days' WHERE id = $1`, [reserved]);
    await h.sql(`UPDATE listings.listing SET status_changed_at = now() - interval '29 days' WHERE id = $1`, [reservedFresh]);
    await h.sql(`UPDATE listings.listing SET status = 'completed', status_changed_at = now() - interval '31 days' WHERE id = $1`, [completedOld]);
    await h.sql(`UPDATE listings.listing SET status = 'completed', status_changed_at = now() - interval '29 days' WHERE id = $1`, [completedFresh]);
    h.jobs.queued = [];

    const stats = await h.modules.listings.maintenance();
    const dealEvents = h.jobs.queued.filter((j) => j.name === 'deal-events').map((j) => j.data as { type: string; eventId: string });
    await h.jobs.drain();
    expect(stats).toMatchObject({ reservationFallback: 1, purged: 1 });

    // Rückfall: aktiv, wieder in der Suche, offener Deal aufgehoben, Hinweis an den Anbieter, Systemnachricht im Chat
    expect(await status(reserved)).toBe('active');
    expect(await status(reservedFresh)).toBe('reserved');
    const deals = await h.sql(`SELECT status FROM messaging.deal WHERE listing_id = $1`, [reserved]);
    expect(deals.map((d) => d.status)).toEqual(['cancelled']);
    expect(dealEvents.some((e) => e.type === 'DealCancelled' && Boolean(e.eventId))).toBe(true);
    const hint = h.mail.to(lea.email).filter((m) => m.subject.includes('Seit 31 Tagen reserviert'));
    expect(hint).toHaveLength(1);
    expect(hint[0]!.text).toContain('Impressum');
    const messages = (await ben.call('GET', `/conversations/${conv}/messages`)).data as { kind: string; systemCode: string | null }[];
    expect(messages.some((m) => m.kind === 'system' && m.systemCode === 'reservation_expired')).toBe(true);
    const search = (await ben.call('GET', `/listings?q=${encodeURIComponent('Seit 31 Tagen reserviert')}`)).data.items as { id: string }[];
    expect(search.map((i) => i.id)).toContain(reserved);

    // Rückfall startet eine neue 14-Tage-Frist (REQ-LST-013)
    const fallback = (await h.sql(`SELECT expires_at FROM listings.listing WHERE id = $1`, [reserved]))[0];
    expect(new Date(fallback.expires_at).getTime()).toBeGreaterThan(Date.now() + 13.9 * 86_400_000);

    // Löschfristen Anzeigen: abgegeben > 30 Tage gelöscht, jüngere bleiben
    expect(await status(completedOld)).toBe('deleted');
    expect(await status(completedFresh)).toBe('completed');

    // Zweiter Lauf ändert nichts mehr
    const again = await h.modules.listings.maintenance();
    expect(again).toMatchObject({ reminders: 0, expired: 0, reservationFallback: 0 });

    // Konten: unbestätigt > 7 Tage gelöscht, Löschantrag nach 14 Tagen Karenz vollzogen
    const meta = (await h.client().call('GET', '/meta')).data as { termsVersion: string };
    const register = await h.client().call('POST', '/auth/register', {
      email: 'nie.bestaetigt@studmail.hwg-lu.de', password: PASSWORD, displayName: 'Nie', acceptTerms: true, termsVersion: meta.termsVersion,
    });
    expect(register.status).toBe(202);
    await h.sql(`UPDATE identity."user" SET created_at = now() - interval '8 days' WHERE email = 'nie.bestaetigt@studmail.hwg-lu.de'`);
    await h.privacy.purgeExpired();
    expect(await h.sql(`SELECT 1 FROM identity."user" WHERE email = 'nie.bestaetigt@studmail.hwg-lu.de'`)).toHaveLength(0);
    expect((await ben.call('POST', '/me/delete', { password: PASSWORD })).status).toBeLessThan(300);
    await h.sql(`UPDATE identity."user" SET deletion_requested_at = now() - interval '13 days' WHERE email = $1`, [ben.email]);
    expect(await h.privacy.purgeDueAccounts()).toBe(0);
    await h.sql(`UPDATE identity."user" SET deletion_requested_at = now() - interval '15 days' WHERE email = $1`, [ben.email]);
    expect(await h.privacy.purgeDueAccounts()).toBe(1);
    expect(await h.sql(`SELECT 1 FROM identity."user" WHERE email = $1`, [ben.email])).toHaveLength(0);
  });

  it('eigene Anzeigen und Moderationsstatus in „Meine Anzeigen“', async () => {
    await lea.call('POST', '/listings', body({ title: 'Erste' }));
    await lea.call('POST', '/listings', body({ title: 'Zweite' }));
    const mine = await lea.call('GET', '/me/listings');
    expect(mine.status).toBe(200);
    expect((mine.data.items ?? mine.data).length).toBe(2);
  });
});
