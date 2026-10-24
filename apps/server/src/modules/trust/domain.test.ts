import { describe, expect, it } from 'vitest';
import { addMonths, appealDeadline, appealRole, canReviewAppeal, checkAppeal, checkDecision } from './domain.js';

describe('Widerspruch nach DSA Art. 20 (REQ-LEGAL-007) – Regeln', () => {
  it('Frist: sechs Kalendermonate ab Mitteilung, am Monatsende begrenzt', () => {
    expect(appealDeadline(new Date('2026-10-24T10:00:00Z')).toISOString()).toBe('2027-04-24T10:00:00.000Z');
    expect(addMonths(new Date('2026-08-31T00:00:00Z'), 6).toISOString()).toBe('2027-02-28T00:00:00.000Z');
  });

  it.each([
    // Betroffene widersprechen Maßnahmen, Meldende nur „keine Maßnahme“, alle anderen nicht
    ['sara', 'sara', [], 'remove', 'subject'],
    ['sara', 'sara', [], 'ban', 'subject'],
    ['sara', 'sara', [], 'no_action', null],
    ['ben', 'sara', ['ben'], 'no_action', 'reporter'],
    ['ben', 'sara', ['ben'], 'remove', null],
    ['mia', 'sara', ['ben'], 'remove', null],
  ] as const)('%s (betroffen %s, meldend %j) gegen %s → %s', (userId, subject, reporters, decision, role) => {
    expect(appealRole({ userId, subjectUserId: subject, reporterIds: reporters, decision })).toBe(role);
  });

  it.each([
    ['subject', '2026-10-21T00:00:00Z', false, { ok: true }],
    ['subject', '2026-04-23T00:00:00Z', false, { ok: false, code: 'appeal_expired' }],
    ['subject', '2026-10-21T00:00:00Z', true, { ok: false, code: 'appeal_exists' }],
    [null, '2026-10-21T00:00:00Z', false, { ok: false, code: 'not_found' }],
  ] as const)('Rolle %s, Mitteilung %s, schon widersprochen %s', (role, notifiedAt, already, result) => {
    expect(checkAppeal({ role, notifiedAt: new Date(notifiedAt), now: new Date('2026-10-24T00:00:00Z'), alreadyAppealed: already })).toEqual(result);
  });

  it('Vier-Augen-Prinzip: nie die Person, die ursprünglich entschieden hat', () => {
    expect(canReviewAppeal('max', 'max')).toBe(false);
    expect(canReviewAppeal('admin', 'max')).toBe(true);
  });
});

describe('Pflichtangaben einer Entscheidung (REQ-LEGAL-006, REQ-LEGAL-008)', () => {
  const reason = 'Die Anzeige bietet Prüfungslösungen an.';
  it.each([
    [{ decision: 'remove', reason, ruleRef: 'community_prohibited_items' }, { ok: true }],
    [{ decision: 'no_action', reason }, { ok: true }],
    [{ decision: 'remove', reason }, { ok: false, code: 'rule_required', path: 'ruleRef' }],
    [{ decision: 'remove', reason: 'zu kurz', ruleRef: 'community_prohibited_items' }, { ok: false, code: 'reason_too_short', path: 'reason' }],
    [
      { decision: 'ban', reason, ruleRef: 'illegal_content', criminalSuspicion: 'suspected' },
      { ok: false, code: 'criminal_reason_required', path: 'criminalSuspicionReason' },
    ],
    [
      { decision: 'ban', reason, ruleRef: 'illegal_content', criminalSuspicion: 'imminent_danger', criminalSuspicionReason: 'Drohung mit Gewalt gegen eine Person.' },
      { ok: true },
    ],
  ] as const)('%j → %j', (input, result) => {
    expect(checkDecision(input)).toEqual(result);
  });
});
