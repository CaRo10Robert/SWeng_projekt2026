// [AT-PERF-002] Zustellzeit von Chatnachrichten (REQ-PERF-002): p95 < 2 s vom Eingang beim Server bis zum Empfang,
// 0 verlorene und 0 doppelte Nachrichten, 200 gleichzeitige WebSocket-Verbindungen, 5 Nachrichten/s, 5 min.
//
// Aufbau: Lea und Ben (Demo-Konversation) halten je 100 Verbindungen offen. Jede Nachricht geht an beide Teilnehmer,
// also an alle 200 Verbindungen. Gemessen wird ab der Server-Antwort auf das Senden (Nachricht ist gespeichert,
// ADR-0004) bis zum Eintreffen auf der jeweiligen Verbindung. Die Verbindungen öffnen vor dem Senden und schließen
// danach, sodass jede Verbindung jede Nachricht genau einmal erhalten muss.
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import { WebSocket } from 'k6/websockets';
import { API, BASE, CSRF, DURATION, authed, login, seconds, summary, uuid } from './lib.js';

const CONNECTIONS = Number(__ENV.CONNECTIONS || 200);
const RATE = Number(__ENV.RATE || 5);
const LEAD_SECONDS = 15; // Verbindungen stehen, bevor gesendet wird
const TAIL_SECONDS = 15; // Nachlauf für die letzten Zustellungen

const delivery = new Trend('chat_delivery_ms', true);
const sent = new Counter('chat_sent');
const received = new Counter('chat_received');
const duplicates = new Counter('chat_duplicates');
const missing = new Counter('chat_missing');
const wsErrors = new Counter('chat_ws_errors');

export const options = {
  setupTimeout: '2m',
  scenarios: {
    listeners: {
      executor: 'per-vu-iterations', vus: CONNECTIONS, iterations: 1,
      maxDuration: `${seconds(DURATION) + LEAD_SECONDS + TAIL_SECONDS + 60}s`, exec: 'listen',
    },
    senders: {
      executor: 'constant-arrival-rate', rate: RATE, timeUnit: '1s', duration: DURATION, startTime: `${LEAD_SECONDS}s`,
      preAllocatedVUs: 10, maxVUs: 30, exec: 'send',
    },
  },
  thresholds: {
    chat_delivery_ms: ['p(95)<2000'],
    chat_duplicates: ['count==0'],
    chat_missing: ['count==0'],
    // Gegen falsch-positive Läufe: Verbindungen müssen stehen und Nachrichten ankommen
    chat_ws_errors: ['count==0'],
    chat_received: ['count>0'],
    'http_req_failed{name:send}': ['rate==0'],
  },
  summaryTrendStats: ['avg', 'p(50)', 'p(95)', 'p(99)', 'max'],
};

export function setup() {
  const lea = login('lea@studmail.hwg-lu.de');
  const ben = login('ben@studmail.hwg-lu.de');
  const conversations = http.get(`${API}/conversations`, authed(lea)).json();
  const conv = conversations.find((c) => c.counterpart.id === ben.userId);
  if (!conv) throw new Error('Demo-Konversation Lea–Ben fehlt');
  // Startmarke: der Abgleich blättert ab hier (`?after=`), ältere Läufe zählen nicht mit
  const marker = http.post(
    `${API}/conversations/${conv.id}/messages`,
    JSON.stringify({ body: 'Lasttest-Start', clientMsgId: uuid() }),
    { headers: { cookie: lea.cookie, 'content-type': 'application/json', ...CSRF } },
  ).json('id');
  return { lea, ben, conversationId: conv.id, marker, sendEndsAt: Date.now() + (LEAD_SECONDS + seconds(DURATION)) * 1000 };
}

export function send(data) {
  const sender = Math.random() < 0.5 ? data.lea : data.ben;
  const body = `Lasttest ${uuid()} ${'x'.repeat(20 + Math.floor(Math.random() * 480))}`.slice(0, 500);
  const res = http.post(
    `${API}/conversations/${data.conversationId}/messages`,
    JSON.stringify({ body, clientMsgId: uuid() }),
    { headers: { cookie: sender.cookie, 'content-type': 'application/json', ...CSRF }, tags: { name: 'send' } },
  );
  if (check(res, { 'Senden 201': (r) => r.status === 201 || r.status === 200 })) sent.add(1);
}

export function listen(data) {
  const session = __VU % 2 === 0 ? data.lea : data.ben;
  const seen = new Set();
  const ws = new WebSocket(`${BASE.replace(/^http/, 'ws')}/ws`, null, { headers: { cookie: session.cookie } });
  ws.onmessage = (event) => {
    const now = Date.now();
    const msg = JSON.parse(event.data);
    if (msg.type !== 'message' || !msg.message.body.startsWith('Lasttest ')) return;
    if (seen.has(msg.message.id)) {
      duplicates.add(1);
      return;
    }
    seen.add(msg.message.id);
    received.add(1);
    delivery.add(now - Date.parse(msg.message.createdAt));
  };
  ws.onerror = (e) => {
    wsErrors.add(1);
    console.error(`WebSocket-Fehler VU ${__VU}: ${e.error}`);
  };
  // Bis nach dem Senden plus Nachlauf offen halten, dann Vollständigkeit je Verbindung prüfen
  const stayMs = data.sendEndsAt + TAIL_SECONDS * 1000 - Date.now();
  ws.addEventListener('open', () => {
    setTimeout(() => ws.close(), Math.max(1000, stayMs));
  });
  ws.addEventListener('close', () => {
    // Abgleich: jede in diesem Lauf gespeicherte Lasttest-Nachricht muss auf dieser Verbindung angekommen sein
    const expected = [];
    let after = data.marker;
    for (;;) {
      const page = http.get(
        `${API}/conversations/${data.conversationId}/messages?limit=200&after=${after}`,
        { ...authed(session), tags: { name: 'verify' } },
      ).json();
      if (!Array.isArray(page) || page.length === 0) break;
      for (const m of page) if (m.body.startsWith('Lasttest ')) expected.push(m.id);
      if (page.length < 200) break;
      after = page[page.length - 1].id;
    }
    const lost = expected.filter((id) => !seen.has(id)).length;
    if (lost > 0) missing.add(lost);
  });
  sleep(0);
}

export function handleSummary(summaryData) {
  return summary('perf-002-chat', summaryData);
}
