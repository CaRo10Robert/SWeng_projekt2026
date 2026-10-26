import { describe, expect, it } from 'vitest';
import { contactView, dealEvent, decideContactAction, needsSafetyHint, SYSTEM_TEXT } from './domain.js';

describe('[AT-CHAT-006] Sicherheitshinweis im Chat (REQ-CHAT-006)', () => {
  it.each([
    ['Schau mal hier: https://example.com/deal', true],
    ['www.irgendwas.de', true],
    ['Überweis auf DE89 3704 0044 0532 0130 00', true],
    ['DE89370400440532013000', true],
    ['Ruf an: 0621 1234567', true],
    ['+49 170 1234567', true],
    ['Ist das Buch noch da?', false],
    ['Treffen um 12:30 in Raum A 1.05?', false],
    ['Preis 15 €, 2. Auflage von 2019', false],
  ])('%s → %s', (body, expected) => {
    expect(needsSafetyHint(body)).toBe(expected);
  });
});

describe('Kontaktfreigabe (REQ-CHAT-010) – Entscheidungsregeln', () => {
  const now = new Date('2026-10-23T12:00:00Z');
  const row = (state: 'granted' | 'withdrawn' | 'declined', requestCount = 1, hoursAgo = 1) =>
    ({ state, requestCount, changedAt: new Date(now.getTime() - hoursAgo * 3_600_000) });
  const ctx = (mine?: ReturnType<typeof row>, theirs?: ReturnType<typeof row>, extra = {}) =>
    ({ mine, theirs, blocked: false, bothActive: true, now, ...extra });

  it('einseitige Zustimmung gibt nichts preis, beidseitige schon', () => {
    expect(contactView(ctx(row('granted'))).visible).toBe(false);
    expect(contactView(ctx(row('granted'), row('granted'))).visible).toBe(true);
  });

  it('Blockierung oder inaktives Konto blendet Adressen aus und verhindert Zustimmung', () => {
    expect(contactView(ctx(row('granted'), row('granted'), { blocked: true })).visible).toBe(false);
    expect(decideContactAction('grant', ctx(undefined, undefined, { bothActive: false }))).toEqual({ ok: false, code: 'contact_not_possible' });
  });

  it('Zustimmen auf eine offene Anfrage tauscht aus und zählt nicht als Anfrage', () => {
    expect(decideContactAction('grant', ctx(undefined, row('granted')))).toMatchObject({ ok: true, exchanged: true, countsAsRequest: false });
  });

  it('erneute Anfrage frühestens 24 h nach Ablehnung oder Widerruf', () => {
    const view = contactView(ctx(row('declined', 1, 2)));
    expect(view.canGrant).toBe(false);
    expect(view.retryAfter?.toISOString()).toBe('2026-10-24T10:00:00.000Z');
    expect(contactView(ctx(row('withdrawn', 1, 25))).canGrant).toBe(true);
  });

  it('nach eigenem Widerruf gilt die Sperrfrist, auch wenn das Gegenüber weiter zustimmt', () => {
    const view = contactView(ctx(row('withdrawn', 1, 1), row('granted')));
    expect(view.canGrant).toBe(false);
    expect(view.retryAfter?.toISOString()).toBe('2026-10-24T11:00:00.000Z');
    expect(decideContactAction('grant', ctx(row('withdrawn', 1, 1), row('granted')))).toEqual({ ok: false, code: 'contact_request_limit' });
    // nach Ablauf zählt das erneute Zustimmen als eigene Anfrage
    expect(decideContactAction('grant', ctx(row('withdrawn', 1, 25), row('granted')))).toMatchObject({ ok: true, exchanged: true, countsAsRequest: true });
    expect(decideContactAction('grant', ctx(row('withdrawn', 3, 25), row('granted')))).toEqual({ ok: false, code: 'contact_request_limit' });
  });

  it('höchstens 3 Anfragen je Teilnehmer und Konversation', () => {
    expect(contactView(ctx(row('declined', 3, 48))).canGrant).toBe(false);
    expect(decideContactAction('grant', ctx(row('declined', 3, 48)))).toEqual({ ok: false, code: 'contact_request_limit' });
    // Zustimmen auf eine Anfrage des Gegenübers bleibt trotzdem möglich
    expect(decideContactAction('grant', ctx(row('declined', 3, 1), row('granted'))).ok).toBe(true);
  });

  it('Ablehnen nur bei offener Anfrage des Gegenübers, Widerruf nur nach eigener Zustimmung', () => {
    expect(decideContactAction('decline', ctx(undefined, row('granted')))).toMatchObject({ ok: true, set: 'theirs', state: 'declined' });
    expect(decideContactAction('decline', ctx())).toEqual({ ok: false, code: 'invalid_contact_action' });
    expect(decideContactAction('withdraw', ctx())).toEqual({ ok: false, code: 'invalid_contact_action' });
    expect(decideContactAction('withdraw', ctx(row('granted')))).toMatchObject({ ok: true, state: 'withdrawn' });
  });
});

describe('Deal-Ereignisse mit eigener eventId (ADR-0006, MAN-ARCH-001 B-2)', () => {
  const deal = {
    id: '11111111-1111-4111-8111-111111111111',
    listing_id: '22222222-2222-4222-8222-222222222222',
    seller_id: '33333333-3333-4333-8333-333333333333',
    buyer_id: '44444444-4444-4444-8444-444444444444',
    agreed_price_cents: 4500,
    currency: 'EUR',
    status: 'completed',
    created_at: '2026-10-26T10:00:00.000Z',
  };

  it('jedes Ereignis bekommt eine neue eventId, auch für denselben Deal', () => {
    let n = 0;
    const id = () => `e-${++n}`;
    const a = dealEvent('DealAgreed', deal, id);
    const b = dealEvent('DealCompleted', deal, id);
    expect(a.eventId).not.toBe(b.eventId);
    expect(a.dealId).toBe(b.dealId);
  });

  it('enthält Betrag in Cent mit Währung und keine personenbezogenen Daten außer IDs', () => {
    const event = dealEvent('DealCompleted', deal, () => 'e-1', new Date('2026-10-26T12:00:00Z'));
    expect(event).toMatchObject({ type: 'DealCompleted', agreedPriceCents: 4500, currency: 'EUR', occurredAt: '2026-10-26T12:00:00.000Z' });
    expect(JSON.stringify(event)).not.toMatch(/@/);
  });
});

describe('Systemnachrichten als Code (MAN-UX-002 T-2)', () => {
  it('jeder Code hat einen deutschen Klartext', () => {
    for (const [code, text] of Object.entries(SYSTEM_TEXT)) expect(text.length, code).toBeGreaterThan(5);
    expect(Object.keys(SYSTEM_TEXT).sort()).toEqual(
      ['contact_exchanged', 'deal_cancelled', 'deal_completed', 'deal_reserved', 'message_deleted', 'message_removed'],
    );
  });
});
