#!/usr/bin/env node
/**
 * Wiederherstellung einer Sicherung (REQ-AVAIL-003, ADR-0018, docs/07-betrieb/backup-restore.md).
 *   node scripts/restore.mjs backups/<Zeitstempel> [--yes] [--project <compose-projekt>] [--other-project]
 *
 * Ablauf: Manifest und Prüfsummen prüfen → Projekt und Migrationsstand prüfen → app stoppen → Sicherung in eine
 * temporäre Datenbank einspielen → Bilder in ein Arbeitsverzeichnis entpacken → erst wenn beides gelungen ist,
 * Datenbank und Bilder tauschen → Löschjournal seit dem Sicherungszeitpunkt erneut anwenden → app starten.
 * Scheitert ein Schritt vor dem Tausch, bleibt der bisherige Stand unverändert erhalten (RV-A-02).
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import {
  compose,
  composeFromFile,
  DB_NAME,
  DB_USER,
  latestCodeMigration,
  mergeJournalText,
  parseArgs,
  ROOT,
  sha256,
  sql,
  validBackups,
  waitHealthy,
} from './lib/compose.mjs';

const REQUIRED_FILES = ['db.dump', 'uploads.tar.gz'];
const TEMP_DB = `${DB_NAME}_restore`;

const args = parseArgs(process.argv.slice(2), ['yes', 'other-project']);
const project = args.project ?? process.env.COMPOSE_PROJECT_NAME;
const dir = args._[0] && resolve(ROOT, args._[0]);
if (!dir || !existsSync(join(dir, 'manifest.json'))) {
  console.error('Aufruf: node scripts/restore.mjs backups/<Zeitstempel> [--yes] [--project <name>]');
  process.exit(2);
}
const started = Date.now();
const manifest = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8'));
const fail = (message) => {
  console.error(`✘ ${message}`);
  process.exit(1);
};

// 1. Vollständigkeit und Prüfsummen: beide Dateien müssen im Manifest stehen (RV-A-14)
for (const file of REQUIRED_FILES) {
  if (!manifest.files?.[file]) fail(`Manifest ohne Eintrag für ${file}. Abbruch.`);
  if (!existsSync(join(dir, file))) fail(`${file} fehlt in ${dir}. Abbruch.`);
  const actual = await sha256(join(dir, file));
  if (actual !== manifest.files[file].sha256) fail(`Prüfsumme von ${file} stimmt nicht (erwartet ${manifest.files[file].sha256}, ist ${actual}). Abbruch.`);
}
console.log(`✔ Prüfsummen ok (Sicherung vom ${manifest.createdAt}, Version ${manifest.appVersion})`);

// 2. Sicherung gehört zu diesem Stack? Schutz vor einem falschen --project mit --yes (RV-A-14)
const target = project ?? 'campusmarkt';
if (manifest.project && manifest.project !== target && !args['other-project']) {
  fail(`Sicherung stammt aus Projekt „${manifest.project}“, Ziel ist „${target}“. Absichtlich? Dann mit --other-project wiederholen.`);
}

// 3. Eine Sicherung mit neuerem Schema als der Code kann nicht sicher eingespielt werden
const codeMigration = latestCodeMigration();
if (manifest.lastMigration && codeMigration && manifest.lastMigration > codeMigration) {
  fail(`Sicherung stammt von neuerem Code (Migration ${manifest.lastMigration} > ${codeMigration}). Erst den Code aktualisieren.`);
}

if (!args.yes) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(`Aktuellen Stand von „${target}“ mit dieser Sicherung überschreiben? (ja/nein) `);
  rl.close();
  if (!/^(j|ja|y|yes)$/i.test(answer.trim())) {
    console.log('Abgebrochen.');
    process.exit(1);
  }
}

// 4. Anwendung stoppen: keine Schreibzugriffe und keine Jobs während des Einspielens. Hinter dem Proxy erscheint
//    solange 502 (eine Wartungsseite ist ohne laufende App nicht möglich).
console.log('… app wird für die Wiederherstellung gestoppt');
compose(project, ['stop', 'app']);
const restartOld = (reason) => {
  console.error(`✘ ${reason}`);
  compose(project, ['exec', '-T', 'db', 'psql', '-U', DB_USER, '-d', 'postgres', '-c', `DROP DATABASE IF EXISTS ${TEMP_DB} WITH (FORCE)`], { allowFail: true });
  compose(project, ['run', '--rm', '--no-deps', '-T', '--entrypoint', 'sh', 'app', '-c', 'rm -rf /data/uploads/.restore-new'], { allowFail: true });
  compose(project, ['start', 'app'], { allowFail: true });
  console.error('Der bisherige Stand ist unverändert; app wurde wieder gestartet.');
  process.exit(1);
};

// 5. In eine temporäre Datenbank einspielen; der bisherige Stand bleibt bis zum Tausch unberührt
const admin = ['exec', '-T', 'db', 'psql', '-U', DB_USER, '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-c'];
try {
  compose(project, [...admin, `DROP DATABASE IF EXISTS ${TEMP_DB} WITH (FORCE)`]);
  compose(project, [...admin, `CREATE DATABASE ${TEMP_DB} OWNER ${DB_USER}`]);
  await composeFromFile(project, ['exec', '-T', 'db', 'pg_restore', '-U', DB_USER, '-d', TEMP_DB, '--no-owner', '--exit-on-error'], join(dir, 'db.dump'));
} catch (error) {
  restartOld(`Einspielen der Datenbank fehlgeschlagen: ${error.message.split('\n')[0]}`);
}
console.log('✔ Datenbank in temporäre Datenbank eingespielt');

// 6. Bilder in ein Arbeitsverzeichnis im Volume entpacken (Root-Dateisystem bleibt read-only)
try {
  await composeFromFile(
    project,
    ['run', '--rm', '--no-deps', '-T', '--entrypoint', 'sh', 'app', '-c', 'set -e; rm -rf /data/uploads/.restore-new; mkdir /data/uploads/.restore-new; tar -xzf - -C /data/uploads/.restore-new'],
    join(dir, 'uploads.tar.gz'),
  );
} catch (error) {
  restartOld(`Entpacken der Bilder fehlgeschlagen: ${error.message.split('\n')[0]}`);
}
console.log('✔ Bilder entpackt');

// 7. Tausch: Datenbank umbenennen, Bilder verschieben (beides kurze, lokale Operationen)
compose(project, [...admin, `DROP DATABASE IF EXISTS ${DB_NAME} WITH (FORCE)`]);
compose(project, [...admin, `ALTER DATABASE ${TEMP_DB} RENAME TO ${DB_NAME}`]);
compose(project, [
  'run', '--rm', '--no-deps', '-T', '--entrypoint', 'sh', 'app', '-c',
  [
    'set -e',
    'cd /data/uploads',
    'rm -rf .restore-old && mkdir .restore-old',
    'for f in * .[!.]*; do [ -e "$f" ] || continue; case "$f" in .restore-new|.restore-old) ;; *) mv "$f" .restore-old/ ;; esac; done',
    'for f in .restore-new/* .restore-new/.[!.]*; do [ -e "$f" ] && mv "$f" . ; done',
    'rm -rf .restore-new .restore-old',
  ].join('; '),
]);
console.log('✔ Datenbank und Bilder getauscht');

// 8. Löschjournal anwenden: Löschungen seit dem Sicherungszeitpunkt erneut ausführen (Art. 17 DSGVO, RV-A-01).
//    Quelle: Journal im Volume `journal` (übersteht die Wiederherstellung) plus Kopie neben den Sicherungen.
const journalCopy = join(dirname(dir), 'deletions.ndjson');
const hostJournal = existsSync(journalCopy) ? mergeJournalText(readFileSync(journalCopy, 'utf8')) : '';
const replay = await composeFromFile(
  project,
  ['run', '--rm', '--no-deps', '-T', 'app', 'node', 'server/dist/main.js', 'replay-deletions', '--since', manifest.createdAt],
  hostJournal,
  { inputIsText: true },
).catch((error) => {
  console.error(`⚠ Löschjournal konnte nicht angewendet werden: ${error.message.split('\n')[0]}`);
  console.error('  Bitte manuell nachholen: docker compose run --rm app node server/dist/main.js replay-deletions --since <Zeitpunkt>');
  return null;
});
if (replay !== null) console.log('✔ Löschjournal seit dem Sicherungszeitpunkt angewendet');

// 9. Zeitpunkt der letzten Sicherung: die neueste gültige Sicherung, nicht der Wert aus der eingespielten Datenbank (RV-A-05)
const newest = validBackups(dirname(dir))[0]?.manifest.createdAt ?? manifest.createdAt;
sql(
  project,
  `INSERT INTO platform.setting (key, value) VALUES ('backup.last_success_at', jsonb_build_object('at', '${newest}'::timestamptz))
   ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
  { allowFail: true },
);

// 10. Starten (Migrationen laufen idempotent nach, REQ-OPS-005) und auf Readiness warten
compose(project, ['start', 'app']);
const waited = await waitHealthy(project, 'app');
console.log(`✔ app ist wieder „healthy“ (${(waited / 1000).toFixed(0)} s)`);
console.log(`Fertig in ${((Date.now() - started) / 1000).toFixed(1)} s.`);
