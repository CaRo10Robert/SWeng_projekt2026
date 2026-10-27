// [AT-PERF-003] Antwortzeit beim Erstellen einer Anzeige (REQ-PERF-003): p95 < 800 ms, 0 % 5xx bei 2 Anfragen/s
// über 5 min, angemeldete Testkonten, Anzeigen mit 0–8 bereits hochgeladenen Bildern. Gemessen wird nur das Anlegen;
// der Bild-Upload vorher ist nicht Teil der Messung (Bildverarbeitung asynchron).
import http from 'k6/http';
import { check } from 'k6';
import encoding from 'k6/encoding';
import { API, CSRF, DURATION, freshAccount, seconds, summary } from './lib.js';

// 1×1-PNG (gültige Signatur, REQ-SEC-007)
const PNG = encoding.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==');
// Höchstens 30 aktive Anzeigen je Konto (REQ-LST-005): genug frische Konten für 2/s über die ganze Dauer
const ACCOUNTS = Math.ceil((2 * seconds(DURATION)) / 25) + 1;

export const options = {
  setupTimeout: '5m',
  scenarios: {
    create: { executor: 'constant-arrival-rate', rate: 2, timeUnit: '1s', duration: DURATION, preAllocatedVUs: 10, maxVUs: 40 },
  },
  thresholds: {
    'http_req_duration{name:create}': ['p(95)<800'],
    'http_req_failed{name:create}': ['rate==0'],
    checks: ['rate==1'],
  },
  summaryTrendStats: ['avg', 'p(50)', 'p(95)', 'p(99)', 'max'],
};

export function setup() {
  const meta = http.get(`${API}/meta`).json();
  return {
    sessions: Array.from({ length: ACCOUNTS }, () => freshAccount('anzeige')),
    categories: meta.categories.map((c) => c.id),
    locations: meta.locations.map((l) => l.id),
  };
}

export default function (data) {
  // Reihum, damit kein Konto die Grenze von 30 aktiven Anzeigen erreicht
  const session = data.sessions[(__VU * 1000 + __ITER) % data.sessions.length];
  const headers = { cookie: session.cookie, ...CSRF };
  const imageCount = Math.floor(Math.random() * 9); // 0–8
  let imageIds = [];
  if (imageCount > 0) {
    const files = [];
    for (let i = 0; i < imageCount; i++) files.push(http.file(PNG, `bild-${i}.png`, 'image/png'));
    const upload = http.post(`${API}/uploads`, multi(files), { headers, tags: { name: 'upload' } });
    check(upload, { 'Upload 201': (r) => r.status === 201 });
    imageIds = upload.status === 201 ? upload.json('uploads').map((u) => u.id) : [];
  }
  const listing = {
    kind: 'offer',
    title: `Lasttest Anzeige ${__VU}-${__ITER}`,
    description: 'Automatisch erzeugte Anzeige für den Lasttest (REQ-PERF-003).',
    categoryId: data.categories[Math.floor(Math.random() * data.categories.length)],
    priceType: 'fixed',
    priceCents: 100 + Math.floor(Math.random() * 10_000),
    condition: 'good',
    locationIds: [data.locations[0]],
    imageIds,
  };
  const res = http.post(`${API}/listings`, JSON.stringify(listing), {
    headers: { ...headers, 'content-type': 'application/json' },
    tags: { name: 'create' },
  });
  check(res, { 'Anlegen 201': (r) => r.status === 201 });
}

/** k6 erwartet für Multipart ein Objekt; der Server liest alle Datei-Felder unabhängig vom Namen. */
function multi(files) {
  const body = {};
  files.forEach((file, i) => (body[`file${i}`] = file));
  return body;
}

export function handleSummary(data) {
  return summary('perf-003-create-listing', data);
}
