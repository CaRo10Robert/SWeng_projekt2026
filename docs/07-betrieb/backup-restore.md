---
id: OPS-BACKUP
type: operational
status: in-review
owner: architecture-lead
version: 1.2
created: 2026-10-24
last_updated: 2026-10-25
---

# Datensicherung und Wiederherstellung

> **Muster im Rahmen einer Übungsaufgabe.** Anforderungen: REQ-AVAIL-003 (Docker-Beispiel), REQ-AVAIL-002 (Ziele im Echtbetrieb). Architekturentscheidung: ADR-0018.

## Was wird gesichert?

| Teil | Inhalt | Verfahren |
|---|---|---|
| Datenbank | alle Schemas (identity, listings, messaging, trust, platform, pg-boss) | `pg_dump --format=custom` im Container `db` |
| Bilder | Volume `uploads` | `tar` des Verzeichnisses im Container `app` |
| Konfiguration | `compose.yaml`, `.env` (ohne Geheimnisse im Repo) | Git; Geheimnisse im Secret-Store des RZ (fiktiv „MusterVault“) |

Ein Backup ist ein Verzeichnis `backups/<UTC-Zeitstempel>/` (in `.gitignore` und `.dockerignore`) mit `db.dump`, `uploads.tar.gz` und `manifest.json` (Zeitpunkt, Compose-Projekt, App-Version, letzte Migration, SHA-256-Prüfsummen und Größen). Es entsteht zuerst als `<Zeitstempel>.partial` und wird erst nach Abschluss umbenannt; abgebrochene Läufe werden weder rotiert noch wiederhergestellt. Reihenfolge: erst die Datenbank, dann die Bilder. Bilder, die nach dem Dump **entstehen**, liegen höchstens zusätzlich im Archiv. Bilder, die zwischen Dump und Archiv **gelöscht** werden, fehlen nach einer Wiederherstellung (die Anzeige verweist dann auf ein fehlendes Bild); das ist im Beispiel hingenommen (RV-A-12).

Zusätzlich legt das Skript eine Kopie des **Löschjournals** als `backups/deletions.ndjson` ab (siehe unten).

Nach einer erfolgreichen Sicherung schreibt das Skript den Zeitpunkt in `platform.setting` (`backup.last_success_at`). Daraus liefert die App die Metrik `campusmarkt_backup_last_success_timestamp_seconds` für den Alarm `BackupMissing` ([Überwachung und Alarmierung](monitoring-alarmierung.md)).

## Befehle (Docker-Beispiel)

| Aufgabe | Befehl |
|---|---|
| Sicherung erstellen | `node scripts/backup.mjs [--out <Verzeichnis>] [--project <Compose-Projekt>] [--no-rotate]` |
| Sicherung wiederherstellen | `node scripts/restore.mjs backups/<Zeitstempel> [--yes] [--project <Compose-Projekt>] [--other-project]` |
| Löschjournal manuell nachholen | `docker compose run --rm app node server/dist/main.js replay-deletions --since <ISO-Zeitpunkt>` |
| Restore-Test (automatisiert, AT-AVAIL-003) | `node tests/ops/restore-test.mjs [http://localhost:8080] [--project <Compose-Projekt>]` – läuft in CI im Job `compose`; **zerstört die Daten des Stacks**. Mit eigenem Projekt die Port-Variablen des Stacks setzen (`APP_PORT`, `MAILPIT_PORT`) |

Ohne `--project` gilt `COMPOSE_PROJECT_NAME` bzw. der Projektname aus `compose.yaml`.

**Ablauf der Wiederherstellung** (`scripts/restore.mjs`):

