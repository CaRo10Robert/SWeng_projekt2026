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
const headersOf = async (mail) => (mail ? (await fetch(`${MAILPIT}/api/v1/message/${mail.ID}/headers`)).json() : {});

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

// ------------------------------------------------------------------ Auftritt und Betrieb (EPIC-13)
const unknownPage = await fetch(`${BASE}/gibt-es-nicht`);
const unknownApi = await anon.call('GET', '/gibt-es-nicht');
check('[AT-UX-003] Unbekannte Seite → 404 mit der SPA (Fehlerseite), unbekannter API-Pfad → JSON-404',
  unknownPage.status === 404 && (await unknownPage.text()).includes('<div id="root">') &&
  unknownApi.status === 404 && unknownApi.data?.code === 'not_found' && !!unknownApi.data?.requestId,
  [unknownPage.status, unknownApi.status]);
const robots = await fetch(`${BASE}/robots.txt`);
const robotsText = await robots.text();
const legalPage = await fetch(`${BASE}/impressum`);
check('[AT-PRIV-008] robots.txt sperrt alles, X-Robots-Tag auf Start- und Rechtsseiten',
  robots.status === 200 && /User-agent: \*/.test(robotsText) && /^Disallow: \/$/m.test(robotsText) &&
  spa.headers.get('x-robots-tag') === 'noindex, nofollow' && legalPage.status === 200 &&
  legalPage.headers.get('x-robots-tag') === 'noindex, nofollow');
const securityTxt = await fetch(`${BASE}/.well-known/security.txt`);
const securityText = await securityTxt.text();
const securityExpires = new Date(/^Expires: (.+)$/m.exec(securityText)?.[1] ?? 0);
// Policy und Canonical (Web-URIs) nur bei HTTPS, RFC 9116 (RV-A-17)
const httpsBase = BASE.startsWith('https://');
check('[AT-SEC-012] security.txt nach RFC 9116: Contact, Expires in der Zukunft, Sprachen; Policy und Canonical nur über HTTPS',
  securityTxt.status === 200 && (securityTxt.headers.get('content-type') ?? '').startsWith('text/plain') &&
  /^Contact: mailto:/m.test(securityText) && securityExpires > new Date() &&
  securityExpires.getTime() - Date.now() <= 366 * 86_400_000 && /^Preferred-Languages: de, en$/m.test(securityText) &&
  /^Policy: /m.test(securityText) === httpsBase && /^Canonical: /m.test(securityText) === httpsBase, securityText);
const statusRes = await anon.call('GET', '/status');
const statusPage = await fetch(`${BASE}/status`);
check('[AT-OPS-007] Statusseite und Status-API ohne Anmeldung, je Dienst mit Zeitpunkt, ohne interne Details',
  statusRes.status === 200 && statusPage.status === 200 &&
  ['app', 'database', 'email', 'realtime'].every((id) => statusRes.data.services.some((s) => s.id === id && ['operational', 'disrupted'].includes(s.status))) &&
  Date.now() - new Date(statusRes.data.checkedAt).getTime() <= 60_000 &&
  !/version|hostname|postgres|smtp|mailpit|error|\d+\.\d+\.\d+\.\d+/i.test(JSON.stringify(statusRes.data)), statusRes.data);

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

// ------------------------------------------------------------------ Neue Nutzungsbedingungen (REQ-LEGAL-003)
// Tim (Demo-Daten) hat einer älteren Fassung zugestimmt
const tim = await login('tim@studmail.hwg-lu.de');
const timMe = await tim.call('GET', '/me');
const timWrite = await tim.call('PATCH', '/me', { studyProgram: 'BWL' });
// Benachrichtigungen und Sprache bleiben ohne neue Zustimmung änderbar (RV-C-06)
const timLocale = await tim.call('PATCH', '/me', { locale: 'de' });
const timAccept = await tim.call('POST', '/me/terms', { version: meta.termsVersion });
const timAfter = await tim.call('PATCH', '/me', { studyProgram: 'BWL (B.Sc.)' });
check('[AT-LEGAL-003-2] Ältere Zustimmung: schreibend 403 terms_required, nach erneuter Zustimmung Version gespeichert',
  timMe.data?.termsRequired === true && timWrite.status === 403 && timWrite.data?.code === 'terms_required' && timLocale.status === 200 &&
  timAccept.status === 200 && timAccept.data?.termsRequired === false && timAccept.data?.termsAcceptedVersion === meta.termsVersion &&
  timAfter.status === 200,
  timMe.data?.termsRequired === false ? 'Tim hat bereits zugestimmt (Stack wiederverwendet): docker compose down -v' : [timMe.data?.termsRequired, timWrite.status, timAccept.status, timAfter.status]);

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
const leaRegrant = await lea.call('POST', `/conversations/${convId}/contact`, { action: 'grant' });
check('[AT-CHAT-010] Einseitig nichts, beidseitig Adresse, Systemnachricht ohne Adresse, Widerruf blendet aus und sperrt 24 h',
  oneSided && exchanged && !!systemMsg && noEmail(msgs) && leaWithdraw.data?.counterpartEmail === null && userAfterWithdraw.counterpartEmail === null &&
  leaRegrant.status === 429 && leaRegrant.data.code === 'contact_request_limit',
  { oneSided, exchanged, systemMsg: !!systemMsg, withdraw: leaWithdraw.data, userAfterWithdraw, leaRegrant: leaRegrant.status });
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
const benStart = await ben.call('POST', '/conversations', { listingId: created.data.id, body: 'Ist das noch zu haben?', clientMsgId: crypto.randomUUID() });
const benConv = benStart.data?.conversationId;
await ben.call('POST', `/conversations/${benConv}/contact`, { action: 'grant' });
const openRequest = (await contactOf(user, benConv)).theirs === 'granted';
await ben.call('POST', `/conversations/${benConv}/contact`, { action: 'withdraw' });
const afterBenWithdraw = await contactOf(user, benConv);
// Austausch zwischen Anbieter und Mia: Anbieter fragt an, Mia stimmt zu (ihre Ablehnungssperre betrifft nur eigene Anfragen)
const userAsksMia = await user.call('POST', `/conversations/${miaConv}/contact`, { action: 'grant' });
const miaAccepts = await mia.call('POST', `/conversations/${miaConv}/contact`, { action: 'grant' });
ws?.close();

