---
id: REQ-OPS-004
title: Reproduzierbarer, versionierter Image-Build
type: operational
class: quality
status: verified
owner: team-plattform
risk: medium
reviewers: [qa-lead]
release: R1
moscow: M
moscow_reason: [3]
kano: n/a
epic: EPIC-00
source: Guideline Kap. 10
version: 2.4
created: 2026-10-20
last_updated: 2026-10-25
verification: [CTRL-CI-IMAGE]
---

# REQ-OPS-004 Reproduzierbarer, versionierter Image-Build
## Anforderung
Das Anwendungs-Image muss automatisch und reproduzierbar gebaut und mit einer semantischen Versionsnummer versehen werden. Die Abgabe erfolgt als Quellcode mit lokalem Build (`docker compose up --build`); zusätzlich kann ein mit `docker save` erzeugtes Image-Archiv beigelegt werden. Die Veröffentlichung in einer Container-Registry ist **optional** und für Prüfer/innen nicht erforderlich (Entscheidungslog Q-19, C-06).

## Begründung
„Build once, promote the image“ (Guideline Kap. 10); Prüfer/innen können eine definierte Version starten.

## Qualitätsmerkmal, Metrik, Messverfahren
| Feld | Festlegung |
|---|---|
| Qualitätsmerkmal (ISO 25010) | Flexibility → Installability; Maintainability |
| Metrik | (1) Anteil der Releases mit automatisch gebautem, SemVer-getaggtem Image und Image-Archiv; (2) Erfolgsquote des Builds aus einem sauberen Checkout |
| Akzeptanzkriterium | (1) **100 %**; (2) **100 %** mit gesperrten Abhängigkeitsversionen (Lockfile) |
| Messverfahren | CI-Pipeline-Auswertung: Build aus sauberem Checkout, Tag nach SemVer, Archiv als CI-Artefakt; Push in eine Registry nur optional |
| Messkontext | CI bei jedem Tag `v*` |
| Verhalten bei Verfehlung | Kein Release |

## Nachweis
- `CTRL-CI-IMAGE`: CI-Job `compose` baut das Image aus sauberem Checkout, taggt es mit der Version aus `package.json` (`campusmarkt:<version>`) und legt das `docker save`-Archiv `campusmarkt-<version>.tar.gz` für 7 Tage als Artefakt ab (umgesetzt 2026-10-24).


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 2.0 | 2026-10-23 | Merkmal/Metrik/Akzeptanzkriterium/Messverfahren getrennt (Fallstudie FS-M3) |
| 2.1 | 2026-10-23 | Review v0.2: R-32 (Registry optional, Abgabe als Quellcode bzw. Archiv; Q-19), R-15 |
| 2.2 | 2026-10-23 | Umgesetzt (Schritt 6): GitHub-Actions-Workflow .github/workflows/ci.yml (Prüfungen, Diagramme, Compose mit E2E und Smoke); Status → implemented |
| 2.3 | 2026-10-24 | Nachweis CTRL-CI-IMAGE im CI-Workflow umgesetzt (Tag aus package.json, Archiv als Artefakt) |
| 2.4 | 2026-10-25 | Verifiziert im finalen Lauf gegen das Docker-Beispiel (CTRL-CI-IMAGE bestanden bzw. ausgeführt); Status → verified |
