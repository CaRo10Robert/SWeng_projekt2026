import { resolve } from 'node:path';
import { privacyVersionOf, readLegalManifest, termsVersionOf } from './platform/legal.js';

/** Wurzel des Server-Pakets (gleich für `src/` mit tsx und `dist/` im Image). */
export const APP_ROOT = resolve(import.meta.dirname, '..');

export type StartMode = 'all' | 'api' | 'worker';

function env(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') throw new Error(`Umgebungsvariable ${name} fehlt`);
  return value;
}

function bool(name: string, fallback: boolean): boolean {
  const value = process.env[name];
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

function int(name: string, fallback: number): number {
  const value = process.env[name];
  if (value === undefined || value === '') return fallback;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) throw new Error(`Umgebungsvariable ${name} ist keine Zahl`);
  return parsed;
}

/** Twelve-Factor: Konfiguration ausschließlich über Umgebungsvariablen (siehe .env.example). */
export function loadConfig() {
  const mode = env('APP_MODE', 'all') as StartMode;
  if (!['all', 'api', 'worker'].includes(mode)) throw new Error(`APP_MODE ${mode} ungültig`);
  const webDistDir = env('WEB_DIST_DIR', resolve(APP_ROOT, '../web/dist'));
  // Eine Quelle für die Version der Nutzungsbedingungen: Front Matter des Rechtstexts (ADR-0015);
  // TERMS_VERSION nur noch als Override, z. B. für Tests.
  const legalManifest = readLegalManifest(webDistDir, resolve(APP_ROOT, '../web/src/content/legal'));

  return {
    mode,
    port: int('PORT', 8080),
    host: env('HOST', '0.0.0.0'),
    publicUrl: env('PUBLIC_URL', 'http://localhost:8080').replace(/\/$/, ''),
    databaseUrl: env('DATABASE_URL', 'postgres://campusmarkt:campusmarkt@localhost:5432/campusmarkt'),
    dbPoolSize: int('DB_POOL_SIZE', 10),
    smtp: {
      host: env('SMTP_HOST', 'localhost'),
      port: int('SMTP_PORT', 1025),
      secure: bool('SMTP_SECURE', false),
      user: process.env.SMTP_USER || undefined,
      password: process.env.SMTP_PASSWORD || undefined,
      // Absenderdomain passt zu den Beispiel-DNS-Einträgen (SPF/DKIM/DMARC, docs/07-betrieb/mail-zustellbarkeit.md)
      from: env('MAIL_FROM', 'CampusMarkt HWG LU <no-reply@campusmarkt.example>'),
      // Antworten gehen an die Kontaktstelle (REQ-LEGAL-005), nicht ins Leere
      replyTo: env('MAIL_REPLY_TO', 'CampusMarkt Support <campusmarkt-support@hwg-lu.example>'),
    },
    uploadsDir: env('UPLOADS_DIR', resolve(APP_ROOT, '../../.data/uploads')),
    webDistDir,
    legalManifest,
    /** Echtbetrieb: Start verweigern, solange Rechtstexte Muster oder Platzhalter enthalten (ADR-0015 Nr. 7). */
    legalStrict: bool('LEGAL_STRICT', false),
    cookieSecure: bool('COOKIE_SECURE', true),
    /** Hinter dem Reverse Proxy (Profil `proxy`, ADR-0017): Client-IP und Protokoll aus X-Forwarded-* übernehmen. */
    trustProxy: bool('TRUST_PROXY', false),
    sessionTtlDays: int('SESSION_TTL_DAYS', 30),
    termsVersion: process.env.TERMS_VERSION || termsVersionOf(legalManifest) || '2026-10',
    privacyVersion: privacyVersionOf(legalManifest) || '2026-10',
    seedDemo: bool('SEED_DEMO', false),
    demoMode: bool('DEMO_MODE', false),
    // Interaktive API-Doku nur im Demo-Modus, sonst ausdrücklich einschalten (Pentest PT-INFO-01)
    apiDocs: bool('API_DOCS', bool('DEMO_MODE', false)),
    /**
     * Hebt alle Rate-Limits um diesen Faktor an, nur für Lasttests (REQ-PERF-002/-004: „Rate-Limit für den Test
     * angehoben“). Wirkt ausschließlich mit DEMO_MODE=true; im Echtbetrieb bleibt der Faktor 1.
     */
    rateLimitFactor: bool('DEMO_MODE', false) ? Math.max(1, int('RATE_LIMIT_FACTOR', 1)) : 1,
    logLevel: env('LOG_LEVEL', 'info'),
    passwordBlocklistFile: env('PASSWORD_BLOCKLIST_FILE', resolve(APP_ROOT, 'assets/password-blocklist.txt')),
    shutdownTimeoutMs: int('SHUTDOWN_TIMEOUT_MS', 25_000),
    /** Harter Wartungsmodus, z. B. während einer Wiederherstellung (REQ-OPS-006, ADR-0018). */
    maintenanceMode: bool('MAINTENANCE_MODE', false),
    maintenanceUntil: process.env.MAINTENANCE_UNTIL || null,
    /**
     * Signiert die Abmeldelinks in Benachrichtigungs-Mails (REQ-NOTI-003, REQ-OPS-010). Ohne UNSUBSCRIBE_SECRET erzeugt
     * der Start ein zufälliges Geheimnis und speichert es in `platform.setting` (kein öffentlicher Standardwert, RV-C-02).
     */
    unsubscribeSecret: process.env.UNSUBSCRIBE_SECRET || '',
    /** Löschjournal außerhalb der Datenbank (ADR-0018, RV-A-01); eigenes Volume im Docker-Beispiel. */
    journalDir: env('JOURNAL_DIR', resolve(APP_ROOT, '../../.data/journal')),
    /** Kontakt in security.txt (REQ-SEC-012); Platzhalter bis zum Echtbetrieb. */
    securityContact: env('SECURITY_CONTACT', 'mailto:security@hwg-lu.example'),
  };
}

export type Config = ReturnType<typeof loadConfig>;
