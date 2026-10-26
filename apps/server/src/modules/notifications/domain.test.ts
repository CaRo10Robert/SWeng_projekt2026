import { describe, expect, it } from 'vitest';
import { unsubscribeToken, verifyUnsubscribeToken } from './domain.js';

const SECRET = 'test-geheimnis';
const USER = '00000000-0000-4000-8000-0000000000aa';

describe('Signierter Abmeldelink (REQ-NOTI-003, REQ-OPS-010, RV-C-02)', () => {
  it('erkennt einen gültigen Link mit Konto und Kategorie', () => {
    expect(verifyUnsubscribeToken(SECRET, unsubscribeToken(SECRET, USER, 'newMessage'))).toEqual({
      userId: USER,
      category: 'newMessage',
    });
  });

  it('lehnt Links mit anderem Geheimnis, fremdem Konto oder anderer Kategorie ab', () => {
    const token = unsubscribeToken(SECRET, USER, 'newMessage');
    const [, , signature] = token.split('.');
    expect(verifyUnsubscribeToken('anderes-geheimnis', token)).toBeNull();
    expect(verifyUnsubscribeToken(SECRET, `00000000-0000-4000-8000-0000000000bb.newMessage.${signature}`)).toBeNull();
    expect(verifyUnsubscribeToken(SECRET, `${USER}.listingExpiry.${signature}`)).toBeNull();
  });

  it.each([
    ['zu wenige Teile', `${USER}.newMessage`],
    ['zu viele Teile', `${USER}.newMessage.a.b`],
    ['keine Konto-ID', 'admin.newMessage.x'],
    ['unbekannte Kategorie', `${USER}.security.x`],
    ['leere Signatur', `${USER}.newMessage.`],
  ])('lehnt ungültiges Format ab: %s', (_, token) => {
    expect(verifyUnsubscribeToken(SECRET, token)).toBeNull();
  });
});
