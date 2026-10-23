---
id: REQ-PORT-001
title: Entwicklungsumgebung mit einem Befehl
type: quality
class: quality
status: implemented
owner: team-plattform
risk: low
release: R1
moscow: M
kano: n/a
epic: EPIC-00
source: Guideline Kap. 05
version: 2.0
created: 2026-10-20
last_updated: 2026-10-23
verification: [MAN-PORT-001]
---

# REQ-PORT-001 Entwicklungsumgebung mit einem Befehl
## Anforderung
Eine lokale Entwicklungsumgebung muss mit einem Befehl startbar sein und dieselben unterstützenden Dienste in denselben Versionen nutzen wie Tests und Docker-Beispiel.

## Begründung
Dev/Prod-Parität (Twelve-Factor, Guideline Kap. 05); schnelles Onboarding im Studienteam.

## Qualitätsmerkmal, Metrik, Messverfahren
| Feld | Festlegung |
|---|---|
| Qualitätsmerkmal (ISO 25010) | Flexibility → Installability; Maintainability |
| Metrik | (1) Zeit vom Klonen bis zur laufenden Entwicklungsumgebung; (2) Versionsgleichheit der Datenbank in Entwicklung, CI und Beispiel |
| Akzeptanzkriterium | (1) **≤ 15 min** für eine teamfremde Person nach README; (2) identisches Datenbank-Image |
| Messverfahren | Onboarding-Test mit einer teamfremden Person und Stoppuhr; Vergleich der Image-Tags in `compose.yaml` und `compose.dev.yaml` |
| Messkontext | Rechner mit Docker Desktop, Node.js 22, Internetzugang für die Erstinstallation |
| Verhalten bei Verfehlung | README und Skripte werden nachgebessert |

## Nachweis
- `MAN-PORT-001`: Protokoll des Onboarding-Tests.


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 2.0 | 2026-10-23 | Merkmal/Metrik/Akzeptanzkriterium/Messverfahren getrennt (Fallstudie FS-M3) |
