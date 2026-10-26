---
id: REQ-PORT-002
title: Lauffähig auf x86- und ARM-Rechnern
type: quality
class: quality
status: implemented
owner: team-plattform
risk: medium
reviewers: [qa-lead]
release: R1
moscow: M
moscow_reason: [3, 4]
kano: n/a
epic: EPIC-00
source: Risiko R-6
version: 2.2
created: 2026-10-20
last_updated: 2026-10-26
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
- `CTRL-CI-MULTIARCH`: CI-Job `multiarch` (QEMU + Buildx) baut `linux/amd64` und `linux/arm64`, startet das arm64-Image unter Emulation bis „healthy“ und lädt beide Image-Archive hoch; der Smoke-Test läuft gegen amd64 im Job `compose`. Lokal geprüft: arm64 nativ „healthy“, amd64 per Emulation in 347 s gebaut.


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 2.0 | 2026-10-23 | Merkmal/Metrik/Akzeptanzkriterium/Messverfahren getrennt (Fallstudie FS-M3) |
| 2.1 | 2026-10-23 | Review v0.2: R-15 |
| 2.2 | 2026-10-26 | Multi-Arch-Build in CI eingerichtet (B-08); Status → implemented |
