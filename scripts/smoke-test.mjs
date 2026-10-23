#!/usr/bin/env node
/**
 * Smoke- und Akzeptanztests gegen ein laufendes Docker-Beispiel (REQ-ARCH-005, QS-9).
 *   node scripts/smoke-test.mjs [http://localhost:8080] [http://localhost:8025]
 *
 * Jede Prüfung trägt die Nachweis-ID aus docs/02-anforderungen/nachweise.md im Namen ([AT-…]),
 * damit scripts/trace.mjs Anforderung → Nachweis → Test verknüpfen kann (Fallstudie FS-M14).
 * Prüfungen ohne ID sind Hilfsprüfungen. Der Lauf verändert Daten (u. a. wird ein Testkonto gesperrt);
 * für einen sauberen Stand: docker compose down -v && docker compose up. Wegen der Registrierungsgrenze
 * (Q-18: 30 je IP und Stunde) laufen Smoke-Test und E2E-Suite zusammen etwa zweimal je Stunde und Stack.
 */
const BASE = process.argv[2] ?? 'http://localhost:8080';
const MAILPIT = process.argv[3] ?? 'http://localhost:8025';
const API = `${BASE}/api/v1`;
const DEMO_PASSWORD = 'CampusMarkt-Demo-2026';
const TS = Date.now();

let failures = 0;
const check = (name, ok, info = '') => {
  console.log(`${ok ? '✔' : '✘'} ${name}${ok ? '' : `  ${typeof info === 'string' ? info : JSON.stringify(info)}`}`);
  if (!ok) failures++;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const noEmail = (value) => !/@(studmail\.)?hwg-lu\.de/i.test(JSON.stringify(value));
// Die Adresse darf nur im Feld contact stehen, und nur nach beidseitiger Freigabe (REQ-CHAT-010)
const withoutContact = (value) => JSON.parse(JSON.stringify(value, (key, v) => (key === 'contact' ? undefined : v)));

function session() {
  let cookie = '';
  let lastSetCookie = '';
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
    if (setCookie) {
      lastSetCookie = setCookie;
      cookie = setCookie.split(';')[0];
    }
    if (raw) return res;
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    return { status: res.status, data, headers: res.headers };
  }
  return { call, cookie: () => cookie, setCookie: () => lastSetCookie, useCookie: (c) => { cookie = c; } };
}

async function login(email, password = DEMO_PASSWORD) {
  const s = session();
  const res = await s.call('POST', '/auth/login', { email, password });
  if (res.status !== 200) throw new Error(`Login ${email} fehlgeschlagen: ${res.status} ${JSON.stringify(res.data)}`);
  return s;
}

