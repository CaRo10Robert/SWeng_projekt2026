---
id: REQ-AVAIL-001
title: Verfügbarkeit der kritischen Funktionen
type: quality
class: quality
status: in-review
owner: team-plattform
risk: medium
release: R1
moscow: W
kano: basis
epic: EPIC-12
source: BG-6
version: 2.0
created: 2026-10-20
last_updated: 2026-10-23
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

## Nachweis
- `AT-AVAIL-001`: Auswertung der Fehlerquote in den k6-Lasttests (neu zu schreiben).


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 2.0 | 2026-10-23 | Merkmal/Metrik/Akzeptanzkriterium/Messverfahren getrennt; Projektkriterium festgelegt |
