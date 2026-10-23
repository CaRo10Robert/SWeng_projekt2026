import { resolve } from 'node:path';

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
      from: env('MAIL_FROM', 'CampusMarkt HWG LU <no-reply@campusmarkt.local>'),
    },
    uploadsDir: env('UPLOADS_DIR', resolve(APP_ROOT, '../../.data/uploads')),
    webDistDir: env('WEB_DIST_DIR', resolve(APP_ROOT, '../web/dist')),
    cookieSecure: bool('COOKIE_SECURE', true),
    sessionTtlDays: int('SESSION_TTL_DAYS', 30),
    termsVersion: env('TERMS_VERSION', '2026-10'),
    seedDemo: bool('SEED_DEMO', false),
    demoMode: bool('DEMO_MODE', false),
    logLevel: env('LOG_LEVEL', 'info'),
    passwordBlocklistFile: env('PASSWORD_BLOCKLIST_FILE', resolve(APP_ROOT, 'assets/password-blocklist.txt')),
    /** Geheimnis für das Hashen von IP-Adressen (REQ-PRIV-002). Im Beispiel unkritisch. */
    ipHashSalt: env('IP_HASH_SALT', 'campusmarkt-demo-salt'),
    shutdownTimeoutMs: int('SHUTDOWN_TIMEOUT_MS', 25_000),
  };
}

export type Config = ReturnType<typeof loadConfig>;
