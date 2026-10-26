#!/usr/bin/env node
/**
 * Löschfristen (REQ-PRIV-003) mit vorgestellter Zeit: Datensätze werden per psql zurückdatiert, dann löst die
 * Administration den Löschlauf aus (POST /admin/demo/run-due-jobs, nur DEMO_MODE) und der Test prüft das Ergebnis.
 *   node tests/ops/retention-test.mjs [http://localhost:8080] [http://localhost:8025] [--project <compose-projekt>]
 *
 * Verändert Daten (legt ein Testkonto an und löscht es). Dauer etwa 30–60 s.
 * Nicht geprüft: reservierte Anzeigen nach 30 Tagen (noch nicht umgesetzt, siehe REQ-PRIV-003).
 */
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const urls = args.filter((a) => a.startsWith('http'));
const BASE = urls[0] ?? 'http://localhost:8080';
const MAILPIT = urls[1] ?? 'http://localhost:8025';
const projectIdx = args.indexOf('--project');
const project = projectIdx >= 0 ? ['-p', args[projectIdx + 1]] : [];
const API = `${BASE}/api/v1`;
const DEMO_PASSWORD = 'CampusMarkt-Demo-2026';
const TS = Date.now();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let failures = 0;
function check(name, ok, detail) {
  if (!ok) failures++;
  console.log(`${ok ? '✔' : '✘'} ${name}${ok || detail === undefined ? '' : `  ${JSON.stringify(detail)}`}`);
}

/** SQL im db-Container; Ergebnis als Text (eine Zeile je Datensatz, Spalten mit |). */
function psql(query) {
  return execFileSync('docker', ['compose', ...project, 'exec', '-T', 'db', 'psql', '-U', 'campusmarkt', '-d', 'campusmarkt', '-qAt', '-c', query], {
    stdio: ['ignore', 'pipe', 'pipe'],
  })
    .toString()
    .trim();
}
const uuid = (value) => {
  if (!/^[0-9a-f-]{36}$/i.test(value ?? '')) throw new Error(`keine UUID: ${value}`);
  return value;
};

function session() {
  let cookie = '';
  async function call(method, path, body) {
    const headers = { cookie };
    if (method !== 'GET') headers['x-campusmarkt-csrf'] = '1';
    if (body !== undefined) headers['content-type'] = 'application/json';
    const res = await fetch(`${API}${path}`, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) cookie = setCookie.split(';')[0];
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    return { status: res.status, data };
  }
  return { call };
}

async function login(email, password = DEMO_PASSWORD) {
  const s = session();
  const res = await s.call('POST', '/auth/login', { email, password });
  if (res.status !== 200) throw new Error(`Login ${email}: ${res.status} ${JSON.stringify(res.data)}`);
  return s;
}

