import { describe, expect, it } from 'vitest';
import { checkPassword, checkRegistrationEmail, hashToken, newToken, type DomainRule } from './domain.js';

const INST = '00000000-0000-4000-8000-000000000001';
const rules: DomainRule[] = [
  { domain: 'studmail.hwg-lu.de', institutionId: INST, userType: 'student', active: true },
  { domain: 'hwg-lu.de', institutionId: INST, userType: 'staff', active: true },
  { domain: 'alt.hwg-lu.de', institutionId: INST, userType: 'staff', active: false },
];

// Entscheidungstabelle BR-01 (Anforderungskatalog §1.1), Zeile für Zeile
describe('[AT-AUTH-001] [AT-AUTH-003] BR-01 Domain-Prüfung und Nutzertyp', () => {
  it.each([
    ['max.muster@studmail.hwg-lu.de', true, 'student'],
    ['M.Muster@HWG-LU.DE', true, 'staff'],
    ['max@mail.hwg-lu.de', false, undefined],
    ['max@hwg-lu.de.evil.com', false, undefined],
    ['max@uni-mannheim.de', false, undefined],
    ['max+test@studmail.hwg-lu.de', true, 'student'],
    ['someone@alt.hwg-lu.de', false, undefined],
  ])('%s → zulassen=%s', (email, allowed, userType) => {
    const result = checkRegistrationEmail(email, rules);
    expect(result.ok).toBe(allowed);
    if (result.ok) expect(result.userType).toBe(userType);
  });

  it('normalisiert die Domain, lässt den lokalen Teil unverändert', () => {
    const result = checkRegistrationEmail('  M.Muster@HWG-LU.DE ', rules);
    expect(result.ok && result.email.email).toBe('M.Muster@hwg-lu.de');
  });

  it('entfernt +Suffix für die Eindeutigkeit', () => {
    const result = checkRegistrationEmail('max+test@studmail.hwg-lu.de', rules);
    expect(result.ok && result.email.canonical).toBe('max@studmail.hwg-lu.de');
  });

  it.each(['', 'kein-at-zeichen', 'a@@hwg-lu.de', '@hwg-lu.de', 'max@', 'max@hwg-lu'])('lehnt ungültiges Format ab: %s', (email) => {
    expect(checkRegistrationEmail(email, rules)).toEqual({ ok: false, reason: 'invalid_format' });
  });
});

describe('[AT-SEC-003] Passwortrichtlinie (REQ-SEC-003)', () => {
  const blocklist = new Set(['password1234']);

  it('verlangt mindestens 12 Zeichen, ohne Kompositionsregeln', () => {
    expect(checkPassword('kurz', { blocklist }).ok).toBe(false);
    expect(checkPassword('nurkleinbuchstaben', { blocklist }).ok).toBe(true);
  });

  it('lehnt Passwörter aus der Leak-Liste ab (case-insensitive)', () => {
    expect(checkPassword('Password1234', { blocklist }).ok).toBe(false);
  });

  it('lehnt Passwörter mit der E-Mail-Adresse ab', () => {
    expect(checkPassword('maxmuster-geheim', { blocklist, email: 'maxmuster@hwg-lu.de' }).ok).toBe(false);
  });

  it('lehnt triviale Wiederholungen ab', () => {
    expect(checkPassword('aaaaaaaaaaaaaa', { blocklist }).ok).toBe(false);
  });
});

describe('Tokens', () => {
  it('speichert nur den Hash und ist nicht vorhersagbar', () => {
    const a = newToken();
    const b = newToken();
    expect(a.token).not.toBe(b.token);
    expect(a.hash).toBe(hashToken(a.token));
    expect(a.hash).not.toContain(a.token);
  });
});

describe('Randfälle der Adress- und Passwortprüfung (Zweigabdeckung kritischer Pfade)', () => {
  it.each(['.max@hwg-lu.de', 'max.@hwg-lu.de', '+nur-suffix@hwg-lu.de'])('lehnt %s als ungültiges Format ab', (email) => {
    expect(checkRegistrationEmail(email, rules)).toEqual({ ok: false, reason: 'invalid_format' });
  });

  it('lehnt Passwörter über 256 Zeichen ab', () => {
    expect(checkPassword('a1'.repeat(129), { blocklist: new Set() }).ok).toBe(false);
  });
});
