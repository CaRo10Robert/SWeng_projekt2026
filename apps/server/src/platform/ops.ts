import type { Announcement, SystemStatus } from '@campusmarkt/contracts';
import { SETTING, type SettingsStore } from './settings.js';

export interface MaintenanceState {
  active: boolean;
  until: string | null;
  /** `env`: harter Modus über MAINTENANCE_MODE (nur per Neustart abschaltbar), `setting`: über die Oberfläche. */
  source: 'env' | 'setting' | null;
}

export interface OpsOptions {
  maintenanceFromEnv: boolean;
  maintenanceUntilFromEnv: string | null;
  settings: SettingsStore;
  checkDatabase(): Promise<boolean>;
  checkMail(): Promise<boolean>;
  /** Wie lange ein Ergebnis der Statusprüfung gilt (REQ-OPS-007: ≤ 60 s alt). */
  statusCacheMs?: number;
}

/** Ankündigung nur im angegebenen Zeitraum sichtbar. Reine Funktion. */
export function visibleAnnouncement(value: Announcement | null, now = new Date()): Announcement | null {
  if (!value) return null;
  if (value.startsAt && new Date(value.startsAt) > now) return null;
  if (value.endsAt && new Date(value.endsAt) < now) return null;
  return value;
}

/** Betriebsfunktionen: Wartungsmodus, Ankündigung, Statusseite (REQ-OPS-006/007). */
export function createOps(options: OpsOptions) {
  const cacheMs = options.statusCacheMs ?? 15_000;
  let checks: { at: number; db: boolean; mail: boolean } | null = null;
  // Laufende Prüfung teilen: viele gleichzeitige Abrufe erzeugen nur eine DB- und eine SMTP-Prüfung (RV-A-11)
  let inFlight: Promise<{ at: number; db: boolean; mail: boolean }> | null = null;

  async function maintenance(): Promise<MaintenanceState> {
    if (options.maintenanceFromEnv) return { active: true, until: options.maintenanceUntilFromEnv, source: 'env' };
    const value = await options.settings.get<{ on: boolean; until: string | null }>(SETTING.maintenance);
    return value?.on ? { active: true, until: value.until ?? null, source: 'setting' } : { active: false, until: null, source: null };
  }

  async function announcement(): Promise<Announcement | null> {
    return visibleAnnouncement(await options.settings.get<Announcement>(SETTING.announcement));
  }

  async function runChecks() {
    if (checks && Date.now() - checks.at < cacheMs) return checks;
    inFlight ??= (async () => {
      try {
        const [db, mail] = await Promise.all([
          options.checkDatabase().catch(() => false),
          options.checkMail().catch(() => false),
        ]);
        checks = { at: Date.now(), db, mail };
        return checks;
      } finally {
        inFlight = null;
      }
    })();
    return inFlight;
  }

  return {
    maintenance,
    announcement,

    async status(): Promise<SystemStatus> {
      const c = await runChecks();
      const m = await maintenance().catch((): MaintenanceState => ({ active: false, until: null, source: null }));
      const services: SystemStatus['services'] = [
        { id: 'app', status: 'operational' },
        { id: 'database', status: c.db ? 'operational' : 'disrupted' },
        { id: 'email', status: c.mail ? 'operational' : 'disrupted' },
        // Echtzeit läuft im selben Prozess (ADR-0004); ohne Datenbank gibt es keine Nachrichten
        { id: 'realtime', status: c.db ? 'operational' : 'disrupted' },
      ];
      return {
        status: m.active ? 'maintenance' : services.every((s) => s.status === 'operational') ? 'operational' : 'degraded',
        checkedAt: new Date(c.at).toISOString(),
        services,
        maintenance: { active: m.active, until: m.until },
        announcement: c.db ? await announcement().catch(() => null) : null,
      };
    },

    /** Zeitpunkt der letzten erfolgreichen Sicherung (für die Metrik und die Alarmregel BackupMissing). */
    async lastBackupAt(): Promise<Date | null> {
      const value = await options.settings.get<{ at: string }>(SETTING.backupLastSuccess);
      return value?.at ? new Date(value.at) : null;
    },
  };
}

export type Ops = ReturnType<typeof createOps>;
