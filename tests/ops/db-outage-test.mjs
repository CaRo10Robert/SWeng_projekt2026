#!/usr/bin/env node
/**
 * Datenbankausfall (REQ-OPS-001 Kriterium 1, REQ-OPS-007; Befund B-1 aus MAN-OPS-011):
 *   node tests/ops/db-outage-test.mjs [http://localhost:8080] [--project <compose-projekt>]
 *
 * Ablauf: Datenbank-Container stoppen → die App läuft weiter (kein Neustart des Containers), Lebendigkeit „ok“,
 * Bereitschaft 503, Statusseite meldet die Datenbank als gestört, Rechtsseite und Statusseite der SPA laden →
 * Datenbank starten → Bereitschaft innerhalb von 60 s wieder 200, Anmeldung funktioniert. Dauer etwa 1–2 min.
 */
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const BASE = args.find((a) => a.startsWith('http')) ?? 'http://localhost:8080';
const projectIdx = args.indexOf('--project');
const project = projectIdx >= 0 ? ['-p', args[projectIdx + 1]] : [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const compose = (...a) => execFileSync('docker', ['compose', ...project, ...a], { stdio: 'pipe' }).toString();

let failures = 0;
function check(name, ok, detail) {
  if (!ok) failures++;
  console.log(`${ok ? '✔' : '✘'} ${name}${ok || detail === undefined ? '' : `  ${JSON.stringify(detail)}`}`);
}

async function get(path) {
  try {
    const res = await fetch(BASE + path, { signal: AbortSignal.timeout(15_000) });
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      // HTML
    }
    return { status: res.status, text, json };
  } catch (error) {
    return { status: 0, text: String(error), json: null };
  }
}

const appId = () => compose('ps', '-q', 'app').trim();
const restarts = () => Number(execFileSync('docker', ['inspect', '-f', '{{.RestartCount}}', appId()]).toString().trim());
const startedAt = () => execFileSync('docker', ['inspect', '-f', '{{.State.StartedAt}}', appId()]).toString().trim();

check('Ausgangslage: bereit', (await get('/health/ready')).status === 200);
const before = { restarts: restarts(), startedAt: startedAt() };

compose('stop', 'db');
try {
  // Abgebrochene Pool-Verbindungen erzeugen 'error'-Events; ohne Handler beendet Node den Prozess (B-1)
  await sleep(8_000);
  const live = await get('/health/live');
  const ready = await get('/health/ready');
  const status = await get('/api/v1/status');
  const legal = await get('/impressum');
  const statusPage = await get('/status');
  await sleep(3_000);
  const after = { restarts: restarts(), startedAt: startedAt() };
  check('App-Prozess läuft weiter (kein Absturz, kein Neustart)', after.restarts === before.restarts && after.startedAt === before.startedAt, { before, after });
  check('Lebendigkeit bleibt „ok“ (REQ-OPS-001)', live.status === 200, live.status);
  check('Bereitschaft meldet „nicht bereit“ (REQ-OPS-001)', ready.status === 503, ready.status);
  const db = status.json?.services?.find((s) => s.id === 'database');
  check('Status-API meldet die Datenbank als gestört, ohne interne Details (REQ-OPS-007)',
    status.status === 200 && db?.status === 'disrupted' && !/postgres|ECONN|password|host/i.test(status.text), { status: status.status, db });
  check('Rechtsseite und Statusseite sind erreichbar', legal.status === 200 && statusPage.status === 200, [legal.status, statusPage.status]);
} finally {
  compose('start', 'db');
}

const recovered = Date.now();
let ready = 0;
while (Date.now() - recovered < 60_000) {
  ready = (await get('/health/ready')).status;
  if (ready === 200) break;
  await sleep(2_000);
}
check('Nach dem Datenbankstart wieder bereit (≤ 60 s)', ready === 200, { ready, seconds: Math.round((Date.now() - recovered) / 1000) });
const login = await fetch(`${BASE}/api/v1/auth/login`, {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'x-campusmarkt-csrf': '1' },
  body: JSON.stringify({ email: 'lea@studmail.hwg-lu.de', password: 'CampusMarkt-Demo-2026' }),
});
check('Anmeldung funktioniert nach dem Ausfall', login.status === 200, login.status);

console.log(failures ? `\n${failures} Prüfung(en) fehlgeschlagen` : '\nAlle Prüfungen bestanden');
process.exit(failures ? 1 : 0);
