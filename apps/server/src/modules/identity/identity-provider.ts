import type { DomainRule } from './domain.js';
import { checkRegistrationEmail } from './domain.js';

/**
 * IdentityProviderPort (ADR-0013, REQ-AUTH-009): kapselt das Anmeldeverfahren. Zweistufig, damit
 * Formularverfahren (Passwort) und Umleitungsverfahren (SSO der Hochschule) dieselbe Schnittstelle haben.
 * Sitzungen, Rollen, Sperren, Whitelist und Rate-Limits bleiben im Modul identity.
 */
export type BeginResult = { kind: 'form' } | { kind: 'redirect'; url: string; state: string };

export interface VerifiedIdentity {
  /** Vom Verfahren geprüfte Adresse. */
  email: string;
  /** Zusätzliche Angaben des Verfahrens; werden nur protokolliert (Q-20). */
  attributes: Record<string, string>;
}

export interface IdentityProviderPort {
  readonly id: string;
  begin(): Promise<BeginResult>;
  /** Liefert die geprüfte Identität oder null, wenn die Anmeldedaten nicht stimmen. */
  complete(input: unknown): Promise<VerifiedIdentity | null>;
}

export interface LoginAccount {
  id: string;
  status: 'unverified' | 'active' | 'suspended' | 'pending_deletion';
}

export type LoginOutcome<A extends LoginAccount> =
  | { ok: true; account: A; userType: 'student' | 'staff' }
  | { ok: false; code: 'invalid_credentials' | 'domain_not_allowed' | 'not_verified' | 'account_suspended' };

/**
 * Gemeinsamer Anmeldeablauf für jedes Verfahren: Identität prüfen lassen, Kennung gegen die Whitelist (BR-01),
 * Konto über die kanonische Adresse verknüpfen, Kontostatus prüfen. Der Nutzertyp folgt immer aus der Domain.
 */
export async function resolveLogin<A extends LoginAccount>(
  provider: IdentityProviderPort,
  input: unknown,
  deps: { rules: readonly DomainRule[]; findByCanonical(canonical: string): Promise<A | undefined> },
): Promise<LoginOutcome<A>> {
  const identity = await provider.complete(input);
  if (!identity) return { ok: false, code: 'invalid_credentials' };
  const check = checkRegistrationEmail(identity.email, deps.rules);
  if (!check.ok) return { ok: false, code: 'domain_not_allowed' };
  const account = await deps.findByCanonical(check.email.canonical);
  // Erstanmeldung per SSO legt erst nach Einwilligung ein Konto an (ADR-0013 Nr. 6); bis dahin abgelehnt
  if (!account) return { ok: false, code: 'invalid_credentials' };
  if (account.status === 'unverified') return { ok: false, code: 'not_verified' };
  if (account.status === 'suspended') return { ok: false, code: 'account_suspended' };
  return { ok: true, account, userType: check.userType };
}
