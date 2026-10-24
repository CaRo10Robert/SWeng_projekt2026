---
id: OPS-BACKUP
type: operational
status: in-review
owner: architecture-lead
version: 1.0
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

Ein Backup ist ein Verzeichnis `backups/<Zeitstempel>/` mit `db.dump`, `uploads.tar.gz` und `manifest.json` (Zeitpunkt, Image-Version, Migrationsstand, SHA-256-Prüfsummen).

## Befehle (Docker-Beispiel)

| Aufgabe | Befehl |
|---|---|
| Sicherung erstellen | `node scripts/backup.mjs` (optional `--out <Verzeichnis>`) |
| Sicherung wiederherstellen | `node scripts/restore.mjs backups/<Zeitstempel>` |
| Restore-Test (automatisiert) | in CI: Daten anlegen → sichern → `down -v` → wiederherstellen → Daten prüfen |

Die Wiederherstellung stoppt `app`, spielt Datenbank und Bilder ein, prüft die Prüfsummen und startet `app` wieder. Sie überschreibt den aktuellen Stand und fragt deshalb vorher nach (`--yes` für Automatisierung).

## Aufbewahrung

| Art | Aufbewahrung |
|---|---|
| tägliche Sicherung | 7 Tage |
| wöchentliche Sicherung (Sonntag) | 4 Wochen |
| ältere Sicherungen | werden gelöscht; Höchstdauer **30 Tage** (Löschkonzept REQ-PRIV-003) |

Gelöschte Daten verschwinden spätestens nach 30 Tagen auch aus den Sicherungen. Wird eine Sicherung eingespielt, laufen die Löschfristen danach sofort erneut (täglicher Lauf), damit bereits gelöschte Daten nicht wieder auftauchen.

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