1. Manifest prüfen: beide Pflichtdateien (`db.dump`, `uploads.tar.gz`) müssen eingetragen sein; Prüfsummen gegen das Manifest prüfen; bei Abweichung Abbruch. Stammt die Sicherung aus einem anderen Compose-Projekt als dem Ziel, bricht das Skript ab (absichtlich nur mit `--other-project`).
2. Migrationsstand prüfen: Ist die letzte Migration der Sicherung neuer als die neueste Migration in `apps/server/migrations` des Repos, wird abgebrochen (erst den Code aktualisieren). Eine ältere Sicherung mit neuerem Code ist erlaubt, die Migrationen laufen beim Start idempotent nach (REQ-OPS-005).
3. Rückfrage, weil der aktuelle Stand überschrieben wird (`--yes` für Automatisierung).
4. `app` **stoppen**, damit keine Schreibzugriffe und Jobs dazwischenkommen. Läuft das Profil `proxy`, antwortet es in dieser Zeit mit 502; ein Wartungsmodus hilft hier nicht, weil die App gestoppt ist (RV-A-09).
5. Sicherung in eine **temporäre Datenbank** (`<db>_restore`) einspielen (`pg_restore --no-owner --exit-on-error`). Scheitert das, bleibt die bisherige Datenbank unverändert, und die App startet wieder mit dem alten Stand (RV-A-02).
6. Bilder in ein Arbeitsverzeichnis `.restore-new` im Volume entpacken (über `docker compose run --rm --no-deps --entrypoint sh app`; das Root-Dateisystem bleibt read-only). Scheitert das, bleibt der alte Stand erhalten.
7. Erst wenn beides gelungen ist: alte Datenbank löschen, temporäre per `ALTER DATABASE … RENAME` übernehmen und die Bilder tauschen.
8. **Löschjournal anwenden:** alle Löschungen seit dem Sicherungszeitpunkt erneut ausführen (`replay-deletions --since <Sicherungszeitpunkt>`, idempotent). Quelle ist das Journal im Volume `journal` (übersteht die Wiederherstellung) plus die Kopie neben den Sicherungen. Schlägt das fehl, gibt das Skript den Befehl zum manuellen Nachholen aus.
9. Zeitstempel `backup.last_success_at` auf die neueste vollständige Sicherung setzen (sonst meldet `BackupMissing` nach einem älteren Restore fälschlich), `app` starten und auf „healthy“ warten.

Im lokalen Test dauerte die Wiederherstellung etwa 10 s, vom Datenverlust (`down -v`) bis „healthy“ etwa 24 s (Ziel im Beispiel: RTO ≤ 15 min, QS-15).

## Aufbewahrung

| Art | Aufbewahrung |
|---|---|
| alle Sicherungen der letzten 7 Tage | 7 Tage |
| je Kalenderwoche (Montag–Sonntag, UTC) die neueste Sicherung | 4 Wochen (28 Tage) |
| ältere Sicherungen | werden bei jeder neuen Sicherung gelöscht (außer mit `--no-rotate`); Höchstdauer **28 Tage** (Löschkonzept REQ-PRIV-003) |

Die 28 Tage gelten streng, **auch für die neueste Sicherung**: Ist sie älter, wird sie mit einer Warnung gelöscht; eine fehlende aktuelle Sicherung meldet der Alarm `BackupMissing`. Gelöschte Daten verschwinden so spätestens nach 28 Tagen auch aus den Sicherungen.

## Löschjournal (Art. 17 DSGVO)

Eine Wiederherstellung würde sonst Daten zurückbringen, die nach dem Sicherungszeitpunkt gelöscht wurden (sofort gelöschte Anzeigen, endgültig gelöschte Konten, moderativ entfernte Inhalte). Fristlöschungen allein holen das nicht nach. Deshalb schreibt die App jede endgültige Löschung **nach dem Commit** als Zeile in ein Journal außerhalb der Datenbank:

| Punkt | Festlegung |
|---|---|
| Ort | Datei `deletions.ndjson` im Volume `journal` (`JOURNAL_DIR`, Standard `/data/journal`); Kopie bei jeder Sicherung als `backups/deletions.ndjson` |
| Inhalt | nur Art, Kennung und Zeitpunkt (z. B. `listing_deleted`, `account_deleted`, `message_removed`, `image_deleted`, `listing_restored`), keine Inhalte |
| Aufbewahrung | 35 Tage (länger als die älteste Sicherung) |
| Anwendung | nach jeder Wiederherstellung automatisch (Schritt 8), idempotent |
| Grenzen | Gehen **alle** Volumes verloren (`down -v` ohne Wiederherstellung des Journals), stehen nur die Einträge bis zur letzten Sicherung zur Verfügung (aus der Kopie). Sperren und Entsperren stehen nicht im Journal; nach einer Wiederherstellung gilt der Stand der Sicherung |

## Echtbetrieb

- **Verschlüsselung:** Archive vor dem Verlassen des Servers verschlüsseln (z. B. age oder GPG; Schlüssel getrennt verwahrt) (Verfahren des RZ: age mit Schlüssel im Tresor der Stabsstelle, fiktiv).
- **Ablage:** zweiter Standort bzw. Objektspeicher in der EU, unveränderlich (Object Lock) gegen Ransomware.
- **Point-in-Time-Recovery:** WAL-Archivierung (z. B. pgBackRest), damit das RPO unter 24 h sinkt.
- **Ziele (Beispielwerte, REQ-AVAIL-002):** RPO 24 h (mit PITR 15 min), RTO 4 h.

## Restore-Übung

Monatlich auf einer Testumgebung. Protokoll:

| Datum | Sicherung von | Dauer bis „healthy“ | Stichprobe geprüft (Konto, Anzeige mit Bild, Konversation) | Ergebnis | Durchgeführt von |
|---|---|---|---|---|---|
| *(Übung: Restore-Test aus CI; Echtbetrieb: Eintrag nach jeder Übung)* | | | | | |
