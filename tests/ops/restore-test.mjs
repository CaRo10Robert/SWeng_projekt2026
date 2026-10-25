#!/usr/bin/env node
/**
 * Restore-Test gegen ein laufendes Docker-Beispiel (REQ-AVAIL-003, ADR-0018, Nachweis AT-AVAIL-003).
 *   node tests/ops/restore-test.mjs [http://localhost:8080] [--project <compose-projekt>]
 *
 * Teil 1: Legt eine Anzeige mit Bild an, sichert, löscht den Stack samt Volumes (down -v), startet neu,
 * stellt wieder her und prüft Zählungen, Anmeldung, Anzeige und Bild.
 * Teil 2: Sichert, löscht danach eine Anzeige, stellt die Sicherung wieder her und prüft, dass die Löschung über das
 * Löschjournal erhalten bleibt (ADR-0018, RV-A-01). Zerstört die Daten des Stacks!
 * Die Umgebungsvariablen des Starts (z. B. APP_PORT) müssen gesetzt sein, damit `up` denselben Stack erzeugt.
 */
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { compose, parseArgs, ROOT, sql, validBackups, waitHealthy } from '../../scripts/lib/compose.mjs';

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

/** „healthy“ im Container heißt noch nicht, dass die Portweiterleitung des Hosts schon steht (Docker Desktop). */
async function waitForHttp(timeoutMs = 60_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      if ((await fetch(`${BASE}/health/ready`)).ok) return;
    } catch {
      // Verbindung noch nicht möglich
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`${BASE} nicht erreichbar`);
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
const backupDir = join(OUT, validBackups(join(ROOT, OUT))[0].name);

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
await waitForHttp();
const relogin = await login('lea@studmail.hwg-lu.de');
const found = await fetch(`${API}/listings/${listing.id}`, { headers: { cookie: relogin.cookie } });
const image = imageId ? await fetch(`${API}/media/${imageId}/md`, { headers: { cookie: relogin.cookie } }) : { status: 0 };
check('[AT-AVAIL-003] Sicherung → down -v → Wiederherstellung: Zählungen identisch, Anmeldung, Anzeige und Bild wieder da, Dauer ≤ 15 min',
  JSON.stringify(before) === JSON.stringify(after) && relogin.status === 200 && found.status === 200 && image.status === 200 && duration <= RTO_MS,
  { before, after, login: relogin.status, listing: found.status, image: image.status, durationS: Math.round(duration / 1000) });
console.log(`Dauer vom Datenverlust bis „healthy“: ${Math.round(duration / 1000)} s`);

// 6. Teil 2: Löschung nach der Sicherung bleibt nach der Wiederherstellung gelöscht (Löschjournal)
const lea2 = await login('lea@studmail.hwg-lu.de');
const meta2 = await (await fetch(`${API}/meta`)).json();
const title2 = `Restore-Löschjournal ${Date.now()}`;
const second = await (await fetch(`${API}/listings`, {
  method: 'POST',
  headers: { cookie: lea2.cookie, 'x-campusmarkt-csrf': '1', 'content-type': 'application/json' },
  body: JSON.stringify({
    kind: 'offer', title: title2, description: 'Wird nach der Sicherung gelöscht.', categoryId: meta2.categories[0].id,
    priceType: 'fixed', priceCents: 100, condition: 'good', locationIds: [meta2.locations[0].id],
  }),
})).json();
check('Zweite Sicherung erstellt', node('scripts/backup.mjs', ['--out', OUT, '--no-rotate']).status === 0);
const secondBackup = join(OUT, validBackups(join(ROOT, OUT))[0].name);
const deleted = await fetch(`${API}/listings/${second.id}`, { method: 'DELETE', headers: { cookie: lea2.cookie, 'x-campusmarkt-csrf': '1' } });
check('Wiederherstellung der zweiten Sicherung erfolgreich', node('scripts/restore.mjs', [secondBackup, '--yes']).status === 0);
await waitForHttp();
const statusAfter = sql(project, `SELECT status FROM listings.listing WHERE id = '${second.id}'`).stdout.trim();
const lea3 = await login('lea@studmail.hwg-lu.de');
const visible = await fetch(`${API}/listings/${second.id}`, { headers: { cookie: lea3.cookie } });
check('[AT-AVAIL-003] Löschung nach der Sicherung bleibt nach der Wiederherstellung bestehen (Löschjournal)',
  deleted.status === 204 && statusAfter === 'deleted' && visible.status === 404,
  { delete: deleted.status, statusAfter, visible: visible.status });

console.log(failures ? `\n${failures} Prüfung(en) fehlgeschlagen` : '\nAlle Prüfungen bestanden');
process.exit(failures ? 1 : 0);
