import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { integrationAvailable, PASSWORD, startHarness, type Client, type Harness } from '../../../test/integration/harness.js';

type Member = Client & { userId: string; email: string };

/**
 * REQ-NOTI-001: jede geforderte Mailart wird über die echte API ausgelöst; der Mail-Catcher (FakeMail am MailPort)
 * muss sie empfangen. Geprüft werden Empfänger, Betreff, Link zur Plattform, Fußzeile (REQ-UX-006) und dass
 * keine Chatinhalte in Mails stehen.
 */
describe.skipIf(!integrationAvailable)('Integration notifications (PostgreSQL)', () => {
  let h: Harness;
  let lea: Member;
  let ben: Member;

  const listing = async (owner: Member, title: string) => {
    const meta = (await owner.call('GET', '/meta')).data;
    return (
      await owner.call('POST', '/listings', {
        kind: 'offer', title, description: 'Gut erhalten, Abholung auf dem Campus.', categoryId: meta.categories[0].id,
        priceType: 'fixed', priceCents: 2_500, condition: 'good', locationIds: [meta.locations[0].id],
      })
    ).data.id as string;
  };

  /** Genau eine neue Mail an `to` mit passendem Betreff seit `since` (Index in h.mail.sent). */
  const expectMail = (since: number, to: string, subject: RegExp) => {
    const mails = h.mail.sent.slice(since).filter((m) => m.to.toLowerCase() === to && subject.test(m.subject));
    expect(mails, `Mail „${subject.source}“ an ${to}`).toHaveLength(1);
    const mail = mails[0]!;
    expect(mail.text).toContain(h.deps.config.publicUrl);
    for (const path of ['/impressum', '/datenschutz', '/kontakt']) {
      expect(mail.text, `Fußzeile ${path}`).toContain(`${h.deps.config.publicUrl}${path}`);
      expect(mail.html, `Fußzeile ${path} (HTML)`).toContain(`${h.deps.config.publicUrl}${path}`);
    }
    return mail;
  };

  beforeAll(async () => {
    h = await startHarness();
  });
  afterAll(async () => h?.close());
  beforeEach(async () => {
    await h.reset();
    lea = await h.member('lea@studmail.hwg-lu.de');
    ben = await h.member('ben@studmail.hwg-lu.de');
    await h.jobs.drain();
  });

  it('[AT-NOTI-001-2] jede Mailart aus REQ-NOTI-001 kommt nach ihrem Auslöser im Mail-Catcher an', async () => {
    const anonymous = h.client();
    const terms = h.deps.config.termsVersion;

    // Verifikation: Registrierung
    let mark = h.mail.sent.length;
    await anonymous.call('POST', '/auth/register', { email: 'mia@studmail.hwg-lu.de', password: PASSWORD, displayName: 'Mia', acceptTerms: true, termsVersion: terms });
    await h.jobs.drain();
    expect(expectMail(mark, 'mia@studmail.hwg-lu.de', /bestätige deine E-Mail-Adresse/).text).toMatch(/\/verify[?#]token=/);

    // „Konto existiert bereits“: Registrierung mit bestehender Adresse
    mark = h.mail.sent.length;
    await anonymous.call('POST', '/auth/register', { email: 'lea@studmail.hwg-lu.de', password: PASSWORD, displayName: 'Lea', acceptTerms: true, termsVersion: terms });
    await h.jobs.drain();
    expectMail(mark, 'lea@studmail.hwg-lu.de', /bereits ein Konto/);

    // Passwort zurücksetzen
    mark = h.mail.sent.length;
    await anonymous.call('POST', '/auth/password-reset/request', { email: 'ben@studmail.hwg-lu.de' });
    await h.jobs.drain();
    expect(expectMail(mark, 'ben@studmail.hwg-lu.de', /Passwort zurücksetzen/).text).toMatch(/\/reset-password[?#]token=/);

    // Neue Nachricht: ungelesene Nachricht, ohne Inhalt in der Mail
    const bike = await listing(lea, 'Fahrrad 28 Zoll');
    mark = h.mail.sent.length;
    await ben.call('POST', '/conversations', { listingId: bike, body: 'Vertraulicher Chatinhalt 4711', clientMsgId: randomUUID() });
    await h.jobs.drain();
    const message = expectMail(mark, 'lea@studmail.hwg-lu.de', /Neue Nachricht zu „Fahrrad 28 Zoll“/);
    expect(message.text + message.html).not.toContain('4711');
    expect(message.headers?.['List-Unsubscribe']).toBeTruthy();

    // Ablauf-Erinnerung: 7 Tage vor Ablauf
    const lamp = await listing(lea, 'Schreibtischlampe');
    await h.sql(`UPDATE listings.listing SET expires_at = now() - interval '1 minute' WHERE id = $1`, [lamp]);
    mark = h.mail.sent.length;
    await h.modules.listings.maintenance();
    await h.jobs.drain();
    expectMail(mark, 'lea@studmail.hwg-lu.de', /Bitte erneuere deine Anzeige „Schreibtischlampe“/);

    // Moderationsentscheidung: Anzeige nach Meldung entfernt, Mail mit Entscheidung und Begründung
    const mod = await h.staff('mod@hwg-lu.de', 'moderator');
    const book = await listing(lea, 'Lehrbuch mit Lösungen');
    await ben.call('POST', '/reports', { targetType: 'listing', targetId: book, reason: 'other', details: 'Enthält Klausurlösungen' });
    const cases = (await mod.call('GET', '/moderation/cases?status=open')).data as { id: string; targetId: string }[];
    const reason = 'Die Anzeige verstößt nach Prüfung gegen die Community-Regeln.';
    mark = h.mail.sent.length;
    const decided = await mod.call('POST', `/moderation/cases/${cases.find((c) => c.targetId === book)!.id}/decision`, {
      decision: 'remove', reason, ruleRef: 'community_prohibited_items',
    });
    expect(decided.status).toBe(204);
    await h.jobs.drain();
    const decision = expectMail(mark, 'lea@studmail.hwg-lu.de', /Entscheidung der Moderation/);
    expect(decision.text).toContain('Lehrbuch mit Lösungen');
    expect(decision.text).toContain(reason);

    // Löschung angekündigt und abgeschlossen
    mark = h.mail.sent.length;
    expect((await ben.call('POST', '/me/delete', { password: PASSWORD })).status).toBeLessThan(300);
    await h.jobs.drain();
    expectMail(mark, 'ben@studmail.hwg-lu.de', /Konto wird gelöscht/);
    await h.sql(`UPDATE identity."user" SET deletion_requested_at = now() - interval '15 days' WHERE email = 'ben@studmail.hwg-lu.de'`);
    mark = h.mail.sent.length;
    expect(await h.privacy.purgeDueAccounts()).toBe(1);
    await h.jobs.drain();
    expectMail(mark, 'ben@studmail.hwg-lu.de', /Konto wurde gelöscht/);

    expect(h.jobs.failed).toEqual([]);
  });

  it('[AT-NOTI-008] Benachrichtigungen in der App: Auslöser, Zähler mit Echtzeit, gelesen/ungelesen, nur eigene, Paginierung, Löschfristen', async () => {
    const events: { type: string; unread?: number }[] = [];
    h.deps.realtime.subscribe(lea.userId, (e) => events.push(e as { type: string; unread?: number }));
    const unread = async (c: Member) => (await c.call('GET', '/me/notifications/unread')).data.count as number;
    const list = async (c: Member, query = '') => (await c.call('GET', `/me/notifications${query}`)).data as {
      items: { id: string; kind: string; data: Record<string, unknown>; readAt: string | null }[];
      nextCursor: string | null;
    };

    // Chatnachrichten erzeugen keine Benachrichtigung (eigener Zähler)
    const lamp = await listing(lea, 'Schreibtischlampe');
    await ben.call('POST', '/conversations', { listingId: lamp, body: 'Vertraulicher Chatinhalt 4711', clientMsgId: randomUUID() });
    await h.jobs.drain();
    expect(await unread(lea)).toBe(0);

    // Ablauf-Erinnerung
    await h.sql(`UPDATE listings.listing SET expires_at = now() - interval '1 minute' WHERE id = $1`, [lamp]);
    await h.modules.listings.maintenance();
    // Moderationsentscheidung: Betroffene und Meldende
    const mod = await h.staff('mod@hwg-lu.de', 'moderator');
    const book = await listing(lea, 'Lehrbuch mit Lösungen');
    await ben.call('POST', '/reports', { targetType: 'listing', targetId: book, reason: 'other', details: 'Enthält Klausurlösungen' });
    const cases = (await mod.call('GET', '/moderation/cases?status=open')).data as { id: string; targetId: string }[];
    await mod.call('POST', `/moderation/cases/${cases.find((c) => c.targetId === book)!.id}/decision`, {
      decision: 'remove', reason: 'Die Anzeige verstößt nach Prüfung gegen die Community-Regeln.', ruleRef: 'community_prohibited_items',
    });
    await h.jobs.drain();

    expect(await unread(lea)).toBe(2);
    expect(await unread(ben)).toBe(1);
    expect(events.filter((e) => e.type === 'notifications').at(-1)?.unread).toBe(2);
    const all = await list(lea);
    expect(all.items.map((n) => n.kind)).toEqual(['moderation_notice', 'listing_renewal_due']);
    expect(all.items[0]!.data).toMatchObject({ listingId: book, listingTitle: 'Lehrbuch mit Lösungen' });
    expect(all.items[1]!.data).toMatchObject({ listingId: lamp, listingTitle: 'Schreibtischlampe' });
    expect(JSON.stringify(all)).not.toContain('4711');

    // Paginierung, neueste zuerst
    const first = await list(lea, '?limit=1');
    expect(first.items.map((n) => n.id)).toEqual([all.items[0]!.id]);
    const second = await list(lea, `?limit=1&cursor=${first.nextCursor}`);
    expect(second.items.map((n) => n.id)).toEqual([all.items[1]!.id]);
    expect(second.nextCursor).toBeNull();

    // Gelesen, ungelesen, nur eigene
    const id = all.items[0]!.id;
    expect((await lea.call('PUT', `/me/notifications/${id}/read`, { read: true })).status).toBe(204);
    expect(await unread(lea)).toBe(1);
    expect(events.at(-1)).toEqual({ type: 'notifications', unread: 1 });
    expect((await lea.call('PUT', `/me/notifications/${id}/read`, { read: false })).status).toBe(204);
    expect(await unread(lea)).toBe(2);
    expect((await ben.call('PUT', `/me/notifications/${id}/read`, { read: true })).status).toBe(404);
    expect((await lea.call('PUT', `/me/notifications/${randomUUID()}/read`, { read: true })).status).toBe(404);
    expect((await h.client().call('GET', '/me/notifications')).status).toBe(401);
    expect(await unread(lea)).toBe(2);

    // Alle als gelesen
    expect((await lea.call('POST', '/me/notifications/read-all')).status).toBe(204);
    expect(await unread(lea)).toBe(0);
    expect((await list(lea)).items.every((n) => n.readAt)).toBe(true);
    expect(await unread(ben)).toBe(1);

    // Löschfrist 90 Tage
    await h.sql(`UPDATE notifications.notification SET created_at = now() - interval '91 days' WHERE id = $1`, [id]);
    await h.privacy.purgeExpired();
    expect((await list(lea)).items.map((n) => n.id)).not.toContain(id);

    // Kontolöschung entfernt alle eigenen Benachrichtigungen
    await ben.call('POST', '/me/delete', { password: PASSWORD });
    await h.sql(`UPDATE identity."user" SET deletion_requested_at = now() - interval '15 days' WHERE id = $1`, [ben.userId]);
    await h.privacy.purgeDueAccounts();
    expect(await h.sql(`SELECT 1 FROM notifications.notification WHERE user_id = $1`, [ben.userId])).toHaveLength(0);
  });

  it('[AT-NOTI-008-3] Grundregel: nicht selbst ausgelöste Zustandsänderungen an Deal und Anzeige erzeugen eine Benachrichtigung, eigene nicht', async () => {
    // Die Einladung zur Bewertung nach Abschluss (REQ-MOD-006) ist keine Zustandsänderung und zählt hier nicht
    const kinds = async (c: Member) =>
      ((await c.call('GET', '/me/notifications')).data.items as { kind: string; data: Record<string, unknown> }[]).filter((n) => n.kind !== 'rating_possible');
    const start = async (title: string) => {
      const id = await listing(lea, title);
      const conv = (await ben.call('POST', '/conversations', { listingId: id, body: 'Noch da?', clientMsgId: randomUUID() })).data
        .conversationId as string;
      return { id, conv };
    };
    const deal = (conv: string, action: string) => lea.call('POST', `/conversations/${conv}/deal`, { action });

    // Anbieterin Lea reserviert, hebt auf, reserviert erneut und gibt ab: nur Ben wird benachrichtigt
    const a = await start('Fahrradhelm');
    expect((await deal(a.conv, 'reserve')).status).toBe(200);
    expect((await deal(a.conv, 'cancel')).status).toBe(200);
    expect((await deal(a.conv, 'reserve')).status).toBe(200);
    expect((await deal(a.conv, 'complete')).status).toBe(200);
    await h.jobs.drain();
    expect((await kinds(ben)).map((n) => n.kind)).toEqual(['deal_completed', 'deal_reserved', 'deal_cancelled', 'deal_reserved']);
    expect((await kinds(ben))[0]!.data).toMatchObject({ listingId: a.id, listingTitle: 'Fahrradhelm', conversationId: a.conv });
    expect(await kinds(lea)).toEqual([]);

    // Anbieterin löscht eine reservierte Anzeige direkt: Ben erfährt die Stornierung
    const b = await start('Kaffeemaschine');
    await deal(b.conv, 'reserve');
    await h.sql(`DELETE FROM notifications.notification`);
    expect((await lea.call('DELETE', `/listings/${b.id}`)).status).toBeLessThan(300);
    await h.jobs.drain();
    expect((await kinds(ben)).map((n) => n.kind)).toEqual(['deal_cancelled']);
    expect(await kinds(lea)).toEqual([]);

    // System: Reservierung fällt nach 30 Tagen zurück – beide wurden nicht gefragt
    const c = await start('Stehlampe');
    await deal(c.conv, 'reserve');
    await h.sql(`DELETE FROM notifications.notification`);
    await h.sql(`UPDATE listings.listing SET status_changed_at = now() - interval '31 days' WHERE id = $1`, [c.id]);
    await h.modules.listings.maintenance();
    await h.jobs.drain();
    expect((await kinds(lea)).map((n) => n.kind)).toEqual(['reservation_expired']);
    expect((await kinds(ben)).map((n) => n.kind)).toEqual(['deal_cancelled']);
  });

  it('[AT-NOTI-001-2] Mails gehen in der Sprache des Kontos hinaus', async () => {
    expect((await lea.call('PATCH', '/me', { locale: 'en' })).status).toBe(200);
    const mark = h.mail.sent.length;
    await h.client().call('POST', '/auth/password-reset/request', { email: 'lea@studmail.hwg-lu.de' });
    await h.jobs.drain();
    const mails = h.mail.sent.slice(mark).filter((m) => m.to === 'lea@studmail.hwg-lu.de');
    expect(mails).toHaveLength(1);
    expect(mails[0]!.subject).toMatch(/password/i);
    expect(mails[0]!.html).toContain('lang="en"');
  });
});
