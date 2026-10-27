---
id: REQ-PERF-003
title: Antwortzeit beim Erstellen einer Anzeige
type: quality
class: quality
status: approved
owner: team-plattform
risk: low
reviewers: [qa-lead]
release: R1
moscow: M
moscow_reason: [1]
kano: leistung
epic: EPIC-02
source: BG-2
use_cases: [UC-10]
depends_on: [REQ-LST-001]
version: 2.2
created: 2026-10-20
last_updated: 2026-10-26
verification: [AT-PERF-003]
---

# REQ-PERF-003 Antwortzeit beim Erstellen einer Anzeige
## Anforderung
Das Speichern einer Anzeige muss ohne spürbare Wartezeit bestätigt werden; die Bildverarbeitung darf das Speichern nicht verzögern.

## Begründung
Ziel „Anzeige in unter 2 Minuten“ (REQ-LST-001, BG-2).

## Qualitätsmerkmal, Metrik, Messverfahren
| Feld | Festlegung |
|---|---|
| Qualitätsmerkmal (ISO 25010) | Performance Efficiency → Time Behaviour |
| Metrik (SLI) | Serverseitige Antwortzeit beim Anlegen einer Anzeige (ohne Upload der Bilddateien), HTTP 2xx |
| Akzeptanzkriterium (SLO) | **p95 < 800 ms** |
| Messverfahren | k6-Lasttest, 5 min, angemeldete Testkonten, Anzeigen mit 0–8 bereits hochgeladenen Bildern |
| Messkontext | Docker-Beispiel, **2 Anfragen/s**, Seed mit 10.000 Anzeigen, Referenzrechner 4 Kerne / 16 GB |
| Degradation | Bilder erscheinen verzögert mit Platzhalter; die Anzeige selbst ist sofort gespeichert |
| Fehlerbudget | 0 % 5xx im Lasttest; höchstens 5 % über 800 ms |
| Last- und Datenprofil | Anzeigen mit 0–8 bereits hochgeladenen Bildern; Bildverarbeitung asynchron und nicht Teil der Messung |
| Timeout, Retry, Idempotenz | Statement-Timeout 10 s; Anlegen wird vom Client nicht automatisch wiederholt (Mutation); Bildverarbeitung als Job mit 2 Wiederholungen |
| Wiederherstellung | Anzeige und Bilder werden gesichert (REQ-AVAIL-003) |
| Verantwortung und Eskalation | Service-Owner team-plattform; Eskalation über den Incident-Prozess (`docs/07-betrieb/incident-prozess.md`), Rufbereitschaft im Echtbetrieb (fiktiv) |

## Nachweis
- `AT-PERF-003`: k6-Lasttest „Anzeige erstellen“ (neu zu schreiben; Umsetzungsstand ⬜).


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 2.0 | 2026-10-23 | Merkmal/Metrik/Akzeptanzkriterium/Messverfahren getrennt (Fallstudie FS-M3) |
| 2.1 | 2026-10-23 | Review v0.2: R-15 |
| 2.2 | 2026-10-26 | Guideline-Review: GL-10 Felder aus der NFR-/SLO-Vorlage ergänzt (Fehlerbudget, Lastprofil, Timeout/Retry, Wiederherstellung, Eskalation) |
