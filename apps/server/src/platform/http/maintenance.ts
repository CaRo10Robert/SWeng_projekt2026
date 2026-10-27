import type { Role } from '@campusmarkt/contracts';
import { isLegalPage, normalizePath } from './spa-routes.js';

/**
 * Wartungsmodus (REQ-OPS-006, architektur.md §8.11): Was bleibt erreichbar? Reine Funktion, tabellarisch getestet.
 * Erreichbar bleiben Health, Metriken, Statusseite und -API, statische Dateien, Rechtsseiten, die Anmeldung
 * (damit Admins den Modus wieder ausschalten können) und alle Anfragen von Administratoren.
 */
export function isMaintenanceExempt(input: { url: string; method: string; role: Role | null }): boolean {
  if (input.role === 'admin') return true;
  const path = normalizePath(input.url);
  if (/^\/(health\/|metrics$|robots\.txt$|\.well-known\/)/.test(path)) return true;
  if (/\.[a-z0-9]+$/i.test(path)) return true; // JS, CSS, Bilder, Manifest, Service Worker
  if (isLegalPage(path) || path === '/status' || path === '/login') return true;
  const api = path.replace(/^\/api\/v1/, '');
  if (api !== path) {
    if (api === '/status' || api === '/auth/login' || api === '/auth/logout') return true;
    if (input.method === 'GET' && (api === '/meta' || api === '/me')) return true;
  }
  return false;
}

/** Sekunden bis zum angekündigten Ende, mindestens 60 s, höchstens ein Tag; ohne Ende 5 min. */
export function retryAfterSeconds(until: string | null, now = new Date()): number {
  if (!until) return 300;
  const seconds = Math.ceil((new Date(until).getTime() - now.getTime()) / 1000);
  if (Number.isNaN(seconds)) return 300;
  return Math.min(86_400, Math.max(60, seconds));
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Statische Wartungsseite ohne externe Ressourcen und ohne Skripte (CSP-konform). */
export function maintenancePage(until: string | null): string {
  const end = until
    ? `Voraussichtlich wieder erreichbar ab ${escapeHtml(
        new Date(until).toLocaleString('de-DE', { timeZone: 'Europe/Berlin', dateStyle: 'medium', timeStyle: 'short' }),
      )} Uhr.`
    : 'Wir sind in Kürze wieder für dich da.';
  // Englischer Abschnitt für internationale Mitglieder (REQ-UX-007): die statische Seite kennt die Sprachwahl nicht
  const endEn = until
    ? `Expected to be back from ${escapeHtml(
        new Date(until).toLocaleString('en-GB', { timeZone: 'Europe/Berlin', dateStyle: 'medium', timeStyle: 'short' }),
      )} (Berlin time).`
    : 'We will be back for you shortly.';
  return `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>Wartung – CampusMarkt HWG LU</title>
<style>body{font-family:system-ui,sans-serif;color:#1f2937;max-width:40rem;margin:4rem auto;padding:0 1rem;line-height:1.5}
h1{color:#0b4884;font-size:1.75rem}a{color:#0b4884}footer{margin-top:3rem;font-size:.875rem;color:#4b5563}</style></head>
<body><main><h1 tabindex="-1">CampusMarkt wird gerade gewartet</h1>
<p>Wegen Wartungsarbeiten ist CampusMarkt vorübergehend nicht verfügbar. ${end}</p>
<p>Den aktuellen Stand findest du auf der <a href="/status">Statusseite</a>.</p>
<section lang="en"><h2>CampusMarkt is under maintenance</h2>
<p>CampusMarkt is temporarily unavailable due to maintenance work. ${endEn}</p>
<p>See the <a href="/status">status page</a> for the current state.</p></section></main>
<footer><a href="/impressum">Impressum</a> · <a href="/datenschutz">Datenschutz</a> · <a href="/nutzungsbedingungen">Nutzungsbedingungen</a> · <a href="/barrierefreiheit">Barrierefreiheit</a> · <a href="/kontakt">Kontakt</a> · <a href="/hilfe">Hilfe</a></footer>
</body></html>`;
}
