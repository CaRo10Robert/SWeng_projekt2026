import { createHmac, timingSafeEqual } from 'node:crypto';

/** Abbestellbare Kategorien = Schlüssel der Benachrichtigungs-Einstellungen (REQ-NOTI-003). */
export type UnsubscribeCategory = 'newMessage' | 'listingExpiry';

const CATEGORIES: readonly UnsubscribeCategory[] = ['newMessage', 'listingExpiry'];

const sign = (secret: string, payload: string) => createHmac('sha256', secret).update(payload).digest('base64url');

/** Signierter Abmeldelink ohne Ablauf (RFC 8058 verlangt, dass er dauerhaft funktioniert). */
export function unsubscribeToken(secret: string, userId: string, category: UnsubscribeCategory): string {
  const payload = `${userId}.${category}`;
  return `${payload}.${sign(secret, payload)}`;
}

export function verifyUnsubscribeToken(
  secret: string,
  token: string,
): { userId: string; category: UnsubscribeCategory } | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [userId, category, signature] = parts as [string, string, string];
  if (!/^[0-9a-f-]{36}$/i.test(userId) || !(CATEGORIES as readonly string[]).includes(category)) return null;
  const expected = Buffer.from(sign(secret, `${userId}.${category}`));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  return { userId, category: category as UnsubscribeCategory };
}
