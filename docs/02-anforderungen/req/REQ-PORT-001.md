---
id: REQ-PORT-001
title: Entwicklungsumgebung mit einem Befehl
type: quality
class: quality
status: implemented
owner: team-plattform
risk: low
reviewers: [qa-lead]
release: R1
moscow: S
kano: n/a
epic: EPIC-00
source: Guideline Kap. 05
version: 2.2
created: 2026-10-20
last_updated: 2026-10-26
verification: [MAN-PORT-001]
---

# REQ-PORT-001 Entwicklungsumgebung mit einem Befehl
## Anforderung
Eine lokale Entwicklungsumgebung muss mit einem Befehl startbar sein und dieselben unterstützenden Dienste in denselben Versionen nutzen wie Tests und Docker-Beispiel.

## Begründung
Dev/Prod-Parität (Twelve-Factor, Guideline Kap. 05); schnelles Onboarding im Studienteam.

**MoSCoW:** Should statt Must (Review v0.2, R-15): Betrifft nur die Entwicklungsumgebung; Release-Ziel, Sicherheit, Betreibbarkeit des Beispiels und Verpflichtungen hängen nicht davon ab. Die Gleichheit des Datenbank-Images bleibt trotzdem geprüft.

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
- `MAN-PORT-001`: Protokoll des Onboarding-Tests – [MAN-PORT-001](../../05-umsetzung/nachweise/MAN-PORT-001.md) (simuliert, 3 min 25 s). Die Befunde (feste Ports in `compose.dev.yaml`, Dev-Proxy ohne `.env`) sind behoben: Ports nur an 127.0.0.1 und per `DEV_DB_PORT`, `DEV_SMTP_PORT`, `DEV_MAILPIT_PORT` änderbar; Vite liest `VITE_API_TARGET` bzw. den `PORT` des Servers aus `.env`.


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 2.0 | 2026-10-23 | Merkmal/Metrik/Akzeptanzkriterium/Messverfahren getrennt (Fallstudie FS-M3) |
| 2.1 | 2026-10-23 | Review v0.2: R-15 (Must → Should) |
| 2.2 | 2026-10-26 | Nachweis MAN-PORT-001 mit Protokoll verlinkt; Port-Befunde behoben |
