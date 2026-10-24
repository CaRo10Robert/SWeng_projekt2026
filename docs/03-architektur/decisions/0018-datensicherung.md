# ADR-0018: Datensicherung mit pg_dump und Uploads-Archiv, Wiederherstellung in CI getestet

- **Status:** Accepted (vorläufig, Q-23; Bestätigung mit dem Architektur-Review ausstehend)
- **Datum:** 2026-10-24
- **Bezug:** REQ-AVAIL-003, REQ-AVAIL-002 (Echtbetrieb), REQ-PRIV-003, REQ-LEGAL-011 (TOMs), Guideline Kap. 11 („a backup nobody has ever restored from is a hypothesis, not a control“), Backlog B-56; Verfahren in [docs/07-betrieb/backup-restore.md](../../07-betrieb/backup-restore.md)

## Kontext
Das Docker-Beispiel hält zwei Arten von Daten:
- die **Datenbank** (Volume `pgdata`): Fachdaten, Sessions, Job-Queue;
- die **Bildablage** (Volume `uploads`).

Heute gibt es keine Sicherung. `docker compose down -v` löscht alles. REQ-AVAIL-002 (RTO/RPO im Echtbetrieb) ist Won't für R1. REQ-AVAIL-003 verlangt eine Sicherung, deren Wiederherstellung im Beispiel nachweislich funktioniert.

Die Sicherung muss offline laufen und mit Bordmitteln auskommen. Sie muss Datenbank und Bilder zueinander passend sichern. Gelöschte personenbezogene Daten dürfen nur begrenzt in Sicherungen fortbestehen (REQ-PRIV-003).

## Optionen
| Option | Pro | Contra |
|---|---|---|
| **A: `pg_dump -Fc` + `tar` der Uploads per Skript, Restore-Test in CI** | Bordmittel der vorhandenen Images, offline, konsistenter Datenbank-Snapshot (MVCC), selektiver Restore möglich | Kein Point-in-Time-Recovery; RPO = Abstand der Sicherungen |
| B: Kontinuierliche WAL-Archivierung / PITR (z. B. WAL-G, pgBackRest) | RPO von Minuten, Standard im Echtbetrieb | Weiterer Dienst und Objektspeicher; für das Beispiel überdimensioniert |
| C: Snapshot der Docker-Volumes (`docker run … tar` auf `pgdata`) | Einfach | Bei laufender Datenbank inkonsistent; nur mit Stopp sicher; abhängig von der Postgres-Version |
| D: `pg_dumpall` als SQL-Text | Lesbar | Größer, kein paralleler oder selektiver Restore, Rollen und Globals im Beispiel unnötig |

## Entscheidung
**Option A** für das Beispiel; Option B ist der Weg für den Echtbetrieb (EPIC-12, REQ-AVAIL-002).

1. **Sicherung:** `node scripts/backup.mjs [--out <ordner>] [--project <compose-projekt>] [--no-rotate]`, Standard `backups/<UTC-Zeitstempel>/` (in `.gitignore`):
   1. `docker compose exec -T db pg_dump -Fc --no-owner` → `db.dump`. Das ist ein konsistenter Snapshot bei laufender Anwendung.
   2. **Danach** `tar` der Uploads aus dem Container `app` nach stdout → `uploads.tar.gz`. Die Reihenfolge ist bewusst: Bilder, die nach dem Dump entstehen, liegen höchstens zusätzlich im Archiv (verwaiste Dateien, harmlos). Fehlen kann keine Datei, auf die der Dump verweist.
   3. `manifest.json` mit Zeitstempel, App-Version (aus `package.json` im Container), letzter Migration und SHA-256 beider Dateien.
   4. Zeitpunkt der Sicherung in `platform.setting` (`backup.last_success_at`); daraus die Metrik `campusmarkt_backup_last_success_timestamp_seconds` für den Alarm `BackupMissing`.