/** Wartet, bis mindestens `count` passende Mails da sind; liefert sie vom ältesten zum neuesten. */
async function waitForMails(to, subjectPart, count = 1, tries = 60) {
  for (let i = 0; i < tries; i++) {
    const res = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`);
    const data = await res.json();
    const hits = (data.messages ?? []).filter((m) => m.Subject.includes(subjectPart));
    if (hits.length >= count) {
      hits.sort((a, b) => a.Created.localeCompare(b.Created));
      return Promise.all(hits.map(async (m) => (await fetch(`${MAILPIT}/api/v1/message/${m.ID}`)).json()));
    }
    await sleep(500);
  }
  return [];
}
const tokenOf = (mail) => decodeURIComponent(mail?.Text.match(/token=([A-Za-z0-9_\-%]+)/)?.[1] ?? '');

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP8z8DAwMDAxMDAwMDAAAANHQEDasKb6QAAAABJRU5ErkJggg==', 'base64');
const pngForm = () => {
  const form = new FormData();
  form.append('files', new Blob([png], { type: 'image/png' }), 'foto.png');
  return form;
};

// ------------------------------------------------------------------ Basis
const ready = await fetch(`${BASE}/health/ready`);
check('[AT-OPS-001] Readiness /health/ready', ready.status === 200);
const anon = session();
const metaRes = await anon.call('GET', '/meta');
const meta = metaRes.data;
check('GET /meta liefert Kategorien und Standorte', metaRes.status === 200 && meta.categories.length >= 5 && meta.locations.length === 3);
check('Ohne Anmeldung: /me → 401', (await anon.call('GET', '/me')).status === 401);
const spa = await fetch(`${BASE}/listings/irgendwas`);
const csp = spa.headers.get('content-security-policy') ?? '';
check('SPA-Fallback für Client-Routen', spa.status === 200 && (await spa.text()).includes('<div id="root">'));
check('[AT-PRIV-006-2] Content-Security-Policy erlaubt nur den eigenen Ursprung',
  /default-src 'self'/.test(csp) && /script-src 'self'/.test(csp) && /connect-src 'self'/.test(csp) && !/https?:\/\//.test(csp), csp);

// ------------------------------------------------------------------ Registrierung (UC-01)
const register = (address, extra = {}) => anon.call('POST', '/auth/register', {
  email: address, password: 'mein-langes-test-passwort', displayName: 'Testi', acceptTerms: true, termsVersion: meta.termsVersion, ...extra,
});
const rejected = await register('x@hwg-lu.de.evil.com');
check('[AT-AUTH-001-2] BR-01: fremde Domain wird abgelehnt (QS-1)', rejected.status === 422 && rejected.data.code === 'domain_not_allowed');
const csrf = await anon.call('POST', '/auth/login', { email: 'lea@studmail.hwg-lu.de', password: DEMO_PASSWORD }, { csrf: false });
check('[AT-SEC-004] CSRF: Request ohne Schutzmerkmal → 403', csrf.status === 403 && csrf.data.code === 'csrf');
const outdated = await register(`alt.${TS}@studmail.hwg-lu.de`, { termsVersion: '1999-01' });
check('[AT-PRIV-001] Veraltete Version der Nutzungsbedingungen → 422 terms_outdated', outdated.status === 422 && outdated.data.code === 'terms_outdated');

const email = `test.${TS}@studmail.hwg-lu.de`;
const reg = await register(email);
check('Registrierung → 202 neutral', reg.status === 202);
const again = await register(email);
check('[AT-AUTH-004] Zweite Registrierung → identische Antwort', again.status === 202 && again.data.message === reg.data.message);

const mails = await waitForMails(email, 'bestätige', 2);
check('[AT-NOTI-001] Verifikationsmails landen in Mailpit', mails.length === 2, `gefunden: ${mails.length}`);
const user = session();
const verified = await user.call('POST', '/auth/verify', { token: tokenOf(mails[0]) });
check('[AT-AUTH-002] Verifikation mit dem älteren Link → angemeldet', verified.status === 200 && !!user.cookie());
check('[AT-AUTH-003-2] Nutzertyp aus der Domain: Studierende', verified.data?.userType === 'student');
const sc = user.setCookie();
check('[AT-SEC-004-2] Sitzungskennung: HttpOnly, Secure, SameSite=Lax', /HttpOnly/i.test(sc) && /Secure/i.test(sc) && /SameSite=Lax/i.test(sc), sc);
const reused = await session().call('POST', '/auth/verify', { token: tokenOf(mails[0]) });
check('[AT-AUTH-002-2] Link ein zweites Mal → token_used', reused.status === 400 && reused.data.code === 'token_used');

// Rate-Limits (REQ-SEC-005, Q-18)
const limitAddr = `limit.${TS}@studmail.hwg-lu.de`;
const regStatuses = [];
for (let i = 0; i < 4; i++) regStatuses.push((await register(limitAddr)).status);
check('[AT-SEC-005-2] 4. Registrierung derselben Adresse in einer Stunde → 429', regStatuses.join() === '202,202,202,429', regStatuses);
const loginStatuses = [];
for (let i = 0; i < 6; i++) {
  loginStatuses.push((await anon.call('POST', '/auth/login', { email: `niemand.${TS}@studmail.hwg-lu.de`, password: 'falsch-falsch-falsch' })).status);
}
check('[AT-SEC-005] 5 Fehlversuche, die 6. Anmeldung → 429', loginStatuses.join() === '401,401,401,401,401,429', loginStatuses);

// Nur verifizierte Nutzer dürfen anbieten (REQ-SEC-011, Fallstudie FS-C4)
const unverifiedEmail = `unbestaetigt.${TS}@studmail.hwg-lu.de`;
await register(unverifiedEmail);
const unverifiedLogin = await anon.call('POST', '/auth/login', { email: unverifiedEmail, password: 'mein-langes-test-passwort' });
const anonCreate = await anon.call('POST', '/listings', { kind: 'offer', title: 'Ohne Konto', description: 'Darf nicht angelegt werden.', categoryId: meta.categories[0].id, priceType: 'free', locationIds: [meta.locations[0].id] });
const anonUpload = await anon.call('POST', '/uploads', pngForm());
check('[AT-SEC-011] Unbestätigt → not_verified; ohne Sitzung kein Anlegen und kein Upload (401)',
  unverifiedLogin.status === 403 && unverifiedLogin.data.code === 'not_verified' && anonCreate.status === 401 && anonUpload.status === 401,
  [unverifiedLogin.status, anonCreate.status, anonUpload.status]);

// ------------------------------------------------------------------ Anzeige + Suche (UC-10, UC-13)
const upload = await user.call('POST', '/uploads', pngForm());
check('Bild-Upload', upload.status === 201 && upload.data.uploads.length === 1, upload.data);
const fake = new FormData();
fake.append('files', new Blob(['<script>alert(1)</script>'], { type: 'image/png' }), 'evil.png');
check('[AT-SEC-007] Upload ohne gültige Bildsignatur → 415', (await user.call('POST', '/uploads', fake)).status === 415);

const category = meta.categories[0].id;
const bookCategory = meta.categories.find((c) => c.hasStudyAttributes)?.id ?? category;
const location = meta.locations[0].id;
const listingBody = (extra = {}) => ({
  kind: 'offer', title: 'Smoketest Zauberwürfel', description: 'Ein originaler Zauberwürfel, kaum benutzt.',
  categoryId: category, priceType: 'fixed', priceCents: 450, condition: 'good', locationIds: [location], ...extra,
});
const created = await user.call('POST', '/listings', listingBody({ imageIds: (upload.data?.uploads ?? []).map((u) => u.id) }));
check('[AT-LST-001] Anzeige mit Bild erstellen → aktiv', created.status === 201 && created.data.status === 'active', created.data);
const invalidPrice = await user.call('POST', '/listings', listingBody({ title: 'Zu teuer', priceCents: 1_000_001 }));
check('[AT-LST-002-2] Preis > 10.000 € → 422', invalidPrice.status === 422);
const noLocation = await user.call('POST', '/listings', listingBody({ locationIds: [] }));
const unknownLocation = await user.call('POST', '/listings', listingBody({ locationIds: ['00000000-0000-4000-8000-0000000000ff'] }));
check('[AT-LST-004] Ohne bzw. mit unbekanntem Übergabeort → 422', noLocation.status === 422 && unknownLocation.status === 422);
const badIsbn = await user.call('POST', '/listings', listingBody({ categoryId: bookCategory, attributes: { isbn: 'keine-isbn' } }));
const withAttrs = await user.call('POST', '/listings', listingBody({
  title: 'Smoketest Skript', categoryId: bookCategory, attributes: { studyProgram: 'BWL', module: 'Statistik I', isbn: '978-3-486-71638-7' },
}));
check('[AT-LST-005] Studienattribute gespeichert, ungültige ISBN → 422',
  badIsbn.status === 422 && withAttrs.status === 201 && withAttrs.data.attributes.module === 'Statistik I');

const filtered = await user.call('POST', '/listings', listingBody({ title: 'Verkaufe Klausurlösungen', description: 'Alle Klausurlösungen für das Semester.', priceType: 'free', priceCents: undefined }));

let detail;
for (let i = 0; i < 60; i++) {
  detail = await user.call('GET', `/listings/${created.data.id}`);
  if (detail.data.images[0]?.status !== 'processing') break;
  await sleep(500);
}
const media = await user.call('GET', `/media/${detail.data.images[0]?.id}/md`, undefined, { raw: true });
check('[AT-LST-003] Bild verarbeitet und als WebP ausgeliefert', detail.data.images[0]?.status === 'ready' && media.status === 200 && media.headers.get('content-type') === 'image/webp');
check('[AT-SEC-007-2] Bildabruf ohne Sitzung → 401', (await anon.call('GET', `/media/${detail.data.images[0]?.id}/md`)).status === 401);

const lea = await login('lea@studmail.hwg-lu.de');
const ben = await login('ben@studmail.hwg-lu.de');
const mia = await login('mia@studmail.hwg-lu.de');
const searchIds = async (s, q) => ((await s.call('GET', `/listings?q=${encodeURIComponent(q)}&limit=50`)).data?.items ?? []).map((i) => i.id);
check('[AT-SRCH-001] Suche mit Tippfehler findet die Anzeige', (await searchIds(lea, 'Zauberwurfel')).includes(created.data.id));
check('[AT-SRCH-003] Neue Anzeige ist sofort auffindbar', (await searchIds(lea, 'Smoketest Zauberwürfel')).includes(created.data.id));
check('[AT-SRCH-001-2] Suche mit abweichender Wortform', (await searchIds(lea, 'Bücher')).length > 0);
check('[AT-LST-010-2] Inhaltsprüfung → in_review und nicht suchbar',
  filtered.data?.status === 'in_review' && !(await searchIds(lea, 'Klausurlösungen')).includes(filtered.data.id));
check('[AT-PRIV-002] Anzeige und Suche ohne fremde E-Mail-Adressen',
  noEmail((await lea.call('GET', `/listings/${created.data.id}`)).data) && noEmail((await lea.call('GET', '/listings?limit=50')).data));

// Merkliste (REQ-SRCH-004)
const fav = await lea.call('PUT', `/listings/${created.data.id}/favorite`);
const favList = await lea.call('GET', '/me/favorites');
const unfav = await lea.call('DELETE', `/listings/${created.data.id}/favorite`);
const ownFav = await user.call('PUT', `/listings/${created.data.id}/favorite`);
check('[AT-SRCH-004] Merken, Liste, Entfernen; eigene Anzeige nicht merkbar',
  fav.status === 204 && favList.data.some((l) => l.id === created.data.id) && unfav.status === 204 && ownFav.status === 404);

// Lebenszyklus (REQ-LST-006, REQ-SRCH-003)
const paused = await user.call('POST', `/listings/${withAttrs.data.id}/status`, { action: 'pause' });
const pausedFound = (await searchIds(lea, 'Smoketest Skript')).includes(withAttrs.data.id);
check('[AT-SRCH-003-2] Pausierte Anzeige wird nicht mehr gefunden', paused.data?.status === 'paused' && !pausedFound);
const resumed = await user.call('POST', `/listings/${withAttrs.data.id}/status`, { action: 'resume' });
const foreignAction = await lea.call('POST', `/listings/${withAttrs.data.id}/status`, { action: 'pause' });
const deleted = await user.call('DELETE', `/listings/${withAttrs.data.id}`);
check('[AT-LST-006-2] Pausieren, reaktivieren, löschen; fremde Anzeige → 404',
  resumed.data?.status === 'active' && foreignAction.status === 404 && deleted.status === 204 &&
  (await lea.call('GET', `/listings/${withAttrs.data.id}`)).status === 404);

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
const convId = start.data?.conversationId;
const dup = await lea.call('POST', `/conversations/${convId}/messages`, { body: 'Ist der Würfel noch da?', clientMsgId });
await sleep(500);
check('[AT-CHAT-001] Konversation starten, Anbieter erhält die Nachricht',
  start.status === 201 && received.some((e) => e.type === 'message' && e.message.id === start.data.message.id));
check('[AT-CHAT-003] Echtzeit-Zustellung per WebSocket', received.some((e) => e.type === 'message'));
check('[AT-CHAT-004] Gleiche Kennung erzeugt keine zweite Nachricht',
  dup.status === 201 && dup.data.id === start.data.message.id && (await user.call('GET', `/conversations/${convId}/messages`)).data.length === 1);
const second = await lea.call('POST', '/conversations', { listingId: created.data.id, body: 'Und noch eine Frage', clientMsgId: crypto.randomUUID() });
check('[AT-CHAT-002] Zweiter Start liefert dieselbe Konversation', second.data?.conversationId === convId);
check('[AT-CHAT-005] Ungelesen-Zähler', (await user.call('GET', '/me/unread')).data.count >= 1);
const afterRes = await user.call('GET', `/conversations/${convId}/messages?after=${start.data.message.id}`);
check('[AT-CHAT-004-2] Nachladen ab der letzten bekannten Nachricht ohne Lücke',
  afterRes.data.length === 1 && afterRes.data[0].id === second.data.message.id, afterRes.data);
const tooLong = await lea.call('POST', `/conversations/${convId}/messages`, { body: 'x'.repeat(2001), clientMsgId: crypto.randomUUID() });
check('[AT-CHAT-007] Nachrichten über 2.000 Zeichen → 422', tooLong.status === 422);
const ownChat = await user.call('POST', '/conversations', { listingId: created.data.id, body: 'Hallo ich selbst', clientMsgId: crypto.randomUUID() });
check('[AT-CHAT-001-3] Kontakt zur eigenen Anzeige wird abgelehnt', ownChat.status === 422 && ownChat.data.code === 'own_listing');
check('[AT-CHAT-001-2] Konversationen und Nachrichten ohne E-Mail-Adressen',
  noEmail(withoutContact((await lea.call('GET', '/conversations')).data)) && noEmail((await lea.call('GET', `/conversations/${convId}/messages`)).data));

const foreignConv = await ben.call('GET', `/conversations/${convId}`);
const memberQueue = await lea.call('GET', '/moderation/cases');
const reserve = await user.call('POST', `/conversations/${convId}/deal`, { action: 'reserve' });
const buyerDeal = await lea.call('POST', `/conversations/${convId}/deal`, { action: 'complete' });
check('[AT-CHAT-011] Anbieter reserviert aus der Konversation, Anzeige reserviert',
  reserve.status === 200 && reserve.data.status === 'agreed' && (await user.call('GET', `/listings/${created.data.id}`)).data.status === 'reserved');
check('[AT-CHAT-011-2] Interessent darf den Deal nicht steuern', buyerDeal.status === 403);
check('[AT-SEC-006] Autorisierung: fremde Konversation 404, Mitglied auf Moderation 403, Interessent auf Deal 403',
  foreignConv.status === 404 && memberQueue.status === 403 && buyerDeal.status === 403);

// ------------------------------------------------------------------ Kontaktfreigabe (REQ-CHAT-010, Fallstudie FS-C1)
const contactOf = async (s, id) => (await s.call('GET', `/conversations/${id}`)).data.contact;
const leaGrant = await lea.call('POST', `/conversations/${convId}/contact`, { action: 'grant' });
const userViewOne = await contactOf(user, convId);
const oneSided = leaGrant.status === 200 && leaGrant.data.counterpartEmail === null && userViewOne.theirs === 'granted' && userViewOne.counterpartEmail === null;
const userGrant = await user.call('POST', `/conversations/${convId}/contact`, { action: 'grant' });
const leaViewBoth = await contactOf(lea, convId);
const exchanged = userGrant.data?.counterpartEmail === 'lea@studmail.hwg-lu.de' && leaViewBoth.counterpartEmail === email;
const msgs = (await lea.call('GET', `/conversations/${convId}/messages`)).data;
const systemMsg = msgs.find((m) => m.kind === 'system' && m.body.includes('Kontaktdaten wurden ausgetauscht'));
const leaWithdraw = await lea.call('POST', `/conversations/${convId}/contact`, { action: 'withdraw' });
const userAfterWithdraw = await contactOf(user, convId);
check('[AT-CHAT-010] Einseitig nichts, beidseitig Adresse, Systemnachricht ohne Adresse, Widerruf blendet aus',
  oneSided && exchanged && !!systemMsg && noEmail(msgs) && leaWithdraw.data?.counterpartEmail === null && userAfterWithdraw.counterpartEmail === null,
  { oneSided, exchanged, systemMsg: !!systemMsg, withdraw: leaWithdraw.data, userAfterWithdraw });
check('[AT-CHAT-010-2] Fremde erhalten bei der Kontaktfreigabe „nicht gefunden“',
  (await ben.call('POST', `/conversations/${convId}/contact`, { action: 'grant' })).status === 404);

const miaStart = await mia.call('POST', '/conversations', { listingId: created.data.id, body: 'Tauschst du auch?', clientMsgId: crypto.randomUUID() });
const miaConv = miaStart.data?.conversationId;
const miaId = miaStart.data?.message.senderId;
const miaRequest = await mia.call('POST', `/conversations/${miaConv}/contact`, { action: 'grant' });
const userDecline = await user.call('POST', `/conversations/${miaConv}/contact`, { action: 'decline' });
const miaRetry = await mia.call('POST', `/conversations/${miaConv}/contact`, { action: 'grant' });
const miaView = await contactOf(mia, miaConv);
check('[AT-CHAT-010-3] Ablehnen; erneute Anfrage frühestens nach 24 h (429), Restanzahl sichtbar',
  miaRequest.status === 200 && userDecline.status === 200 && miaView.mine === 'declined' && miaRetry.status === 429 &&
  miaRetry.data.code === 'contact_request_limit' && !!miaView.retryAfter && miaView.requestsLeft === 2,
  { miaRequest: miaRequest.status, userDecline: userDecline.status, miaRetry: miaRetry.status, miaView });
ws?.close();

// ------------------------------------------------------------------ Blockieren (REQ-MOD-005, REQ-CHAT-001)
const block = await user.call('PUT', `/users/${miaId}/block`);
const blockedSend = await mia.call('POST', `/conversations/${miaConv}/messages`, { body: 'Hallo?', clientMsgId: crypto.randomUUID() });
const blockedSearch = (await searchIds(mia, 'Smoketest Zauberwürfel')).includes(created.data.id);
check('[AT-MOD-005] Nach Blockierung: Senden 403 contact_not_possible, Anzeige nicht in der Suche',
  block.status === 204 && blockedSend.status === 403 && blockedSend.data.code === 'contact_not_possible' && !blockedSearch);
check('[AT-CHAT-001-4] Kontakt bei Blockierung → „Kontakt nicht möglich“', blockedSend.data?.code === 'contact_not_possible');
await user.call('DELETE', `/users/${miaId}/block`);

// ------------------------------------------------------------------ Melden und Moderation (UC-30/32)
const mod = await login('mod@hwg-lu.de');
const report = await ben.call('POST', '/reports', { targetType: 'listing', targetId: created.data.id, reason: 'spam', details: 'Smoketest' });
let inQueue = false;
const reportedAt = Date.now();
while (!inQueue && Date.now() - reportedAt < 10_000) {
  inQueue = (await mod.call('GET', '/moderation/cases?status=open')).data.some((c) => c.targetId === created.data.id);
  if (!inQueue) await sleep(500);
}
check('[AT-MOD-001] Meldung über die API landet in der Queue', report.status === 201 && inQueue);
check('[AT-MOD-002-3] Fall ist innerhalb von 10 s in der Moderations-Queue', inQueue && Date.now() - reportedAt <= 10_000);
const reportAgain = await ben.call('POST', '/reports', { targetType: 'listing', targetId: created.data.id, reason: 'spam' });
const reportOwn = await user.call('POST', '/reports', { targetType: 'listing', targetId: created.data.id, reason: 'spam' });
check('[AT-MOD-001-2] Doppelte Meldung → 409, eigener Inhalt → 422', reportAgain.status === 409 && reportOwn.status === 422);

const cases = (await mod.call('GET', '/moderation/cases?status=open')).data;
check('[AT-DEMO-001] Demo-Daten: Queue mit Seed-Meldung und Inhaltsprüfungsfall, ≥ 25 Anzeigen',
  cases.length >= 2 && (await lea.call('GET', '/listings?limit=50')).data.items.length >= 25);
check('[AT-PRIV-002] Moderationsfälle ohne E-Mail-Adressen', noEmail(cases));
const filterCase = cases.find((c) => c.targetId === filtered.data?.id);
const decision = await mod.call('POST', `/moderation/cases/${filterCase?.id}/decision`, { decision: 'remove', reason: 'Verstoß gegen die Regeln: Prüfungslösungen' });
check('[AT-MOD-002] Moderator entscheidet „entfernen“', decision.status === 204);
check('[AT-MOD-002-2] Mitglied hat keinen Zugriff auf die Moderations-Queue', memberQueue.status === 403);

// Ausblenden ab 3 Meldungen (REQ-MOD-004, für Anzeigen)
// Eigene Anzeige je Lauf, damit der Test auf einem bestehenden Stack wiederholbar ist
const reportTitle = `Smoketest Meldeobjekt ${TS}`;
const reported = await user.call('POST', '/listings', listingBody({ title: reportTitle }));
const visibleBefore = (await searchIds(lea, reportTitle)).includes(reported.data?.id);
for (const s of [lea, ben, mia]) await s.call('POST', '/reports', { targetType: 'listing', targetId: reported.data?.id, reason: 'other', details: 'Smoketest' });
check('[AT-MOD-004] Drei Meldungen blenden die Anzeige aus der Suche aus',
  reported.status === 201 && visibleBefore && !(await searchIds(lea, reportTitle)).includes(reported.data.id));

// Rollen (REQ-MOD-007)
const admin = await login('admin@hwg-lu.de');
const roleUp = await admin.call('POST', `/admin/users/${miaId}/role`, { role: 'moderator' });
const roleDown = await admin.call('POST', `/admin/users/${miaId}/role`, { role: 'member' });
const auditLog = (await admin.call('GET', '/admin/audit')).data;
check('[AT-MOD-007] Rollenwechsel durch Admin, im Audit-Log protokolliert',
  roleUp.status === 204 && roleDown.status === 204 && auditLog.some((a) => a.action === 'role.changed' && a.targetId === miaId));
check('[AT-MOD-007-2] Mitglied erhält 403 auf die Nutzerverwaltung', (await lea.call('GET', '/admin/users')).status === 403);
check('[AT-MOD-003] Audit-Log protokolliert die Moderationsentscheidung', auditLog.some((a) => a.action === 'moderation.remove'));

// Demo-Werkzeug (REQ-DEMO-002): Erinnerung für die bald ablaufende Seed-Anzeige von Lea
const due = await admin.call('POST', '/admin/demo/run-due-jobs');
const reminder = await waitForMails('lea@studmail.hwg-lu.de', 'läuft bald ab', 1, 40);
check('[AT-DEMO-002] Fällige Jobs auslösen → 202, Erinnerungsmail in Mailpit', due.status === 202 && reminder.length >= 1);

// ------------------------------------------------------------------ Profil, Export, Löschung (UC-04/05/06)
const profile = await user.call('PATCH', '/me', { displayName: 'Testi Neu', studyProgram: 'Wirtschaftsinformatik', preferredLocationIds: [location] });
const me = await user.call('GET', '/me');
check('[AT-ACC-001] Profil ändern: Anzeigename, Studiengang, Übergabeorte',
  profile.status === 200 && me.data.displayName === 'Testi Neu' && me.data.studyProgram === 'Wirtschaftsinformatik' && me.data.preferredLocationIds[0] === location);
const exported = await user.call('GET', '/me/export');
check('[AT-ACC-003] Datenexport inkl. Einwilligung und Kontaktfreigaben',
  exported.status === 200 && exported.data.account.profile.email === email && exported.data.account.consents.length >= 1 &&
  Array.isArray(exported.data.contactConsents) && exported.data.contactConsents.length >= 1);

const sara = await login('sara@studmail.hwg-lu.de');
const saraCookie = sara.cookie();
const delReq = await sara.call('POST', '/me/delete', { password: DEMO_PASSWORD });
const oldSaraSession = session();
oldSaraSession.useCookie(saraCookie);
const afterDeletion = await oldSaraSession.call('POST', '/listings', listingBody({ title: 'Nach Löschantrag' }));
check('[AT-SEC-011-3] Nach beantragter Kontolöschung: Anlegen mit alter Sitzung → 401', delReq.status === 202 && afterDeletion.status === 401);
const saraBack = await anon.call('POST', '/auth/login', { email: 'sara@studmail.hwg-lu.de', password: DEMO_PASSWORD });
check('[AT-ACC-002] Löschung beantragt, erneute Anmeldung bricht sie ab', saraBack.status === 200 && saraBack.data.deletionCancelled === true);

// ------------------------------------------------------------------ Anmelden, Abmelden, Passwort-Reset (UC-02/03)
check('[AT-AUTH-005] Anmeldung mit Demo-Konten liefert Profil und Sitzung', !!lea.cookie() && !!mod.cookie() && !!admin.cookie());
const ben2 = await login('ben@studmail.hwg-lu.de');
const ben2Cookie = ben2.cookie();
const logout = await ben2.call('POST', '/auth/logout');
const benOld = session();
benOld.useCookie(ben2Cookie);
const benMeAfterLogout = await benOld.call('GET', '/me');
check('[AT-AUTH-005-2] Nach Abmelden liefert /me mit der alten Sitzung 401', logout.status === 204 && benMeAfterLogout.status === 401);

const userCookieBeforeReset = user.cookie();
const resetReq = await anon.call('POST', '/auth/password-reset/request', { email });
const [resetMail] = await waitForMails(email, 'Passwort zurücksetzen');
const resetConfirm = await anon.call('POST', '/auth/password-reset/confirm', { token: tokenOf(resetMail), password: 'ganz-neues-passwort-2026' });
const oldUserSession = session();
oldUserSession.useCookie(userCookieBeforeReset);
const oldAfterReset = await oldUserSession.call('GET', '/me');
const userNow = session();
const relogin = await userNow.call('POST', '/auth/login', { email, password: 'ganz-neues-passwort-2026' });
check('[AT-AUTH-006] Passwort per Link zurücksetzen; neue Anmeldung gelingt, alte Sitzung ungültig',
  resetReq.status === 202 && resetConfirm.status === 204 && oldAfterReset.status === 401 && relogin.status === 200);
check('[AT-SEC-004-3] Sitzung nach Abmelden und nach Passwort-Reset ungültig', benMeAfterLogout.status === 401 && oldAfterReset.status === 401);

// ------------------------------------------------------------------ Sperre (REQ-SEC-011, REQ-AUTH-008)
const userId = me.data.id;
await lea.call('POST', '/reports', { targetType: 'user', targetId: userId, reason: 'fraud', details: 'Smoketest Sperre' });
const userCase = (await mod.call('GET', '/moderation/cases?status=open')).data.find((c) => c.targetId === userId);
const ban = await mod.call('POST', `/moderation/cases/${userCase?.id}/decision`, { decision: 'ban', reason: 'Smoketest: Konto sperren' });
const bannedCreate = await userNow.call('POST', '/listings', listingBody({ title: 'Nach Sperre' }));
const bannedUpload = await userNow.call('POST', '/uploads', pngForm());
const bannedEdit = await userNow.call('PATCH', `/listings/${created.data.id}`, { title: 'Nach Sperre geändert' });
check('[AT-SEC-011-2] Nach Sperre: Anlegen, Upload und Bearbeiten mit alter Sitzung → 401',
  ban.status === 204 && bannedCreate.status === 401 && bannedUpload.status === 401 && bannedEdit.status === 401,
  [ban.status, bannedCreate.status, bannedUpload.status, bannedEdit.status]);
const alias = email.replace('@', '+neu@');
const aliasReg = await register(alias);
const aliasMails = await waitForMails(alias, 'bestätige', 1, 8);
check('[AT-AUTH-008] Gesperrte Adresse (auch mit +Alias): neutrale Antwort, kein neues Konto, keine Mail',
  aliasReg.status === 202 && aliasMails.length === 0,
  aliasReg.status === 429 ? 'Registrierungsgrenze je IP erreicht (Q-18): Stack mit „docker compose down -v“ neu starten oder eine Stunde warten' : aliasReg.status);

// ------------------------------------------------------------------ Betrieb
const metrics = await fetch(`${BASE}/metrics`);
check('/metrics im Prometheus-Format', (await metrics.text()).includes('http_request_duration_seconds'));

check('[AT-ARCH-005] Alle Smoke-Prüfungen gegen das Docker-Beispiel bestanden', failures === 0, `${failures} Fehler`);
console.log(failures ? `\n${failures} Prüfung(en) fehlgeschlagen` : '\nAlle Prüfungen bestanden');
process.exit(failures ? 1 : 0);
