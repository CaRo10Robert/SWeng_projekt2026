#!/usr/bin/env node
/**
 * Restore-Test gegen ein laufendes Docker-Beispiel (REQ-AVAIL-003, ADR-0018, Nachweis AT-AVAIL-003).
 *   node tests/ops/restore-test.mjs [http://localhost:8080] [--project <compose-projekt>]
 *
 * Legt eine Anzeige mit Bild an, sichert, löscht den Stack samt Volumes (down -v), startet neu,
 * stellt wieder her und prüft Zählungen, Anmeldung, Anzeige und Bild. Zerstört die Daten des Stacks!
 * Die Umgebungsvariablen des Starts (z. B. APP_PORT) müssen gesetzt sein, damit `up` denselben Stack erzeugt.
 */
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { compose, parseArgs, ROOT, sql, waitHealthy } from '../../scripts/lib/compose.mjs';

const args = parseArgs(process.argv.slice(2));
const BASE = args._[0] ?? 'http://localhost:8080';
const API = `${BASE}/api/v1`;
const project = args.project ?? process.env.COMPOSE_PROJECT_NAME;
const OUT = 'backups/restore-test';
const RTO_MS = 15 * 60_000; // QS-15, Beispielwert

let failures = 0;
const check = (name, ok, info = '') => {
  console.log(`${ok ? '✔' : '✘'} ${name}${ok ? '' : `  ${typeof info === 'string' ? info : JSON.stringify(info)}`}`);
  if (!ok) failures++;
};

async function login(email, password = 'CampusMarkt-Demo-2026') {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-campusmarkt-csrf': '1' },
    body: JSON.stringify({ email, password }),
  });
  const cookie = res.headers.get('set-cookie')?.split(';')[0] ?? '';
  return { status: res.status, cookie };
}

const counts = () => ({
  users: sql(project, 'SELECT count(*) FROM identity."user"').stdout.trim(),
  listings: sql(project, 'SELECT count(*) FROM listings.listing').stdout.trim(),
  messages: sql(project, 'SELECT count(*) FROM messaging.message').stdout.trim(),
});

// 1. Testdaten: Anzeige mit Bild
const lea = await login('lea@studmail.hwg-lu.de');
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP8z8DAwMDAxMDAwMDAAAANHQEDasKb6QAAAABJRU5ErkJggg==', 'base64');
const form = new FormData();
form.append('files', new Blob([png], { type: 'image/png' }), 'restore.png');
const upload = await (await fetch(`${API}/uploads`, { method: 'POST', headers: { cookie: lea.cookie, 'x-campusmarkt-csrf': '1' }, body: form })).json();
const meta = await (await fetch(`${API}/meta`)).json();
const title = `Restore-Test ${Date.now()}`;
const created = await fetch(`${API}/listings`, {
  method: 'POST',
  headers: { cookie: lea.cookie, 'x-campusmarkt-csrf': '1', 'content-type': 'application/json' },
  body: JSON.stringify({
    kind: 'offer', title, description: 'Anzeige für den Restore-Test.', categoryId: meta.categories[0].id,
    priceType: 'fixed', priceCents: 100, condition: 'good', locationIds: [meta.locations[0].id],
    imageIds: (upload.uploads ?? []).map((u) => u.id),
  }),
});
const listing = await created.json();
// Bilder werden asynchron verarbeitet (REQ-LST-003); erst sichern, wenn die Varianten fertig sind
let detail = listing;
for (let i = 0; i < 40 && detail.images?.[0]?.status !== 'ready'; i++) {
  await new Promise((r) => setTimeout(r, 500));
  detail = await (await fetch(`${API}/listings/${listing.id}`, { headers: { cookie: lea.cookie } })).json();
}
const imageId = detail.images?.[0]?.status === 'ready' ? detail.images[0].id : null;
const before = counts();
check('Testdaten angelegt (Anzeige mit verarbeitetem Bild)', lea.status === 200 && created.status === 201 && !!imageId, { login: lea.status, created: created.status, detail });

// 2. Sicherung
const node = (script, extra) => spawnSync(process.execPath, [script, ...extra, ...(project ? ['--project', project] : [])], { cwd: ROOT, stdio: 'inherit' });
check('Sicherung erstellt', node('scripts/backup.mjs', ['--out', OUT, '--no-rotate']).status === 0);
const backupDir = join(OUT, readdirSync(join(ROOT, OUT)).sort().at(-1));

// 3. Totalverlust simulieren und neu starten
const lossStart = Date.now();
compose(project, ['down', '-v']);
compose(project, ['up', '-d']);
await waitHealthy(project, 'app');
const fresh = counts();
check('Nach down -v: frischer Stand ohne Testanzeige', sql(project, `SELECT count(*) FROM listings.listing WHERE title = '${title}'`).stdout.trim() === '0', fresh);

// 4. Wiederherstellung
check('Wiederherstellung erfolgreich', node('scripts/restore.mjs', [backupDir, '--yes']).status === 0);
const duration = Date.now() - lossStart;
const after = counts();

// 5. Prüfungen
const relogin = await login('lea@studmail.hwg-lu.de');
const found = await fetch(`${API}/listings/${listing.id}`, { headers: { cookie: relogin.cookie } });
const image = imageId ? await fetch(`${API}/media/${imageId}/md`, { headers: { cookie: relogin.cookie } }) : { status: 0 };
check('[AT-AVAIL-003] Sicherung → down -v → Wiederherstellung: Zählungen identisch, Anmeldung, Anzeige und Bild wieder da, Dauer ≤ 15 min',
  JSON.stringify(before) === JSON.stringify(after) && relogin.status === 200 && found.status === 200 && image.status === 200 && duration <= RTO_MS,
  { before, after, login: relogin.status, listing: found.status, image: image.status, durationS: Math.round(duration / 1000) });
console.log(`Dauer vom Datenverlust bis „healthy“: ${Math.round(duration / 1000)} s`);

console.log(failures ? `\n${failures} Prüfung(en) fehlgeschlagen` : '\nAlle Prüfungen bestanden');
process.exit(failures ? 1 : 0);
