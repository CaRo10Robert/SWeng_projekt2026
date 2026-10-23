import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type pg from 'pg';
import type { Logger } from 'pino';

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
