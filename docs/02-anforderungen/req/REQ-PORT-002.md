---
id: REQ-PORT-002
title: Lauffähig auf x86- und ARM-Rechnern
type: quality
class: quality
status: in-review
owner: team-plattform
risk: medium
release: R1
moscow: M
kano: n/a
epic: EPIC-00
source: Risiko R-6
version: 2.0
created: 2026-10-20
last_updated: 2026-10-23
verification: [CTRL-CI-MULTIARCH]
---

# REQ-PORT-002 Lauffähig auf x86- und ARM-Rechnern
## Anforderung
Das Docker-Beispiel muss auf Prüfrechnern mit x86-64-Prozessor (Windows, Linux) und mit ARM-Prozessor (Apple Silicon) ohne Anpassung laufen.

## Begründung
Prüfer/innen nutzen unterschiedliche Rechner (Risiko R-6).

## Qualitätsmerkmal, Metrik, Messverfahren
| Feld | Festlegung |
|---|---|
| Qualitätsmerkmal (ISO 25010) | Flexibility → Adaptability, Installability |
| Metrik | Anzahl Zielplattformen, auf denen der Smoke-Test besteht |
| Akzeptanzkriterium | **2 von 2** (`linux/amd64`, `linux/arm64`) |
| Messverfahren | CI-Build-Matrix für beide Plattformen und Smoke-Test des Compose-Setups |
| Messkontext | CI-Runner bzw. Emulation; zusätzlich Stichprobe auf einem Apple-Silicon-Rechner |
| Verhalten bei Verfehlung | Release-Blocker |

## Nachweis
- `CTRL-CI-MULTIARCH`: Multi-Arch-Build mit Smoke-Test in der CI (neu einzurichten; Umsetzungsstand ⬜).


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 2.0 | 2026-10-23 | Merkmal/Metrik/Akzeptanzkriterium/Messverfahren getrennt (Fallstudie FS-M3) |
