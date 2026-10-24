---
id: REQ-OPS-008
title: Überwachung und Alarmierung
type: operational
class: quality
status: approved
owner: team-plattform
risk: medium
reviewers: [qa-lead]
release: R1
moscow: S
kano: n/a
epic: EPIC-13
source: Guideline Kap. 11, Q-27
depends_on: [REQ-OPS-002]
version: 1.1
created: 2026-10-24
last_updated: 2026-10-24
verification: [CTRL-ALERT-RULES, MAN-OPS-008]
---

# REQ-OPS-008 Überwachung und Alarmierung
## Anforderung
Der Betrieb muss bei Ausfällen und Grenzwertverletzungen automatisch per E-Mail alarmiert werden; jede Alarmregel verweist auf eine Handlungsanleitung (Runbook).

## Begründung
Metriken (`/metrics`, REQ-OPS-002) ohne Alarmierung werden erst bemerkt, wenn Nutzer sich beschweren. Im Docker-Beispiel als optionales Profil `monitoring` (Q-27), Alarme gehen an Mailpit.

## Qualitätsmerkmal, Metrik, Messverfahren
| Feld | Festlegung |
|---|---|
| Qualitätsmerkmal (ISO 25010) | Reliability → Availability, Recoverability |
| Metrik | (1) Abgedeckte Störungsarten; (2) Zeit von Störungsbeginn bis Alarm-E-Mail |
| Akzeptanzkriterium | (1) Regeln für: Anwendung nicht erreichbar ≥ 2 min (`AppDown`), Bereitschaft „nicht bereit“ ≥ 5 min (`NotReady`), Anteil 5xx > 5 % über 5 min (`HighErrorRate`), p95 der Suche über dem Ziel aus REQ-PERF-001 (500 ms) über 10 min (`SlowSearch`), fehlgeschlagene Jobs inkl. E-Mail-Versand > 0 in 15 min (`JobFailures`), Einbruch der WebSocket-Verbindungen (`WebSocketDrop`), Wartungsmodus > 2 h (`MaintenanceModeOn`), letzte Sicherung älter als 26 h (`BackupMissing`); Schwellwerte siehe `docs/07-betrieb/monitoring-alarmierung.md`; (2) **≤ 5 min** von Störungsbeginn bis Mail |
| Messverfahren | (1) Prüfung von Konfiguration und Regeln mit `promtool check config` und Regeltests mit `promtool test rules` (`ops/prometheus/alerts.test.yml`) sowie `amtool check-config` in CI (Job `ops-config`); (2) Alarmübung: App-Container stoppen, Zeit bis zur Mail in Mailpit messen (lokal gemessen: 184 s) |
| Messkontext | `docker compose --profile monitoring up` |
| Verhalten bei Verfehlung | Regel oder Schwelle im nächsten Sprint anpassen |

## Nachweis
- `CTRL-ALERT-RULES`: CI-Kontrolle (Job `ops-config`) – `promtool check config`, `promtool test rules`, `amtool check-config`; jede Regel mit Annotation `runbook_url`.
- `MAN-OPS-008`: Protokoll der Alarmübung (App gestoppt → Mail in Mailpit ≤ 5 min).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-24 | Erstfassung aus dem Abgleich Recht, Auftritt und Betrieb ([06-abgleich-recht-betrieb.md](../06-abgleich-recht-betrieb.md)); als Übung mit Platzhaltern freigegeben (Q-23) |
| 1.1 | 2026-10-24 | Angleichung an die Umsetzung (B-54): Alarmnamen und Dauern aus `ops/prometheus/alerts.yml` (AppDown 2 min, NotReady 5 min, JobFailures statt Dead-Letter-Queue), zusätzliche Regeln WebSocketDrop, MaintenanceModeOn, BackupMissing; Regeltests in CI |
