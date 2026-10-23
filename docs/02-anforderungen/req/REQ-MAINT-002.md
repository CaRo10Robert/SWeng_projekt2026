---
id: REQ-MAINT-002
title: Geprüfte Modulgrenzen
type: architecture
class: constraint
status: implemented
owner: team-plattform
risk: medium
release: R1
moscow: M
kano: n/a
epic: EPIC-00
source: ADR-0001
version: 1.1
created: 2026-10-20
last_updated: 2026-10-23
verification: [CTRL-DEPCRUISE]
---

# REQ-MAINT-002 Geprüfte Modulgrenzen
## Anforderung
Das System muss so aufgebaut sein, dass kein Fachmodul auf Daten oder interne Bestandteile eines anderen Moduls zugreift; Abhängigkeiten laufen nur über öffentliche Schnittstellen und Ports. Die Einhaltung wird automatisch geprüft.

## Begründung
Erweiterbarkeit (Bezahlung, weitere Hochschulen) ohne Umbau setzt stabile Grenzen voraus (ADR-0001, BG-5).

## Qualitätsmerkmal, Metrik, Messverfahren
| Feld | Festlegung |
|---|---|
| Qualitätsmerkmal (ISO 25010) | Maintainability → Modularity |
| Metrik | Anzahl Verstöße gegen die Abhängigkeitsregeln (Modulinterna, Adapter in Fachmodulen, Framework in der Domäne, Plattform → Modul) |
| Akzeptanzkriterium | **0** Verstöße |
| Messverfahren | dependency-cruiser mit Regeln in `apps/server/.dependency-cruiser.cjs` (`pnpm lint:deps`) |
| Messkontext | jeder Build bzw. CI-Lauf |
| Verhalten bei Verfehlung | Build schlägt fehl; Abweichung nur über neue ADR |

## Nachweis
- `CTRL-DEPCRUISE`: `pnpm lint:deps` meldet 0 Verstöße (bestehend).


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei mit Front Matter, Kano und Nachweis-IDs |
