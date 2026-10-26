---
id: MAN-AVAIL-002
type: evidence
requirement: REQ-AVAIL-002
status: done
owner: ops-lead
date: 2026-10-26
---

# MAN-AVAIL-002 Restore-Übung nach Totalverlust der Datenbank

## Ziel

Messung von RPO und RTO für REQ-AVAIL-002 (Echtbetrieb: RPO ≤ 1 h, RTO ≤ 4 h) und REQ-AVAIL-003 (Docker-Beispiel: RTO ≤ 15 min, tägliche Sicherung). Ablauf strikt nach [backup-restore.md](../../07-betrieb/backup-restore.md).

## Umgebung

Stack `cmh1` (App 8089, Mailpit 8032, Profil `monitoring`), Sicherungsziel ein eigenes Verzeichnis im Scratchpad (`--out`), Migration `0004_review_korrekturen.sql`, Version 0.1.0.

## Ablauf

| Zeit (UTC) | Schritt | Beobachtung |
|---|---|---|
| 07:36:32 | Datensatz A als Lea: Anzeige „Übung Regal vor Sicherung“ mit Bild | 201 |
| 07:36:33 | `node scripts/backup.mjs --out <ziel> --project cmh1 --no-rotate` | Bilder, Manifest, Löschjournal gesichert; 2,1 s; 521 KB; Sicherungszeitpunkt 07:36:35 |
| 07:36:41 | Datensatz B: Anzeige „Übung Lampe nach Sicherung“ | 201 (liegt nach der Sicherung, geht absichtlich verloren) |
| 07:36:55 | **Datenverlust**: `app` und `db` stoppen, Container `db` entfernen, Volume `cmh1_pgdata` löschen | – |
| 07:36:56 | Stack neu starten (leere DB, Seed legt Demo-Daten neu an) | A und B fehlen, 29 Anzeigen aus dem Seed |
| 07:37:08 | `node scripts/restore.mjs <ziel>/20261026T073633Z --yes --project cmh1` | Prüfsummen ok → `app` gestoppt → temporäre DB eingespielt → Bilder entpackt → getauscht → Löschjournal angewendet → `app` healthy nach 7 s; 12,7 s gesamt |
| 07:37:21 | Prüfung | A vorhanden mit Bild (Bild-URL 200, `image/webp`), B fehlt, 30 Anzeigen; Metrik `campusmarkt_backup_last_success_timestamp_seconds` = Sicherungszeitpunkt |

## Messwerte

| Messgröße | Wert |
|---|---|
| Dauer der Sicherung | 2,1 s |
| Dauer der Wiederherstellung (Skript) | 12,7 s |
| **RTO** gemessen: Datenverlust bis Dienst mit gesicherten Daten | **26 s** |
| **RPO** gemessen: verlorene Zeitspanne vor dem Verlust | 20 s (Sicherung 07:36:35, Verlust 07:36:55); Datensatz B verloren |
| RPO nach Verfahren (tägliche Sicherung, ADR-0018) | bis zu 24 h |

## Ergebnis gegen die Akzeptanzkriterien

| Anforderung | Kriterium | Ist | Bewertung |
|---|---|---|---|
| REQ-AVAIL-003 (Beispiel) | RTO ≤ 15 min, Stichprobe Konto/Anzeige/Bild | 26 s, Stichprobe vollständig | **bestanden** |
| REQ-AVAIL-002 (Echtbetrieb) | RTO ≤ 4 h | 26 s (kleine Datenmenge) | bestanden (unter Übungsbedingungen) |
| REQ-AVAIL-002 (Echtbetrieb) | RPO ≤ 1 h | Verfahren sichert täglich, also RPO bis 24 h; PITR (WAL-Archiv) ist nicht umgesetzt | **nicht erfüllt**; für den Echtbetrieb vorgesehen (ADR-0018, EPIC-12) |

Die Messung des RPO in dieser Übung (20 s) hängt nur vom zufälligen Abstand zwischen Sicherung und Verlust ab. Maßgeblich ist der Sicherungstakt.

## Abweichungen und Befunde

| Nr. | Befund | Vorschlag |
|---|---|---|
| R-1 | Das RPO-Ziel des Echtbetriebs (≤ 1 h) ist mit täglichem `pg_dump` nicht erreichbar. | PITR mit WAL-Archiv bzw. stündliche Sicherung; im Beispiel bewusst nicht umgesetzt (EPIC-12) |
| R-2 | Die Tabelle „Restore-Übung“ in `backup-restore.md` ist leer. | Diese Übung als ersten Eintrag übernehmen |
| R-3 | Nach dem Totalverlust legt der Seed die Demo-Daten neu an, bevor der Restore läuft. Das ist unschädlich, weil der Restore die DB ersetzt, ist aber nicht dokumentiert. | Hinweis in `backup-restore.md`: Nach Totalverlust vor dem Restore nicht mit `SEED_DEMO=true` starten, oder Restore direkt ausführen |

## Folgeaufgaben

- R-2 und R-3 in `docs/07-betrieb/backup-restore.md` übernehmen.
- R-1 bleibt ein offener Punkt für den Echtbetrieb.