// ------------------------------------------------------------------ Blockieren (REQ-MOD-005, REQ-CHAT-001)
const block = await user.call('PUT', `/users/${miaId}/block`);
const blockedSend = await mia.call('POST', `/conversations/${miaConv}/messages`, { body: 'Hallo?', clientMsgId: crypto.randomUUID() });
const blockedSearch = (await searchIds(mia, 'Smoketest Zauberwürfel')).includes(created.data.id);
check('[AT-MOD-005] Nach Blockierung: Senden 403 contact_not_possible, Anzeige nicht in der Suche',
  block.status === 204 && blockedSend.status === 403 && blockedSend.data.code === 'contact_not_possible' && !blockedSearch);
check('[AT-CHAT-001-4] Kontakt bei Blockierung → „Kontakt nicht möglich“', blockedSend.data?.code === 'contact_not_possible');
const miaViewBlocked = await contactOf(mia, miaConv);
const userViewBlocked = await contactOf(user, miaConv);
await mia.call('POST', `/conversations/${miaConv}/contact`, { action: 'withdraw' });
const miaGrantBlocked = await mia.call('POST', `/conversations/${miaConv}/contact`, { action: 'grant' });
check('[AT-CHAT-010-4] Zurückziehen vor Zustimmung entfernt die Anfrage; Blockierung blendet ausgetauschte Adressen aus, neue Zustimmung „Kontakt nicht möglich“',
  openRequest && afterBenWithdraw.theirs === 'withdrawn' && afterBenWithdraw.counterpartEmail === null &&
  userAsksMia.status === 200 && miaAccepts.data?.counterpartEmail === email &&
  miaViewBlocked.counterpartEmail === null && userViewBlocked.counterpartEmail === null && !miaViewBlocked.canGrant &&
  miaGrantBlocked.status === 403 && miaGrantBlocked.data.code === 'contact_not_possible',
  { openRequest, afterBenWithdraw, userAsksMia: userAsksMia.status, miaAccepts: miaAccepts.data, miaViewBlocked, miaGrantBlocked: miaGrantBlocked.status });
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
  cases.some((c) => c.targetType === 'message' && c.reports.some((r) => r.details?.includes('Vorkasse'))) &&
  cases.some((c) => c.targetId === filtered.data?.id) &&
  (await lea.call('GET', '/listings?limit=50')).data.items.length >= 25,
  cases.map((c) => ({ targetType: c.targetType, reports: c.reports.length })));
check('[AT-PRIV-002] Moderationsfälle ohne E-Mail-Adressen', noEmail(cases));
const filterCase = cases.find((c) => c.targetId === filtered.data?.id);
const withoutRule = await mod.call('POST', `/moderation/cases/${filterCase?.id}/decision`, { decision: 'remove', reason: 'Verstoß gegen die Regeln: Prüfungslösungen' });
const tooShort = await mod.call('POST', `/moderation/cases/${filterCase?.id}/decision`, { decision: 'remove', reason: 'Verstoß', ruleRef: 'community_prohibited_items' });
const decision = await mod.call('POST', `/moderation/cases/${filterCase?.id}/decision`, { decision: 'remove', reason: 'Verstoß gegen die Regeln: Prüfungslösungen', ruleRef: 'community_prohibited_items' });
check('[AT-MOD-002] Moderator entscheidet „entfernen“', decision.status === 204);
check('[AT-MOD-002-2] Mitglied hat keinen Zugriff auf die Moderations-Queue', memberQueue.status === 403);

