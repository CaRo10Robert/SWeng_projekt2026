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
    await h.sql(`UPDATE listings.listing SET expires_at = now() + interval '3 days' WHERE id = $1`, [lamp]);
    mark = h.mail.sent.length;
    await h.modules.listings.maintenance();
    await h.jobs.drain();
    expectMail(mark, 'lea@studmail.hwg-lu.de', /„Schreibtischlampe“ läuft bald ab/);

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
