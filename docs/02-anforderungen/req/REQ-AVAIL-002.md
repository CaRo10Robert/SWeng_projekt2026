---
id: REQ-AVAIL-002
title: Wiederherstellungsziele der Datenhaltung
type: operational
class: quality
status: in-review
owner: team-plattform
risk: medium
release: R1
moscow: W
kano: n/a
epic: EPIC-12
source: Guideline Kap. 01
version: 2.0
created: 2026-10-20
last_updated: 2026-10-23
verification: [MAN-AVAIL-002]
---

# REQ-AVAIL-002 Wiederherstellungsziele der Datenhaltung
## Anforderung
Im Echtbetrieb müssen Datenverluste und Ausfallzeiten nach einem Datenbankausfall begrenzt sein.

**N/A im Docker-Beispiel → EPIC-12.** Die Daten des Beispiels sind über den Seed reproduzierbar.

## Begründung
Guideline Kap. 01: RTO und RPO sind für zustandsbehaftete Dienste Pflicht; im Projekt ohne Betrieb nicht anwendbar.

## Qualitätsmerkmal, Metrik, Messverfahren
| Feld | Festlegung |
|---|---|
| Qualitätsmerkmal (ISO 25010) | Reliability → Recoverability |
| Metrik | Recovery Point Objective (RPO) und Recovery Time Objective (RTO) |
| Akzeptanzkriterium | **RPO ≤ 1 h**, **RTO ≤ 4 h** |
| Messverfahren | Halbjährliche Restore-Übung aus Backup mit Point-in-Time-Recovery |
| Messkontext | Echtbetrieb (EPIC-12) |
| Verhalten bei Verfehlung | Incident mit Nachbereitung, Anpassung des Backup-Konzepts |

## Nachweis
- `MAN-AVAIL-002`: Protokoll der Restore-Übung (erst im Echtbetrieb).


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 2.0 | 2026-10-23 | Merkmal/Metrik/Messverfahren ergänzt; als N/A für das Beispiel markiert |
