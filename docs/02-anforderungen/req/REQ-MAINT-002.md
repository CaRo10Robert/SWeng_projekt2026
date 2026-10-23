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
moscow_reason: [4]
kano: n/a
epic: EPIC-00
source: ADR-0001
version: 1.2
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

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Neue Abhängigkeit verletzt eine Regel | Prüfung schlägt fehl, Merge blockiert |
| Regel wird gelockert, um einen Verstoß „durchzuwinken“ | Änderung der Regeldatei nur mit neuer bzw. geänderter ADR und Architektur-Review |
| Umgehung über dynamische Importe oder Zeichenketten | im Code-Review abzulehnen; die statische Prüfung erkennt sie nicht |
| Prüfung läuft nicht (z. B. Konfigurationsfehler) | gilt als fehlgeschlagen, nicht als bestanden |

## Nachweis
- `CTRL-DEPCRUISE`: `pnpm lint:deps` meldet 0 Verstöße (bestehend).


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei mit Front Matter, Kano und Nachweis-IDs |
| 1.2 | 2026-10-23 | Review v0.2: R-04 (Fehler- und Missbrauchsfälle), R-15 |
