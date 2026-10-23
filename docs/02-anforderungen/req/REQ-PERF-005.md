---
id: REQ-PERF-005
title: Ladeverhalten der Oberfläche
type: quality
class: quality
status: in-review
owner: team-plattform
risk: low
release: R1
moscow: M
kano: leistung
epic: EPIC-00
source: BG-2
version: 2.0
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-PERF-005]
---

# REQ-PERF-005 Ladeverhalten der Oberfläche
## Anforderung
Die Oberfläche muss auf Smartphones schnell laden und stabil dargestellt werden.

## Begründung
Mobile Nutzung auf dem Campus mit wechselnder Netzqualität (REQ-UX-001).

## Qualitätsmerkmal, Metrik, Messverfahren
| Feld | Festlegung |
|---|---|
| Qualitätsmerkmal (ISO 25010) | Performance Efficiency → Time Behaviour |
| Metrik | Core Web Vitals im Labor: Largest Contentful Paint (LCP), Total Blocking Time (TBT), Cumulative Layout Shift (CLS) |
| Akzeptanzkriterium | **LCP < 2,5 s**, **TBT < 200 ms**, **CLS < 0,1** auf Start-, Such- und Detailseite |
| Messverfahren | Lighthouse CI, drei Läufe pro Seite, Median |
| Messkontext | Docker-Beispiel, Mobil-Emulation (Lighthouse-Standard „Moto G Power“, gedrosseltes 4G) |
| Verhalten bei Verfehlung | Build-Warnung; Regression um mehr als 20 % blockiert den Merge |

## Nachweis
- `AT-PERF-005`: Lighthouse-CI-Lauf (neu zu schreiben; Umsetzungsstand ⬜).


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 2.0 | 2026-10-23 | Merkmal/Metrik/Akzeptanzkriterium/Messverfahren getrennt (Fallstudie FS-M3) |
