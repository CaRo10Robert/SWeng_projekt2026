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
moscow_reason: [4]
kano: n/a
epic: EPIC-09
source: BG-5, ADR-0006
depends_on: [REQ-CHAT-011]
version: 1.3
created: 2026-10-20
last_updated: 2026-10-26
verification: [CTRL-DEPCRUISE, MAN-ARCH-001]
---

# REQ-ARCH-001 Bezahlung als späteres Modul hinter einem Port
## Anforderung
Das System muss so aufgebaut sein, dass eine Bezahlfunktion später als eigenes Modul hinter einer Zahlungsschnittstelle (`PaymentPort`) ergänzt werden kann, **ohne** bestehende Tabellen anders als additiv zu ändern. Geldbeträge werden als ganzzahlige Cent-Beträge mit Währung gespeichert; Vereinbarungen zwischen Anbieter und Interessent (Deal, REQ-CHAT-011) und ihre Zustandswechsel werden als Ereignisse veröffentlicht.

## Begründung
Erweiterbarkeit (BG-5); ADR-0006.

## Konformitätsprüfung
| Prüfung | Kriterium |
|---|---|
| Architektur-Review je Release | Schnittstelle `PaymentPort` vorhanden; Deal-Ereignisse `DealAgreed`, `DealCompleted`, `DealCancelled` werden veröffentlicht |
| Schema-Review | alle Geldspalten als Cent-Integer plus Währung |
| dependency-cruiser | kein Fachmodul hängt von einem Zahlungsanbieter ab |

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Deal-Ereignis kann nicht veröffentlicht werden | Fachänderung und Ereignis werden gemeinsam verworfen; kein Deal ohne Ereignis (REQ-CHAT-011) |
| Ereignis wird doppelt zugestellt | Konsumenten müssen idempotent sein (Ereignis-ID) |
| Geldbetrag als Gleitkommazahl oder ohne Währung | im Schema-Review abzulehnen |
| Direkter Aufruf eines Zahlungsanbieters aus einem Fachmodul | Konformitätsprüfung (dependency-cruiser) schlägt fehl |

## Nachweis
- `CTRL-DEPCRUISE`: Modulgrenzen ohne Verstöße.
- `MAN-ARCH-001`: Architektur-Review-Protokoll (QS-5) – [MAN-ARCH-001](../../05-umsetzung/nachweise/MAN-ARCH-001.md). Die dependency-cruiser-Regel `no-payment-sdk-in-modules` verhindert Importe von Zahlungsdienstleister-SDKs in Fachmodulen; Deal-Ereignisse tragen `eventId`, `occurredAt` und `dealId`.


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei mit Front Matter, Kano und Nachweis-IDs |
| 1.2 | 2026-10-23 | Review v0.2: R-04, R-15, Deal-Ereignisse aus REQ-CHAT-011 (Q-17) |
| 1.3 | 2026-10-26 | Nachweis MAN-ARCH-001 verlinkt; PSP-SDK-Regel und eventId |
