/**
 * Erneute Zustimmung zu neuen Nutzungsbedingungen (REQ-LEGAL-003): Bis dahin sind schreibende Anfragen
 * gesperrt (403 `terms_required`). Lesen bleibt möglich, ebenso alles, was ein Mitglied für Zustimmung,
 * Ablehnung (Konto löschen) und seine Rechte braucht. Reine Funktion, tabellarisch getestet.
 */
const UNSAFE = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const ALLOWED_WITHOUT_CURRENT_TERMS = [
  /^\/api\/v1\/me\/terms$/,
  /^\/api\/v1\/me\/privacy-ack$/,
  /^\/api\/v1\/me\/delete$/,
  /^\/api\/v1\/me\/notices\/read$/,
  /^\/api\/v1\/auth\/(login|logout)$/,
  /^\/api\/v1\/notifications\/unsubscribe$/,
  // Widerspruch ist ein Recht nach DSA Art. 20 und hängt nicht an den Nutzungsbedingungen
  /^\/api\/v1\/moderation\/decisions\/[^/]+\/appeal$/,
  /^\/api\/v1\/appeals\/token(\/info)?$/,
  // Schutzrechte (RV-C-06): Melden (DSA Art. 16), Blockieren, Kontaktfreigabe widerrufen bzw. ablehnen (Art. 7 Abs. 3 DSGVO)
  /^\/api\/v1\/reports$/,
  /^\/api\/v1\/users\/[^/]+\/block$/,
];

/** PATCH /me nur für Benachrichtigungen und Sprache (Abbestellen ist immer möglich, REQ-NOTI-003). */
const PROFILE_FIELDS_WITHOUT_TERMS = new Set(['notificationPrefs', 'locale']);

/** Kontaktfreigabe: Widerrufen und Ablehnen bleiben möglich, nur neues Zustimmen braucht die aktuellen Bedingungen. */
const CONTACT_PATH = /^\/api\/v1\/conversations\/[^/]+\/contact$/;

export function requiresCurrentTerms(input: { method: string; url: string; body?: unknown }): boolean {
  if (!UNSAFE.has(input.method)) return false;
  const path = input.url.split('?')[0]!;
  if (!path.startsWith('/api/')) return false;
  if (ALLOWED_WITHOUT_CURRENT_TERMS.some((p) => p.test(path))) return false;
  const body = (input.body ?? {}) as Record<string, unknown>;
  if (input.method === 'PATCH' && path === '/api/v1/me') {
    const keys = Object.keys(body);
    return keys.length === 0 || !keys.every((k) => PROFILE_FIELDS_WITHOUT_TERMS.has(k));
  }
  if (input.method === 'POST' && CONTACT_PATH.test(path)) return !['withdraw', 'decline'].includes(String(body.action));
  return true;
}
