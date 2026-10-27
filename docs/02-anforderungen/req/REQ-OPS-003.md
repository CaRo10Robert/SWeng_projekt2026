---
id: REQ-OPS-003
title: Schnellstart und Fehlerbehebung dokumentiert
type: operational
class: quality
status: verified
owner: team-plattform
risk: low
reviewers: [qa-lead]
release: R1
moscow: M
moscow_reason: [1]
kano: n/a
epic: EPIC-00
source: BG-6
version: 2.3
created: 2026-10-20
last_updated: 2026-10-26
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
| Metrik | (a) Dauer des Image-Builds aus einem frischen Klon; (b) Zeit vom Start (`docker compose up` ohne Build) bis zur Anmeldung mit einem Demo-Konto; (c) Anzahl Rückfragen einer teamfremden Person |
| Akzeptanzkriterium | (a) **≤ 10 min** mit Internetzugang; (b) **≤ 3 min** offline nach dem Build (QS-9); (c) **0** Rückfragen |
| Messverfahren | Onboarding-Test nach README mit Stoppuhr in zwei Messungen: (a) `docker compose build` nach dem Klonen; (b) danach Netzwerk trennen, `docker compose up`, Anmeldung mit Demo-Konto |
| Messkontext | Rechner mit Docker (4 Kerne, 16 GB RAM), Person ohne Vorkenntnisse zum Projekt; (a) mit, (b) ohne Internetzugang |
| Verhalten bei Verfehlung | README wird nachgebessert |

## Nachweis
- `MAN-OPS-003`: Protokoll des Onboarding-Tests – [MAN-OPS-003](../../05-umsetzung/nachweise/MAN-OPS-003.md) (simuliert: frischer Clone, nur README-Schritte, 1 min 16 s bis zur Anmeldung mit vorhandenem Build-Cache).


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 2.0 | 2026-10-23 | Merkmal/Metrik/Akzeptanzkriterium/Messverfahren getrennt (Fallstudie FS-M3) |
| 2.1 | 2026-10-23 | Review v0.2: R-23 (zwei Zielwerte: Build ≤ 10 min online, Start bis Login ≤ 3 min offline), R-15 |
| 2.2 | 2026-10-26 | Nachweis MAN-OPS-003 mit Protokoll verlinkt |
| 2.3 | 2026-10-26 | Verifiziert im finalen Lauf gegen das Docker-Beispiel (MAN-OPS-003 bestanden bzw. ausgeführt); Status → verified |
