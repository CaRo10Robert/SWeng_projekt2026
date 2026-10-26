import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { countPlaceholders, parseFrontMatter, readLegalManifest, strictLegalProblems, termsVersionOf } from './legal.js';

const CONTENT = resolve(import.meta.dirname, '../../../web/src/content/legal');

describe('Rechtstexte als versionierte Inhalte (ADR-0015, REQ-LEGAL-003)', () => {
  it('liest Front Matter schlüssel: wert', () => {
    const { data, body } = parseFrontMatter('---\ntitle: Impressum\nversion: 2026-10\n---\n\nText');
    expect(data).toEqual({ title: 'Impressum', version: '2026-10' });
    expect(body.trim()).toBe('Text');
  });

  it('zählt Platzhalter', () => {
    expect(countPlaceholders('A [Platzhalter: Name] und [Platzhalter: Ort], [kein Platzhalter]')).toBe(2);
  });

  it('jeder deutsche Rechtstext hat Titel und Version; die Version der Nutzungsbedingungen ist die Zustimmungsversion', () => {
    const manifest = readLegalManifest('/does-not-exist', CONTENT)!;
    const names = manifest.documents.filter((d) => d.lang === 'de').map((d) => d.name).sort();
    expect(names).toEqual(['barrierefreiheit', 'community-regeln', 'datenschutz', 'impressum', 'kontakt', 'nutzungsbedingungen']);
    for (const d of manifest.documents) expect(d.version, d.name).toMatch(/^\d{4}-\d{2}(-\d+)?$/);
    expect(termsVersionOf(manifest)).toBe(manifest.documents.find((d) => d.name === 'nutzungsbedingungen')!.version);
  });

  it('Muster-Kennzeichnung kommt nur aus dem Front Matter, nicht aus dem Hinweistext (T-1)', () => {
    const manifest = readLegalManifest('/does-not-exist', CONTENT)!;
    for (const d of manifest.documents) expect(d.sample, `${d.name}.${d.lang}`).toBe(true);
  });

  it('LEGAL_STRICT meldet Muster und Platzhalter (Übungsaufgabe, Q-23)', () => {
    const manifest = readLegalManifest('/does-not-exist', CONTENT);
    expect(strictLegalProblems(manifest).length).toBeGreaterThan(0);
    expect(strictLegalProblems({ documents: [{ name: 'impressum', lang: 'de', title: 'I', version: '2026-10', lastUpdated: '', sample: false, placeholders: 0 }] })).toEqual([]);
    expect(strictLegalProblems(null)).toHaveLength(1);
  });
});
