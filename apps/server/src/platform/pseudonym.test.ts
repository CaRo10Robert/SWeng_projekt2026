import { describe, expect, it } from 'vitest';
import { hmacPseudonym, PEPPER_GRACE_MS, PEPPER_ROTATION_MS, pepperPlan } from './pseudonym.js';

describe('IP- und Adress-Pseudonyme nach ADR-0014 (REQ-PRIV-002, RV-R-02)', () => {
  const key = Buffer.alloc(32, 7);
  const other = Buffer.alloc(32, 8);

  it('HMAC-SHA256, 128 Bit, ohne Klartext und schlüsselabhängig', () => {
    const p = hmacPseudonym(key, '10.0.0.5');
    expect(p).toMatch(/^[0-9a-f]{32}$/);
    expect(p).not.toContain('10.0.0.5');
    expect(hmacPseudonym(key, '10.0.0.5')).toBe(p);
    expect(hmacPseudonym(other, '10.0.0.5')).not.toBe(p);
  });

  const now = new Date('2026-10-25T12:00:00Z');
  const ago = (ms: number) => new Date(now.getTime() - ms);

  it.each([
    ['kein Schlüssel → erzeugen', [], { rotate: true, deleteIds: [] }],
    ['Schlüssel jünger als 24 h → behalten', [{ id: 1, validFrom: ago(PEPPER_ROTATION_MS - 1) }], { rotate: false, deleteIds: [] }],
    ['Schlüssel 24 h alt → rotieren', [{ id: 1, validFrom: ago(PEPPER_ROTATION_MS) }], { rotate: true, deleteIds: [] }],
    [
      'Vorgänger bleibt in der ersten Stunde',
      [{ id: 2, validFrom: ago(PEPPER_GRACE_MS - 1) }, { id: 1, validFrom: ago(PEPPER_ROTATION_MS + 10) }],
      { rotate: false, deleteIds: [] },
    ],
    [
      'Vorgänger wird nach einer Stunde gelöscht',
      [{ id: 2, validFrom: ago(PEPPER_GRACE_MS) }, { id: 1, validFrom: ago(PEPPER_ROTATION_MS + 10) }],
      { rotate: false, deleteIds: [1] },
    ],
  ] as const)('%s', (_name, keys, plan) => {
    expect(pepperPlan(keys, now)).toEqual(plan);
  });
});