// Ausblenden ab 3 Meldungen (REQ-MOD-004, für Anzeigen)
// Eigene Anzeige je Lauf, damit der Test auf einem bestehenden Stack wiederholbar ist
const reportTitle = `Smoketest Meldeobjekt ${TS}`;
const reported = await user.call('POST', '/listings', listingBody({ title: reportTitle }));
const visibleBefore = (await searchIds(lea, reportTitle)).includes(reported.data?.id);
for (const s of [lea, ben, mia]) await s.call('POST', '/reports', { targetType: 'listing', targetId: reported.data?.id, reason: 'other', details: 'Smoketest' });
const provisionalNotice = (await user.call('GET', '/me/notices')).data?.find((n) => n.kind === 'provisional_hide' && n.provisional?.targetTitle === reportTitle);
const provisionalMail = (await waitForMails(email, 'vorläufig ausgeblendet')).find((m) => m.Text.includes(reportTitle));
check('[AT-MOD-004] Drei Meldungen blenden die Anzeige aus der Suche aus; Betroffene erhält Mitteilung und Mail „vorläufig, automatisch“ (RV-R-04)',
  reported.status === 201 && visibleBefore && !(await searchIds(lea, reportTitle)).includes(reported.data.id) &&
  provisionalNotice?.decision === null && provisionalNotice.provisional.automated === true && !!provisionalMail &&
  !/\b(Lea|Ben|Mia)\b/.test(provisionalMail.Text),
  { provisionalNotice, mail: !!provisionalMail });

// Rollen (REQ-MOD-007)
const admin = await login('admin@hwg-lu.de');
const roleUp = await admin.call('POST', `/admin/users/${miaId}/role`, { role: 'moderator' });
const roleDown = await admin.call('POST', `/admin/users/${miaId}/role`, { role: 'member' });
const auditLog = (await admin.call('GET', '/admin/audit')).data;
check('[AT-MOD-007] Rollenwechsel durch Admin, im Audit-Log protokolliert',
  roleUp.status === 204 && roleDown.status === 204 && auditLog.some((a) => a.action === 'role.changed' && a.targetId === miaId));
check('[AT-MOD-007-2] Mitglied erhält 403 auf die Nutzerverwaltung', (await lea.call('GET', '/admin/users')).status === 403);
check('[AT-MOD-003] Audit-Log protokolliert die Moderationsentscheidung', auditLog.some((a) => a.action === 'moderation.remove'));

// ------------------------------------------------------------------ DSA: Begründung, Widerspruch, Straftatverdacht (REQ-LEGAL-006..008)
const reportedCase = (await mod.call('GET', '/moderation/cases?status=open')).data.find((c) => c.targetId === reported.data?.id);
const removeReported = await mod.call('POST', `/moderation/cases/${reportedCase?.id}/decision`, {
  decision: 'remove', reason: 'Die Anzeige verstößt nach Prüfung gegen die Community-Regeln.', ruleRef: 'community_prohibited_items',
});
const subjectNotice = (await user.call('GET', '/me/notices')).data?.find((n) => n.decision?.targetTitle === reportTitle);
const decisionMails = await waitForMails(email, 'Entscheidung der Moderation', 2);
const decisionMail = decisionMails.find((m) => m.Text.includes(reportTitle));
const reporterIdentity = /\b(Lea|Ben|Mia)\b|(lea|ben|mia)@/;
check('[AT-LEGAL-006] Betroffene erhält Mitteilung und Mail mit Maßnahme, Tatsachen, Regel, Grundlage und Widerspruch, ohne Meldende',
  removeReported.status === 204 && subjectNotice?.recipientRole === 'subject' && subjectNotice.decision.ruleRef === 'community_prohibited_items' &&
  subjectNotice.decision.facts.length >= 20 && subjectNotice.decision.automatedDetection === false && subjectNotice.appeal.possible === true &&
  !!subjectNotice.appeal.deadline && !!decisionMail &&
  ['Anzeige entfernt', 'Verletzte Regel', 'Meldung eines Mitglieds', 'Widerspruch', 'DSA Art. 21'].every((t) => decisionMail.Text.includes(t)) &&
  !reporterIdentity.test(decisionMail.Text) && !reporterIdentity.test(JSON.stringify(subjectNotice)),
  { status: removeReported.status, subjectNotice, mail: !!decisionMail });
