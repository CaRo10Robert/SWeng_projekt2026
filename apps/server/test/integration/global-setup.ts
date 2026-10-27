import { resolve } from 'node:path';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import pg from 'pg';
import type { TestProject } from 'vitest/node';
import { migrate } from '../../src/platform/migrate.js';
import { createLogger } from '../../src/platform/logger.js';

/** Gleiches Image wie im Docker-Beispiel (compose.yaml), damit Integrationstests dieselbe Datenbankversion prüfen. */
const POSTGRES_IMAGE = 'postgres:17-alpine';
export const TEMPLATE_DB = 'cm_template';

declare module 'vitest' {
  export interface ProvidedContext {
    /** Verbindung zur Verwaltungsdatenbank des Containers; leer, wenn kein Docker verfügbar ist (nur lokal erlaubt). */
    integrationAdminUrl: string;
  }
}

let container: StartedPostgreSqlContainer | undefined;

/**
 * Startet einmal je Testlauf einen PostgreSQL-Container (Testcontainers), wendet alle Migrationen auf eine
 * Template-Datenbank an und gibt die Verbindung an die Testdateien weiter. Jede Datei klont daraus eine eigene
 * Datenbank (siehe harness.ts), sodass Dateien parallel laufen können.
 */
export async function setup(project: TestProject) {
  try {
    container = await new PostgreSqlContainer(POSTGRES_IMAGE)
      .withDatabase('postgres')
      .withUsername('campusmarkt')
      .withPassword('campusmarkt')
      .start();
  } catch (error) {
    // In CI muss Docker vorhanden sein; ein stilles Überspringen würde fehlende Tests grün aussehen lassen
    if (process.env.CI) throw error;
    console.warn(`\n⚠ Integrationstests übersprungen: Docker nicht verfügbar (${(error as Error).message})\n`);
    project.provide('integrationAdminUrl', '');
    return;
  }
  const adminUrl = container.getConnectionUri();
  const admin = new pg.Client({ connectionString: adminUrl });
  await admin.connect();
  await admin.query(`CREATE DATABASE ${TEMPLATE_DB}`);
  await admin.end();

  const pool = new pg.Pool({ connectionString: withDatabase(adminUrl, TEMPLATE_DB), max: 1 });
  await migrate(pool, resolve(import.meta.dirname, '../../migrations'), createLogger('silent'));
  await pool.end();
  project.provide('integrationAdminUrl', adminUrl);
}

export async function teardown() {
  await container?.stop();
}

export function withDatabase(url: string, database: string): string {
  const parsed = new URL(url);
  parsed.pathname = `/${database}`;
  return parsed.toString();
}
