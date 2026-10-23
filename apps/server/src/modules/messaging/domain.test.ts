import { describe, expect, it } from 'vitest';
import { needsSafetyHint } from './domain.js';

describe('Sicherheitshinweis im Chat (REQ-CHAT-006)', () => {
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
