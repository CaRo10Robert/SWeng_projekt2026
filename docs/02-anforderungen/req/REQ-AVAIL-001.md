---
id: REQ-AVAIL-001
title: Verfügbarkeit der kritischen Funktionen
type: quality
class: quality
status: approved
owner: team-plattform
risk: medium
reviewers: [qa-lead]
release: R1
moscow: W
kano: basis
epic: EPIC-12
source: BG-6
version: 2.3
created: 2026-10-20
last_updated: 2026-10-26
verification: [AT-AVAIL-001]
---

# REQ-AVAIL-001 Verfügbarkeit der kritischen Funktionen
## Anforderung
Die kritischen Funktionen (Registrieren/Anmelden, Suchen, Anzeige erstellen, Nachricht senden) müssen im Echtbetrieb zuverlässig erreichbar sein.

**N/A im Docker-Beispiel → EPIC-12.** Im Projekt gilt nur das Lasttest-Kriterium unten.

## Begründung
Ohne Echtbetrieb gibt es keine Felddaten; die Anforderung bleibt für EPIC-12 erhalten (Guideline: N/A nie stillschweigend).

## Qualitätsmerkmal, Metrik, Messverfahren
| Feld | Festlegung |
|---|---|
| Qualitätsmerkmal (ISO 25010) | Reliability → Availability |
| Metrik (SLI) | Anteil erfolgreicher Antworten (kein 5xx) an allen Anfragen der kritischen Endpunkte |
| Akzeptanzkriterium (SLO) | Echtbetrieb: **≥ 99,5 %** über 28 Tage. Projekt: **0 % 5xx** während der Lasttests REQ-PERF-001 bis -004 |
| Messverfahren | Echtbetrieb: Metriken `/metrics` mit Alarmierung. Projekt: Auswertung der k6-Reports |
| Messkontext | Echtbetrieb (EPIC-12); Projekt: Docker-Beispiel wie in REQ-PERF-001 |
| Degradation | Suche auf Titelsuche, Chat auf Polling (REQ-PERF-001/002) |
| Fehlerbudget | Echtbetrieb: 0,5 % fehlgeschlagene Anfragen in 28 Tagen (etwa 3,6 h Ausfall); angekündigte Wartung zählt nicht. Bei aufgebrauchtem Budget nur noch Fehlerbehebungen |
| Last- und Datenprofil | wie REQ-PERF-001 bis -004 |
| Timeout, Retry, Idempotenz | DB-Verbindungs-Timeout 5 s, Statement-Timeout 10 s; Client-Wiederholung nur für GET; Schreibvorgänge idempotent, wo der Client wiederholt (Nachrichten) |
| Wiederherstellung | siehe REQ-AVAIL-002 (Echtbetrieb) und REQ-AVAIL-003 (Docker-Beispiel) |
| Verantwortung und Eskalation | Service-Owner team-plattform; Eskalation über den Incident-Prozess (`docs/07-betrieb/incident-prozess.md`), Rufbereitschaft im Echtbetrieb (fiktiv) |

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Datenbank nicht erreichbar | App läuft weiter, `/health/ready` 503, Statusseite meldet Störung, Rechtsseiten erreichbar (AT-OPS-001-3); Alarm `NotReady` |
| Mail-Relay nicht erreichbar | Versand-Jobs mit Wiederholung (120 s × 4, ADR-0005), danach Dead Letter (CTRL-DLQ); Registrierung bleibt möglich, Bestätigung kann erneut angefordert werden |
| Echtzeitverbindung bricht ab | automatische Wiederverbindung, Polling als Rückfall; keine Nachricht geht verloren (idempotent über `clientMsgId`) |
| Überlast oder Missbrauch | Rate-Limits mit 429 und `Retry-After` (REQ-SEC-005); Upload-Quote je Mitglied |
| Geplante Wartung | Wartungsmodus mit 503 und `Retry-After` (REQ-OPS-006); zählt im Echtbetrieb nicht gegen das Fehlerbudget, wenn angekündigt |
| Fehlerhaftes Release | Rollback auf das vorherige Image-Tag, Migrationen additiv (REQ-OPS-005); im Echtbetrieb EPIC-12 |

## Nachweis
- `AT-AVAIL-001`: Auswertung der Fehlerquote in den k6-Lasttests (neu zu schreiben).


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 2.0 | 2026-10-23 | Merkmal/Metrik/Akzeptanzkriterium/Messverfahren getrennt; Projektkriterium festgelegt |
| 2.1 | 2026-10-23 | Review v0.2: Status nach Review |
| 2.2 | 2026-10-26 | Guideline-Review: GL-05 Fehler- und Missbrauchsfälle ergänzt |
| 2.3 | 2026-10-26 | Guideline-Review: GL-10 Felder aus der NFR-/SLO-Vorlage ergänzt (Fehlerbudget, Lastprofil, Timeout/Retry, Wiederherstellung, Eskalation) |
