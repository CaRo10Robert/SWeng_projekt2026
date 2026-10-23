---
id: REQ-OPS-004
title: Reproduzierbarer, versionierter Image-Build
type: operational
class: quality
status: in-review
owner: team-plattform
risk: medium
release: R1
moscow: M
kano: n/a
epic: EPIC-00
source: Guideline Kap. 10
version: 2.0
created: 2026-10-20
last_updated: 2026-10-23
verification: [CTRL-CI-IMAGE]
---

# REQ-OPS-004 Reproduzierbarer, versionierter Image-Build
## Anforderung
Das Anwendungs-Image muss automatisch und reproduzierbar gebaut und mit einer semantischen Versionsnummer veröffentlicht werden.

## Begründung
„Build once, promote the image“ (Guideline Kap. 10); Prüfer/innen können eine definierte Version starten.

## Qualitätsmerkmal, Metrik, Messverfahren
| Feld | Festlegung |
|---|---|
| Qualitätsmerkmal (ISO 25010) | Flexibility → Installability; Maintainability |
| Metrik | (1) Anteil der Releases mit automatisch gebautem und getaggtem Image; (2) Erfolgsquote des Builds aus einem sauberen Checkout |
| Akzeptanzkriterium | (1) **100 %**; (2) **100 %** mit gesperrten Abhängigkeitsversionen (Lockfile) |
| Messverfahren | CI-Pipeline-Auswertung; Image-Tag nach SemVer in der Container-Registry |
| Messkontext | CI bei jedem Tag `v*` |
| Verhalten bei Verfehlung | Kein Release |

## Nachweis
- `CTRL-CI-IMAGE`: CI-Job für Build und Veröffentlichung (neu einzurichten; Umsetzungsstand ⬜).


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 2.0 | 2026-10-23 | Merkmal/Metrik/Akzeptanzkriterium/Messverfahren getrennt (Fallstudie FS-M3) |
