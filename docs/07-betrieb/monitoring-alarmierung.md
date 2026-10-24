---
id: OPS-MONITORING
type: operational
status: in-review
owner: architecture-lead
version: 1.1
created: 2026-10-24
last_updated: 2026-10-24
---

# Überwachung und Alarmierung

> **Muster im Rahmen einer Übungsaufgabe.** Anforderung: REQ-OPS-008; optionales Compose-Profil `monitoring` (Q-27, ADR-0017).

## Quellen

| Quelle | Inhalt |
|---|---|
| `/metrics` (Prometheus-Format) | `http_request_duration_seconds` (Histogramm je Methode, Route und Status), `ws_connections`, `jobs_processed_total` (je Queue und Ergebnis), `app_ready` (0/1), `campusmarkt_maintenance_mode` (0/1), `campusmarkt_backup_last_success_timestamp_seconds` (Unix-Sekunden, 0 = nie gesichert) sowie Prozessmetriken (CPU, Speicher, Event-Loop). `/metrics` ist nur im internen Compose-Netz erreichbar, am Proxy liefert es 404. |
| `/health/live`, `/health/ready` | Prozess lebt; Datenbank erreichbar und Migrationen fertig |
| Protokolle (JSON) | Fehler mit Korrelations-ID, ohne personenbezogene Daten (REQ-OPS-002) |

Metriken enthalten keine personenbezogenen Daten (keine Nutzer-IDs als Label).

## Alarmregeln

Die Regeln liegen in `ops/prometheus/alerts.yml` (Tests: `ops/prometheus/alerts.test.yml`, geprüft in CI mit `promtool test rules`) und werden von Prometheus ausgewertet; Alertmanager (`ops/alertmanager/alertmanager.yml`) verschickt die Alarme im Beispiel per Mail an Mailpit. Jede Regel trägt einen Runbook-Link.

| Alarm | Bedingung | Dauer | Schweregrad | Bezug |
|---|---|---|---|---|
| `AppDown` | `up{job="campusmarkt"} == 0` | 2 min | SEV-1 | REQ-OPS-001 |
| `NotReady` | `app_ready == 0` (Readiness meldet „nicht bereit“) | 5 min | SEV-1 | REQ-OPS-001 |
| `HighErrorRate` | Anteil 5xx an allen Anfragen > 5 % | 5 min | SEV-2 | REQ-AVAIL-001 |
| `SlowSearch` | p95 von `GET /api/v1/listings` > 500 ms | 10 min | SEV-3 | QS-7, REQ-PERF-001 |
| `JobFailures` | fehlgeschlagene Jobs > 0 in den letzten 15 min (z. B. Mailversand) | sofort | SEV-3 | QS-3, REQ-NOTI-005 |
| `WebSocketDrop` | `ws_connections` fällt um > 80 % gegenüber vor 5 min; nur wenn vorher ≥ 5 Verbindungen bestanden (sonst alarmiert die Demo dauernd) | sofort | SEV-2 | QS-4, REQ-CHAT-003 |
| `MaintenanceModeOn` | `campusmarkt_maintenance_mode == 1` | 2 h | SEV-3 | REQ-OPS-006 |
| `BackupMissing` | letzte erfolgreiche Sicherung älter als 26 h (bzw. noch nie gesichert) | sofort | SEV-2 | REQ-AVAIL-003 |

Schwellwerte sind Beispielwerte und werden nach den ersten Betriebswochen angepasst.

## Eskalation

| Schweregrad | Wer wird benachrichtigt | Reaktionszeit (Beispiel) |
|---|---|---|
| SEV-1 (Plattform nicht nutzbar) | Mail an `[Platzhalter: rufbereitschaft@campusmarkt.example]` mit Erinnerung alle 30 min; im Echtbetrieb zusätzlich [Platzhalter: Telefon/Messenger] | 30 min, auch außerhalb der Dienstzeit [Platzhalter: Vereinbarung] |
| SEV-2 (wichtige Funktion gestört) | Mail an `[Platzhalter: betrieb@campusmarkt.example]`, Erinnerung alle 4 h | nächster Werktag, 4 h in der Dienstzeit |
| SEV-3 (Beeinträchtigung) | Mail an `[Platzhalter: betrieb@campusmarkt.example]`, Erinnerung alle 4 h | im wöchentlichen Review |

Gruppiert wird nach Alarmname (Wartezeit 30 s, Abstand 5 min); behobene Alarme werden ebenfalls gemeldet.

Bei Alarm: [Incident-Prozess](incident-prozess.md); bei Verdacht auf Datenabfluss zusätzlich [Datenpannen-Prozess](../06-recht/datenpannen-prozess.md).

## Starten im Beispiel

`docker compose --profile monitoring up -d` – Prometheus unter `http://127.0.0.1:9090`, Alertmanager unter `http://127.0.0.1:9093` (nur lokal gebunden, Ports über `PROMETHEUS_PORT` und `ALERTMANAGER_PORT` änderbar), Alarm-Mails in Mailpit.

**Alarmübung (MAN-OPS-008):** `docker compose stop app` → nach etwa 2–3 min Mail „[FIRING:1] AppDown … SEV-1“ in Mailpit (lokal gemessen: 184 s, Ziel ≤ 5 min); danach `docker compose start app` und Entwarnung prüfen.
