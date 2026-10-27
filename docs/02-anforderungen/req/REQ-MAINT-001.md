---
id: REQ-MAINT-001
title: Testabdeckung der Fachlogik
type: quality
class: quality
status: implemented
owner: team-plattform
risk: medium
reviewers: [qa-lead]
release: R1
moscow: S
kano: n/a
epic: EPIC-00
source: BG-5
version: 2.3
created: 2026-10-20
last_updated: 2026-10-26
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

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Coverage-Schwelle unterschritten | CI bricht ab (`vitest --coverage` mit Schwellen) |
| Schwellen werden gesenkt | Änderung an `vitest.config.ts` ist im Pull Request sichtbar und braucht Review; Absenkung nur mit Begründung in dieser Anforderung |
| Flaky Tests | kein automatisches Wiederholen in CI; ein flakiger Test wird behoben oder mit Backlog-Eintrag deaktiviert, nie still übersprungen |
| Mutationstest-Score sinkt | wöchentlicher Lauf `mutation.yml` schlägt unter der Schwelle fehl und erzeugt eine sichtbare Fehlermeldung im Workflow |
| Tests ohne Aussage (nur Abdeckung) | Mutationstests decken fehlende Prüfungen auf; Code-Review achtet auf Assertions |

## Nachweis
- `CTRL-COVERAGE`: Vitest-v8-Coverage mit Schwellen in `apps/server/vitest.config.ts`, Bericht als CI-Artefakt `coverage-server`. Messwerte (2026-10-26): Geschäftsregeln (`modules/*/domain.ts`) 100 % Zeilen (Schwelle 95 % Zeilen, 85 % Zweige, 95 % Funktionen); **Fachmodule insgesamt 15,9 %** (Schwelle 13 % = Messwert minus 2 Pp). **Lücke zu Kriterium (1) ≥ 80 % offen:** Die Services hängen an der Datenbank und werden nur über Smoke- und E2E-Tests ausgeführt, die nicht in die Messung eingehen. Lösungsweg: Server unter Smoke- und E2E-Tests mit `NODE_V8_COVERAGE` messen und mit der Unit-Coverage zusammenführen (Backlog B-64).
- `CTRL-MUTATION`: StrykerJS 10.0.0 auf die Geschäftsregeln (`stryker.config.mjs`), Workflow `mutation.yml` montags und auf Anforderung. Score **73,8 %** (Schwelle 60 %) – Kriterium (2) erfüllt; Ausreißer `platform/pseudonym.ts` 45,9 % (datenbanknahe Mutanten) und `listings/domain.ts` 59,3 %.


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 2.0 | 2026-10-23 | Merkmal/Metrik/Akzeptanzkriterium/Messverfahren getrennt (Fallstudie FS-M3) |
| 2.1 | 2026-10-23 | Review v0.2: R-22 (Codepfade in den Messkontext) |
| 2.2 | 2026-10-26 | Coverage und Mutationstests eingerichtet; Messwerte und Lücke Fachmodule (15,9 % statt 80 %) dokumentiert, B-64; Status → implemented |
| 2.3 | 2026-10-26 | Guideline-Review: GL-05 Fehler- und Missbrauchsfälle ergänzt |
