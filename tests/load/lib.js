// Gemeinsame Helfer für die k6-Lasttests (REQ-PERF-001…004, Guideline Kap. 03/09, GL-11).
// Ausführung: node tests/load/run.mjs <szenario> – startet k6 als Container gegen den Compose-Stack.
import http from 'k6/http';
import { fail, sleep } from 'k6';

export const BASE = __ENV.BASE_URL || 'http://localhost:8080';
export const API = `${BASE}/api/v1`;
export const MAILPIT = __ENV.MAILPIT_URL || 'http://localhost:8025';
export const DEMO_PASSWORD = 'CampusMarkt-Demo-2026';
/** Messdauer und Aufwärmphase laut REQ (5 min nach 1 min); für schnelle Probeläufe per Umgebung kürzbar. */
export const DURATION = __ENV.DURATION || '5m';
export const WARMUP = __ENV.WARMUP || '1m';

export const CSRF = { 'x-campusmarkt-csrf': '1' };

/**
 * Anmeldung mit Demo-Konto. Das Sitzungscookie ist `Secure`; k6 sendet es über http nicht automatisch,
 * deshalb wird es als Header weitergereicht.
 */
export function login(email) {
  const res = http.post(`${API}/auth/login`, JSON.stringify({ email, password: DEMO_PASSWORD }), {
    headers: { 'content-type': 'application/json', ...CSRF },
    tags: { name: 'login' },
  });
  if (res.status !== 200) fail(`Anmeldung ${email} fehlgeschlagen: ${res.status} ${res.body}`);
  const cookie = res.headers['Set-Cookie'];
  if (!cookie) fail('Kein Sitzungscookie');
  return { cookie: cookie.split(';')[0], userId: res.json('id') };
}

/**
 * Neues, bestätigtes Konto (Registrierung → Bestätigungslink aus Mailpit → angemeldet). Für Tests, die mehr als die
 * 30 aktiven Anzeigen eines Demo-Kontos brauchen (REQ-LST-005).
 */
export function freshAccount(prefix) {
  const email = `${prefix}.${uuid().slice(0, 13)}@studmail.hwg-lu.de`;
  const termsVersion = http.get(`${API}/meta`).json('termsVersion');
  const reg = http.post(
    `${API}/auth/register`,
    JSON.stringify({ email, password: 'mein-langes-lasttest-passwort', displayName: 'Lasttest', acceptTerms: true, termsVersion }),
    { headers: { 'content-type': 'application/json', ...CSRF } },
  );
  if (reg.status !== 202) fail(`Registrierung ${email}: ${reg.status} ${reg.body}`);
  for (let i = 0; i < 120; i++) {
    const found = http.get(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${email}"`)}`).json('messages');
    if (found && found.length) {
      const text = http.get(`${MAILPIT}/api/v1/message/${found[0].ID}`).json('Text');
      const token = decodeURIComponent((/token=([A-Za-z0-9_\-%]+)/.exec(text) || [])[1] || '');
      const res = http.post(`${API}/auth/verify`, JSON.stringify({ token }), { headers: { 'content-type': 'application/json', ...CSRF } });
      if (res.status !== 200) fail(`Bestätigung ${email}: ${res.status}`);
      return { cookie: res.headers['Set-Cookie'].split(';')[0], userId: res.json('id') };
    }
    sleep(0.25);
  }
  return fail(`Keine Bestätigungsmail für ${email}`);
}

export function authed(session, extra = {}) {
  return { headers: { cookie: session.cookie, ...extra } };
}

export function seconds(duration) {
  const m = /^(\d+)(ms|s|m)$/.exec(duration);
  if (!m) return 60;
  const n = Number(m[1]);
  return m[2] === 'ms' ? n / 1000 : m[2] === 's' ? n : n * 60;
}

export function uuid() {
  const hex = '0123456789abcdef';
  let s = '';
  for (let i = 0; i < 32; i++) s += hex[Math.floor(Math.random() * 16)];
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-4${s.slice(13, 16)}-8${s.slice(17, 20)}-${s.slice(20, 32)}`;
}

/** Kurzbericht in die Konsole und als JSON-Artefakt (Nachweis im CI). */
export function summary(name, data) {
  const pick = (metric, stat) => data.metrics[metric]?.values?.[stat];
  const lines = Object.entries(data.metrics)
    .filter(([, m]) => m.thresholds)
    .map(([key, m]) => {
      const ok = Object.values(m.thresholds).every((t) => t.ok);
      return `${ok ? '✔' : '✘'} ${key} ${JSON.stringify(m.values)}`;
    });
  return {
    stdout: `\n${name}\n${lines.join('\n')}\n`,
    [`/results/${name}.json`]: JSON.stringify({ name, metrics: data.metrics, p95: pick('http_req_duration', 'p(95)') }, null, 2),
  };
}
