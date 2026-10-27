import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createLogger } from '../../platform/logger.js';
import { migrate } from '../../platform/migrate.js';
import { integrationAvailable, PASSWORD, startHarness, type Client, type Harness } from '../../../test/integration/harness.js';

type Member = Client & { userId: string; email: string };

describe.skipIf(!integrationAvailable)('Integration privacy, reporting und Betrieb (PostgreSQL)', () => {
  let h: Harness;
  let lea: Member;
  let ben: Member;

  const listing = async (owner: Member, title: string, priceCents = 12_000) => {
    const meta = (await owner.call('GET', '/meta')).data;
    return (
      await owner.call('POST', '/listings', {
        kind: 'offer', title, description: 'Ausführliche Beschreibung des Angebots.', categoryId: meta.categories[0].id,
        priceType: 'fixed', priceCents, condition: 'good', locationIds: [meta.locations[0].id],
      })
    ).data.id as string;
  };

  beforeAll(async () => {
    h = await startHarness();
  });
  afterAll(async () => h?.close());
  beforeEach(async () => {
    await h.reset();
    lea = await h.member('lea@studmail.hwg-lu.de');
    ben = await h.member('ben@studmail.hwg-lu.de');
  });

  it('Datenexport enthält Profil, Einwilligungen, Anzeigen, eigene Nachrichten und Kontaktfreigaben', async () => {
    const id = await listing(lea, 'Schreibtisch');
    const conv = (await ben.call('POST', '/conversations', { listingId: id, body: 'Noch da?', clientMsgId: randomUUID() })).data.conversationId;
    await lea.call('POST', `/conversations/${conv}/contact`, { action: 'grant' });
    const exported = await lea.call('GET', '/me/export');
    expect(exported.status).toBe(200);
    expect(exported.data.account.profile.email).toBe('lea@studmail.hwg-lu.de');
    expect(exported.data.account.consents.length).toBeGreaterThanOrEqual(1);
    expect(JSON.stringify(exported.data)).toContain('Schreibtisch');
    expect(exported.data.contactConsents.length).toBe(1);
    // Keine Daten anderer Mitglieder außer dem Nötigsten
    expect(JSON.stringify(exported.data)).not.toContain('ben@studmail.hwg-lu.de');
  });

  it('Konto löschen: Karenz, Abbruch durch Anmeldung, falsches Passwort wird abgelehnt', async () => {
    expect((await lea.call('POST', '/me/delete', { password: 'falsches-passwort' })).status).toBeGreaterThanOrEqual(400);
    expect((await lea.call('POST', '/me/delete', { password: PASSWORD })).status).toBeLessThan(300);
    const relogin = await h.client().call('POST', '/auth/login', { email: 'lea@studmail.hwg-lu.de', password: PASSWORD });
    expect(relogin.status).toBe(200);
    expect(relogin.data.status ?? 'active').not.toBe('pending_deletion');
    const [row] = await h.sql(`SELECT status FROM identity."user" WHERE email = 'lea@studmail.hwg-lu.de'`);
    expect(row.status).toBe('active');
  });

  it('[AT-ACC-002-2] Löschlauf nach Ablauf der Karenz entfernt alle personenbezogenen Daten und anonymisiert fremde Konversationen', async () => {
    const leaListing = await listing(lea, 'Lampe von Lea');
    const benListing = await listing(ben, 'Regal von Ben');
    const conv = (await lea.call('POST', '/conversations', { listingId: benListing, body: 'Hallo Ben, ich bin Lea', clientMsgId: randomUUID() })).data.conversationId;
    await ben.call('POST', `/conversations/${conv}/messages`, { body: 'Hallo zurück', clientMsgId: randomUUID() });
    await lea.call('PUT', `/listings/${benListing}/favorite`);
    await lea.call('POST', '/me/delete', { password: PASSWORD });
    await h.sql(`UPDATE identity."user" SET deletion_requested_at = now() - interval '15 days' WHERE email = 'lea@studmail.hwg-lu.de'`);
    expect(await h.privacy.purgeDueAccounts()).toBe(1);
    await h.jobs.drain();

    expect(await h.sql(`SELECT 1 FROM identity."user" WHERE email = 'lea@studmail.hwg-lu.de'`)).toHaveLength(0);
    expect(await h.sql(`SELECT 1 FROM listings.listing WHERE id = $1 AND status <> 'deleted'`, [leaListing])).toHaveLength(0);
    expect(await h.sql(`SELECT 1 FROM search.favorite WHERE user_id = $1`, [lea.userId])).toHaveLength(0);
    expect(await h.sql(`SELECT 1 FROM identity.session WHERE user_id = $1`, [lea.userId])).toHaveLength(0);
    // Die Konversation bleibt für Ben erhalten, Leas Texte sind ersetzt, ihr Name erscheint als „Ehemaliges Mitglied“
    const conversations = (await ben.call('GET', '/conversations')).data as { counterpart: { displayName: string } }[];
    expect(conversations[0]!.counterpart.displayName).toMatch(/Ehemaliges Mitglied|Former member/);
    const texts = (await ben.call('GET', `/conversations/${conv}/messages`)).data as { body: string }[];
    expect(texts.map((m) => m.body).join(' ')).not.toContain('ich bin Lea');
    expect(texts.map((m) => m.body)).toContain('Hallo zurück');
    // Zustimmungsnachweis bleibt ohne Profilbezug (3 Jahre)
    const consents = await h.sql(`SELECT user_id, subject_ref FROM identity.consent WHERE user_id IS NULL`);
    expect(consents.length).toBeGreaterThanOrEqual(1);
    expect(consents[0].subject_ref).toBeTruthy();
    // Bestätigung an die bisherige Adresse
    expect(h.mail.to('lea@studmail.hwg-lu.de').length).toBeGreaterThan(0);
  });

  it('[AT-PRIV-002-2] Daten zum Missbrauchsschutz älter als 7 Tage entfernt der tägliche Löschjob', async () => {
    await h.client().call('POST', '/auth/login', { email: 'lea@studmail.hwg-lu.de', password: 'falsches-passwort' });
    await h.sql(`INSERT INTO platform.rate_limit (key, window_start, count) VALUES ('alt:test', now() - interval '8 days', 3)`);
    const before = (await h.sql(`SELECT count(*)::int AS n FROM platform.rate_limit`))[0].n as number;
    expect(before).toBeGreaterThanOrEqual(2);
    await h.jobs.trigger('privacy-purge');
    expect(await h.sql(`SELECT 1 FROM platform.rate_limit WHERE key = 'alt:test'`)).toHaveLength(0);
    expect(await h.sql(`SELECT 1 FROM platform.rate_limit WHERE window_start < now() - interval '7 days'`)).toHaveLength(0);
  });

  it('Löschfristen: inaktive Konversationen nach 12 Monaten, Audit-Log nach 24 Monaten, abgelaufene Sitzungen', async () => {
    const id = await listing(lea, 'Alte Konversation');
    const conv = (await ben.call('POST', '/conversations', { listingId: id, body: 'Uralt', clientMsgId: randomUUID() })).data.conversationId;
    await h.sql(`UPDATE messaging.conversation SET last_message_at = now() - interval '13 months' WHERE id = $1`, [conv]);
    await h.sql(`ALTER TABLE platform.audit_log DISABLE TRIGGER audit_log_append_only`);
    await h.sql(`INSERT INTO platform.audit_log (action, target_type, created_at) VALUES ('alt.eintrag', 'test', now() - interval '25 months')`);
    await h.sql(`ALTER TABLE platform.audit_log ENABLE TRIGGER audit_log_append_only`);
    await h.sql(`UPDATE identity.session SET expires_at = now() - interval '1 minute' WHERE user_id = $1`, [ben.userId]);
    const stats = await h.privacy.purgeExpired();
    expect(stats.conversations).toBeGreaterThanOrEqual(1);
    expect(await h.sql(`SELECT 1 FROM messaging.conversation WHERE id = $1`, [conv])).toHaveLength(0);
    expect(await h.sql(`SELECT 1 FROM platform.audit_log WHERE action = 'alt.eintrag'`)).toHaveLength(0);
    expect(await h.sql(`SELECT 1 FROM identity.session WHERE user_id = $1`, [ben.userId])).toHaveLength(0);
  });

  it('Löschjournal: nach einer Wiederherstellung wird eine spätere Löschung erneut angewendet', async () => {
    const id = await listing(lea, 'Wird gelöscht');
    const since = new Date(Date.now() - 1_000);
    await lea.call('DELETE', `/listings/${id}`);
    const journal = await h.deps.journal.merge([]);
    expect(journal.some((e) => e.id === id)).toBe(true);
    // Simulierte Wiederherstellung: Anzeige wieder aktiv wie im älteren Backup
    await h.sql(`UPDATE listings.listing SET status = 'active' WHERE id = $1`, [id]);
    expect(await h.privacy.replayDeletions(journal, since)).toBeGreaterThanOrEqual(1);
    expect((await h.sql(`SELECT status FROM listings.listing WHERE id = $1`, [id]))[0].status).toBe('deleted');
  });

  it('DAC7: meldepflichtig ab 30 Verkäufen oder 2.000 €; CSV ohne Formel-Injektion; JSON ohne E-Mail; nur Admins', async () => {
    const admin = await h.staff('admin@hwg-lu.de', 'admin');
    await lea.call('PATCH', '/me', { displayName: '=SUMME(1+1)' });
    const big = await listing(lea, 'Teures Notebook', 250_000);
    const conv = (await ben.call('POST', '/conversations', { listingId: big, body: 'Ich nehme es.', clientMsgId: randomUUID() })).data.conversationId;
    expect((await lea.call('POST', `/conversations/${conv}/deal`, { action: 'complete' })).status).toBe(200);
    const year = new Date().getFullYear();
    expect((await lea.call('GET', `/admin/reports/dac7?year=${year}`)).status).toBe(403);
    const report = await admin.call('GET', `/admin/reports/dac7?year=${year}`);
    expect(report.status).toBe(200);
    const seller = report.data.sellers.find((s: { userId: string }) => s.userId === lea.userId);
    expect(seller).toMatchObject({ sales: 1 });
    expect(JSON.stringify(report.data)).not.toContain('@studmail');
    const csv = await admin.call('GET', `/admin/reports/dac7?year=${year}&format=csv`);
    expect(String(csv.data)).toContain("'=SUMME");
    expect(String(csv.data)).toContain('lea@studmail.hwg-lu.de');
    expect((await admin.call('GET', `/admin/reports/dac7?year=${year + 1}`)).status).toBe(422);
    const page = (await admin.call('GET', '/admin/audit')).data;
    expect((page.items ?? page).some((a: { action: string }) => a.action === 'report.dac7')).toBe(true);
  });

  it('Wartungsmodus: Admin schaltet ein, Mitglieder bekommen 503 mit Retry-After, Status und Admin bleiben erreichbar', async () => {
    const admin = await h.staff('admin@hwg-lu.de', 'admin');
    expect((await admin.call('PUT', '/admin/maintenance', { on: true })).status).toBe(200);
    const blocked = await lea.call('GET', '/conversations');
    expect(blocked.status).toBe(503);
    expect(blocked.headers['retry-after']).toBeDefined();
    expect((await h.client().call('GET', '/status')).status).toBe(200);
    expect((await admin.call('PUT', '/admin/maintenance', { on: false })).status).toBe(200);
    expect((await lea.call('GET', '/conversations')).status).toBe(200);
  });

  it('[AT-OPS-005] Migrationen sind idempotent: ein zweiter Lauf wendet nichts neu an und die Datenbank bleibt bereit', async () => {
    const before = await h.sql(`SELECT name FROM public.schema_migrations ORDER BY name`);
    await migrate(h.database.pool, resolve(import.meta.dirname, '../../../migrations'), createLogger('silent'));
    const after = await h.sql(`SELECT name FROM public.schema_migrations ORDER BY name`);
    expect(after).toEqual(before);
    expect(before.length).toBeGreaterThanOrEqual(5);
    expect(await h.database.ping()).toBe(true);
  });
});
