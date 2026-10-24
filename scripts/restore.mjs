#!/usr/bin/env node
/**
 * Wiederherstellung einer Sicherung (REQ-AVAIL-003, ADR-0018, docs/07-betrieb/backup-restore.md).
 *   node scripts/restore.mjs backups/<Zeitstempel> [--yes] [--project <compose-projekt>]
 *
 * Ablauf: Prüfsummen prüfen → Migrationsstand prüfen → app stoppen → Datenbank neu anlegen und einspielen
 * → Bilder ersetzen → app starten → auf „healthy“ warten. Überschreibt den aktuellen Stand.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import {
  compose,
  composeFromFile,
  DB_NAME,
  DB_USER,
  latestCodeMigration,
  parseArgs,
  ROOT,
  sha256,
  waitHealthy,
} from './lib/compose.mjs';

const args = parseArgs(process.argv.slice(2), ['yes']);
const project = args.project ?? process.env.COMPOSE_PROJECT_NAME;
const dir = args._[0] && resolve(ROOT, args._[0]);
if (!dir || !existsSync(join(dir, 'manifest.json'))) {
  console.error('Aufruf: node scripts/restore.mjs backups/<Zeitstempel> [--yes] [--project <name>]');
  process.exit(2);
}
const started = Date.now();
const manifest = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8'));

// 1. Prüfsummen
for (const [file, meta] of Object.entries(manifest.files)) {
  const actual = await sha256(join(dir, file));
  if (actual !== meta.sha256) {
    console.error(`✘ Prüfsumme von ${file} stimmt nicht (erwartet ${meta.sha256}, ist ${actual}). Abbruch.`);
    process.exit(1);
  }
}
console.log(`✔ Prüfsummen ok (Sicherung vom ${manifest.createdAt}, Version ${manifest.appVersion})`);

// 2. Eine Sicherung mit neuerem Schema als der Code kann nicht sicher eingespielt werden
const codeMigration = latestCodeMigration();
if (manifest.lastMigration && codeMigration && manifest.lastMigration > codeMigration) {
  console.error(`✘ Sicherung stammt von neuerem Code (Migration ${manifest.lastMigration} > ${codeMigration}). Erst den Code aktualisieren.`);
  process.exit(1);
}

if (!args.yes) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(`Aktuellen Stand${project ? ` von „${project}“` : ''} mit dieser Sicherung überschreiben? (ja/nein) `);
  rl.close();
  if (!/^(j|ja|y|yes)$/i.test(answer.trim())) {
    console.log('Abgebrochen.');
    process.exit(1);
  }
}

// 3. Anwendung stoppen: keine Schreibzugriffe und keine Jobs während des Einspielens.
//    Läuft ein Reverse Proxy (Profil proxy), zeigt er solange 502; für eine Wartungsseite vorher MAINTENANCE_MODE setzen
//    (docs/07-betrieb/wartung-statusseite.md).
console.log('… app wird für die Wiederherstellung gestoppt');
compose(project, ['stop', 'app']);

// 4. Datenbank neu anlegen und einspielen (sauberer als --clean: keine Reste neuerer Objekte)
const admin = ['exec', '-T', 'db', 'psql', '-U', DB_USER, '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-c'];
compose(project, [...admin, `DROP DATABASE IF EXISTS ${DB_NAME} WITH (FORCE)`]);
compose(project, [...admin, `CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}`]);
await composeFromFile(project, ['exec', '-T', 'db', 'pg_restore', '-U', DB_USER, '-d', DB_NAME, '--no-owner', '--exit-on-error'], join(dir, 'db.dump'));
console.log('✔ Datenbank eingespielt');

// 5. Bilder: Volume leeren und Archiv entpacken (Root-Dateisystem bleibt read-only, nur das Volume ist beschreibbar)
await composeFromFile(
  project,
  ['run', '--rm', '--no-deps', '-T', '--entrypoint', 'sh', 'app', '-c', 'find /data/uploads -mindepth 1 -delete && tar -xzf - -C /data/uploads'],
  join(dir, 'uploads.tar.gz'),
);
console.log('✔ Bilder eingespielt');

// 6. Starten (Migrationen laufen idempotent nach, REQ-OPS-005) und auf Readiness warten
compose(project, ['start', 'app']);
const waited = await waitHealthy(project, 'app');
console.log(`✔ app ist wieder „healthy“ (${(waited / 1000).toFixed(0)} s)`);
console.log(`Fertig in ${((Date.now() - started) / 1000).toFixed(1)} s.`);
console.log('Hinweis: Löschungen seit dem Sicherungszeitpunkt holt der nächste Löschlauf nach (ADR-0018, Runbook).');
