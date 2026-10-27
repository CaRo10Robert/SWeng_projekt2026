# ADR-0018: Datensicherung mit pg_dump und Uploads-Archiv, Wiederherstellung in CI getestet

- **Status:** Accepted (2026-10-26; bestätigt durch Review v1.3 und Guideline-Review); **Nr. 2 (Wiederherstellung) und Nr. 5 (Löschungen nach dem Sicherungszeitpunkt) ersetzt durch [ADR-0019](0019-wiederherstellung-und-loeschjournal.md)**
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

1. **Sicherung:** `node scripts/backup.mjs [--out <ordner>] [--project <compose-projekt>] [--no-rotate]`, Standard `backups/<UTC-Zeitstempel>/` (in `.gitignore` und `.dockerignore`); geschrieben wird zuerst nach `<Zeitstempel>.partial`, erst nach Abschluss wird umbenannt:
   1. `docker compose exec -T db pg_dump -Fc --no-owner` → `db.dump`. Das ist ein konsistenter Snapshot bei laufender Anwendung.
   2. **Danach** `tar` der Uploads aus dem Container `app` nach stdout → `uploads.tar.gz`. Die Reihenfolge ist bewusst: Bilder, die nach dem Dump entstehen, liegen höchstens zusätzlich im Archiv (verwaiste Dateien, harmlos). Bilder, die zwischen Dump und Archiv gelöscht werden, fehlen dagegen nach einer Wiederherstellung; das ist im Beispiel hingenommen (RV-A-12).
   3. `manifest.json` mit Zeitstempel, Compose-Projekt, App-Version (aus `package.json` im Container), letzter Migration und SHA-256 beider Dateien; dazu eine Kopie des Löschjournals als `backups/deletions.ndjson`.
   4. Zeitpunkt der Sicherung in `platform.setting` (`backup.last_success_at`); daraus die Metrik `campusmarkt_backup_last_success_timestamp_seconds` für den Alarm `BackupMissing`.
2. **Wiederherstellung:** ersetzt durch [ADR-0019](0019-wiederherstellung-und-loeschjournal.md) (temporäre Datenbank mit Rückfall). Ursprüngliche Fassung vom 2026-10-24 (App stoppen, `DROP/CREATE DATABASE`, kein Rückfall) siehe Git-Historie.
3. **Restore-Test in CI** (`node tests/ops/restore-test.mjs`, im Job `compose`, Nachweis AT-AVAIL-003):
   1. Seed, eine Testanzeige mit Bild anlegen, Sicherung;
   2. `docker compose down -v`, `up`, Wiederherstellung;
   3. prüfen: Zählungen identisch, Login mit Demo-Konto, Testanzeige vorhanden, Bild abrufbar, Dauer ≤ 15 min (QS-15);
   4. zweiter Teil: eine nach der Sicherung gelöschte Anzeige bleibt nach der Wiederherstellung gelöscht (Löschjournal).
4. **Beispielwerte:** Sicherung täglich und vor jedem Update; RPO ≤ 24 h, RTO ≤ 15 min (beide Werte nur Beispiel). Aufbewahrung: alle Sicherungen der letzten 7 Tage, danach je Kalenderwoche die neueste bis 28 Tage; ältere werden bei jeder Sicherung gelöscht – streng, **auch die neueste**, wenn sie älter als 28 Tage ist (mit Warnung; `BackupMissing` meldet die fehlende Sicherung). Rotation und Wiederherstellung berücksichtigen nur Verzeichnisse mit `manifest.json`.
5. **Datenschutz:** Sicherungen enthalten personenbezogene Daten. Gelöschte Konten verschwinden erst mit der Rotation aus den Sicherungen, also nach höchstens 28 Tagen. Das wird in Datenschutzerklärung und Verzeichnis der Verarbeitungstätigkeiten genannt (docs/06-recht/vvt.md). Löschungen nach dem Sicherungszeitpunkt: ersetzt durch [ADR-0019](0019-wiederherstellung-und-loeschjournal.md) (Löschjournal).
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
- *Nachtrag 2026-10-25 (Review v1.3, RV-A-01/02/09/12/13/14, RV-R-13):* Wiederherstellung über temporäre Datenbank und Arbeitsverzeichnis mit Rückfall auf den alten Stand; Löschjournal mit `replay-deletions`; `.partial`-Sicherungen; Projektprüfung; strenge 28 Tage auch für die neueste Sicherung; Hinweis auf den Wartungsmodus vor dem Restore gestrichen.
- *Nachtrag 2026-10-26:* Fristlöschungen nach Datum (REQ-PRIV-003, täglicher Lauf `privacy.purgeExpired`) stehen bewusst **nicht** im Löschjournal: Nach einem Restore löscht der nächste Lauf dieselben Datensätze erneut. Das Journal bleibt den Löschungen auf Anforderung vorbehalten (Konto, Anzeige, Bild, Moderation). Restore-Übung mit Zeitmessung: [MAN-AVAIL-002](../../05-umsetzung/nachweise/MAN-AVAIL-002.md).
