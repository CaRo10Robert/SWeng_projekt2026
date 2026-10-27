import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { integrationAvailable, PASSWORD, startHarness, type Harness } from '../../../test/integration/harness.js';

const register = (h: Harness, email: string, extra: Record<string, unknown> = {}) =>
  h.client().call('POST', '/auth/register', {
    email,
    password: PASSWORD,
    displayName: 'Testperson',
    acceptTerms: true,
    termsVersion: h.deps.config.termsVersion,
    ...extra,
  });

describe.skipIf(!integrationAvailable)('Integration identity (PostgreSQL)', () => {
  let h: Harness;
  beforeAll(async () => {
    h = await startHarness();
  });
  afterAll(async () => h?.close());
  beforeEach(async () => h.reset());

  it('Registrierung, Bestätigung per Mail-Link, Anmeldung und Abmeldung', async () => {
    const lea = await h.member('lea@studmail.hwg-lu.de');
    const me = await lea.call('GET', '/me');
    expect(me.status).toBe(200);
    expect(me.data).toMatchObject({ email: 'lea@studmail.hwg-lu.de', userType: 'student', role: 'member' });
    expect((await lea.call('POST', '/auth/logout')).status).toBeLessThan(300);
    expect((await lea.call('GET', '/me')).status).toBe(401);
  });

  it('fremde Domain wird abgelehnt, doppelte Registrierung bleibt neutral und legt kein zweites Konto an', async () => {
    expect((await register(h, 'max@uni-mannheim.de')).data.code).toBe('domain_not_allowed');
    expect((await register(h, 'max@studmail.hwg-lu.de')).status).toBe(202);
    expect((await register(h, 'max+zwei@studmail.hwg-lu.de')).status).toBe(202);
    const rows = await h.sql(`SELECT count(*)::int AS n FROM identity."user" WHERE email_canonical = 'max@studmail.hwg-lu.de'`);
    expect(rows[0].n).toBe(1);
  });

  it('[AT-SEC-002] Passwort-Hash mit Argon2id und mindestens den OWASP-Parametern', async () => {
    await h.member('hash@studmail.hwg-lu.de');
    const [row] = await h.sql<{ password_hash: string }>(
      `SELECT password_hash FROM identity."user" WHERE email = 'hash@studmail.hwg-lu.de'`,
    );
    expect(row!.password_hash).toMatch(/^\$argon2id\$v=19\$m=(\d+),t=(\d+),p=(\d+)\$/);
    const [, m, t, p] = /m=(\d+),t=(\d+),p=(\d+)/.exec(row!.password_hash)!.map(Number);
    expect(m).toBeGreaterThanOrEqual(19_456);
    expect(t).toBeGreaterThanOrEqual(2);
    expect(p).toBeGreaterThanOrEqual(1);
    expect(row!.password_hash).not.toContain(PASSWORD);
  });

  it('[AT-AUTH-002-3] abgelaufener Bestätigungslink liefert token_expired', async () => {
    await register(h, 'spaet@studmail.hwg-lu.de');
    await h.jobs.drain();
    const token = h.mail.token('spaet@studmail.hwg-lu.de', '/verify');
    await h.sql(`UPDATE identity.token SET expires_at = now() - interval '1 minute' WHERE purpose = 'verify'`);
    const res = await h.client().call('POST', '/auth/verify', { token });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.data.code).toBe('token_expired');
  });

  it('[AT-AUTH-002-4] unbestätigtes Konto älter als 7 Tage wird gelöscht, die Adresse ist danach wieder registrierbar', async () => {
    await register(h, 'alt@studmail.hwg-lu.de');
    await h.sql(`UPDATE identity."user" SET created_at = now() - interval '8 days' WHERE email = 'alt@studmail.hwg-lu.de'`);
    await h.privacy.purgeExpired();
    expect(await h.sql(`SELECT 1 FROM identity."user" WHERE email = 'alt@studmail.hwg-lu.de'`)).toHaveLength(0);
    h.mail.sent = [];
    expect((await register(h, 'alt@studmail.hwg-lu.de')).status).toBe(202);
    await h.jobs.drain();
    expect(h.mail.token('alt@studmail.hwg-lu.de', '/verify')).toBeTruthy();
  });

  it('[AT-SEC-005-3] 30 Registrierungen je IP und Stunde werden angenommen, die 31. liefert 429', async () => {
    const statuses: number[] = [];
    for (let i = 1; i <= 31; i++) statuses.push((await register(h, `nutzer${i}@studmail.hwg-lu.de`)).status);
    expect(statuses.slice(0, 30).every((s) => s === 202)).toBe(true);
    expect(statuses[30]).toBe(429);
  });

  it('Anmeldung: nach 5 Fehlversuchen je Konto und IP 429, Antwort ohne Hinweis auf Existenz der Adresse', async () => {
    await h.member('fehler@studmail.hwg-lu.de');
    const c = h.client();
    const unknown = await c.call('POST', '/auth/login', { email: 'gibtsnicht@studmail.hwg-lu.de', password: 'falsches-passwort' });
    const wrong = await c.call('POST', '/auth/login', { email: 'fehler@studmail.hwg-lu.de', password: 'falsches-passwort' });
    expect(unknown.status).toBe(401);
    expect(wrong.status).toBe(401);
    expect(unknown.data.code).toBe(wrong.data.code);
    for (let i = 0; i < 4; i++) await c.call('POST', '/auth/login', { email: 'fehler@studmail.hwg-lu.de', password: 'falsches-passwort' });
    const blocked = await c.call('POST', '/auth/login', { email: 'fehler@studmail.hwg-lu.de', password: PASSWORD });
    expect(blocked.status).toBe(429);
    expect(blocked.headers['retry-after']).toBeDefined();
  });

  it('Passwort zurücksetzen: Link per Mail, neues Passwort gilt, alte Sitzungen enden', async () => {
    const lea = await h.member('reset@studmail.hwg-lu.de');
    const c = h.client();
    expect((await c.call('POST', '/auth/password-reset/request', { email: 'reset@studmail.hwg-lu.de' })).status).toBe(202);
    await h.jobs.drain();
    const token = h.mail.token('reset@studmail.hwg-lu.de', '/reset-password');
    const confirm = await c.call('POST', '/auth/password-reset/confirm', { token, password: 'ganz-neues-passwort-2026' });
    expect(confirm.status).toBeLessThan(300);
    expect((await lea.call('GET', '/me')).status).toBe(401);
    expect((await c.call('POST', '/auth/login', { email: 'reset@studmail.hwg-lu.de', password: 'ganz-neues-passwort-2026' })).status).toBe(200);
    expect((await c.call('POST', '/auth/password-reset/confirm', { token, password: 'noch-ein-passwort-2026' })).status).toBeGreaterThanOrEqual(400);
  });

  it('veraltete Zustimmung: geschützte Aktionen verlangen terms_required, Schutzrechte bleiben, erneute Zustimmung hebt die Sperre auf', async () => {
    const lea = await h.member('terms@studmail.hwg-lu.de');
    await h.sql(`UPDATE identity.consent SET version = '2026-01'`);
    expect((await lea.call('GET', '/me')).data.termsRequired).toBe(true);
    const meta = (await lea.call('GET', '/meta')).data;
    const blocked = await lea.call('POST', '/listings', {
      kind: 'offer', title: 'Ohne Zustimmung', description: 'Darf nicht angelegt werden.', categoryId: meta.categories[0].id,
      priceType: 'free', condition: 'good', locationIds: [meta.locations[0].id],
    });
    expect(blocked.status).toBe(403);
    expect(blocked.data.code).toBe('terms_required');
    expect((await lea.call('PATCH', '/me', { locale: 'en' })).status).toBe(200);
    expect((await lea.call('POST', '/me/terms', { version: '1999-01' })).status).toBe(409);
    expect((await lea.call('POST', '/me/terms', { version: h.deps.config.termsVersion })).status).toBeLessThan(300);
    expect((await lea.call('GET', '/me')).data.termsRequired).toBe(false);
  });

  it('Kenntnisnahme einer neuen Datenschutzerklärung wird im Konto gespeichert', async () => {
    const lea = await h.member('privacy@studmail.hwg-lu.de');
    await h.sql(`UPDATE identity."user" SET privacy_ack_version = '2026-01'`);
    expect((await lea.call('GET', '/me')).data.privacyNoticeVersion).toBe(h.deps.config.privacyVersion);
    expect((await lea.call('POST', '/me/privacy-ack', { version: h.deps.config.privacyVersion })).status).toBeLessThan(300);
    expect((await lea.call('GET', '/me')).data.privacyNoticeVersion).toBeNull();
  });

  it('Profil ändern, Sprache im Konto, Bestätigungsmail in gewählter Sprache', async () => {
    const lea = await h.member('profil@studmail.hwg-lu.de');
    const patched = await lea.call('PATCH', '/me', { displayName: 'Lea M.', studyProgram: 'BWL', locale: 'en' });
    expect(patched.status).toBe(200);
    expect(patched.data).toMatchObject({ displayName: 'Lea M.', studyProgram: 'BWL', locale: 'en' });
    await register(h, 'english@studmail.hwg-lu.de', { locale: 'en' });
    await h.jobs.drain();
    expect(h.mail.to('english@studmail.hwg-lu.de')[0]!.subject).toMatch(/confirm|verify/i);
  });

  it('Notfall: Admin beendet alle Sitzungen, erzwungener Passwortwechsel sperrt die Anmeldung bis zum Reset', async () => {
    const lea = await h.member('notfall@studmail.hwg-lu.de');
    const admin = await h.staff('admin@hwg-lu.de', 'admin');
    const member = await lea.call('POST', '/admin/security/end-sessions', { forcePasswordChange: true });
    expect(member.status).toBe(403);
    expect((await admin.call('POST', '/admin/security/end-sessions', { forcePasswordChange: true })).status).toBe(200);
    expect((await lea.call('GET', '/me')).status).toBe(401);
    const login = await h.client().call('POST', '/auth/login', { email: 'notfall@studmail.hwg-lu.de', password: PASSWORD });
    expect(login.status).toBe(403);
    expect(login.data.code).toBe('password_change_required');
  });

  it('Rollen: nur Admins vergeben Rollen, der Wechsel steht im Audit-Log', async () => {
    const mia = await h.member('mia@studmail.hwg-lu.de');
    const admin = await h.staff('admin2@hwg-lu.de', 'admin');
    expect((await mia.call('GET', '/admin/users')).status).toBe(403);
    const users = (await admin.call('GET', '/admin/users')).data as { id: string; email: string }[];
    const miaId = users.find((u) => u.email === 'mia@studmail.hwg-lu.de')!.id;
    expect((await admin.call('POST', `/admin/users/${miaId}/role`, { role: 'moderator' })).status).toBe(204);
    const page = (await admin.call('GET', '/admin/audit')).data;
    const audit = (page.items ?? page) as { action: string; targetId: string }[];
    expect(audit.some((a) => a.action === 'role.changed' && a.targetId === miaId)).toBe(true);
  });
});
