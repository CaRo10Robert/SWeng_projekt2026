---
id: REQ-ARCH-006
title: Vereinfachte Infrastruktur hinter Ports
type: architecture
class: constraint
status: verified
owner: team-plattform
risk: medium
release: R1
moscow: M
moscow_reason: [4]
kano: n/a
epic: EPIC-00
source: ADR-0010
version: 1.3
created: 2026-10-20
last_updated: 2026-10-24
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

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Fachmodul importiert einen Adapter oder eine Infrastrukturbibliothek | Konformitätsprüfung schlägt fehl |
| Neue Infrastruktur ohne Port | im Architektur-Review abzulehnen |
| Adapter fällt aus (z. B. Mailserver) | Verhalten regelt die jeweilige Fachanforderung (z. B. REQ-NOTI-005); der Port kapselt Zeitlimits |

## Nachweis
- `CTRL-DEPCRUISE`: Regeln `modules-only-know-ports` und `no-infrastructure-libs-in-modules` ohne Verstöße (bestehend).


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei mit Front Matter, Kano und Nachweis-IDs |
| 1.2 | 2026-10-23 | Review v0.2: R-04, R-15 |
| 1.3 | 2026-10-24 | Verifiziert im finalen Lauf gegen das Docker-Beispiel (CTRL-DEPCRUISE bestanden bzw. ausgeführt); Status → verified |
