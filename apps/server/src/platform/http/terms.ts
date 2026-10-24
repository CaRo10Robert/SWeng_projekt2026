/**
 * Erneute Zustimmung zu neuen Nutzungsbedingungen (REQ-LEGAL-003): Bis dahin sind schreibende Anfragen
 * gesperrt (403 `terms_required`). Lesen bleibt möglich, ebenso alles, was ein Mitglied für Zustimmung,
 * Ablehnung (Konto löschen) und seine Rechte braucht. Reine Funktion, tabellarisch getestet.
 */
const UNSAFE = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const ALLOWED_WITHOUT_CURRENT_TERMS = [
  /^\/api\/v1\/me\/terms$/,
  /^\/api\/v1\/me\/delete$/,
  /^\/api\/v1\/me\/notices\/read$/,
  /^\/api\/v1\/auth\/(login|logout)$/,
  /^\/api\/v1\/notifications\/unsubscribe$/,
  // Widerspruch ist ein Recht nach DSA Art. 20 und hängt nicht an den Nutzungsbedingungen
  /^\/api\/v1\/moderation\/decisions\/[^/]+\/appeal$/,
  /^\/api\/v1\/appeals\/token$/,
];

export function requiresCurrentTerms(input: { method: string; url: string }): boolean {
  if (!UNSAFE.has(input.method)) return false;
  const path = input.url.split('?')[0]!;
  if (!path.startsWith('/api/')) return false;
  return !ALLOWED_WITHOUT_CURRENT_TERMS.some((p) => p.test(path));
}
