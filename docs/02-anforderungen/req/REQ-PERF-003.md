---
id: REQ-PERF-003
title: Antwortzeit beim Erstellen einer Anzeige
type: quality
class: quality
status: verified
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
version: 2.3
created: 2026-10-20
last_updated: 2026-11-07
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
- `AT-PERF-003`: k6-Lasttest `tests/load/create-listing.js` (wöchentlich in `ops-weekly.yml`). Messung 2026-11-07, 2 Anfragen/s über 5 min, 10.000 Anzeigen: **p95 19,1 ms** (p99 31,5 ms), 0 % Fehler bei 600 Anfragen. Abweichung vom Messkontext: 12 statt 4 Kerne (Abstand zur Grenze Faktor > 40).


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 2.0 | 2026-10-23 | Merkmal/Metrik/Akzeptanzkriterium/Messverfahren getrennt (Fallstudie FS-M3) |
| 2.1 | 2026-10-23 | Review v0.2: R-15 |
| 2.2 | 2026-10-26 | Guideline-Review: GL-10 Felder aus der NFR-/SLO-Vorlage ergänzt (Fehlerbudget, Lastprofil, Timeout/Retry, Wiederherstellung, Eskalation) |
| 2.3 | 2026-11-07 | AT-PERF-003 umgesetzt (k6) und gemessen: p95 19,1 ms, 0 % Fehler (Testbericht 2026-11-07); Status → verified |
