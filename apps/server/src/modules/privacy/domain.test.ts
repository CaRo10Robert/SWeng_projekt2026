import { describe, expect, it } from 'vitest';
import { monthsBefore, RETENTION, retentionCutoffs } from './domain.js';

describe('Löschfristen aus dem Löschkonzept (REQ-PRIV-003)', () => {
  const now = new Date('2026-10-26T03:17:00Z');

  it('Stichtage je Datenkategorie', () => {
    const c = retentionCutoffs(now);
    expect(c.unverifiedAccountsBefore.toISOString()).toBe('2026-10-19T03:17:00.000Z');
    expect(c.linksBefore.toISOString()).toBe('2026-10-19T03:17:00.000Z');
    expect(c.pausedListingsBefore.toISOString()).toBe('2026-07-28T03:17:00.000Z');
    expect(c.conversationsBefore.toISOString()).toBe('2025-10-26T03:17:00.000Z');
    expect(c.moderationBefore.toISOString()).toBe('2025-10-26T03:17:00.000Z');
    expect(c.removedListingsBefore.toISOString()).toBe('2025-10-26T03:17:00.000Z');
    expect(c.noticesBefore.toISOString()).toBe('2025-10-26T03:17:00.000Z');
    expect(c.auditBefore.toISOString()).toBe('2024-10-26T03:17:00.000Z');
    expect(c.consentProofsBefore.toISOString()).toBe('2023-10-26T03:17:00.000Z');
  });

  it('Fristen entsprechen der Tabelle im Löschkonzept', () => {
    expect(RETENTION).toMatchObject({
      unverifiedAccountDays: 7,
      conversationMonths: 12,
      moderationMonths: 12,
      auditMonths: 24,
      consentProofYears: 3,
    });
  });

  it.each([
    ['2026-03-31T12:00:00Z', 1, '2026-02-28T12:00:00.000Z'],
    ['2024-03-31T12:00:00Z', 1, '2024-02-29T12:00:00.000Z'],
    ['2026-01-15T00:00:00Z', 12, '2025-01-15T00:00:00.000Z'],
    ['2026-12-31T23:59:59Z', 24, '2024-12-31T23:59:59.000Z'],
  ])('Monate rückwärts: %s − %i Monate = %s', (from, months, expected) => {
    expect(monthsBefore(new Date(from), months).toISOString()).toBe(expected);
  });
});
