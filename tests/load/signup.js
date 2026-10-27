// [AT-PERF-004] Zeit bis zum Versand der Bestätigungsmail (REQ-PERF-004): p95 < 10 s von der Antwort auf die
// Registrierung bis zur Annahme durch den Mail-Catcher (Zeitstempel Mailpit), 50 Registrierungen/min über 5 min,
// keine verlorene Mail. Rate-Limit für den Test angehoben (RATE_LIMIT_FACTOR, nur im Demo-Modus).
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import { API, DURATION, MAILPIT, summary, uuid } from './lib.js';

const mailDelay = new Trend('mail_delay_ms', true);
const lost = new Counter('mail_lost');
const MAX_WAIT_MS = Number(__ENV.MAIL_MAX_WAIT_MS || 60_000);

export const options = {
  scenarios: {
    signup: { executor: 'constant-arrival-rate', rate: 50, timeUnit: '1m', duration: DURATION, preAllocatedVUs: 20, maxVUs: 80 },
  },
  thresholds: {
    mail_delay_ms: ['p(95)<10000'],
    mail_lost: ['count==0'],
    'http_req_failed{name:register}': ['rate==0'],
  },
  summaryTrendStats: ['avg', 'p(50)', 'p(95)', 'p(99)', 'max'],
};

export function setup() {
  return { termsVersion: http.get(`${API}/meta`).json('termsVersion') };
}

export default function (data) {
  const email = `last.${uuid().slice(0, 13)}@studmail.hwg-lu.de`;
  const res = http.post(
    `${API}/auth/register`,
    JSON.stringify({ email, password: 'mein-langes-lasttest-passwort', displayName: 'Lasttest', acceptTerms: true, termsVersion: data.termsVersion }),
    { headers: { 'content-type': 'application/json', 'x-campusmarkt-csrf': '1' }, tags: { name: 'register' } },
  );
  if (!check(res, { 'Registrierung 202': (r) => r.status === 202 })) return;
  const answeredAt = Date.now();
  const deadline = answeredAt + MAX_WAIT_MS;
  while (Date.now() < deadline) {
    const search = http.get(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${email}"`)}`, { tags: { name: 'mailpit' } });
    const message = search.status === 200 ? search.json('messages')?.[0] : undefined;
    if (message) {
      mailDelay.add(Math.max(0, Date.parse(message.Created) - answeredAt));
      return;
    }
    sleep(0.25);
  }
  lost.add(1);
}

export function handleSummary(data) {
  return summary('perf-004-signup-mail', data);
}
