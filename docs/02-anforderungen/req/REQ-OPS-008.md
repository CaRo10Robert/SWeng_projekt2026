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
version: 1.0
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
| Akzeptanzkriterium | (1) Regeln für: Anwendung nicht erreichbar > 1 min, Bereitschaft „nicht bereit“ > 2 min, Anteil 5xx > 5 % über 5 min, p95-Antwortzeit über dem Ziel aus REQ-PERF-001 über 10 min, Jobs in der Dead-Letter-Queue > 0, fehlgeschlagene E-Mails > 0 über 15 min; (2) **≤ 5 min** |
| Messverfahren | (1) Prüfung der Regeldatei mit `promtool check rules` in CI; (2) Alarmübung: App-Container stoppen, Zeit bis zur Mail in Mailpit messen |
| Messkontext | `docker compose --profile monitoring up` |
| Verhalten bei Verfehlung | Regel oder Schwelle im nächsten Sprint anpassen |

## Nachweis
- `CTRL-ALERT-RULES`: CI-Kontrolle – `promtool check rules` für die Alarmregeln, jede Regel mit Annotation `runbook`.
- `MAN-OPS-008`: Protokoll der Alarmübung (App gestoppt → Mail in Mailpit ≤ 5 min).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-24 | Erstfassung aus dem Abgleich Recht, Auftritt und Betrieb ([06-abgleich-recht-betrieb.md](../06-abgleich-recht-betrieb.md)); als Übung mit Platzhaltern freigegeben (Q-23) |
