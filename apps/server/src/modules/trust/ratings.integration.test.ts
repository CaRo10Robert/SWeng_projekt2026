import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { integrationAvailable, startHarness, type Client, type Harness } from '../../../test/integration/harness.js';

type Member = Client & { userId: string; email: string };
type Ratings = {
  summary: Record<'seller' | 'buyer', Record<'positive' | 'neutral' | 'negative', number>>;
  items: { role: string; score: string; text: string | null; raterName: string; listingTitle: string }[];
};

/** REQ-MOD-006 v2 (B-70): Bewertungen als Käufer und Verkäufer nach abgeschlossenem Deal. */
describe.skipIf(!integrationAvailable)('Integration Bewertungen (PostgreSQL)', () => {
  let h: Harness;
  let lea: Member;
  let ben: Member;
  let mia: Member;

  /** Anzeige von `owner`, Konversation mit `other`, Deal abgeschlossen; liefert die Deal-ID. */
  const completedDeal = async (owner: Member, other: Member, title: string, kind: 'offer' | 'wanted' = 'offer') => {
    const meta = (await owner.call('GET', '/meta')).data;
    const listingId = (
      await owner.call('POST', '/listings', {
        kind, title, description: 'Gut erhalten, Abholung auf dem Campus.', categoryId: meta.categories[0].id,
        priceType: 'fixed', priceCents: 1_000, condition: 'good', locationIds: [meta.locations[0].id],
      })
    ).data.id as string;
    const conv = (await other.call('POST', '/conversations', { listingId, body: 'Passt das?', clientMsgId: randomUUID() })).data
      .conversationId as string;
    expect((await owner.call('POST', `/conversations/${conv}/deal`, { action: 'complete' })).status).toBe(200);
    return { dealId: (await owner.call('GET', `/conversations/${conv}`)).data.deal.id as string, conv, listingId };
  };
  const rate = (c: Member, dealId: string, score: string, text?: string) =>
    c.call('POST', `/deals/${dealId}/rating`, { score, ...(text === undefined ? {} : { text }) });
  const ratings = async (viewer: Member, user: Member) => (await viewer.call('GET', `/users/${user.userId}/ratings`)).data as Ratings;
  const backdate = (dealId: string, days: number) =>
    h.sql(`UPDATE trust.rating SET deal_completed_at = now() - make_interval(days => $2), created_at = now() - make_interval(days => $2) WHERE deal_id = $1`, [dealId, days]);

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

  it('[AT-MOD-006] beide Seiten bewerten nach abgeschlossenem Deal; Rolle bei Angebot und Gesuch; Übersicht im Profil', async () => {
    // Angebot von Ben, Lea kauft: Ben wird als Verkäufer bewertet, Lea als Käuferin
    const { dealId, conv } = await completedDeal(ben, lea, 'Lehrbuch Statistik');
    await h.jobs.drain();
    // Einladung zur Bewertung an beide (App und E-Mail)
    for (const m of [lea, ben]) {
      expect(((await m.call('GET', '/me/notifications')).data.items as { kind: string }[]).map((n) => n.kind)).toContain('rating_possible');
      expect(h.mail.to(m.email).some((mail) => mail.subject.includes('Lehrbuch Statistik'))).toBe(true);
    }
    const state = (await lea.call('GET', `/deals/${dealId}/rating`)).data;
    expect(state).toMatchObject({ counterpartRole: 'seller', canRate: true, windowOpen: true, mine: null, counterpartRated: false });

    expect((await rate(lea, dealId, 'positive', 'Pünktlich und wie beschrieben')).status).toBe(201);
    expect((await rate(ben, dealId, 'neutral')).status).toBe(201);
    const benRatings = await ratings(mia, ben);
    expect(benRatings.summary.seller).toEqual({ positive: 1, neutral: 0, negative: 0 });
    expect(benRatings.items[0]).toMatchObject({ role: 'seller', score: 'positive', text: 'Pünktlich und wie beschrieben', raterName: 'lea', listingTitle: 'Lehrbuch Statistik' });
    expect((await ratings(mia, lea)).summary.buyer).toEqual({ positive: 0, neutral: 1, negative: 0 });
    expect(JSON.stringify(benRatings)).not.toContain('@');

    // Gesuch von Mia, Lea liefert: Mia wird als Käuferin bewertet, Lea als Verkäuferin
    const wanted = await completedDeal(mia, lea, 'Suche Taschenrechner', 'wanted');
    expect((await lea.call('GET', `/deals/${wanted.dealId}/rating`)).data.counterpartRole).toBe('buyer');
    expect((await mia.call('GET', `/deals/${wanted.dealId}/rating`)).data.counterpartRole).toBe('seller');
    await rate(lea, wanted.dealId, 'negative', 'Kam 30 Minuten zu spät.');
    await rate(mia, wanted.dealId, 'positive');
    expect((await ratings(ben, mia)).summary.buyer).toEqual({ positive: 0, neutral: 0, negative: 1 });
    expect((await ratings(ben, lea)).summary.seller).toEqual({ positive: 1, neutral: 0, negative: 0 });
    expect(conv).toBeTruthy();
  });

  it('[AT-MOD-006-2] verdeckt bis zur zweiten Bewertung bzw. bis zum Fristende; nach der Frist keine Abgabe mehr', async () => {
    const { dealId } = await completedDeal(ben, lea, 'Fahrradhelm');
    await rate(lea, dealId, 'positive', 'Alles bestens');
    // Nur Lea hat bewertet: für andere und für Ben verdeckt; Ben sieht nur, dass eine Bewertung vorliegt
    expect((await ratings(mia, ben)).items).toHaveLength(0);
    expect((await ratings(ben, ben)).items).toHaveLength(0);
    const benState = (await ben.call('GET', `/deals/${dealId}/rating`)).data;
    expect(benState).toMatchObject({ counterpartRated: true, mine: null });
    expect(JSON.stringify(benState)).not.toContain('Alles bestens');

    // Frist abgelaufen: Leas Bewertung wird sichtbar, Ben kann nicht mehr bewerten
    await h.sql(`UPDATE trust.rating SET deal_completed_at = now() - interval '15 days' WHERE deal_id = $1`, [dealId]);
    await h.sql(`UPDATE messaging.deal SET updated_at = now() - interval '15 days' WHERE id = $1`, [dealId]);
    expect((await ratings(mia, ben)).items.map((i) => i.text)).toEqual(['Alles bestens']);
    const late = await rate(ben, dealId, 'positive');
    expect(late.status).toBe(409);
    expect(late.data.code).toBe('rating_window_closed');
    expect((await ben.call('GET', `/deals/${dealId}/rating`)).data).toMatchObject({ windowOpen: false, canRate: false });

    // Eigene Bewertung vor der Veröffentlichung löschen und neu abgeben, danach nur noch löschen
    const second = await completedDeal(ben, mia, 'Kaffeemaschine');
    await rate(mia, second.dealId, 'neutral');
    expect((await mia.call('DELETE', `/deals/${second.dealId}/rating`)).status).toBe(204);
    expect((await rate(mia, second.dealId, 'positive')).status).toBe(201);
    await rate(ben, second.dealId, 'positive');
    expect((await mia.call('DELETE', `/deals/${second.dealId}/rating`)).status).toBe(204);
    expect((await rate(mia, second.dealId, 'positive')).data.code).toBe('already_rated');
    expect((await ratings(lea, ben)).items.map((i) => i.listingTitle)).not.toContain('Kaffeemaschine');
  });

  it('[AT-MOD-006-3] Missbrauch: ohne Deal, fremder Deal, doppelt, negativ ohne Text, Wortfilter, nur neueste Bewertung je Paar und Rolle zählt', async () => {
    // Ohne abgeschlossenen Deal: Konversation und Reservierung genügen nicht
    const meta = (await ben.call('GET', '/meta')).data;
    const listingId = (await ben.call('POST', '/listings', {
      kind: 'offer', title: 'Nur reserviert', description: 'Gut erhalten, Abholung auf dem Campus.', categoryId: meta.categories[0].id,
      priceType: 'fixed', priceCents: 500, condition: 'good', locationIds: [meta.locations[0].id],
    })).data.id;
    const conv = (await lea.call('POST', '/conversations', { listingId, body: 'Hallo', clientMsgId: randomUUID() })).data.conversationId;
    await ben.call('POST', `/conversations/${conv}/deal`, { action: 'reserve' });
    const reservedDeal = (await ben.call('GET', `/conversations/${conv}`)).data.deal.id as string;
    expect((await rate(lea, reservedDeal, 'positive')).status).toBe(404);
    expect((await rate(lea, randomUUID(), 'positive')).status).toBe(404);

    const { dealId } = await completedDeal(ben, lea, 'Regal');
    expect((await rate(mia, dealId, 'positive')).status).toBe(404); // fremder Deal
    expect((await rate(lea, dealId, 'negative')).data.code).toBe('text_required');
    expect((await rate(lea, dealId, 'negative', 'zu kurz')).data.code).toBe('text_required');
    expect((await rate(lea, dealId, 'negative', 'Hat mir Klausurlösungen angeboten.')).data.code).toBe('text_not_allowed');
    expect((await rate(lea, dealId, 'positive')).status).toBe(201);
    expect((await rate(lea, dealId, 'positive')).data.code).toBe('already_rated');
    await rate(ben, dealId, 'positive'); // erst dann veröffentlicht

    // Mehrere Deals desselben Paares: je Rolle zählt nur die neueste Bewertung, alle bleiben in der Liste
    for (const [title, score, days] of [['Lampe', 'positive', 10], ['Stuhl', 'positive', 5], ['Tisch', 'negative', 0]] as const) {
      const d = await completedDeal(ben, mia, title);
      await rate(mia, d.dealId, score, score === 'negative' ? 'Nicht wie beschrieben.' : undefined);
      await rate(ben, d.dealId, 'positive');
      await backdate(d.dealId, days);
    }
    const benRatings = await ratings(lea, ben);
    expect(benRatings.summary.seller).toEqual({ positive: 1, neutral: 0, negative: 1 }); // Lea: positiv, Mia: nur die neueste (negativ)
    expect(benRatings.items.filter((i) => i.raterName === 'mia')).toHaveLength(3);

    // Blockierung nach dem Deal: Bewerten bleibt möglich
    const blocked = await completedDeal(ben, lea, 'Spiegel');
    await ben.call('PUT', `/users/${lea.userId}/block`);
    expect((await rate(lea, blocked.dealId, 'neutral')).status).toBe(201);
    // Blockiertes Profil: Bewertungen wie das Profil nicht abrufbar
    expect((await lea.call('GET', `/users/${ben.userId}/ratings`)).status).toBe(404);
  });
});