const leaNotice = (await lea.call('GET', '/me/notices')).data?.find((n) => n.decision?.id === subjectNotice?.decision.id);
const leaResult = await waitForMails('lea@studmail.hwg-lu.de', 'Ergebnis deiner Meldung');
const leaResultMail = leaResult.find((m) => m.Text.includes('Begründung'));
check('[AT-LEGAL-006-2] Meldende erhalten das Ergebnis mit Begründung und Rechtsbehelfen; ohne Regel oder mit zu kurzer Begründung 422',
  leaNotice?.recipientRole === 'reporter' && leaNotice.appeal.possible === false && !!leaResultMail &&
  ['Begründung', 'DSA Art. 21', 'Rechtsweg'].every((t) => leaResultMail.Text.includes(t)) &&
  withoutRule.status === 422 && withoutRule.data.code === 'rule_required' && tooShort.status === 422,
  { leaNotice, mails: leaResult.length, withoutRule: withoutRule.status, tooShort: tooShort.status });

const appealReason = 'Das ist ein normales Lehrbuch ohne Prüfungslösungen.';
const appealBlank = await user.call('POST', `/moderation/decisions/${subjectNotice?.decision.id}/appeal`, { reason: ' '.repeat(25) });
const appealOne = await user.call('POST', `/moderation/decisions/${subjectNotice?.decision.id}/appeal`, { reason: appealReason });
const appealTwo = await user.call('POST', `/moderation/decisions/${subjectNotice?.decision.id}/appeal`, { reason: appealReason });
// Mias alte Sitzung endete mit dem Rollenwechsel (AT-MOD-007)
const foreignAppeal = await (await login('mia@studmail.hwg-lu.de')).call('POST', `/moderation/decisions/${subjectNotice?.decision.id}/appeal`, { reason: appealReason });
const queuedAppeal = (await mod.call('GET', '/moderation/appeals?status=open')).data?.find((a) => a.id === appealOne.data?.id);
check('[AT-LEGAL-007] Widerspruch aus der Mitteilung erzeugt einen Fall „Widerspruch“; zweiter 409, Fremde 404',
  appealOne.status === 201 && appealOne.data.status === 'open' && appealTwo.status === 409 && appealTwo.data.code === 'appeal_exists' &&
  foreignAppeal.status === 404 && queuedAppeal?.reason === appealReason && queuedAppeal.canDecide === false &&
  appealBlank.status === 422 && appealBlank.data.code === 'reason_too_short',
  [appealOne.status, appealTwo.status, foreignAppeal.status, queuedAppeal?.canDecide, appealBlank.status]);
const ownReview = await mod.call('POST', `/moderation/appeals/${appealOne.data?.id}/decision`, { outcome: 'reversed', reason: 'Ich prüfe meine eigene Entscheidung noch einmal.' });
check('[AT-LEGAL-007-2] Der ursprüngliche Entscheider kann den Widerspruch nicht entscheiden (403)',
  ownReview.status === 403 && ownReview.data.code === 'four_eyes');
const reversal = await admin.call('POST', `/moderation/appeals/${appealOne.data?.id}/decision`, { outcome: 'reversed', reason: 'Lehrbuch ohne Lösungen, kein Verstoß erkennbar.' });
const restored = await user.call('GET', `/listings/${reported.data?.id}`);
const userResult = (await user.call('GET', '/me/notices')).data?.find((n) => n.kind === 'appeal_result' && n.decision?.id === subjectNotice?.decision.id);
const leaAppealResult = (await lea.call('GET', '/me/notices')).data?.find((n) => n.kind === 'appeal_result' && n.decision?.id === subjectNotice?.decision.id);
const appealAudit = (await admin.call('GET', '/admin/audit')).data;
check('[AT-LEGAL-007-3] Stattgeben stellt die Anzeige wieder her; beide Seiten erhalten eine Mitteilung; Audit-Log',
  reversal.status === 204 && restored.data?.status === 'active' && userResult?.appeal.status === 'reversed' &&
  leaAppealResult?.appeal.status === 'reversed' && !!userResult?.appeal.outcomeReason &&
  appealAudit.some((a) => a.action === 'appeal.created') && appealAudit.some((a) => a.action === 'appeal.reversed'),
  { reversal: reversal.status, listing: restored.data?.status, userResult, leaAppealResult });

