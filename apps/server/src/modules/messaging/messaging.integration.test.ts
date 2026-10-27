import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { integrationAvailable, startHarness, type Client, type Harness } from '../../../test/integration/harness.js';

type Member = Client & { userId: string; email: string };

describe.skipIf(!integrationAvailable)('Integration messaging (PostgreSQL)', () => {
  let h: Harness;
  let lea: Member;
  let ben: Member;
  let listingId: string;

  const listing = async (owner: Member, title = 'Fahrrad 28 Zoll') => {
    const meta = (await owner.call('GET', '/meta')).data;
    const res = await owner.call('POST', '/listings', {
      kind: 'offer', title, description: 'Gut gepflegt, neue Bremsen.', categoryId: meta.categories[0].id,
      priceType: 'fixed', priceCents: 12_000, condition: 'good', locationIds: [meta.locations[0].id],
    });
    return res.data.id as string;
  };
  const start = (c: Member, id: string, body = 'Ist das Rad noch da?') =>
    c.call('POST', '/conversations', { listingId: id, body, clientMsgId: randomUUID() });

  beforeAll(async () => {
    h = await startHarness();
  });
  afterAll(async () => h?.close());
  beforeEach(async () => {
    await h.reset();
    lea = await h.member('lea@studmail.hwg-lu.de');
    ben = await h.member('ben@studmail.hwg-lu.de');
    listingId = await listing(lea);
  });

  it('Konversation starten, Nachrichten idempotent senden, ungelesen und gelesen', async () => {
    const started = await start(ben, listingId);
    expect(started.status).toBe(201);
    const convId = started.data.conversationId as string;
    const clientMsgId = randomUUID();
    const first = await ben.call('POST', `/conversations/${convId}/messages`, { body: 'Noch eine Frage', clientMsgId });
    const repeat = await ben.call('POST', `/conversations/${convId}/messages`, { body: 'Noch eine Frage', clientMsgId });
    expect(first.data.id).toBe(repeat.data.id);
    expect((await lea.call('GET', '/me/unread')).data.count).toBe(2);
    expect((await lea.call('POST', `/conversations/${convId}/read`)).status).toBeLessThan(300);
    expect((await lea.call('GET', '/me/unread')).data.count).toBe(0);
    const messages = (await lea.call('GET', `/conversations/${convId}/messages`)).data as { readAt: string | null }[];
    expect(messages).toHaveLength(2);
    expect(messages.every((m) => m.readAt)).toBe(true);
    // eigene Anzeige, zu lange Nachricht, fremde Konversation
    expect((await start(lea, listingId)).status).toBe(422);
    expect((await ben.call('POST', `/conversations/${convId}/messages`, { body: 'x'.repeat(2001), clientMsgId: randomUUID() })).status).toBe(422);
    const mia = await h.member('mia@studmail.hwg-lu.de');
    expect((await mia.call('GET', `/conversations/${convId}/messages`)).status).toBe(404);
  });

  it('[AT-CHAT-007-2] Rate-Limits: höchstens 20 neue Konversationen je Stunde und 60 Nachrichten je Minute', async () => {
    const ids: string[] = [];
    for (let i = 0; i < 21; i++) ids.push(await listing(lea, `Angebot Nummer ${i + 1}`));
    const statuses: number[] = [];
    for (const id of ids) statuses.push((await start(ben, id)).status);
    expect(statuses.slice(0, 20).every((s) => s === 201)).toBe(true);
    expect(statuses[20]).toBe(429);

    const convId = (await ben.call('GET', '/conversations')).data[0].id as string;
    const results: number[] = [];
    for (let i = 0; i < 60; i++) {
      results.push((await ben.call('POST', `/conversations/${convId}/messages`, { body: `Nachricht ${i}`, clientMsgId: randomUUID() })).status);
    }
    // Die erste Nachricht kam mit dem Start der Konversation; die 61. im Fenster wird abgelehnt
    expect(results.filter((s) => s === 201).length).toBeGreaterThanOrEqual(40);
    expect(results.at(-1)).toBe(429);
  });

  it('Kontaktfreigabe: gleichzeitige Zustimmung beider Seiten erzeugt genau einen Austausch und eine Systemnachricht', async () => {
    const convId = (await start(ben, listingId)).data.conversationId as string;
    const results = await Promise.all([
      lea.call('POST', `/conversations/${convId}/contact`, { action: 'grant' }),
      ben.call('POST', `/conversations/${convId}/contact`, { action: 'grant' }),
      lea.call('POST', `/conversations/${convId}/contact`, { action: 'grant' }),
      ben.call('POST', `/conversations/${convId}/contact`, { action: 'grant' }),
    ]);
    expect(results.filter((r) => r.status === 200)).toHaveLength(2);
    expect(results.filter((r) => r.status === 409)).toHaveLength(2);
    const messages = (await lea.call('GET', `/conversations/${convId}/messages`)).data as { kind: string }[];
    expect(messages.filter((m) => m.kind === 'system')).toHaveLength(1);
    expect((await lea.call('GET', `/conversations/${convId}`)).data.contact.counterpartEmail).toBe('ben@studmail.hwg-lu.de');
    expect((await ben.call('GET', `/conversations/${convId}`)).data.contact.counterpartEmail).toBe('lea@studmail.hwg-lu.de');
    // Widerruf blendet aus und sperrt 24 h
    expect((await ben.call('POST', `/conversations/${convId}/contact`, { action: 'withdraw' })).data.counterpartEmail).toBeNull();
    expect((await ben.call('POST', `/conversations/${convId}/contact`, { action: 'grant' })).status).toBe(429);
    expect((await lea.call('GET', `/conversations/${convId}`)).data.contact.counterpartEmail).toBeNull();
  });

  it('Blockierung: Senden und Kontaktfreigabe nicht möglich', async () => {
    const convId = (await start(ben, listingId)).data.conversationId as string;
    expect((await lea.call('PUT', `/users/${ben.userId}/block`)).status).toBe(204);
    const send = await ben.call('POST', `/conversations/${convId}/messages`, { body: 'Hallo?', clientMsgId: randomUUID() });
    expect(send.status).toBe(403);
    expect(send.data.code).toBe('contact_not_possible');
    expect((await ben.call('POST', `/conversations/${convId}/contact`, { action: 'grant' })).data.code).toBe('contact_not_possible');
    expect((await lea.call('GET', '/me/blocks')).data).toHaveLength(1);
  });

  it('Deal: nur der Anbieter reserviert und gibt ab; Ereignisse mit eventId; Storno macht die Anzeige wieder aktiv', async () => {
    const mia = await h.member('mia@studmail.hwg-lu.de');
    const convId = (await start(ben, listingId)).data.conversationId as string;
    expect((await ben.call('POST', `/conversations/${convId}/deal`, { action: 'reserve' })).status).toBe(403);
    const reserved = await lea.call('POST', `/conversations/${convId}/deal`, { action: 'reserve' });
    expect(reserved.data.status).toBe('agreed');
    expect((await ben.call('GET', `/listings/${listingId}`)).data.status).toBe('reserved');
    const other = (await start(mia, listingId)).status;
    expect([201, 404]).toContain(other);
    expect((await lea.call('POST', `/conversations/${convId}/deal`, { action: 'cancel' })).data.status).toBe('cancelled');
    expect((await ben.call('GET', `/listings/${listingId}`)).data.status).toBe('active');
    const completed = await lea.call('POST', `/conversations/${convId}/deal`, { action: 'complete' });
    expect(completed.data.status).toBe('completed');
    const events = h.jobs.queued.filter((j) => j.name === 'deal-events').map((j) => j.data as { type: string; eventId: string });
    expect(events.map((e) => e.type)).toEqual(['DealAgreed', 'DealCancelled', 'DealCompleted']);
    expect(new Set(events.map((e) => e.eventId)).size).toBe(3);
  });

  it('[AT-NOTI-002] Benachrichtigung über neue Nachrichten: gebündelt, ohne Inhalt, entfällt nach dem Lesen', async () => {
    const convId = (await start(ben, listingId, 'Geheimer Inhalt 4711')).data.conversationId as string;
    await ben.call('POST', `/conversations/${convId}/messages`, { body: 'Noch ein geheimer Inhalt 4712', clientMsgId: randomUUID() });
    await h.jobs.drain('notify-unread');
    const mails = h.mail.to('lea@studmail.hwg-lu.de');
    expect(mails).toHaveLength(1);
    expect(mails[0]!.text).not.toContain('4711');
    expect(mails[0]!.text).not.toContain('4712');
    expect(mails[0]!.html).not.toContain('4711');

    // Gelesen vor dem Versand → keine Mail
    const second = (await start(lea, await listing(ben, 'Kaffeemaschine'))).data.conversationId as string;
    await ben.call('POST', `/conversations/${second}/read`);
    await h.jobs.drain('notify-unread');
    expect(h.mail.to('ben@studmail.hwg-lu.de').filter((m) => /Nachricht|message/i.test(m.subject))).toHaveLength(0);
  });

  it('[AT-NOTI-003] abbestellte Kategorie erzeugt keine Mail, Sicherheitsmails kommen trotzdem', async () => {
    const prefs = (await lea.call('GET', '/me')).data.notificationPrefs;
    expect((await lea.call('PATCH', '/me', { notificationPrefs: { ...prefs, newMessage: false } })).status).toBe(200);
    h.mail.sent = [];
    await start(ben, listingId);
    await h.jobs.drain();
    expect(h.mail.to('lea@studmail.hwg-lu.de')).toHaveLength(0);
    await h.client().call('POST', '/auth/password-reset/request', { email: 'lea@studmail.hwg-lu.de' });
    await h.jobs.drain();
    expect(h.mail.to('lea@studmail.hwg-lu.de')).toHaveLength(1);
    // Abmeldelink in Benachrichtigungen (List-Unsubscribe) ist signiert; ein gefälschtes Token ändert nichts
    const forged = await h.client().call('POST', '/notifications/unsubscribe?token=gefaelscht.newMessage.abc');
    expect(forged.status).toBe(404);
  });

  it('Konversationsliste mit Gegenüber, Anzeige, letzter Nachricht und Kontaktstatus', async () => {
    await start(ben, listingId);
    const list = (await lea.call('GET', '/conversations')).data as { counterpart: { displayName: string }; listing: { id: string }; lastMessage: { body: string }; contact: { mine: string } }[];
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ listing: { id: listingId }, lastMessage: { body: 'Ist das Rad noch da?' }, contact: { mine: 'none' } });
  });
});
