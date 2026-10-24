#!/usr/bin/env node
/**
 * Datensicherung des Docker-Beispiels (REQ-AVAIL-003, ADR-0018, docs/07-betrieb/backup-restore.md).
 *   node scripts/backup.mjs [--out backups] [--project <compose-projekt>] [--no-rotate]
 *
 * Ergebnis: <out>/<UTC-Zeitstempel>/ mit db.dump (pg_dump -Fc), uploads.tar.gz und manifest.json (SHA-256).
 * Reihenfolge: erst Datenbank, dann Bilder – Bilder, die danach entstehen, liegen höchstens zusätzlich im Archiv.
 */
import { mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  compose,
  composeToFile,
  DB_NAME,
  DB_USER,
  parseArgs,
  ROOT,
  selectForDeletion,
  sha256,
  sql,
  timestamp,
} from './lib/compose.mjs';

const args = parseArgs(process.argv.slice(2), ['no-rotate']);
const project = args.project ?? process.env.COMPOSE_PROJECT_NAME;
const outRoot = resolve(ROOT, args.out ?? 'backups');
const started = Date.now();
const name = timestamp();
const dir = join(outRoot, name);
mkdirSync(dir, { recursive: true });

console.log(`Sicherung nach ${dir}`);

// 1. Datenbank: konsistenter Snapshot bei laufender Anwendung (MVCC)
await composeToFile(project, ['exec', '-T', 'db', 'pg_dump', '-U', DB_USER, '-d', DB_NAME, '-Fc', '--no-owner'], join(dir, 'db.dump'));
console.log('✔ Datenbank gesichert');

// 2. Bilder aus dem Volume des app-Containers (Root-Dateisystem ist read-only, tar schreibt nach stdout)
await composeToFile(project, ['exec', '-T', 'app', 'tar', '-czf', '-', '-C', '/data/uploads', '.'], join(dir, 'uploads.tar.gz'));
console.log('✔ Bilder gesichert');

// 3. Manifest
const lastMigration = sql(project, 'SELECT name FROM public.schema_migrations ORDER BY name DESC LIMIT 1').stdout.trim() || null;
const appVersion =
  compose(project, ['exec', '-T', 'app', 'node', '-p', "require('/app/server/package.json').version"], { allowFail: true }).stdout.trim() ||
  JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version;
const files = {};
for (const file of ['db.dump', 'uploads.tar.gz']) {
  files[file] = { sha256: await sha256(join(dir, file)), bytes: statSync(join(dir, file)).size };
}
const manifest = { format: 1, createdAt: new Date().toISOString(), project: project ?? 'campusmarkt', appVersion, lastMigration, files };
writeFileSync(join(dir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`✔ Manifest (Migration ${lastMigration}, Version ${appVersion})`);

// 4. Zeitpunkt der letzten erfolgreichen Sicherung für Alarm BackupMissing und Metrik
const recorded = sql(
  project,
  `INSERT INTO platform.setting (key, value) VALUES ('backup.last_success_at', jsonb_build_object('at', now()))
   ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
  { allowFail: true },
);
if (!recorded.ok) console.warn(`⚠ Zeitpunkt nicht gespeichert (Tabelle platform.setting fehlt?): ${recorded.stderr.trim().split('\n')[0]}`);

// 5. Aufbewahrung: 7 Tage täglich, 4 Wochen wöchentlich
if (!args['no-rotate']) {
  for (const old of selectForDeletion(readdirSync(outRoot))) {
    rmSync(join(outRoot, old), { recursive: true, force: true });
    console.log(`  gelöscht (Aufbewahrung abgelaufen): ${old}`);
  }
}

console.log(`Fertig in ${((Date.now() - started) / 1000).toFixed(1)} s: ${dir}`);