const crimeTitle = `Smoketest Beweissicherung ${TS}`;
const crimeListing = await user.call('POST', '/listings', listingBody({ title: crimeTitle }));
await ben.call('POST', '/reports', { targetType: 'listing', targetId: crimeListing.data?.id, reason: 'fraud', details: 'Smoketest Straftat' });
const crimeCase = (await mod.call('GET', '/moderation/cases?status=open')).data.find((c) => c.targetId === crimeListing.data?.id);
const crimeGround = '§ 263 StGB (Betrug): Vorkasse ohne Absicht zu liefern, gefälschte Zahlungsbelege.';
const crimeBody = { decision: 'remove', reason: 'Betrugsversuch mit Vorkasse und gefälschten Belegen.', ruleRef: 'illegal_content', criminalSuspicion: 'suspected', legalGround: crimeGround };
const crimeNoGround = await mod.call('POST', `/moderation/cases/${crimeCase?.id}/decision`, { ...crimeBody, legalGround: undefined, criminalSuspicionReason: 'Mehrere Mitglieder berichten von Vorkasse ohne Ware.' });
const crimeNoReason = await mod.call('POST', `/moderation/cases/${crimeCase?.id}/decision`, crimeBody);
const memberFlag = await lea.call('POST', `/moderation/cases/${crimeCase?.id}/decision`, { ...crimeBody, criminalSuspicionReason: 'Mehrere Mitglieder berichten von Vorkasse ohne Ware.' });
const crimeDecision = await mod.call('POST', `/moderation/cases/${crimeCase?.id}/decision`, { ...crimeBody, criminalSuspicionReason: 'Mehrere Mitglieder berichten von Vorkasse ohne Ware.' });
const crimeAlert = await waitForMails('admin@hwg-lu.de', 'Verdacht auf Straftat');
const crimeSubjectMail = (await waitForMails(email, 'Entscheidung der Moderation', 3)).find((m) => m.Text.includes(crimeTitle));
const crimeNotice = (await user.call('GET', '/me/notices')).data?.find((n) => n.decision?.targetTitle === crimeTitle);
const hold = (await admin.call('GET', '/admin/evidence-holds')).data?.find((h) => h.targetId === crimeListing.data?.id);
const crimeAudit = (await admin.call('GET', '/admin/audit')).data;
const holdRelease = await admin.call('POST', `/admin/evidence-holds/${hold?.id}/release`);
check('[AT-LEGAL-008] Kennzeichnung „Verdacht auf Straftat“: Audit-Log, Mail an Admins, Beweissicherung; ohne Begründung 422; nicht in der Mitteilung an Betroffene',
  crimeNoReason.status === 422 && crimeNoReason.data.code === 'criminal_reason_required' && memberFlag.status === 403 &&
  crimeDecision.status === 204 && crimeAlert.length >= 1 && !!hold && hold.releasedAt === null && holdRelease.status === 204 &&
  crimeAudit.some((a) => a.action === 'moderation.criminal_suspicion' && a.targetId === crimeListing.data?.id) &&
  !!crimeSubjectMail && !/Straftat/.test(crimeSubjectMail.Text) && !!crimeNotice && !/Straftat|criminal/i.test(JSON.stringify(crimeNotice)) &&
  hold.preservedItems >= 1,
  { noReason: crimeNoReason.status, member: memberFlag.status, decision: crimeDecision.status, alert: crimeAlert.length, hold, release: holdRelease.status });
check('[AT-LEGAL-006] Rechtswidriger Inhalt nur mit Rechtsgrundlage (422 legal_ground_required); Rechtsgrundlage in Mitteilung und Mail (RV-R-03)',
  crimeNoGround.status === 422 && crimeNoGround.data.code === 'legal_ground_required' &&
  crimeNotice?.decision.legalGround === crimeGround && !!crimeSubjectMail && crimeSubjectMail.Text.includes('Rechtsgrundlage'),
  { noGround: crimeNoGround.status, legalGround: crimeNotice?.decision.legalGround });

// ------------------------------------------------------------------ DAC7 (REQ-LEGAL-009)
// Ein meldepflichtiger Verkauf (≥ 2.000 €) mit einem Anzeigenamen, der wie eine Formel aussieht (CSV-Injektion, RV-C-19)
await user.call('PATCH', '/me', { displayName: '=SUMME(1+1)' });
const bigSale = await user.call('POST', '/listings', listingBody({ title: `Smoketest Verkauf ${TS}`, priceCents: 250_000 }));
const saleStart = await ben.call('POST', '/conversations', { listingId: bigSale.data?.id, body: 'Ich nehme es.', clientMsgId: crypto.randomUUID() });
const saleDone = await user.call('POST', `/conversations/${saleStart.data?.conversationId}/deal`, { action: 'complete' });
const year = new Date().getFullYear();
const dac7 = await admin.call('GET', `/admin/reports/dac7?year=${year}`);
const dac7Csv = await admin.call('GET', `/admin/reports/dac7?year=${year}&format=csv`, undefined, { raw: true });
const dac7CsvText = await dac7Csv.text();
const dac7Member = await lea.call('GET', `/admin/reports/dac7?year=${year}`);
const dac7Future = await admin.call('GET', `/admin/reports/dac7?year=${year + 1}`);
const dac7Audit = (await admin.call('GET', '/admin/audit')).data;
check('[AT-LEGAL-009-2] DAC7-Auswertung als JSON und CSV nur für Admins, Mitglied 403, Zukunft 422, Abruf im Audit-Log',
  dac7.status === 200 && dac7.data.thresholds.sales === 30 && dac7.data.thresholds.amountCents === 200_000 && Array.isArray(dac7.data.sellers) &&
  dac7.headers.get('cache-control') === 'no-store' &&
  dac7Csv.status === 200 && (dac7Csv.headers.get('content-type') ?? '').startsWith('text/csv') && dac7CsvText.includes('Konto-ID;') &&
  dac7Member.status === 403 && dac7Future.status === 422 &&
  dac7Audit.filter((a) => a.action === 'report.dac7').length >= 2 &&
  saleDone.status === 200 && dac7.data.sellers.some((s) => s.displayName === '=SUMME(1+1)' && s.amountCents >= 250_000) &&
  !JSON.stringify(dac7.data).includes('@') && dac7CsvText.includes(email) && dac7CsvText.includes("'=SUMME(1+1)") &&
  !/;=SUMME/.test(dac7CsvText),
  [dac7.status, dac7Csv.status, dac7Member.status, dac7Future.status, saleDone.status, dac7.data?.sellers?.length]);
