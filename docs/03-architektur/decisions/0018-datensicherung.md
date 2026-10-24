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

1. **Sicherung:** `node scripts/backup.mjs [zielordner]`, Standard `backups/<UTC-Zeitstempel>/` (in `.gitignore`):
   1. `docker compose exec -T db pg_dump -Fc --no-owner` → `db.dump`. Das ist ein konsistenter Snapshot bei laufender Anwendung.
   2. **Danach** `tar` der Uploads aus dem Container `app` nach stdout → `uploads.tar.gz`. Die Reihenfolge ist bewusst: Bilder, die nach dem Dump entstehen, liegen höchstens zusätzlich im Archiv (verwaiste Dateien, harmlos). Fehlen kann keine Datei, auf die der Dump verweist.
   3. `manifest.json` mit Zeitstempel, App-Version (Image-Label), letzter Migration und SHA-256 beider Dateien.
2. **Wiederherstellung:** `node scripts/restore.mjs <ordner>`:
   1. Prüfsummen prüfen.
   2. Mit `MAINTENANCE_MODE=true` ein Neustart der App (REQ-OPS-006, harte Wartung). Danach `pg_restore --clean --if-exists --no-owner` in die laufende `db`.
   3. Uploads mit `docker compose run --rm --no-deps --entrypoint …` in das Volume entpacken. Das Root-Dateisystem bleibt read-only, nur das Volume ist beschreibbar.
   4. App normal starten. Migrationen laufen idempotent (REQ-OPS-005), daher kann eine ältere Sicherung mit neuerem Code wiederhergestellt werden. Eine neuere Sicherung mit älterem Code wird abgelehnt (Abgleich der letzten Migration im Manifest).
3. **Restore-Test in CI** (im Job `compose`, Nachweis REQ-AVAIL-003):
   1. Seed, eine Testanzeige mit Bild anlegen, Sicherung;
   2. `docker compose down -v`, `up`, Wiederherstellung;
   3. prüfen: Login mit Demo-Konto, Anzahl der Anzeigen, Testanzeige vorhanden, Bild abrufbar, Dauer ≤ 15 min (QS-15).
4. **Beispielwerte:** Sicherung täglich und vor jedem Update; RPO ≤ 24 h, RTO ≤ 15 min (beide Werte nur Beispiel). Aufbewahrung: 7 tägliche und 4 wöchentliche Sicherungen; ältere werden gelöscht.
5. **Datenschutz:** Sicherungen enthalten personenbezogene Daten. Gelöschte Konten verschwinden erst mit der Rotation aus den Sicherungen, also nach höchstens 35 Tagen. Das wird in Datenschutzerklärung und Verzeichnis der Verarbeitungstätigkeiten genannt (docs/06-recht/vvt.md). Nach einer Wiederherstellung werden Löschungen seit dem Sicherungszeitpunkt erneut ausgeführt: Der Löschlauf `privacy-purge` arbeitet mit Fristen und erfasst sie beim nächsten Lauf. Eine Liste der Löschaufträge seit der Sicherung führt das Runbook.
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
- (−) Während `pg_restore` ist die App im Wartungsmodus (Ausfallzeit).
- (−) Im Beispiel liegen die Sicherungen unverschlüsselt auf dem Prüfrechner. Das ist akzeptiert, weil nur Seed- und Testdaten vorkommen.
- Umsetzung: Backlog B-56.
