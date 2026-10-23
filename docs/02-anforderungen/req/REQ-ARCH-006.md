---
id: REQ-ARCH-006
title: Vereinfachte Infrastruktur hinter Ports
type: architecture
class: constraint
status: implemented
owner: team-plattform
risk: medium
release: R1
moscow: M
kano: n/a
epic: EPIC-00
source: ADR-0010
version: 1.1
created: 2026-10-20
last_updated: 2026-10-23
verification: [CTRL-DEPCRUISE]
---

# REQ-ARCH-006 Vereinfachte Infrastruktur hinter Ports
## Anforderung
Jede im Beispiel vereinfachte Infrastruktur – E-Mail-Versand, Dateiablage, Echtzeit-Verteilung, Rate-Limit-Speicher, Job-Queue und Suche – muss hinter einer Schnittstelle (Port) liegen, sodass ein Produktivadapter ohne Änderung der Fachlogik eingesetzt werden kann.

## Begründung
Späterer Echtbetrieb (EPIC-12) tauscht Adapter, nicht Fachlogik (ADR-0010, QS-8).

## Konformitätsprüfung
| Prüfung | Kriterium |
|---|---|
| dependency-cruiser | Fachmodule importieren keine Adapter und keine Infrastrukturbibliotheken (Mail, Queue, Datenbanktreiber) |
| Architektur-Review | Port-Liste in der Architekturdokumentation stimmt mit dem Code überein |

## Nachweis
- `CTRL-DEPCRUISE`: Regeln `modules-only-know-ports` und `no-infrastructure-libs-in-modules` ohne Verstöße (bestehend).


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei mit Front Matter, Kano und Nachweis-IDs |
