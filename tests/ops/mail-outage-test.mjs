#!/usr/bin/env node
/**
 * AT-NOTI-005 (REQ-NOTI-005, QS-3): Ein Ausfall des Mailservers bis 30 min wird ohne Verlust und ohne Duplikate überbrückt.
 *   node tests/ops/mail-outage-test.mjs [app-url] [mailpit-url] [--project <compose-projekt>]
 *
 * Voraussetzung: Stack mit verkürztem Wiederholungsplan, z. B. `MAIL_RETRY_DELAY_SECONDS=10 docker compose up -d --wait`.
 * Das Messverfahren erlaubt das, solange das Verhältnis Ausfalldauer zu Wiederholungsplan gleich bleibt: Skala =
 * 120 s (Produktivwert, ADR-0005) / eingestellter Abstand; 30 min Ausfall werden zu 1800 s / Skala.
 *
 * Ablauf: Mailpit stoppen → neues Konto registrieren (Antwortzeit < 800 ms, unabhängig vom Mailserver) →
 * skalierte 30 min warten → Mailpit starten → die Bestätigungsmail kommt innerhalb weiterer skalierter 30 min
 * genau einmal an. Bei 10 s Abstand dauert der Test etwa 3–5 min.
 */
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const urls = args.filter((a) => a.startsWith('http'));
const BASE = urls[0] ?? 'http://localhost:8080';
const MAILPIT = urls[1] ?? 'http://localhost:8025';
const projectIdx = args.indexOf('--project');
const project = projectIdx >= 0 ? ['-p', args[projectIdx + 1]] : [];
const API = `${BASE}/api/v1`;
const PRODUCTION_DELAY_S = 120;
const OUTAGE_S = 30 * 60;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const compose = (...a) => execFileSync('docker', ['compose', ...project, ...a], { stdio: 'pipe' }).toString();

let failures = 0;
function check(name, ok, detail) {
  if (!ok) failures++;
  console.log(`${ok ? '✔' : '✘'} ${name}${ok || detail === undefined ? '' : `  ${JSON.stringify(detail)}`}`);
}

// Eingestellten Abstand aus dem laufenden Container lesen, damit Skala und Stack sicher zusammenpassen
const appId = compose('ps', '-q', 'app').trim();
const envLines = JSON.parse(execFileSync('docker', ['inspect', '-f', '{{json .Config.Env}}', appId]).toString());
const delay = Number((envLines.find((l) => l.startsWith('MAIL_RETRY_DELAY_SECONDS=')) ?? '=120').split('=')[1]);
const scale = PRODUCTION_DELAY_S / delay;
const scaledOutageMs = (OUTAGE_S / scale) * 1000;
if (scaledOutageMs > 10 * 60_000) {
  console.error(`MAIL_RETRY_DELAY_SECONDS=${delay}: Ausfall müsste ${Math.round(scaledOutageMs / 60_000)} min dauern. Stack mit MAIL_RETRY_DELAY_SECONDS=10 starten.`);
  process.exit(2);
}
console.log(`Wiederholungsabstand ${delay} s → Skala 1:${scale}, simulierter Ausfall von 30 min = ${scaledOutageMs / 1000} s`);

async function mailsTo(address) {
  const res = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${address}"`)}`);
  return res.ok ? ((await res.json()).messages ?? []) : null;
}

const email = `ausfall-${Date.now()}@studmail.hwg-lu.de`;
const terms = (await (await fetch(`${API}/meta`)).json()).termsVersion;

compose('stop', 'mailpit');
let mailpitStarted = false;
try {
  const t0 = performance.now();
  const reg = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-campusmarkt-csrf': '1' },
    body: JSON.stringify({ email, password: 'Ausfall-Test-2026!', displayName: 'Ausfalltest', acceptTerms: true, termsVersion: terms }),
  });
  const ms = Math.round(performance.now() - t0);
  check('Registrierung bei ausgefallenem Mailserver angenommen (202)', reg.status === 202, reg.status);
  check(`Antwortzeit unabhängig vom Mailserver (< 800 ms, gemessen ${ms} ms)`, ms < 800, ms);

  await sleep(scaledOutageMs);
  compose('start', 'mailpit');
  mailpitStarted = true;
  const restoredAt = Date.now();

  let mails = [];
  while (Date.now() - restoredAt < scaledOutageMs) {
    await sleep(5_000);
    mails = (await mailsTo(email)) ?? [];
    if (mails.length) break;
  }
  const after = Math.round((Date.now() - restoredAt) / 1000);
  check(`Bestätigungsmail nach dem Ausfall zugestellt (nach ${after} s)`, mails.length >= 1, mails.length);
  // Nachzügler abwarten, dann Duplikate zählen
  await sleep(3 * delay * 1000);
  mails = (await mailsTo(email)) ?? [];
  check('Genau eine Zustellung (0 Duplikate)', mails.length === 1, mails.length);
} finally {
  if (!mailpitStarted) compose('start', 'mailpit');
}

console.log(`${failures ? '✘' : '✔'} [AT-NOTI-005] Mailserver-Ausfall bis 30 min ohne Verlust und ohne Duplikate überbrückt`);
process.exit(failures ? 1 : 0);
