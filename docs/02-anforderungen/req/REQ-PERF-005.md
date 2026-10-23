---
id: REQ-PERF-005
title: Ladeverhalten der Oberfläche
type: quality
class: quality
status: approved
owner: team-plattform
risk: low
reviewers: [qa-lead]
release: R1
moscow: S
kano: leistung
epic: EPIC-00
source: BG-2
version: 2.1
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-PERF-005]
---

# REQ-PERF-005 Ladeverhalten der Oberfläche
## Anforderung
Die Oberfläche muss auf Smartphones schnell laden und stabil dargestellt werden.

## Begründung
Mobile Nutzung auf dem Campus mit wechselnder Netzqualität (REQ-UX-001).

**MoSCoW:** Should statt Must (Review v0.2, R-15): Eine Verfehlung erzeugt nur eine Build-Warnung; keines der Must-Kriterien 1–4 trifft zu.

## Qualitätsmerkmal, Metrik, Messverfahren
| Feld | Festlegung |
|---|---|
| Qualitätsmerkmal (ISO 25010) | Performance Efficiency → Time Behaviour |
| Metrik | Core Web Vitals im Labor: Largest Contentful Paint (LCP), Total Blocking Time (TBT), Cumulative Layout Shift (CLS) |
| Akzeptanzkriterium | **LCP < 2,5 s**, **TBT < 200 ms**, **CLS < 0,1** auf Start-, Such- und Detailseite |
| Messverfahren | Lighthouse CI, drei Läufe pro Seite, Median |
| Messkontext | Docker-Beispiel; **Lighthouse 12.x** (Version im CI fixiert) mit Mobil-Emulation in dessen Standardprofil (Moto G Power, simuliert gedrosseltes 4G: 150 ms RTT, 1,6 Mbit/s, 4-fache CPU-Drosselung); Chromium aktuell |
| Verhalten bei Verfehlung | Build-Warnung; Regression um mehr als 20 % blockiert den Merge |

## Nachweis
- `AT-PERF-005`: Lighthouse-CI-Lauf (neu zu schreiben; Umsetzungsstand ⬜).


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 2.0 | 2026-10-23 | Merkmal/Metrik/Akzeptanzkriterium/Messverfahren getrennt (Fallstudie FS-M3) |
| 2.1 | 2026-10-23 | Review v0.2: R-15 (Must → Should), R-24 (Lighthouse-Version fixiert) |
