import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { integrationAvailable, startHarness, type Client, type Harness } from '../../../test/integration/harness.js';

type Member = Client & { userId: string; email: string };
type Offer = { id: string; senderId: string; recipientId: string; amountCents: number; status: string; counter: boolean };
type Msg = { id: string; kind: string; body: string; offer?: Offer | null; systemCode?: string | null };

/** REQ-CHAT-009 v4.0 (B-73): Kaufangebot und Gegenangebot. */
describe.skipIf(!integrationAvailable)('Integration Kaufangebot (PostgreSQL)', () => {
  let h: Harness;
  let lea: Member;
  let ben: Member;
  let mia: Member;

  const listing = async (owner: Member, title: string, extra: Record<string, unknown> = {}) => {
    const meta = (await owner.call('GET', '/meta')).data;
    const res = await owner.call('POST', '/listings', {
      kind: 'offer', title, description: 'Gut erhalten, Abholung auf dem Campus.', categoryId: meta.categories[0].id,
      priceType: 'fixed', priceCents: 12_000, condition: 'good', locationIds: [meta.locations[0].id], ...extra,
    });
    expect(res.status, JSON.stringify(res.data)).toBe(201);
    return res.data.id as string;
  };
  const offer = (c: Member, listingId: string, amountCents?: number, clientMsgId = randomUUID()) =>
    c.call('POST', `/listings/${listingId}/offers`, { ...(amountCents === undefined ? {} : { amountCents }), clientMsgId });
  const respond = (c: Member, offerId: string, action: 'accept' | 'decline' | 'withdraw') => c.call('POST', `/offers/${offerId}/${action}`);
  const counter = (c: Member, offerId: string, amountCents: number) =>
    c.call('POST', `/offers/${offerId}/counter`, { amountCents, clientMsgId: randomUUID() });
  const offers = async (c: Member, conversationId: string) =>
    ((await c.call('GET', `/conversations/${conversationId}/messages`)).data as Msg[]).filter((m) => m.kind === 'offer').map((m) => m.offer!);
  const kinds = async (c: Member) => ((await c.call('GET', '/me/notifications')).data.items as { kind: string; data: Record<string, unknown> }[]);
  const status = async (id: string) => (await h.sql(`SELECT status FROM listings.listing WHERE id = $1`, [id]))[0]?.status;

  beforeAll(async () => {
    h = await startHarness();
  });
  afterAll(async () => h?.close());
  beforeEach(async () => {
    await h.reset();
    lea = await h.member('lea@studmail.hwg-lu.de');
    ben = await h.member('ben@studmail.hwg-lu.de');
    mia = await h.member('mia@studmail.hwg-lu.de');
  });

  it('[AT-CHAT-009] Nehm ich, Gegenangebot, Akzeptieren reserviert mit Betrag und beendet andere offene Angebote', async () => {
    const bike = await listing(lea, 'Fahrrad 28 Zoll');
    // Mia sendet zuerst ein „Nehm ich“, Ben danach
    const miaOffer = await offer(mia, bike);
    expect(miaOffer.status).toBe(201);
    const benStart = await offer(ben, bike);
    expect(benStart.status).toBe(201);
    const conv = benStart.data.conversationId as string;
    expect(benStart.data.message).toMatchObject({ kind: 'offer', offer: { amountCents: 12_000, status: 'open', counter: false, senderId: ben.userId } });
    await h.jobs.drain();
    expect((await kinds(lea)).filter((n) => n.kind === 'offer_received')).toHaveLength(2);

    // Gegenangebot der Anbieterin auf Bens Angebot
    const leaCounter = await counter(lea, benStart.data.message.offer.id, 11_000);
    expect(leaCounter.status).toBe(201);
    expect(leaCounter.data.offer).toMatchObject({ amountCents: 11_000, status: 'open', counter: true, senderId: lea.userId });
    expect((await offers(ben, conv)).map((o) => o.status)).toEqual(['countered', 'open']);
    expect((await kinds(ben)).map((n) => n.kind)).toContain('offer_countered');

    // Ben akzeptiert das Gegenangebot: Deal vereinbart zu 110 €, Anzeige reserviert, Mias Angebot nicht mehr verfügbar
    const accepted = await respond(ben, leaCounter.data.offer.id, 'accept');
    expect(accepted.status).toBe(200);
    expect(accepted.data.offer.status).toBe('accepted');
    await h.jobs.drain();
    expect(await status(bike)).toBe('reserved');
    const [deal] = await h.sql(`SELECT status, agreed_price_cents, buyer_id FROM messaging.deal WHERE listing_id = $1`, [bike]);
    expect(deal).toMatchObject({ status: 'agreed', agreed_price_cents: 11_000, buyer_id: ben.userId });
    const messages = (await ben.call('GET', `/conversations/${conv}/messages`)).data as Msg[];
    expect(messages.some((m) => m.systemCode === 'deal_reserved')).toBe(true);
    expect((await kinds(lea)).map((n) => n.kind)).toContain('offer_accepted');
    expect((await h.sql(`SELECT status FROM messaging.offer WHERE id = $1`, [miaOffer.data.message.offer.id]))[0].status).toBe('unavailable');
    const miaNotice = (await kinds(mia)).find((n) => n.kind === 'offer_unavailable');
    expect(miaNotice?.data).toMatchObject({ listingId: bike, listingTitle: 'Fahrrad 28 Zoll' });
    // Auf eine reservierte Anzeige ist kein neues Angebot möglich
    expect((await offer(mia, bike)).status).toBe(409);
  });

  it('[AT-CHAT-009] VB: Preisangebot, Ablehnen, Ersetzen, Zurückziehen; verschenken mit 0 €; Idempotenz; Pause beendet Angebote', async () => {
    const lamp = await listing(lea, 'Stehlampe', { priceType: 'negotiable', priceCents: 1_500 });
    const first = await offer(ben, lamp, 900);
    expect(first.data.message.offer).toMatchObject({ amountCents: 900, status: 'open' });
    const conv = first.data.conversationId as string;
    expect((await respond(lea, first.data.message.offer.id, 'decline')).data.offer.status).toBe('declined');
    await h.jobs.drain();
    expect((await kinds(ben)).map((n) => n.kind)).toContain('offer_declined');

    // Neues Angebot ersetzt das eigene offene
    const second = await offer(ben, lamp, 1_000);
    const third = await offer(ben, lamp, 1_100);
    expect((await offers(ben, conv)).map((o) => `${o.amountCents}:${o.status}`)).toEqual(['900:declined', '1000:withdrawn', '1100:open']);
    expect(second.status).toBe(201);
    expect((await respond(ben, third.data.message.offer.id, 'withdraw')).data.offer.status).toBe('withdrawn');

    // Idempotenz: dieselbe Client-ID ergibt dieselbe Nachricht und genau ein Angebot
    const clientMsgId = randomUUID();
    const a = await offer(ben, lamp, 1_200, clientMsgId);
    const b = await offer(ben, lamp, 1_200, clientMsgId);
    expect(b.data.message.id).toBe(a.data.message.id);
    expect((await offers(ben, conv)).filter((o) => o.status === 'open')).toHaveLength(1);

    // Pausieren durch die Anbieterin beendet das offene Angebot mit Benachrichtigung
    await lea.call('POST', `/listings/${lamp}/status`, { action: 'pause' });
    await h.jobs.drain();
    expect((await offers(ben, conv)).at(-1)!.status).toBe('unavailable');
    expect((await kinds(ben)).map((n) => n.kind)).toContain('offer_unavailable');

    // Zu verschenken: „Nehm ich“ mit 0 €
    const plant = await listing(lea, 'Pflanzenableger', { priceType: 'free', priceCents: null });
    expect((await offer(mia, plant)).data.message.offer.amountCents).toBe(0);

    // Automatische Pause (REQ-LST-013) beendet offene Angebote ebenfalls
    await h.sql(`UPDATE listings.listing SET expires_at = now() - interval '1 day', reminder_sent_at = now() - interval '25 hours' WHERE id = $1`, [plant]);
    await h.modules.listings.maintenance();
    await h.jobs.drain();
    expect((await h.sql(`SELECT status FROM messaging.offer WHERE listing_id = $1`, [plant]))[0].status).toBe('unavailable');
    expect((await kinds(mia)).map((n) => n.kind)).toContain('offer_unavailable');
  });

  it('[AT-CHAT-009-2] Fehlerfälle: eigene Anzeige, Gesuch, Tausch, Beträge, Blockierung, Fremde, falsche Seite, geschlossenes Angebot, gleichzeitiges Akzeptieren', async () => {
    const own = await listing(lea, 'Eigenes Buch');
    expect((await offer(lea, own)).data.code).toBe('offer_not_possible');
    const wanted = await listing(lea, 'Suche Taschenrechner', { kind: 'wanted', priceType: 'negotiable', priceCents: 1_000 });
    expect((await offer(ben, wanted, 500)).data.code).toBe('offer_not_possible');
    const swap = await listing(lea, 'Tausche Skript', { priceType: 'swap', priceCents: null });
    expect((await offer(ben, swap)).data.code).toBe('offer_not_possible');
    const vb = await listing(lea, 'Regal', { priceType: 'negotiable', priceCents: 3_000 });
    expect((await offer(ben, vb)).data.code).toBe('invalid_amount');
    expect((await offer(ben, vb, 1_000_001)).status).toBeGreaterThanOrEqual(400);
    expect((await offer(ben, own, 5)).data.code).toBe('invalid_amount');

    // Blockierung
    await lea.call('PUT', `/users/${mia.userId}/block`);
    expect((await offer(mia, own)).data.code).toBe('contact_not_possible');
    await lea.call('DELETE', `/users/${mia.userId}/block`);

    // Fremde 404, falsche Seite 403, geschlossenes Angebot 409
    const open = (await offer(ben, own)).data.message.offer as Offer;
    expect((await respond(mia, open.id, 'accept')).status).toBe(404);
    expect((await respond(ben, open.id, 'accept')).data.code).toBe('not_your_turn');
    expect((await respond(lea, open.id, 'withdraw')).status).toBe(403);
    expect((await respond(lea, open.id, 'decline')).status).toBe(200);
    expect((await respond(lea, open.id, 'accept')).data.code).toBe('offer_closed');

    // Gleichzeitiges Akzeptieren zweier Angebote derselben Anzeige: genau ein Deal
    const desk = await listing(lea, 'Schreibtisch');
    const fromBen = (await offer(ben, desk)).data.message.offer as Offer;
    const fromMia = (await offer(mia, desk)).data.message.offer as Offer;
    const results = await Promise.all([respond(lea, fromBen.id, 'accept'), respond(lea, fromMia.id, 'accept')]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(await h.sql(`SELECT 1 FROM messaging.deal WHERE listing_id = $1 AND status = 'agreed'`, [desk])).toHaveLength(1);
  });
});
