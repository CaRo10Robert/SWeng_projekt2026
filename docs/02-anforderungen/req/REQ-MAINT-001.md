---
id: REQ-MAINT-001
title: Testabdeckung der Fachlogik
type: quality
class: quality
status: in-review
owner: team-plattform
risk: medium
release: R1
moscow: S
kano: n/a
epic: EPIC-00
source: BG-5
version: 2.0
created: 2026-10-20
last_updated: 2026-10-23
verification: [CTRL-COVERAGE, CTRL-MUTATION]
---

# REQ-MAINT-001 Testabdeckung der Fachlogik
## Anforderung
Die Fachlogik muss so durch automatisierte Tests abgesichert sein, dass Änderungen ohne Regressionen möglich sind.

## Begründung
Erweiterbarkeit ohne Umbau (BG-5) setzt belastbare Tests voraus.

## Qualitätsmerkmal, Metrik, Messverfahren
| Feld | Festlegung |
|---|---|
| Qualitätsmerkmal (ISO 25010) | Maintainability → Testability, Modifiability |
| Metrik | (1) Zeilenabdeckung der Fachmodule; (2) Mutation-Score der Geschäftsregeln |
| Akzeptanzkriterium | (1) **≥ 80 %** Zeilenabdeckung in `apps/server/src/modules`; (2) **≥ 60 %** Mutation-Score in den `domain.ts`-Dateien |
| Messverfahren | (1) Vitest-Coverage-Report; (2) StrykerJS auf die Geschäftsregeln |
| Messkontext | CI-Lauf je Merge-Request |
| Verhalten bei Verfehlung | CI schlägt fehl, wenn die Abdeckung unter den Schwellwert fällt |

## Nachweis
- `CTRL-COVERAGE`: Coverage-Schwelle in der Testkonfiguration (neu einzurichten).
- `CTRL-MUTATION`: Mutationstestlauf (neu einzurichten).
- Umsetzungsstand 🟡: Unit-Tests der Geschäftsregeln vorhanden, Abdeckung nicht gemessen.


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 2.0 | 2026-10-23 | Merkmal/Metrik/Akzeptanzkriterium/Messverfahren getrennt (Fallstudie FS-M3) |