await user.call('PATCH', '/me', { displayName: 'Testi' });

// Demo-Werkzeug (REQ-DEMO-002): Erinnerung für die bald ablaufende Seed-Anzeige von Lea
const due = await admin.call('POST', '/admin/demo/run-due-jobs');
const reminder = await waitForMails('lea@studmail.hwg-lu.de', 'läuft bald ab', 1, 40);
check('[AT-DEMO-002] Fällige Jobs auslösen → 202, Erinnerungsmail in Mailpit', due.status === 202 && reminder.length >= 1);
const reminderHeaders = await headersOf(reminder.at(-1));
const [verifyMail] = await waitForMails(email, 'bestätige');
const verifyHeaders = await headersOf(verifyMail);
const unsubscribeUrl = /<([^>]+)>/.exec(reminderHeaders['List-Unsubscribe']?.[0] ?? '')?.[1];
const leaPrefsBefore = (await lea.call('GET', '/me')).data.notificationPrefs;
const getOnly = unsubscribeUrl ? await fetch(unsubscribeUrl) : null;
const leaPrefsAfterGet = (await lea.call('GET', '/me')).data.notificationPrefs;
const leaId = (await lea.call('GET', '/me')).data.id;
const forged = await fetch(`${API}/notifications/unsubscribe?token=${encodeURIComponent(`${leaId}.listingExpiry.gefälscht`)}`, {
  method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'List-Unsubscribe=One-Click',
});
const oneClick = unsubscribeUrl
  ? await fetch(unsubscribeUrl, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'List-Unsubscribe=One-Click' })
  : null;
const leaPrefs = (await lea.call('GET', '/me')).data.notificationPrefs;
await lea.call('PATCH', '/me', { notificationPrefs: { ...leaPrefs, listingExpiry: true } });
check('[AT-OPS-010] Benachrichtigung mit List-Unsubscribe und One-Click (ohne CSRF-Header), Bestätigungsmail ohne',
  !!unsubscribeUrl && reminderHeaders['List-Unsubscribe-Post']?.[0] === 'List-Unsubscribe=One-Click' &&
  !verifyHeaders['List-Unsubscribe'] && oneClick?.status === 200 && leaPrefs.listingExpiry === false &&
  getOnly?.status === 200 && leaPrefsBefore.listingExpiry === true && leaPrefsAfterGet.listingExpiry === true && forged.status === 404 &&
  reminder.at(-1)?.Text.includes('/impressum') && verifyMail?.Text.includes('/datenschutz'),
  { reminderHeaders, oneClick: oneClick?.status, leaPrefs });

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
const ban = await mod.call('POST', `/moderation/cases/${userCase?.id}/decision`, { decision: 'ban', reason: 'Smoketest: Konto sperren', ruleRef: 'terms_member_duties' });
const bannedCreate = await userNow.call('POST', '/listings', listingBody({ title: 'Nach Sperre' }));
const bannedUpload = await userNow.call('POST', '/uploads', pngForm());
const bannedEdit = await userNow.call('PATCH', `/listings/${created.data.id}`, { title: 'Nach Sperre geändert' });
check('[AT-SEC-011-2] Nach Sperre: Anlegen, Upload und Bearbeiten mit alter Sitzung → 401',
  ban.status === 204 && bannedCreate.status === 401 && bannedUpload.status === 401 && bannedEdit.status === 401,
  [ban.status, bannedCreate.status, bannedUpload.status, bannedEdit.status]);
