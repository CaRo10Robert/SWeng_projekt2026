#!/usr/bin/env node
/**
 * Datensicherung des Docker-Beispiels (REQ-AVAIL-003, ADR-0018, docs/07-betrieb/backup-restore.md).
 *   node scripts/backup.mjs [--out backups] [--project <compose-projekt>] [--no-rotate]
 *
 * Ergebnis: <out>/<UTC-Zeitstempel>/ mit db.dump (pg_dump -Fc), uploads.tar.gz und manifest.json (SHA-256).
 * Geschrieben wird zuerst nach <Zeitstempel>.partial und erst am Ende umbenannt: Ein abgebrochener Lauf hinterlässt
 * keine Sicherung, die wie eine gültige aussieht (RV-A-13).
 * Reihenfolge: erst Datenbank, dann Bilder – Bilder, die danach entstehen, liegen höchstens zusätzlich im Archiv.
 * Zusätzlich wird das Löschjournal neben die Sicherungen kopiert (<out>/deletions.ndjson, ADR-0018, RV-A-01).
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  compose,
  composeToFile,
  DB_NAME,
  DB_USER,
  mergeJournalText,
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
const partial = `${dir}.partial`;
mkdirSync(partial, { recursive: true });

// Reste abgebrochener Läufe entfernen (älter als einen Tag)
for (const entry of readdirSync(outRoot)) {
  if (entry.endsWith('.partial') && entry !== `${name}.partial` && Date.now() - statSync(join(outRoot, entry)).mtimeMs > 86_400_000) {
    rmSync(join(outRoot, entry), { recursive: true, force: true });
    console.log(`  abgebrochene Sicherung entfernt: ${entry}`);
  }
}

console.log(`Sicherung nach ${dir}`);

try {
  // 1. Datenbank: konsistenter Snapshot bei laufender Anwendung (MVCC)
  await composeToFile(project, ['exec', '-T', 'db', 'pg_dump', '-U', DB_USER, '-d', DB_NAME, '-Fc', '--no-owner'], join(partial, 'db.dump'));
  console.log('✔ Datenbank gesichert');

  // 2. Bilder aus dem Volume des app-Containers (Root-Dateisystem ist read-only, tar schreibt nach stdout);
  //    Arbeitsverzeichnisse einer laufenden Wiederherstellung gehören nicht dazu
  await composeToFile(
    project,
    ['exec', '-T', 'app', 'tar', '-czf', '-', '--exclude=./.restore-new', '--exclude=./.restore-old', '-C', '/data/uploads', '.'],
    join(partial, 'uploads.tar.gz'),
  );
  console.log('✔ Bilder gesichert');

  // 3. Manifest
  const lastMigration = sql(project, 'SELECT name FROM public.schema_migrations ORDER BY name DESC LIMIT 1').stdout.trim() || null;
  const appVersion =
    compose(project, ['exec', '-T', 'app', 'node', '-p', "require('/app/server/package.json').version"], { allowFail: true }).stdout.trim() ||
    JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version;
  const files = {};
  for (const file of ['db.dump', 'uploads.tar.gz']) {
    files[file] = { sha256: await sha256(join(partial, file)), bytes: statSync(join(partial, file)).size };
  }
  const manifest = { format: 1, createdAt: new Date().toISOString(), project: project ?? 'campusmarkt', appVersion, lastMigration, files };
  writeFileSync(join(partial, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  renameSync(partial, dir);
  console.log(`✔ Manifest (Migration ${lastMigration}, Version ${appVersion})`);
} catch (error) {
  rmSync(partial, { recursive: true, force: true });
  console.error(`✘ Sicherung abgebrochen: ${error.message}`);
  process.exit(1);
}

// 4. Löschjournal neben die Sicherungen kopieren (vereinigt mit der vorhandenen Kopie), damit es auch einen
//    Verlust der Volumes übersteht
const journal = compose(project, ['exec', '-T', 'app', 'sh', '-c', 'cat /data/journal/deletions.ndjson 2>/dev/null || true'], { allowFail: true });
const journalCopy = join(outRoot, 'deletions.ndjson');
const existing = existsSync(journalCopy) ? readFileSync(journalCopy, 'utf8') : '';
writeFileSync(journalCopy, mergeJournalText(existing, journal.stdout));
console.log('✔ Löschjournal kopiert');

// 5. Zeitpunkt der letzten erfolgreichen Sicherung für Alarm BackupMissing und Metrik
const recorded = sql(
  project,
  `INSERT INTO platform.setting (key, value) VALUES ('backup.last_success_at', jsonb_build_object('at', now()))
   ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
  { allowFail: true },
);
if (!recorded.ok) console.warn(`⚠ Zeitpunkt nicht gespeichert (Tabelle platform.setting fehlt?): ${recorded.stderr.trim().split('\n')[0]}`);

// 6. Aufbewahrung: 7 Tage täglich, danach wöchentlich, höchstens 28 Tage – auch nicht die neueste (RV-R-13)
if (!args['no-rotate']) {
  const valid = readdirSync(outRoot).filter((entry) => existsSync(join(outRoot, entry, 'manifest.json')));
  const remove = selectForDeletion(valid);
  for (const old of remove) {
    rmSync(join(outRoot, old), { recursive: true, force: true });
    console.log(`  gelöscht (Aufbewahrung abgelaufen): ${old}`);
  }
  if (valid.length === remove.length) {
    console.warn('⚠ Keine Sicherung innerhalb der Aufbewahrungsfrist vorhanden – Alarm BackupMissing prüfen.');
  }
}

console.log(`Fertig in ${((Date.now() - started) / 1000).toFixed(1)} s: ${dir}`);
