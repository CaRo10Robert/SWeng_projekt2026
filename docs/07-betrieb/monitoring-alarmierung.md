---
id: OPS-MONITORING
type: operational
status: in-review
owner: architecture-lead
version: 1.0
created: 2026-10-24
last_updated: 2026-10-24
---

# Überwachung und Alarmierung

> **Muster im Rahmen einer Übungsaufgabe.** Anforderung: REQ-OPS-008; optionales Compose-Profil `monitoring` (Q-27, ADR-0017).

## Quellen

| Quelle | Inhalt |
|---|---|
| `/metrics` (Prometheus-Format) | `http_request_duration_seconds` (Histogramm je Route und Status), `ws_connections`, `jobs_processed_total` sowie Prozessmetriken (CPU, Speicher, Event-Loop) |
| `/health/live`, `/health/ready` | Prozess lebt; Datenbank erreichbar und Migrationen fertig |
| Protokolle (JSON) | Fehler mit Korrelations-ID, ohne personenbezogene Daten (REQ-OPS-002) |

Metriken enthalten keine personenbezogenen Daten (keine Nutzer-IDs als Label).

## Alarmregeln

Die Regeln liegen im Repo (Profil `monitoring`) und werden von Prometheus ausgewertet; Alertmanager verschickt die Alarme im Beispiel per Mail an Mailpit.

| Alarm | Bedingung | Dauer | Schweregrad | Bezug |
|---|---|---|---|---|
| `AppDown` | `up{job="campusmarkt"} == 0` | 2 min | SEV-1 | REQ-OPS-001 |
| `NotReady` | Readiness meldet `not_ready` | 5 min | SEV-1 | REQ-OPS-001 |
| `HighErrorRate` | Anteil 5xx an allen Anfragen > 5 % | 5 min | SEV-2 | REQ-AVAIL-001 |
| `SlowSearch` | p95 der Suche > 500 ms | 10 min | SEV-3 | QS-7, REQ-PERF-001 |
| `JobFailures` | fehlgeschlagene Jobs > 0 in 15 min (z. B. Mailversand) | 15 min | SEV-3 | QS-3, REQ-NOTI-005 |
| `WebSocketDrop` | `ws_connections` fällt um > 80 % in 5 min | 5 min | SEV-2 | QS-4, REQ-CHAT-003 |
| `MaintenanceModeOn` | Wartungsmodus länger als geplant aktiv | 2 h | SEV-3 | REQ-OPS-006 |
| `BackupMissing` | letzte erfolgreiche Sicherung älter als 26 h | – | SEV-2 | REQ-AVAIL-003 |

Schwellwerte sind Beispielwerte und werden nach den ersten Betriebswochen angepasst.

## Eskalation

| Schweregrad | Wer wird benachrichtigt | Reaktionszeit (Beispiel) |
|---|---|---|
| SEV-1 (Plattform nicht nutzbar) | Rufbereitschaft per [Platzhalter: Telefon/Messenger], zusätzlich Mail | 30 min, auch außerhalb der Dienstzeit [Platzhalter: Vereinbarung] |
| SEV-2 (wichtige Funktion gestört) | Betriebsteam per Mail | nächster Werktag, 4 h in der Dienstzeit |
| SEV-3 (Beeinträchtigung) | Betriebsteam per Mail | im wöchentlichen Review |

Bei Alarm: [Incident-Prozess](incident-prozess.md); bei Verdacht auf Datenabfluss zusätzlich [Datenpannen-Prozess](../06-recht/datenpannen-prozess.md).

## Starten im Beispiel

`docker compose --profile monitoring up -d` – Prometheus unter `http://localhost:9090`, Alertmanager unter `http://localhost:9093`, Alarm-Mails in Mailpit.
