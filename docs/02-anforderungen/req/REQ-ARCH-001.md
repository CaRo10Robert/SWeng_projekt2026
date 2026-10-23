---
id: REQ-ARCH-001
title: Bezahlung als späteres Modul hinter einem Port
type: architecture
class: constraint
status: implemented
owner: team-plattform
risk: high
reviewers: [product-owner, architecture-lead]
release: R1
moscow: M
kano: n/a
epic: EPIC-09
source: BG-5, ADR-0006
version: 1.1
created: 2026-10-20
last_updated: 2026-10-23
verification: [CTRL-DEPCRUISE, MAN-ARCH-001]
---

# REQ-ARCH-001 Bezahlung als späteres Modul hinter einem Port
## Anforderung
Das System muss so aufgebaut sein, dass eine Bezahlfunktion später als eigenes Modul hinter einer Zahlungsschnittstelle (`PaymentPort`) ergänzt werden kann, **ohne** bestehende Tabellen anders als additiv zu ändern. Geldbeträge werden als ganzzahlige Cent-Beträge mit Währung gespeichert; Vereinbarungen zwischen Anbieter und Interessent (Deal) und ihre Zustandswechsel werden als Ereignisse veröffentlicht.

## Begründung
Erweiterbarkeit (BG-5); ADR-0006.

## Konformitätsprüfung
| Prüfung | Kriterium |
|---|---|
| Architektur-Review je Release | Schnittstelle `PaymentPort` vorhanden; Deal-Ereignisse `DealAgreed`, `DealCompleted`, `DealCancelled` werden veröffentlicht |
| Schema-Review | alle Geldspalten als Cent-Integer plus Währung |
| dependency-cruiser | kein Fachmodul hängt von einem Zahlungsanbieter ab |

## Nachweis
- `CTRL-DEPCRUISE`: Modulgrenzen ohne Verstöße.
- `MAN-ARCH-001`: Architektur-Review-Protokoll (QS-5).


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei mit Front Matter, Kano und Nachweis-IDs |
