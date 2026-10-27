import { describe, expect, it } from 'vitest';
import type { DomainRule } from './domain.js';
import { resolveLogin, type IdentityProviderPort, type LoginAccount } from './identity-provider.js';

const INST = '00000000-0000-4000-8000-000000000001';
const rules: DomainRule[] = [
  { domain: 'studmail.hwg-lu.de', institutionId: INST, userType: 'student', active: true },
  { domain: 'hwg-lu.de', institutionId: INST, userType: 'staff', active: true },
];

/** Simuliertes zweites Anmeldeverfahren (z. B. SSO der Hochschule): Umleitung, dann geprüfte Identität. */
function fakeSso(identities: Record<string, { email: string; attributes: Record<string, string> }>): IdentityProviderPort {
  return {
    id: 'fake-sso',
    async begin() {
      return { kind: 'redirect', url: 'https://idp.example/login', state: 'state-123' };
    },
    async complete(input) {
      const { ticket } = input as { ticket: string };
      return identities[ticket] ?? null;
    },
  };
}

const accounts = new Map<string, LoginAccount>([
  ['lea@studmail.hwg-lu.de', { id: 'u-lea', status: 'active' }],
  ['neu@studmail.hwg-lu.de', { id: 'u-neu', status: 'unverified' }],
  ['gesperrt@hwg-lu.de', { id: 'u-x', status: 'suspended' }],
]);
const deps = { rules, findByCanonical: async (c: string) => accounts.get(c) };

describe('[AT-AUTH-009] Anmeldeverfahren austauschbar (REQ-AUTH-009, ADR-0013)', () => {
  const sso = fakeSso({
    ok: { email: 'Lea+markt@studmail.hwg-lu.de', attributes: { affiliation: 'staff' } },
    fremd: { email: 'lea@uni-mannheim.de', attributes: {} },
    unbekannt: { email: 'niemand@studmail.hwg-lu.de', attributes: {} },
    unbestaetigt: { email: 'neu@studmail.hwg-lu.de', attributes: {} },
    gesperrt: { email: 'gesperrt@hwg-lu.de', attributes: {} },
  });

  it('beginnt per Umleitung statt Formular', async () => {
    expect(await sso.begin()).toEqual({ kind: 'redirect', url: 'https://idp.example/login', state: 'state-123' });
  });

  it('verknüpft das Konto über die kanonische Adresse; Nutzertyp aus der Domain, nicht aus Attributen (Q-20)', async () => {
    expect(await resolveLogin(sso, { ticket: 'ok' }, deps)).toEqual({
      ok: true,
      account: { id: 'u-lea', status: 'active' },
      userType: 'student',
    });
  });

  it.each([
    ['ungültige Antwort', 'kaputt', 'invalid_credentials'],
    ['Adresse außerhalb der Whitelist', 'fremd', 'domain_not_allowed'],
    ['kein Konto (Erstanmeldung erst nach Einwilligung)', 'unbekannt', 'invalid_credentials'],
    ['unbestätigtes Konto', 'unbestaetigt', 'not_verified'],
    ['gesperrtes Konto', 'gesperrt', 'account_suspended'],
  ])('lehnt ab: %s', async (_name, ticket, code) => {
    expect(await resolveLogin(sso, { ticket }, deps)).toEqual({ ok: false, code });
  });
});