async function waitForMail(to, subjectPart) {
  for (let i = 0; i < 60; i++) {
    const data = await (await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`)).json();
    const hit = (data.messages ?? []).find((m) => m.Subject.includes(subjectPart));
    if (hit) return (await fetch(`${MAILPIT}/api/v1/message/${hit.ID}`)).json();
    await sleep(500);
  }
  throw new Error(`Keine Mail „${subjectPart}“ an ${to}`);
}

// ------------------------------------------------------------------ Vorbereitung über die API
const anon = session();
const meta = (await anon.call('GET', '/meta')).data;
const lea = await login('lea@studmail.hwg-lu.de');
const ben = await login('ben@studmail.hwg-lu.de');
const admin = await login('admin@hwg-lu.de');
const listingBody = (title) => ({
  kind: 'offer', title, description: 'Testanzeige für die Löschfristen.', categoryId: meta.categories[0].id,
  priceType: 'fixed', priceCents: 500, condition: 'good', locationIds: [meta.locations[0].id],
});

const paused = (await lea.call('POST', '/listings', listingBody(`Fristtest pausiert ${TS}`))).data;
await lea.call('POST', `/listings/${paused.id}/status`, { action: 'pause' });
const removed = (await lea.call('POST', '/listings', listingBody(`Fristtest entfernt ${TS}`))).data;
const chatListing = (await lea.call('POST', '/listings', listingBody(`Fristtest Chat ${TS}`))).data;
const oldChat = (await ben.call('POST', '/conversations', { listingId: chatListing.id, body: 'Alte Nachricht', clientMsgId: crypto.randomUUID() })).data;

// Konto mit Löschantrag: registrieren, bestätigen, schreiben, Löschung beantragen
const leaver = `fristtest.${TS}@studmail.hwg-lu.de`;
await anon.call('POST', '/auth/register', {
  email: leaver, password: 'mein-langes-test-passwort', displayName: 'Fristtest', acceptTerms: true, termsVersion: meta.termsVersion,
});
const verifyMail = await waitForMail(leaver, 'bestätige');
const leaverSession = session();
const token = decodeURIComponent(verifyMail.Text.match(/token=([A-Za-z0-9_\-%]+)/)[1]);
const verified = await leaverSession.call('POST', '/auth/verify', { token });
const leaverId = uuid(verified.data?.id);
const leaverConv = (await leaverSession.call('POST', '/conversations', {
  listingId: chatListing.id, body: `Text des ausscheidenden Mitglieds ${TS}`, clientMsgId: crypto.randomUUID(),
})).data;
await lea.call('POST', `/conversations/${leaverConv.conversationId}/messages`, { body: `Antwort von Lea ${TS}`, clientMsgId: crypto.randomUUID() });
const deletion = await leaverSession.call('POST', '/me/delete', { password: 'mein-langes-test-passwort' });

// Unbestätigtes Konto
const unverified = `unbestaetigt.${TS}@studmail.hwg-lu.de`;
await anon.call('POST', '/auth/register', {
  email: unverified, password: 'mein-langes-test-passwort', displayName: 'Unbestätigt', acceptTerms: true, termsVersion: meta.termsVersion,
});

// ------------------------------------------------------------------ Zeit vorstellen (psql)
const leaId = uuid(psql(`SELECT id FROM identity."user" WHERE email = 'lea@studmail.hwg-lu.de'`));
psql(`UPDATE listings.listing SET status_changed_at = now() - interval '91 days' WHERE id = '${uuid(paused.id)}'`);
psql(`UPDATE listings.listing SET status = 'removed', status_before_removal = 'active', status_changed_at = now() - interval '13 months' WHERE id = '${uuid(removed.id)}'`);
psql(`UPDATE messaging.conversation SET last_message_at = now() - interval '13 months' WHERE id = '${uuid(oldChat.conversationId)}'`);
psql(`UPDATE identity."user" SET deletion_requested_at = now() - interval '15 days' WHERE id = '${leaverId}'`);
psql(`UPDATE identity."user" SET created_at = now() - interval '8 days' WHERE email = '${unverified}'`);
psql(`INSERT INTO identity.token (token_hash, user_id, purpose, expires_at, used_at) VALUES ('fristtest-${TS}', '${leaId}', 'reset', now() - interval '9 days', NULL)`);
const auditId = uuid(psql(`INSERT INTO platform.audit_log (actor_id, action, target_type, created_at) VALUES (NULL, 'test.retention', 'test', now() - interval '25 months') RETURNING id`));
const caseId = uuid(psql(`INSERT INTO trust.moderation_case (target_type, target_id, status, created_at, decided_at) VALUES ('listing', gen_random_uuid(), 'decided', now() - interval '14 months', now() - interval '13 months') RETURNING id`));
psql(`INSERT INTO trust.decision (case_id, moderator_id, decision, reason, created_at) VALUES ('${caseId}', '${leaId}', 'no_action', 'Fristtest: alter Fall ohne Maßnahme', now() - interval '13 months')`);
psql(`INSERT INTO platform.audit_log (actor_id, action, target_type, created_at) VALUES (NULL, 'test.retention.recent', 'test', now() - interval '23 months')`);

// ------------------------------------------------------------------ Löschlauf
const due = await admin.call('POST', '/admin/demo/run-due-jobs');
check('Löschlauf ausgelöst (DEMO_MODE)', due.status === 202, due.status);
const gone = (sql) => psql(sql) === '0';
let done = false;
for (let i = 0; i < 60 && !done; i++) {
  await sleep(1_000);
  done = gone(`SELECT count(*) FROM identity."user" WHERE id = '${leaverId}'`) && gone(`SELECT count(*) FROM platform.audit_log WHERE id = '${auditId}'`);
}

const pausedStatus = psql(`SELECT status FROM listings.listing WHERE id = '${paused.id}'`);
check('Anzeigen: pausiert seit 90 Tagen → abgelaufen (REQ-PRIV-003)', pausedStatus === 'expired', pausedStatus);
const unverifiedCount = psql(`SELECT count(*) FROM identity."user" WHERE email = '${unverified}'`);
check('Konten: unbestätigt seit 7 Tagen → gelöscht', unverifiedCount === '0', unverifiedCount);

const removedStatus = psql(`SELECT coalesce((SELECT status FROM listings.listing WHERE id = '${removed.id}'), 'weg')`);
const oldChatCount = psql(`SELECT count(*) FROM messaging.conversation WHERE id = '${oldChat.conversationId}'`);
const oldCase = psql(`SELECT count(*) FROM trust.moderation_case WHERE id = '${caseId}'`);
const oldAudit = psql(`SELECT count(*) FROM platform.audit_log WHERE id = '${auditId}'`);
const recentAudit = psql(`SELECT count(*) FROM platform.audit_log WHERE action = 'test.retention.recent'`);
const oldLink = psql(`SELECT count(*) FROM identity.token WHERE token_hash = 'fristtest-${TS}'`);
check('[AT-PRIV-003-2] Chats nach 12 Monaten, Meldungen/Entscheidungen nach 12 Monaten, Audit-Log nach 24 Monaten, Links nach 7 Tagen und entfernte Anzeigen nach 12 Monaten gelöscht; jüngere Einträge bleiben',
  oldChatCount === '0' && oldCase === '0' && oldAudit === '0' && recentAudit !== '0' && oldLink === '0' && ['deleted', 'weg'].includes(removedStatus),
  { oldChatCount, oldCase, oldAudit, recentAudit, oldLink, removedStatus });

const leaverRow = psql(`SELECT count(*) FROM identity."user" WHERE id = '${leaverId}'`);
const leaverConsent = psql(`SELECT count(*) || '|' || count(subject_ref) FROM identity.consent WHERE user_id IS NULL AND subject_ref IS NOT NULL AND anonymized_at > now() - interval '1 hour'`);
const leaConversation = (await lea.call('GET', `/conversations/${leaverConv.conversationId}`)).data;
const leaMessages = (await lea.call('GET', `/conversations/${leaverConv.conversationId}/messages`)).data ?? [];
const ownTextGone = !JSON.stringify(leaMessages).includes(`Text des ausscheidenden Mitglieds ${TS}`);
const deletedMarker = leaMessages.some((m) => m.systemCode === 'message_deleted');
const leaReplyKept = leaMessages.some((m) => m.body === `Antwort von Lea ${TS}`);
check('[AT-PRIV-003-3] Kontolöschung: eigene Nachrichtentexte entfernt, Konversation des Gegenübers bleibt mit „Ehemaliges Mitglied“',
  deletion.status === 202 && leaverRow === '0' && ownTextGone && deletedMarker && leaReplyKept &&
  leaConversation?.counterpart?.displayName === 'Ehemaliges Mitglied',
  { deletion: deletion.status, leaverRow, ownTextGone, deletedMarker, leaReplyKept, counterpart: leaConversation?.counterpart });
check('Zustimmungsnachweis bleibt ohne Profilbezug erhalten (REQ-PRIV-003, S-4)', Number(leaverConsent.split('|')[1]) >= 1, leaverConsent);

console.log(failures ? `\n${failures} Prüfung(en) fehlgeschlagen` : '\nAlle Prüfungen bestanden');
process.exit(failures ? 1 : 0);
