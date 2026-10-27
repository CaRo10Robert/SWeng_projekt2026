import { describe, expect, it } from 'vitest';
import {
  addMonths,
  appealDeadline,
  appealRole,
  canDecideCase,
  canReviewAppeal,
  checkAppeal,
  checkDecision,
  hashAppealToken,
  hasMinLength,
  newAppealToken,
} from './domain.js';

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

});

describe('[AT-LEGAL-007-2] Vier-Augen-Prinzip (REQ-LEGAL-007, RV-C-01)', () => {
  const base = { originalModeratorId: 'max', appellantId: 'lea', subjectUserId: 'lea', reporterIds: ['ben'] };
  it.each([
    ['max', false, 'ursprünglicher Entscheider'],
    ['lea', false, 'Widerspruchsführerin und Betroffene'],
    ['ben', false, 'Meldender'],
    ['admin', true, 'unbeteiligte Person'],
  ] as const)('Prüfer %s → %s (%s)', (reviewerId, ok, _who) => {
    expect(canReviewAppeal({ ...base, reviewerId })).toBe(ok);
  });

  it('Widerspruch eines Moderators gegen eine Entscheidung zu seiner Meldung: entscheidet nicht selbst', () => {
    expect(canReviewAppeal({ originalModeratorId: 'mod', appellantId: 'admin', subjectUserId: null, reporterIds: ['admin'], reviewerId: 'admin' })).toBe(false);
  });

  it('Fall entscheidet nicht, wer betroffen ist oder selbst gemeldet hat', () => {
    expect(canDecideCase({ moderatorId: 'mod', subjectUserId: 'lea', reporterIds: ['mod'] })).toBe(false);
    expect(canDecideCase({ moderatorId: 'mod', subjectUserId: 'mod', reporterIds: [] })).toBe(false);
    expect(canDecideCase({ moderatorId: 'mod', subjectUserId: 'lea', reporterIds: ['ben'] })).toBe(true);
  });
});

describe('[AT-LEGAL-006-2] Pflichtangaben einer Entscheidung (REQ-LEGAL-006, REQ-LEGAL-008)', () => {
  const reason = 'Die Anzeige bietet Prüfungslösungen an.';
  it.each([
    [{ decision: 'remove', reason, ruleRef: 'community_prohibited_items' }, { ok: true }],
    [{ decision: 'no_action', reason }, { ok: true }],
    [{ decision: 'remove', reason }, { ok: false, code: 'rule_required', path: 'ruleRef' }],
    [{ decision: 'remove', reason: 'zu kurz', ruleRef: 'community_prohibited_items' }, { ok: false, code: 'reason_too_short', path: 'reason' }],
    [
      { decision: 'ban', reason, ruleRef: 'illegal_content', criminalSuspicion: 'suspected', legalGround: '§ 241 StGB (Bedrohung): Ankündigung einer Gewalttat.' },
      { ok: false, code: 'criminal_reason_required', path: 'criminalSuspicionReason' },
    ],
    [
      {
        decision: 'ban', reason, ruleRef: 'illegal_content', criminalSuspicion: 'imminent_danger',
        criminalSuspicionReason: 'Drohung mit Gewalt gegen eine Person.', legalGround: '§ 241 StGB (Bedrohung): Ankündigung einer Gewalttat.',
      },
      { ok: true },
    ],
    // RV-R-03: rechtswidriger Inhalt nur mit Rechtsgrundlage (DSA Art. 17 Abs. 3 lit. d)
    [{ decision: 'remove', reason, ruleRef: 'illegal_content' }, { ok: false, code: 'legal_ground_required', path: 'legalGround' }],
    [{ decision: 'remove', reason, ruleRef: 'illegal_content', legalGround: '§ 241 StGB' }, { ok: false, code: 'legal_ground_required', path: 'legalGround' }],
    // RV-C-11: nur Leerzeichen zählen nicht
    [{ decision: 'remove', reason: ' '.repeat(30), ruleRef: 'community_prohibited_items' }, { ok: false, code: 'reason_too_short', path: 'reason' }],
  ] as const)('%j → %j', (input, result) => {
    expect(checkDecision(input)).toEqual(result);
  });

  it('Mindestlänge wird nach dem Entfernen von Leerzeichen am Rand geprüft', () => {
    expect(hasMinLength(`   ${'x'.repeat(19)}   `, 20)).toBe(false);
    expect(hasMinLength('x'.repeat(20), 20)).toBe(true);
    expect(hasMinLength(undefined, 1)).toBe(false);
  });
});

describe('Einmal-Link für den Widerspruch gesperrter Konten (REQ-LEGAL-007)', () => {
  it('erzeugt 256 Bit Zufall und speichert nur den Hash', () => {
    const a = newAppealToken();
    const b = newAppealToken();
    expect(Buffer.from(a.token, 'base64url')).toHaveLength(32);
    expect(a.token).not.toBe(b.token);
    expect(a.hash).toBe(hashAppealToken(a.token));
    expect(a.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(a.hash).not.toContain(a.token);
  });
});
