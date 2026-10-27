// [AT-PERF-001] Antwortzeit der Suche (REQ-PERF-001): p95 < 500 ms, p99 < 1.500 ms, 0 % 5xx bei 20 Anfragen/s,
// 5 min Dauerlast nach 1 min Aufwärmen, Mischung Freitext 50 % / Filter 30 % / Blättern 20 %, Seed 10.000 Anzeigen.
import http from 'k6/http';
import { check } from 'k6';
import { API, DURATION, WARMUP, authed, login, summary } from './lib.js';

const WORDS = ['Buch', 'Statistik', 'Fahrrad', 'Lampe', 'Regal', 'Taschenrechner', 'Monitor', 'Stuhl', 'Kaffeemaschine', 'Jacke', 'Skript', 'Rucksack'];

export const options = {
  scenarios: {
    warmup: { executor: 'constant-arrival-rate', rate: 20, timeUnit: '1s', duration: WARMUP, preAllocatedVUs: 20, maxVUs: 60, tags: { phase: 'warmup' } },
    main: {
      executor: 'constant-arrival-rate', rate: 20, timeUnit: '1s', duration: DURATION, startTime: WARMUP,
      preAllocatedVUs: 20, maxVUs: 60, tags: { phase: 'main' },
    },
  },
  thresholds: {
    'http_req_duration{phase:main,name:search}': ['p(95)<500', 'p(99)<1500'],
    'http_req_failed{phase:main,name:search}': ['rate==0'],
    'checks{phase:main}': ['rate==1'],
  },
  summaryTrendStats: ['avg', 'p(50)', 'p(95)', 'p(99)', 'max'],
};

export function setup() {
  const session = login('lea@studmail.hwg-lu.de');
  const meta = http.get(`${API}/meta`).json();
  return { session, categories: meta.categories.map((c) => c.id) };
}

let cursor = null;

export default function (data) {
  const roll = Math.random();
  let query;
  if (roll < 0.5) {
    query = `q=${encodeURIComponent(WORDS[Math.floor(Math.random() * WORDS.length)])}&limit=24`;
  } else if (roll < 0.8) {
    const category = data.categories[Math.floor(Math.random() * data.categories.length)];
    query = `categoryId=${category}&maxPriceCents=${(1 + Math.floor(Math.random() * 20)) * 500}&sort=price_asc&limit=24`;
  } else {
    query = cursor ? `cursor=${encodeURIComponent(cursor)}&limit=24` : 'limit=24';
  }
  const res = http.get(`${API}/listings?${query}`, { ...authed(data.session), tags: { name: 'search' } });
  const ok = check(res, { 'Suche 200': (r) => r.status === 200 });
  if (ok && roll >= 0.8) cursor = res.json('nextCursor');
}

export function handleSummary(data) {
  return summary('perf-001-search', data);
}
