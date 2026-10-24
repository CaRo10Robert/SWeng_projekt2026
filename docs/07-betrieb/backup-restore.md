---
id: OPS-BACKUP
type: operational
status: in-review
owner: architecture-lead
version: 1.1
created: 2026-10-24
last_updated: 2026-10-24
---

# Datensicherung und Wiederherstellung

> **Muster im Rahmen einer Übungsaufgabe.** Anforderungen: REQ-AVAIL-003 (Docker-Beispiel), REQ-AVAIL-002 (Ziele im Echtbetrieb). Architekturentscheidung: ADR-0018.

## Was wird gesichert?

| Teil | Inhalt | Verfahren |
|---|---|---|
| Datenbank | alle Schemas (identity, listings, messaging, trust, platform, pg-boss) | `pg_dump --format=custom` im Container `db` |
| Bilder | Volume `uploads` | `tar` des Verzeichnisses im Container `app` |
| Konfiguration | `compose.yaml`, `.env` (ohne Geheimnisse im Repo) | Git; Geheimnisse im Secret-Store [Platzhalter] |

Ein Backup ist ein Verzeichnis `backups/<UTC-Zeitstempel>/` (in `.gitignore`) mit `db.dump`, `uploads.tar.gz` und `manifest.json` (Zeitpunkt, App-Version, letzte Migration, SHA-256-Prüfsummen und Größen). Reihenfolge: erst die Datenbank, dann die Bilder. Bilder, die nach dem Dump entstehen, liegen höchstens zusätzlich im Archiv; es fehlt keine Datei, auf die der Dump verweist.

Nach einer erfolgreichen Sicherung schreibt das Skript den Zeitpunkt in `platform.setting` (`backup.last_success_at`). Daraus liefert die App die Metrik `campusmarkt_backup_last_success_timestamp_seconds` für den Alarm `BackupMissing` ([Überwachung und Alarmierung](monitoring-alarmierung.md)).

## Befehle (Docker-Beispiel)

| Aufgabe | Befehl |
|---|---|
| Sicherung erstellen | `node scripts/backup.mjs [--out <Verzeichnis>] [--project <Compose-Projekt>] [--no-rotate]` |
| Sicherung wiederherstellen | `node scripts/restore.mjs backups/<Zeitstempel> [--yes] [--project <Compose-Projekt>]` |
| Restore-Test (automatisiert, AT-AVAIL-003) | `node tests/ops/restore-test.mjs [http://localhost:8080] [--project <Compose-Projekt>]` – läuft in CI im Job `compose`; **zerstört die Daten des Stacks** |

Ohne `--project` gilt `COMPOSE_PROJECT_NAME` bzw. der Projektname aus `compose.yaml`.

**Ablauf der Wiederherstellung** (`scripts/restore.mjs`):

1. Prüfsummen aller Dateien gegen das Manifest prüfen; bei Abweichung Abbruch.
2. Migrationsstand prüfen: Ist die letzte Migration der Sicherung neuer als die neueste Migration in `apps/server/migrations` des Repos, wird abgebrochen (erst den Code aktualisieren). Eine ältere Sicherung mit neuerem Code ist erlaubt, die Migrationen laufen beim Start idempotent nach (REQ-OPS-005).
3. Rückfrage, weil der aktuelle Stand überschrieben wird (`--yes` für Automatisierung).
4. `app` **stoppen**, damit keine Schreibzugriffe und Jobs dazwischenkommen. Läuft das Profil `proxy`, antwortet es in dieser Zeit mit 502. Wer stattdessen eine Wartungsseite zeigen will, setzt vorher `MAINTENANCE_MODE=true` ([Wartung und Statusseite](wartung-statusseite.md)).
5. Datenbank löschen und neu anlegen (`DROP DATABASE … WITH (FORCE)`, `CREATE DATABASE`), dann `pg_restore --no-owner --exit-on-error`. Das ist sauberer als `pg_restore --clean`, weil keine Reste neuerer Objekte bleiben.
6. Bilder: Volume leeren und Archiv entpacken über `docker compose run --rm --no-deps --entrypoint sh app` (das Root-Dateisystem bleibt read-only, nur das Volume ist beschreibbar).
7. `app` starten und auf „healthy“ warten.

Im lokalen Test dauerte die Wiederherstellung etwa 10 s, vom Datenverlust (`down -v`) bis „healthy“ etwa 24 s (Ziel im Beispiel: RTO ≤ 15 min, QS-15).

## Aufbewahrung

| Art | Aufbewahrung |
|---|---|
| alle Sicherungen der letzten 7 Tage | 7 Tage |
| je Kalenderwoche (Montag–Sonntag, UTC) die neueste Sicherung | 4 Wochen (28 Tage) |
| ältere Sicherungen | werden bei jeder neuen Sicherung gelöscht (außer mit `--no-rotate`); Höchstdauer **28 Tage** (Löschkonzept REQ-PRIV-003) |

Die jeweils neueste Sicherung bleibt immer erhalten. Gelöschte Daten verschwinden spätestens nach 28 Tagen auch aus den Sicherungen. Wird eine Sicherung eingespielt, laufen die Löschfristen danach sofort erneut (täglicher Lauf), damit bereits gelöschte Daten nicht wieder auftauchen.

## Echtbetrieb

- **Verschlüsselung:** Archive vor dem Verlassen des Servers verschlüsseln (z. B. age oder GPG; Schlüssel getrennt verwahrt) [Platzhalter: Verfahren des RZ].
- **Ablage:** zweiter Standort bzw. Objektspeicher in der EU, unveränderlich (Object Lock) gegen Ransomware.
- **Point-in-Time-Recovery:** WAL-Archivierung (z. B. pgBackRest), damit das RPO unter 24 h sinkt.
- **Ziele (Beispielwerte, REQ-AVAIL-002):** RPO 24 h (mit PITR 15 min), RTO 4 h.

## Restore-Übung

Monatlich auf einer Testumgebung. Protokoll:

| Datum | Sicherung von | Dauer bis „healthy“ | Stichprobe geprüft (Konto, Anzeige mit Bild, Konversation) | Ergebnis | Durchgeführt von |
|---|---|---|---|---|---|
| [Platzhalter] | | | | | |
