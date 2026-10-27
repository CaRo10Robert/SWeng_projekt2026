import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type pg from 'pg';
import type { Logger } from 'pino';

/**
 * Migrationen in der Datenbank, die der Code nicht kennt: Die Datenbank ist neuer als der Code (z. B. Rollback des
 * Image ohne Restore). Dann darf die App nicht starten, weil sie ein Schema bedienen würde, das sie nicht versteht.
 */
export function unknownMigrations(applied: Iterable<string>, files: string[]): string[] {
  const known = new Set(files);
  return [...applied].filter((name) => !known.has(name)).sort();
}

/**
 * Vorwärtsgerichtete SQL-Migrationen (REQ-OPS-005): laufen beim Start automatisch, idempotent
 * und unter einem Advisory Lock, damit parallel startende Instanzen sich nicht stören.
 */
export async function migrate(pool: pg.Pool, dir: string, log: Logger): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('SELECT pg_advisory_lock(727001)');
    await client.query(`CREATE TABLE IF NOT EXISTS public.schema_migrations (
      name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`);
    const applied = new Set(
      (await client.query<{ name: string }>('SELECT name FROM public.schema_migrations')).rows.map((r) => r.name),
    );
    const files = (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort();
    const unknown = unknownMigrations(applied, files);
    if (unknown.length) {
      throw new Error(
        `Datenbank ist neuer als der Code: unbekannte Migrationen ${unknown.join(', ')}. ` +
          'Start abgebrochen. Passendes Image verwenden oder eine Sicherung mit passendem Stand wiederherstellen (docs/07-betrieb/backup-restore.md).',
      );
    }
    for (const file of files) {
      if (applied.has(file)) continue;
      const sql = await readFile(join(dir, file), 'utf8');
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO public.schema_migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        log.info({ migration: file }, 'Migration angewendet');
      } catch (error) {
        await client.query('ROLLBACK');
        throw new Error(`Migration ${file} fehlgeschlagen: ${(error as Error).message}`);
      }
    }
  } finally {
    await client.query('SELECT pg_advisory_unlock(727001)').catch(() => undefined);
    client.release();
  }
}
