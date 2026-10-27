---
id: REQ-OPS-008
title: Überwachung und Alarmierung
type: operational
class: quality
status: verified
owner: team-plattform
risk: medium
reviewers: [qa-lead]
release: R1
moscow: S
kano: n/a
epic: EPIC-13
source: Guideline Kap. 11, Q-27
depends_on: [REQ-OPS-002]
version: 1.6
created: 2026-10-24
last_updated: 2026-10-26
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
| Akzeptanzkriterium | (1) Regeln für: Anwendung nicht erreichbar ≥ 2 min (`AppDown`), Bereitschaft „nicht bereit“ ≥ 5 min (`NotReady`), Anteil 5xx > 5 % über 5 min bei mindestens 0,1 Anfragen/s und nicht im Wartungsmodus (`HighErrorRate`), p95 der Suche über dem Ziel aus REQ-PERF-001 (500 ms) über 10 min (`SlowSearch`), endgültig gescheiterte Jobs inkl. E-Mail-Versand (Ausgang `dead`) > 0 in 15 min (`JobFailures`), Einbruch der WebSocket-Verbindungen (`WebSocketDrop`), Wartungsmodus > 2 h (`MaintenanceModeOn`), letzte Sicherung älter als 26 h; nicht lesbarer Wert (NaN) löst nichts aus, „nie gesichert“ (0) erst nach 26 h Laufzeit (`BackupMissing`); Folgealarme werden unterdrückt, solange `AppDown` oder `NotReady` feuern (`inhibit_rules`); Schwellwerte siehe `docs/07-betrieb/monitoring-alarmierung.md`; (2) **≤ 5 min** von Störungsbeginn bis Mail |
| Messverfahren | (1) Prüfung von Konfiguration und Regeln mit `promtool check config` und Regeltests mit `promtool test rules` (`ops/prometheus/alerts.test.yml`) sowie `amtool check-config` in CI (Job `ops-config`); (2) Alarmübung: App-Container stoppen, Zeit bis zur Mail in Mailpit messen (lokal gemessen: 184 s) |
| Messkontext | `docker compose --profile monitoring up` |
| Verhalten bei Verfehlung | Regel oder Schwelle im nächsten Sprint anpassen |
| Fehlerbudget | Fehlalarme höchstens 1 je Woche; kein Ausfall über 5 min ohne Alarm |
| Last- und Datenprofil | Abfrage alle 15 s, Regelauswertung alle 15 s |
| Timeout, Retry, Idempotenz | Alertmanager wiederholt Benachrichtigungen (SEV-1 häufiger) und gruppiert; Entwarnung bis zu 5 min verzögert (`group_interval`) |
| Wiederherstellung | Überwachung ist zustandsarm; Verlust der Prometheus-Daten betrifft nur die Historie |
| Verantwortung und Eskalation | Service-Owner team-plattform; Eskalation über den Incident-Prozess (`docs/07-betrieb/incident-prozess.md`), Rufbereitschaft im Echtbetrieb (fiktiv) |

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Alertmanager oder Mail-Relay ausgefallen | keine Alarm-Mail; im Beispiel nicht überwacht. Im Echtbetrieb Dead-Man-Switch („Watchdog“-Alarm an einen externen Dienst, EPIC-12) |
| Prometheus ausgefallen | keine Auswertung, keine Alarme; Docker-Healthcheck der App bleibt unabhängig davon |
| Alarmflut bei Totalausfall | Gruppierung und `inhibit_rules`: bei `AppDown`/`NotReady` keine Folgealarme |
| Fehlalarme während geplanter Wartung | `HighErrorRate` ist im Wartungsmodus ausgeschlossen; `MaintenanceModeOn` informiert |
| Alarm ohne Handlungsanweisung | jede Regel hat `runbook_url` auf einen eigenen Abschnitt im Betriebshandbuch; `promtool test rules` in CI |
| Neue Zeitreihe ohne Werte | Zähler werden mit 0 vorbelegt, damit `increase()` die erste Fehlerserie erkennt |

## Nachweis
- `CTRL-ALERT-RULES`: CI-Kontrolle (Job `ops-config`) – `promtool check config`, `promtool test rules`, `amtool check-config`; jede Regel mit Annotation `runbook_url`.
- `MAN-OPS-008`: Protokoll der Alarmübung (App gestoppt → Mail in Mailpit ≤ 5 min) – [MAN-OPS-008](../../05-umsetzung/nachweise/MAN-OPS-008.md): AppDown-Mail nach 196 s, Entwarnung nach 295 s (bis zu 5 min Verzögerung durch `group_interval`). Alarm-Links zeigen dank `--web.external-url` auf die lokal erreichbaren Adressen.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-24 | Erstfassung aus dem Abgleich Recht, Auftritt und Betrieb ([06-abgleich-recht-betrieb.md](../06-abgleich-recht-betrieb.md)); als Übung mit Platzhaltern freigegeben (Q-23) |
| 1.1 | 2026-10-24 | Angleichung an die Umsetzung (B-54): Alarmnamen und Dauern aus `ops/prometheus/alerts.yml` (AppDown 2 min, NotReady 5 min, JobFailures statt Dead-Letter-Queue), zusätzliche Regeln WebSocketDrop, MaintenanceModeOn, BackupMissing; Regeltests in CI |
| 1.2 | 2026-10-25 | Review v1.3 (RV-A-04, RV-A-05, RV-A-18): Wartungsausschluss und Mindestlast, JobFailures nur dead, BackupMissing ohne Fehlalarme, Inhibit-Regeln; Status nach Umsetzung |
| 1.3 | 2026-10-26 | Nachweis MAN-OPS-008 mit Protokoll verlinkt; Entwarnungsverzögerung und external-url dokumentiert |
| 1.4 | 2026-10-26 | Verifiziert im finalen Lauf gegen das Docker-Beispiel (CTRL-ALERT-RULES, MAN-OPS-008 bestanden bzw. ausgeführt); Status → verified |
| 1.5 | 2026-10-26 | Guideline-Review: GL-05 Fehler- und Missbrauchsfälle ergänzt |
| 1.6 | 2026-10-26 | Guideline-Review: GL-10 Felder aus der NFR-/SLO-Vorlage ergänzt (Fehlerbudget, Lastprofil, Timeout/Retry, Wiederherstellung, Eskalation) |