const banMail = (await waitForMails(email, 'Konto dauerhaft gesperrt')).at(-1);
const appealToken = tokenOf(banMail);
const tokenInfo = await anon.call('POST', '/appeals/token/info', { token: appealToken });
const tokenUnknown = await anon.call('POST', '/appeals/token/info', { token: 'unbekanntes-token-0000000000' });
const tokenAppeal = await anon.call('POST', '/appeals/token', { token: appealToken, reason: 'Ich habe nicht gegen die Regeln verstoßen.' });
const tokenAgain = await anon.call('POST', '/appeals/token', { token: appealToken, reason: 'Ich habe nicht gegen die Regeln verstoßen.' });
const tokenInfoAfter = await anon.call('POST', '/appeals/token/info', { token: appealToken });
check('[AT-LEGAL-007-4] Gesperrtes Konto widerspricht über den Link aus der Mail ohne Anmeldung; Token nur im Fragment; unbekannt 404, zweite Nutzung 410',
  !!banMail && banMail.Text.includes('/widerspruch#token=') && tokenInfo.status === 200 && tokenInfo.data.decision.decision === 'ban' &&
  tokenUnknown.status === 404 && tokenAppeal.status === 201 && tokenAgain.status === 410 && tokenAgain.data.code === 'token_used' &&
  tokenInfoAfter.status === 410,
  [!!banMail, tokenInfo.status, tokenUnknown.status, tokenAppeal.status, tokenAgain.status, tokenInfoAfter.status]);
const alias = email.replace('@', '+neu@');
const aliasReg = await register(alias);
const aliasMails = await waitForMails(alias, 'bestätige', 1, 30);
check('[AT-AUTH-008] Gesperrte Adresse (auch mit +Alias): neutrale Antwort, kein neues Konto, keine Mail',
  aliasReg.status === 202 && aliasMails.length === 0,
  aliasReg.status === 429 ? 'Registrierungsgrenze je IP erreicht (Q-18): Stack mit „docker compose down -v“ neu starten oder eine Stunde warten' : aliasReg.status);

// Stattgabe des Widerspruchs gegen die Sperre: Konto entsperrt, Anmeldung wieder möglich; Meldende informiert (RV-R-14)
const banAppeal = (await admin.call('GET', '/moderation/appeals?status=open')).data?.find((a) => a.id === tokenAppeal.data?.id);
const unban = await admin.call('POST', `/moderation/appeals/${tokenAppeal.data?.id}/decision`, {
  outcome: 'reversed', reason: 'Die Sperre war nicht ausreichend begründet und wird aufgehoben.',
});
const loginAfterUnban = await anon.call('POST', '/auth/login', { email, password: 'ganz-neues-passwort-2026' });
const leaUnbanNotice = (await lea.call('GET', '/me/notices')).data?.find((n) => n.kind === 'appeal_result' && n.decision?.decision === 'ban');
check('[AT-LEGAL-007-3] Stattgabe gegen eine Sperre: Konto entsperrt, Anmeldung wieder möglich, Meldende erhält das Ergebnis',
  banAppeal?.canDecide === true && unban.status === 204 && loginAfterUnban.status === 200 && leaUnbanNotice?.appeal.status === 'reversed',
  { canDecide: banAppeal?.canDecide, unban: unban.status, login: loginAfterUnban.status, leaUnbanNotice: !!leaUnbanNotice });

// Vier-Augen-Prinzip vollständig (RV-C-01, RV-C-14): Meldende entscheiden nicht, Widersprechende nicht über sich selbst
const adminListing = await admin.call('POST', '/listings', listingBody({ title: `Smoketest Vier-Augen ${TS}` }));
await mod.call('POST', '/reports', { targetType: 'listing', targetId: adminListing.data?.id, reason: 'other', details: 'Smoketest Vier-Augen' });
const fourCase = (await mod.call('GET', '/moderation/cases?status=open')).data?.find((c) => c.targetId === adminListing.data?.id);
const reporterDecides = await mod.call('POST', `/moderation/cases/${fourCase?.id}/decision`, {
  decision: 'remove', reason: 'Ich entscheide über meine eigene Meldung.', ruleRef: 'terms_member_duties',
});
await admin.call('POST', `/admin/users/${miaId}/role`, { role: 'moderator' });
const miaMod = await login('mia@studmail.hwg-lu.de');
const miaDecides = await miaMod.call('POST', `/moderation/cases/${fourCase?.id}/decision`, {
  decision: 'remove', reason: 'Prüfung durch eine unbeteiligte Person: Verstoß.', ruleRef: 'terms_member_duties',
});
const adminNotice = (await admin.call('GET', '/me/notices')).data?.find((n) => n.decision?.targetTitle === `Smoketest Vier-Augen ${TS}`);
const adminAppeal = await admin.call('POST', `/moderation/decisions/${adminNotice?.decision.id}/appeal`, { reason: 'Ich halte die Entfernung für unbegründet.' });
const selfDecide = await admin.call('POST', `/moderation/appeals/${adminAppeal.data?.id}/decision`, { outcome: 'reversed', reason: 'Ich gebe meinem eigenen Widerspruch statt.' });
const reporterAppealDecide = await mod.call('POST', `/moderation/appeals/${adminAppeal.data?.id}/decision`, { outcome: 'upheld', reason: 'Ich habe gemeldet und entscheide trotzdem.' });
const adminQueue = (await admin.call('GET', '/moderation/appeals?status=open')).data?.find((a) => a.id === adminAppeal.data?.id);
await admin.call('POST', `/admin/users/${miaId}/role`, { role: 'member' });
check('[AT-LEGAL-007-2] Vier-Augen: Meldende entscheiden den Fall nicht (422), Widersprechende und Meldende nicht den Widerspruch (403)',
  reporterDecides.status === 422 && reporterDecides.data.code === 'own_case' && miaDecides.status === 204 &&
  adminAppeal.status === 201 && selfDecide.status === 403 && selfDecide.data.code === 'four_eyes' &&
  reporterAppealDecide.status === 403 && adminQueue?.canDecide === false,
  [reporterDecides.status, miaDecides.status, adminAppeal.status, selfDecide.status, reporterAppealDecide.status, adminQueue?.canDecide]);

