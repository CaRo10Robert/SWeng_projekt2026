---
id: REQ-MAINT-001
title: Testabdeckung der Fachlogik
type: quality
class: quality
status: approved
owner: team-plattform
risk: medium
reviewers: [qa-lead]
release: R1
moscow: S
kano: n/a
epic: EPIC-00
source: BG-5
version: 2.1
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
| Akzeptanzkriterium | (1) **≥ 80 %** Zeilenabdeckung der Fachmodule; (2) **≥ 60 %** Mutation-Score der Geschäftsregeln |
| Messverfahren | (1) Vitest-Coverage-Report; (2) StrykerJS auf die Geschäftsregeln |
| Messkontext | CI-Lauf je Merge-Request; Fachmodule = `apps/server/src/modules`, Geschäftsregeln = die `domain.ts`-Dateien der Module |
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
| 2.1 | 2026-10-23 | Review v0.2: R-22 (Codepfade in den Messkontext) |
