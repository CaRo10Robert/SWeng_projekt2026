import { describe, expect, it } from 'vitest';
import { checkPrice, findProhibitedTerms, nextStatus, sniffImageType } from './domain.js';

describe('Preisregeln (REQ-LST-002)', () => {
  it.each([
    ['fixed', 1, true],
    ['fixed', 1_000_000, true],
    ['fixed', 0, false],
    ['fixed', 1_000_001, false],
    ['negotiable', null, false],
    ['negotiable', 12.5, false],
  ] as const)('%s %s → %s', (type, cents, ok) => {
    expect(checkPrice(type, cents).ok).toBe(ok);
  });

  it('verwirft Preise bei „zu verschenken“ und „Tausch“', () => {
    expect(checkPrice('free', 500)).toEqual({ ok: true, priceCents: null });
    expect(checkPrice('swap', undefined)).toEqual({ ok: true, priceCents: null });
  });
});

describe('Zustandsmodell Anzeige', () => {
  it.each([
    ['active', 'pause', 'paused'],
    ['paused', 'resume', 'active'],
    ['active', 'reserve', 'reserved'],
    ['reserved', 'unreserve', 'active'],
    ['reserved', 'complete', 'completed'],
    ['expired', 'extend', 'active'],
  ] as const)('%s --%s--> %s', (from, action, to) => {
    expect(nextStatus(from, action)).toBe(to);
  });

  it.each([
    ['in_review', 'pause'],
    ['completed', 'resume'],
    ['paused', 'reserve'],
    ['removed', 'extend'],
    ['deleted', 'resume'],
  ] as const)('verbietet %s --%s-->', (from, action) => {
    expect(nextStatus(from, action)).toBeNull();
  });
});

describe('Wortfilter (REQ-LST-010)', () => {
  it('findet verbotene Begriffe unabhängig von Groß-/Kleinschreibung', () => {
    expect(findProhibitedTerms('Verkaufe KLAUSURLÖSUNGEN für Mikro')).toContain('klausurlösungen');
    expect(findProhibitedTerms('Schreckschuss-Pistole', '')).toEqual(expect.arrayContaining(['pistole', 'schreckschuss']));
  });

  it('erzeugt keine Treffer in Teilwörtern', () => {
    expect(findProhibitedTerms('Waffeleisen zu verschenken', 'Funktioniert super')).toEqual([]);
  });
});

describe('Magic Bytes (REQ-SEC-007)', () => {
  it('erkennt Bildformate am Inhalt, nicht an der Endung', () => {
    expect(sniffImageType(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]))).toBe('jpeg');
    expect(sniffImageType(Buffer.from('89504e470d0a1a0a0000000d', 'hex'))).toBe('png');
    expect(sniffImageType(Buffer.from('RIFF0000WEBPVP8 ', 'ascii'))).toBe('webp');
    expect(sniffImageType(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg">'))).toBeNull();
    expect(sniffImageType(Buffer.from('MZ\x90\x00 ausführbare Datei'))).toBeNull();
  });
});