// ------------------------------------------------------------------ Betrieb
const metrics = await fetch(`${BASE}/metrics`);
const metricsText = await metrics.text();
check('/metrics im Prometheus-Format inkl. Betriebsmetriken (app_ready, Wartungsmodus, letzte Sicherung)',
  metricsText.includes('http_request_duration_seconds') && /^app_ready 1$/m.test(metricsText) &&
  /^campusmarkt_maintenance_mode 0$/m.test(metricsText) && /^campusmarkt_backup_last_success_timestamp_seconds \d+$/m.test(metricsText));

const announcementText = `Smoketest: Wartung am Samstag 8–10 Uhr (${TS})`;
const memberAnnouncement = await lea.call('PUT', '/admin/announcement', { text: announcementText });
const setAnnouncement = await admin.call('PUT', '/admin/announcement', { text: announcementText });
const publicAnnouncement = (await anon.call('GET', '/status')).data?.announcement?.text;
const removeAnnouncement = await admin.call('DELETE', '/admin/announcement');
const announcementAudit = (await admin.call('GET', '/admin/audit')).data;
check('[AT-OPS-006-2] Admin setzt und entfernt eine Ankündigung (Mitglied 403), öffentlich abrufbar, im Audit-Log',
  memberAnnouncement.status === 403 && setAnnouncement.status === 200 && publicAnnouncement === announcementText &&
  removeAnnouncement.status === 200 && removeAnnouncement.data.announcement === null &&
  announcementAudit.some((a) => a.action === 'announcement.set') && announcementAudit.some((a) => a.action === 'announcement.removed'));

// Weicher Wartungsmodus über die Einstellung; MAINTENANCE_MODE=true nutzt denselben Pfad (Unit-Test server.test.ts)
const memberMaintenance = await lea.call('PUT', '/admin/maintenance', { on: true });
const maintenanceOn = await admin.call('PUT', '/admin/maintenance', { on: true, until: new Date(Date.now() + 30 * 60_000).toISOString() });
try {
  const pageDuring = await fetch(`${BASE}/`);
  const pageText = await pageDuring.text();
  const apiDuring = await lea.call('POST', '/listings', listingBody({ title: 'Während der Wartung' }));
  const healthDuring = await fetch(`${BASE}/health/ready`);
  const statusDuring = await anon.call('GET', '/status');
  const legalDuring = await fetch(`${BASE}/datenschutz`);
  const adminDuring = await admin.call('GET', '/admin/jobs');
  const metricsDuring = await (await fetch(`${BASE}/metrics`)).text();
  check('[AT-OPS-006] Wartungsmodus: Seiten und API 503 mit Retry-After; Health, Status, Rechtsseiten und Admin erreichbar',
    memberMaintenance.status === 403 && maintenanceOn.status === 200 && maintenanceOn.data.status === 'maintenance' &&
    pageDuring.status === 503 && Number(pageDuring.headers.get('retry-after')) >= 60 && pageText.includes('gewartet') &&
    apiDuring.status === 503 && apiDuring.data?.code === 'maintenance' && !!apiDuring.headers.get('retry-after') &&
    healthDuring.status === 200 && statusDuring.status === 200 && statusDuring.data.maintenance.active === true &&
    legalDuring.status === 200 && adminDuring.status === 200 && /^campusmarkt_maintenance_mode 1$/m.test(metricsDuring),
    [memberMaintenance.status, maintenanceOn.status, pageDuring.status, apiDuring.status, healthDuring.status, statusDuring.status, legalDuring.status, adminDuring.status]);
} finally {
  const off = await admin.call('PUT', '/admin/maintenance', { on: false });
  check('Wartungsmodus wieder aus', off.status === 200 && off.data.maintenance.active === false && (await fetch(`${BASE}/`)).status === 200);
}

check('[AT-ARCH-005] Alle Smoke-Prüfungen gegen das Docker-Beispiel bestanden', failures === 0, `${failures} Fehler`);
console.log(failures ? `\n${failures} Prüfung(en) fehlgeschlagen` : '\nAlle Prüfungen bestanden');
process.exit(failures ? 1 : 0);
