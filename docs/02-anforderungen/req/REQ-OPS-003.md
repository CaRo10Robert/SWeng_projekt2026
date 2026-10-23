---
id: REQ-OPS-003
title: Schnellstart und Fehlerbehebung dokumentiert
type: operational
class: quality
status: implemented
owner: team-plattform
risk: low
release: R1
moscow: M
kano: n/a
epic: EPIC-00
source: BG-6
version: 2.0
created: 2026-10-20
last_updated: 2026-10-23
verification: [MAN-OPS-003]
---

# REQ-OPS-003 Schnellstart und Fehlerbehebung dokumentiert
## Anforderung
Die Projektdokumentation muss den Start des Beispiels, die Demo-Konten und die Behebung typischer Probleme (Port belegt, Prozessorarchitektur, Browser-Cookies, Zurücksetzen) so beschreiben, dass eine teamfremde Person ohne Hilfe zurechtkommt. Betriebshandbücher für den Echtbetrieb sind N/A (EPIC-12).

## Begründung
Vorführbarkeit (BG-6, QS-9).

## Qualitätsmerkmal, Metrik, Messverfahren
| Feld | Festlegung |
|---|---|
| Qualitätsmerkmal (ISO 25010) | Interaction Capability → Learnability; Flexibility → Installability |
| Metrik | Zeit und Anzahl Rückfragen einer teamfremden Person vom Klonen bis zur Anmeldung mit einem Demo-Konto |
| Akzeptanzkriterium | **≤ 3 min** nach dem Image-Build (QS-9), **0** Rückfragen |
| Messverfahren | Onboarding-Test nach README mit Stoppuhr |
| Messkontext | Rechner mit Docker, ohne Vorkenntnisse zum Projekt |
| Verhalten bei Verfehlung | README wird nachgebessert |

## Nachweis
- `MAN-OPS-003`: Protokoll des Onboarding-Tests.


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 2.0 | 2026-10-23 | Merkmal/Metrik/Akzeptanzkriterium/Messverfahren getrennt (Fallstudie FS-M3) |
