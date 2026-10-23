import { describe, expect, it } from 'vitest';
import { contactView, decideContactAction, needsSafetyHint } from './domain.js';

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
