#!/usr/bin/env node
/**
 * Smoke-Test gegen ein laufendes Docker-Beispiel (REQ-ARCH-005, QS-9).
 *   node scripts/smoke-test.mjs [http://localhost:8080] [http://localhost:8025]
 * Prüft die Kernreise: Registrierung → Mail in Mailpit → Verifikation → Anzeige → Suche → Chat (REST + WS)
 * sowie Whitelist, CSRF-Schutz, Idempotenz, Wortfilter und Moderation.
 */
const BASE = process.argv[2] ?? 'http://localhost:8080';
const MAILPIT = process.argv[3] ?? 'http://localhost:8025';
const API = `${BASE}/api/v1`;
const PASSWORD = 'CampusMarkt-Demo-2026';

let failures = 0;
const check = (name, ok, info = '') => {
  console.log(`${ok ? '✔' : '✘'} ${name}${ok ? '' : `  ${info}`}`);
  if (!ok) failures++;
};

function session() {
  let cookie = '';
  async function call(method, path, body, { csrf = true, raw = false } = {}) {
    const headers = { cookie };
    if (csrf && method !== 'GET') headers['x-campusmarkt-csrf'] = '1';
    if (body !== undefined && !(body instanceof FormData)) headers['content-type'] = 'application/json';
    const res = await fetch(`${API}${path}`, {
      method,
      headers,
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) cookie = setCookie.split(';')[0];
    if (raw) return res;
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    return { status: res.status, data };
  }
  return { call, cookie: () => cookie };
}

async function login(email) {
  const s = session();
  const res = await s.call('POST', '/auth/login', { email, password: PASSWORD });
  if (res.status !== 200) throw new Error(`Login ${email} fehlgeschlagen: ${res.status} ${JSON.stringify(res.data)}`);
  return s;
}

/** Wartet, bis mindestens `count` passende Mails da sind; liefert sie vom ältesten zum neuesten. */
async function waitForMails(to, subjectPart, count = 1) {
  for (let i = 0; i < 60; i++) {
    const res = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`);
    const data = await res.json();
    const hits = (data.messages ?? []).filter((m) => m.Subject.includes(subjectPart));
    if (hits.length >= count) {
      hits.sort((a, b) => a.Created.localeCompare(b.Created));
      return Promise.all(hits.map(async (m) => (await fetch(`${MAILPIT}/api/v1/message/${m.ID}`)).json()));
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return [];
}

// ------------------------------------------------------------------ Basis
const live = await fetch(`${BASE}/health/ready`);
check('Readiness /health/ready', live.status === 200);
const anon = session();
const meta = await anon.call('GET', '/meta');
check('GET /meta liefert Kategorien und Standorte', meta.status === 200 && meta.data.categories.length >= 5 && meta.data.locations.length === 3);
check('Ohne Anmeldung: /me → 401', (await anon.call('GET', '/me')).status === 401);
const spa = await fetch(`${BASE}/listings/irgendwas`);
check('SPA-Fallback für Client-Routen', spa.status === 200 && (await spa.text()).includes('<div id="root">'));

// ------------------------------------------------------------------ Registrierung (UC-01)
const rejected = await anon.call('POST', '/auth/register', {
  email: 'x@hwg-lu.de.evil.com', password: 'ein-sehr-sicheres-passwort', displayName: 'Evil', acceptTerms: true, termsVersion: meta.data.termsVersion,
});
check('BR-01: fremde Domain wird abgelehnt (QS-1)', rejected.status === 422 && rejected.data.code === 'domain_not_allowed');

const csrf = await anon.call('POST', '/auth/login', { email: 'lea@studmail.hwg-lu.de', password: PASSWORD }, { csrf: false });
check('CSRF: Request ohne Header → 403', csrf.status === 403 && csrf.data.code === 'csrf');

const email = `test.${Date.now()}@studmail.hwg-lu.de`;
const reg = await anon.call('POST', '/auth/register', {
  email, password: 'mein-langes-test-passwort', displayName: 'Testi', acceptTerms: true, termsVersion: meta.data.termsVersion,
});
check('Registrierung → 202 neutral', reg.status === 202);
const again = await anon.call('POST', '/auth/register', {
  email, password: 'mein-langes-test-passwort', displayName: 'Testi', acceptTerms: true, termsVersion: meta.data.termsVersion,
});
check('Zweite Registrierung → identische Antwort (REQ-AUTH-004)', again.status === 202 && again.data.message === reg.data.message);

const mails = await waitForMails(email, 'bestätige', 2);
check('Verifikationsmails landen in Mailpit', mails.length === 2, `gefunden: ${mails.length}`);
// Regression: auch der Link aus der ÄLTEREN Mail muss funktionieren
const token = mails[0]?.Text.match(/token=([A-Za-z0-9_\-%]+)/)?.[1];
const user = session();
const verified = await user.call('POST', '/auth/verify', { token: decodeURIComponent(token ?? '') });
check('Verifikation mit dem älteren Link → angemeldet', verified.status === 200 && verified.data.userType === 'student' && !!user.cookie());
const reused = await session().call('POST', '/auth/verify', { token: decodeURIComponent(token ?? '') });
check('Link ein zweites Mal → token_used', reused.status === 400 && reused.data.code === 'token_used');

// ------------------------------------------------------------------ Anzeige + Suche (UC-10, UC-13)
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP8z8DAwMDAxMDAwMDAAAANHQEDasKb6QAAAABJRU5ErkJggg==', 'base64');
const form = new FormData();
form.append('files', new Blob([png], { type: 'image/png' }), 'foto.png');
const upload = await user.call('POST', '/uploads', form);
check('Bild-Upload', upload.status === 201 && upload.data.uploads.length === 1, JSON.stringify(upload.data));
const fake = new FormData();
fake.append('files', new Blob(['<script>alert(1)</script>'], { type: 'image/png' }), 'evil.png');
check('Upload ohne gültige Magic Bytes → 415', (await user.call('POST', '/uploads', fake)).status === 415);

const category = meta.data.categories[0].id;
const location = meta.data.locations[0].id;
const created = await user.call('POST', '/listings', {
  kind: 'offer', title: 'Smoketest Zauberwürfel', description: 'Ein originaler Zauberwürfel, kaum benutzt.',
  categoryId: category, priceType: 'fixed', priceCents: 450, condition: 'good', locationIds: [location],
  imageIds: (upload.data?.uploads ?? []).map((u) => u.id),
});
check('Anzeige erstellen → aktiv', created.status === 201 && created.data.status === 'active', JSON.stringify(created.data));
const invalidPrice = await user.call('POST', '/listings', {
  kind: 'offer', title: 'Zu teuer', description: 'Preis ist über dem Maximum.', categoryId: category,
  priceType: 'fixed', priceCents: 1_000_001, locationIds: [location],
});
check('Preis > 10.000 € → 422', invalidPrice.status === 422);
const filtered = await user.call('POST', '/listings', {
  kind: 'offer', title: 'Verkaufe Klausurlösungen', description: 'Alle Klausurlösungen für das Semester.',
  categoryId: category, priceType: 'free', locationIds: [location],
});
check('Wortfilter → in_review (REQ-LST-010)', filtered.data?.status === 'in_review');

// Bilder werden asynchron verarbeitet (ADR-0007); nach einem frischen Start arbeitet der Worker noch die Seed-Bilder ab
let detail;
for (let i = 0; i < 60; i++) {
  detail = await user.call('GET', `/listings/${created.data.id}`);
  if (detail.data.images[0]?.status !== 'processing') break;
  await new Promise((r) => setTimeout(r, 500));
}
check('Bild verarbeitet (WebP, ohne EXIF)', detail.data.images[0]?.status === 'ready', JSON.stringify(detail.data.images));
const media = await user.call('GET', `/media/${detail.data.images[0]?.id}/md`, undefined, { raw: true });
check('Bildauslieferung nur mit Session', media.status === 200 && media.headers.get('content-type') === 'image/webp');
const mediaAnon = await anon.call('GET', `/media/${detail.data.images[0]?.id}/md`);
check('Bild ohne Session → 401', mediaAnon.status === 401);

const lea = await login('lea@studmail.hwg-lu.de');
const found = await lea.call('GET', `/listings?q=${encodeURIComponent('Zauberwurfel')}`);
check('Suche mit Tippfehler findet neue Anzeige sofort', found.data.items.some((i) => i.id === created.data.id), JSON.stringify(found.data.items.map((i) => i.title)));
const stem = await lea.call('GET', `/listings?q=${encodeURIComponent('Bücher')}`);
check('Suche mit deutschen Wortstämmen', stem.data.items.length > 0);
check('In Prüfung befindliche Anzeige ist nicht suchbar', !(await lea.call('GET', '/listings?q=Klausurlösungen')).data.items.some((i) => i.id === filtered.data.id));

// ------------------------------------------------------------------ Chat (UC-20/21) inkl. WebSocket
const received = [];
let ws;
try {
  ws = new WebSocket(`${BASE.replace(/^http/, 'ws')}/ws`, { headers: { cookie: user.cookie(), origin: BASE } });
  ws.addEventListener('message', (e) => received.push(JSON.parse(e.data)));
  await new Promise((resolve, reject) => { ws.addEventListener('open', resolve); ws.addEventListener('error', reject); });
} catch (error) {
  check('WebSocket-Verbindung', false, String(error));
}
const clientMsgId = crypto.randomUUID();
const start = await lea.call('POST', '/conversations', { listingId: created.data.id, body: 'Ist der Würfel noch da?', clientMsgId });
check('Konversation starten', start.status === 201);
const dup = await lea.call('POST', `/conversations/${start.data.conversationId}/messages`, { body: 'Ist der Würfel noch da?', clientMsgId });
check('Gleiche clientMsgId → keine Doppelung (REQ-CHAT-004)', dup.status === 201 && dup.data.id === start.data.message.id);
await new Promise((r) => setTimeout(r, 500));
check('Anbieter erhält Nachricht in Echtzeit per WS', received.some((e) => e.type === 'message' && e.message.id === start.data.message.id), JSON.stringify(received));
const msgs = await user.call('GET', `/conversations/${start.data.conversationId}/messages`);
check('Genau eine Nachricht persistiert', msgs.data.length === 1);
const unread = await user.call('GET', '/me/unread');
check('Ungelesen-Zähler', unread.data.count >= 1);
const ben = await login('ben@studmail.hwg-lu.de');
check('Fremde Konversation → 404 (QS-2)', (await ben.call('GET', `/conversations/${start.data.conversationId}`)).status === 404);
const reserve = await user.call('POST', `/conversations/${start.data.conversationId}/deal`, { action: 'reserve' });
check('Deal: Reservierung durch Anbieter', reserve.status === 200 && reserve.data.status === 'agreed');
check('Interessent darf Deal nicht steuern', (await lea.call('POST', `/conversations/${start.data.conversationId}/deal`, { action: 'complete' })).status === 403);
ws?.close();

// ------------------------------------------------------------------ Moderation (UC-30/32)
const mod = await login('mod@hwg-lu.de');
const cases = await mod.call('GET', '/moderation/cases?status=open');
check('Moderations-Queue enthält Seed-Meldung und Wortfilter-Fall', cases.status === 200 && cases.data.length >= 2);
const filterCase = cases.data.find((c) => c.targetId === filtered.data.id);
const decision = await mod.call('POST', `/moderation/cases/${filterCase?.id}/decision`, { decision: 'remove', reason: 'Verstoß gegen die Regeln: Prüfungslösungen' });
check('Moderationsentscheidung', decision.status === 204);
check('Mitglied hat keinen Zugriff auf Moderation', (await lea.call('GET', '/moderation/cases')).status === 403);
const admin = await login('admin@hwg-lu.de');
const auditLog = await admin.call('GET', '/admin/audit');
check('Audit-Log protokolliert Entscheidung', auditLog.data.some((a) => a.action === 'moderation.remove'));

// ------------------------------------------------------------------ Datenschutz
const exported = await user.call('GET', '/me/export');
check('Datenexport (Art. 15/20)', exported.status === 200 && exported.data.account.profile.email === email);
const metrics = await fetch(`${BASE}/metrics`);
check('/metrics im Prometheus-Format', (await metrics.text()).includes('http_request_duration_seconds'));

console.log(failures ? `\n${failures} Prüfung(en) fehlgeschlagen` : '\nAlle Prüfungen bestanden');
process.exit(failures ? 1 : 0);
