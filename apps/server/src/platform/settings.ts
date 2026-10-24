import type { Db } from './db.js';
import { sql } from './sql.js';

/**
 * Einstellungen in `platform.setting` (Wartungsmodus, Ankündigung, letzte Sicherung; architektur.md §5.4).
 * Gelesene Werte werden kurz zwischengespeichert; eigene Änderungen wirken sofort.
 */
export interface SettingsStore {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, actorId: string | null): Promise<void>;
  remove(key: string): Promise<void>;
}

export const SETTING = {
  maintenance: 'maintenance',
  announcement: 'announcement',
  /** Schreibt das Sicherungsskript nach erfolgreichem Lauf: `{"at": "<ISO>"}` (ADR-0018). */
  backupLastSuccess: 'backup.last_success_at',
} as const;

export function createSettings(db: Db, cacheMs = 10_000): SettingsStore {
  const cache = new Map<string, { value: unknown; at: number }>();
  return {
    async get<T>(key: string) {
      const hit = cache.get(key);
      if (hit && Date.now() - hit.at < cacheMs) return hit.value as T | null;
      const row = await db.one<{ value: T }>(sql`SELECT value FROM platform.setting WHERE key = ${key}`);
      const value = row?.value ?? null;
      cache.set(key, { value, at: Date.now() });
      return value;
    },
    async set(key, value, actorId) {
      await db.exec(sql`
        INSERT INTO platform.setting (key, value, updated_by) VALUES (${key}, ${JSON.stringify(value)}::jsonb, ${actorId})
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now(), updated_by = EXCLUDED.updated_by`);
      cache.delete(key);
    },
    async remove(key) {
      await db.exec(sql`DELETE FROM platform.setting WHERE key = ${key}`);
      cache.delete(key);
    },
  };
}