2. **Wiederherstellung:** `node scripts/restore.mjs <ordner> [--yes] [--project <compose-projekt>]`:
   1. Prüfsummen prüfen.
   2. Migrationsstand prüfen: Eine Sicherung, deren letzte Migration neuer ist als die neueste Migration in `apps/server/migrations` des Repos, wird abgelehnt. Eine ältere Sicherung mit neuerem Code ist erlaubt, weil die Migrationen idempotent nachlaufen (REQ-OPS-005).
   3. App **stoppen** (nicht nur Wartungsmodus): So stören keine laufenden Jobs und Verbindungen das Einspielen. Hinter dem Proxy erscheint in dieser Zeit 502; für eine Wartungsseite setzt der Betrieb vorher `MAINTENANCE_MODE=true` (REQ-OPS-006).
   4. Datenbank löschen und neu anlegen (`DROP DATABASE … WITH (FORCE)`, `CREATE DATABASE`), danach `pg_restore --no-owner --exit-on-error`. Das ist sauberer als `pg_restore --clean`, weil keine Reste neuerer Objekte bleiben.
   5. Uploads mit `docker compose run --rm --no-deps --entrypoint sh app` in das geleerte Volume entpacken. Das Root-Dateisystem bleibt read-only, nur das Volume ist beschreibbar.
   6. App starten und auf „healthy“ warten.
3. **Restore-Test in CI** (`node tests/ops/restore-test.mjs`, im Job `compose`, Nachweis AT-AVAIL-003):
   1. Seed, eine Testanzeige mit Bild anlegen, Sicherung;
   2. `docker compose down -v`, `up`, Wiederherstellung;
   3. prüfen: Zählungen identisch, Login mit Demo-Konto, Testanzeige vorhanden, Bild abrufbar, Dauer ≤ 15 min (QS-15).
4. **Beispielwerte:** Sicherung täglich und vor jedem Update; RPO ≤ 24 h, RTO ≤ 15 min (beide Werte nur Beispiel). Aufbewahrung: alle Sicherungen der letzten 7 Tage, danach je Kalenderwoche die neueste bis 28 Tage; ältere werden bei jeder Sicherung gelöscht, die neueste bleibt immer.
5. **Datenschutz:** Sicherungen enthalten personenbezogene Daten. Gelöschte Konten verschwinden erst mit der Rotation aus den Sicherungen, also nach höchstens 28 Tagen. Das wird in Datenschutzerklärung und Verzeichnis der Verarbeitungstätigkeiten genannt (docs/06-recht/vvt.md). Nach einer Wiederherstellung werden Löschungen seit dem Sicherungszeitpunkt erneut ausgeführt: Der Löschlauf `privacy-purge` arbeitet mit Fristen und erfasst sie beim nächsten Lauf. Eine Liste der Löschaufträge seit der Sicherung führt das Runbook.
6. **Echtbetrieb (nur dokumentiert):**
   - verschlüsselte Sicherung (z. B. `age`), Schlüssel getrennt verwahrt;
   - Kopie außerhalb des Rechenzentrums (3-2-1-Regel);
   - PITR nach Option B;
   - Restore-Übung mindestens halbjährlich, protokolliert (MAN-AVAIL-002).

## Konsequenzen
- (+) Die Wiederherstellung ist bei jeder Änderung in CI belegt, nicht nur die Sicherung.
- (+) Keine neuen Dienste; das Skript nutzt die Werkzeuge der vorhandenen Images.
- (+) Selektive Wiederherstellung einzelner Schemas bei Bedarf (`pg_restore -n`).
- (−) RPO entspricht dem Abstand der Sicherungen; Daten seit der letzten Sicherung gehen verloren.
- (−) Während der Wiederherstellung ist die App gestoppt (Ausfallzeit; im lokalen Test etwa 24 s vom Datenverlust bis „healthy“).
- (−) Im Beispiel liegen die Sicherungen unverschlüsselt auf dem Prüfrechner. Das ist akzeptiert, weil nur Seed- und Testdaten vorkommen.
- Umsetzung: Backlog B-56 (`scripts/backup.mjs`, `scripts/restore.mjs`, `scripts/lib/compose.mjs`, `tests/ops/restore-test.mjs`).
- *Angleichung 2026-10-24 an die Umsetzung:* Wiederherstellung stoppt die App statt Wartungsmodus, `DROP/CREATE DATABASE` statt `pg_restore --clean`, Migrationsprüfung gegen das Repo, Aufbewahrung höchstens 28 statt 35 Tage, Aufrufsyntax mit `--out`.
