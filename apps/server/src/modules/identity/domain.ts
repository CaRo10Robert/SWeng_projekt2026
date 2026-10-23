import { createHash, randomBytes } from 'node:crypto';
import type { UserType } from '@campusmarkt/contracts';

export interface DomainRule {
  domain: string;
  institutionId: string;
  userType: UserType;
  active: boolean;
}

export interface NormalizedEmail {
  /** Adresse, wie sie für Login und Versand genutzt wird (Domain klein geschrieben). */
  email: string;
  /** Ohne `+`-Suffix, für die Eindeutigkeit (BR-01 #6). */
  canonical: string;
  domain: string;
}

const LOCAL_PART = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}$/;
const DOMAIN = /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;

/** Normalisierung vor der Prüfung: trimmen, Domain klein; der lokale Teil bleibt unverändert. */
export function normalizeEmail(input: string): NormalizedEmail | null {
  const trimmed = input.trim();
  const at = trimmed.lastIndexOf('@');
  if (at <= 0 || at !== trimmed.indexOf('@')) return null;
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1).toLowerCase();
  if (!LOCAL_PART.test(local) || local.startsWith('.') || local.endsWith('.') || !DOMAIN.test(domain)) return null;
  const canonicalLocal = local.split('+')[0] ?? '';
  if (canonicalLocal === '') return null;
  return { email: `${local}@${domain}`, canonical: `${canonicalLocal}@${domain}`.toLowerCase(), domain };
}

export type EmailCheck =
  | { ok: true; email: NormalizedEmail; userType: UserType; institutionId: string }
  | { ok: false; reason: 'invalid_format' | 'domain_not_allowed' };

/**
 * Geschäftsregel BR-01 (Entscheidungstabelle im Anforderungskatalog): Die Domain muss EXAKT auf der
 * Whitelist stehen und aktiv sein. Subdomains und Suffix-Tricks werden abgelehnt.
 * Der Nutzertyp ergibt sich aus dem Whitelist-Eintrag (REQ-AUTH-003).
 */
export function checkRegistrationEmail(input: string, rules: readonly DomainRule[]): EmailCheck {
  const email = normalizeEmail(input);
  if (!email) return { ok: false, reason: 'invalid_format' };
  const rule = rules.find((r) => r.domain.toLowerCase() === email.domain);
  if (!rule || !rule.active) return { ok: false, reason: 'domain_not_allowed' };
  return { ok: true, email, userType: rule.userType, institutionId: rule.institutionId };
}

export type PasswordCheck = { ok: true } | { ok: false; reason: string };

/** NIST SP 800-63B: Mindestlänge 12, Abgleich mit Leak-Liste, keine Kompositionsregeln (REQ-SEC-003). */
export function checkPassword(
  password: string,
  context: { blocklist: ReadonlySet<string>; email?: string; displayName?: string },
): PasswordCheck {
  if ([...password].length < 12) return { ok: false, reason: 'Das Passwort muss mindestens 12 Zeichen lang sein.' };
  if (password.length > 256) return { ok: false, reason: 'Das Passwort ist zu lang.' };
  const lower = password.toLowerCase();
  if (context.blocklist.has(lower)) {
    return { ok: false, reason: 'Dieses Passwort ist aus Datenlecks bekannt. Bitte wähle ein anderes.' };
  }
  if (/^(.)\1+$/.test(password)) return { ok: false, reason: 'Das Passwort ist zu einfach.' };
  const local = context.email?.split('@')[0]?.split('+')[0]?.toLowerCase();
  if (local && local.length >= 4 && lower.includes(local)) {
    return { ok: false, reason: 'Das Passwort darf deine E-Mail-Adresse nicht enthalten.' };
  }
  return { ok: true };
}

/** Opaque-Token (256 Bit) für Sessions, Verifikation und Reset; gespeichert wird nur der Hash. */
export function newToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, hash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
