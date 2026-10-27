#!/usr/bin/env node
/**
 * CTRL-DLQ (REQ-NOTI-005): Endgültig fehlgeschlagene Mail-Zustellungen erscheinen in der Admin-Ansicht „Jobs“.
 *   node tests/ops/dlq-test.mjs [http://localhost:8080] [--project <compose-projekt>]
 *
 * Ablauf: Mailpit stoppen → Passwort-Reset für Lea anfordern (erzeugt einen Mail-Job) → warten, bis der Job nach
 * 5 Versuchen (10/20/40/80 s Backoff) in der Dead-Letter-Queue liegt → GET /admin/jobs prüft den Eintrag →
 * Mailpit wieder starten. Dauer etwa 3–4 min. Verändert Daten (Reset-Token für Lea).
 */
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const BASE = args.find((a) => a.startsWith('http')) ?? 'http://localhost:8080';
const projectIdx = args.indexOf('--project');
const project = projectIdx >= 0 ? ['-p', args[projectIdx + 1]] : [];
const API = `${BASE}/api/v1`;
const DEMO_PASSWORD = 'CampusMarkt-Demo-2026';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const compose = (...a) => execFileSync('docker', ['compose', ...project, ...a], { stdio: 'pipe' }).toString();

async function call(method, path, body, cookie) {
  const headers = { 'x-campusmarkt-csrf': '1' };
  if (body) headers['content-type'] = 'application/json';
  if (cookie) headers.cookie = cookie;
  const res = await fetch(API + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  return { status: res.status, data: text ? JSON.parse(text) : null, cookie: (res.headers.get('set-cookie') ?? '').split(';')[0] };
}

const admin = await call('POST', '/auth/login', { email: 'admin@hwg-lu.de', password: DEMO_PASSWORD });
if (admin.status !== 200) throw new Error(`Admin-Anmeldung fehlgeschlagen: ${admin.status}`);
const deadBefore = (await call('GET', '/admin/jobs', null, admin.cookie)).data.deadLetters.length;

let ok = false;
const started = Date.now();
compose('stop', 'mailpit');
try {
  const reset = await call('POST', '/auth/password-reset/request', { email: 'lea@studmail.hwg-lu.de' });
  if (reset.status !== 202) throw new Error(`Reset-Anfrage: ${reset.status}`);
  while (Date.now() - started < 6 * 60_000) {
    await sleep(10_000);
    const jobs = (await call('GET', '/admin/jobs', null, admin.cookie)).data;
    const fresh = jobs.deadLetters.slice(0, jobs.deadLetters.length - deadBefore);
    // Dead Letters tragen den Namen der Dead-Letter-Queue; die ursprüngliche Mail steht in data
    const resetMail = fresh.find((d) => /reset/i.test(String(d.data?.template ?? '')));
    if (resetMail) {
      ok = true;
      console.log(`Dead Letter nach ${Math.round((Date.now() - started) / 1000)} s: ${resetMail.name} (Vorlage ${resetMail.data.template})`);
      break;
    }
  }
} finally {
  compose('start', 'mailpit');
}

console.log(`${ok ? '✔' : '✘'} [CTRL-DLQ] Endgültig fehlgeschlagene Mail-Zustellung erscheint in der Admin-Ansicht „Jobs/Dead Letters“`);
process.exit(ok ? 0 : 1);
