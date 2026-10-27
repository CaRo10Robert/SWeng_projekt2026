---
id: MAN-ARCH-001
type: evidence
requirement: REQ-ARCH-001
status: done
owner: architecture-lead
date: 2026-10-25
---

# MAN-ARCH-001 Architektur-Review: Erweiterbarkeit für die Bezahlfunktion (QS-5)

## Ziel

Dieser Nachweis prüft, ob eine Bezahlfunktion später als eigenes Modul hinter dem `PaymentPort` ergänzt werden kann, ohne bestehende Tabellen anders als additiv zu ändern. Grundlage sind [REQ-ARCH-001](../../02-anforderungen/req/REQ-ARCH-001.md), [ADR-0006](../../03-architektur/decisions/0006-bezahlung-erweiterungspunkt.md) und das Qualitätsszenario QS-5 der [Architektur](../../03-architektur/architektur.md).

## Gegenstand

- Code auf Branch `feature/fallstudie-req-c4`, Stand nach Commit `37ac306` (EPIC-13 einschließlich Review v1.3)
- Frühere Architektur-Reviews: [Review v1.0](../../04-review/review-v1.0-architektur.md) mit 23 Befunden und [Review v1.3](../../04-review/review-v1.3-recht-betrieb.md) mit den Befunden RV-A-01 bis 20
- Fitness Functions in `apps/server/.dependency-cruiser.cjs`

## Vorgehen

1. Die Ergebnisse von Review v1.0 und v1.3 zu Modulgrenzen und Erweiterbarkeit zusammengefasst.
2. Jede Zeile der Konformitätsprüfung aus REQ-ARCH-001 am Code nachgeprüft.
3. `pnpm lint:deps` ausgeführt.
4. QS-5 als Gedankenexperiment durchgespielt: Was müsste sich ändern, wenn ein Adapter für einen Zahlungsdienstleister dazukommt?

## Zusammenfassung der früheren Reviews

| Review | Ergebnis zu Modulgrenzen und Erweiterbarkeit |
|---|---|
| v1.0 (A-01 bis A-23) | Modulstruktur und Ports passen zur Bausteinsicht. Bemängelt waren der Direktzugriff der Module auf die Datenbank (A-02) und die Abhängigkeitsrichtung `listings` → `messaging` (A-07). Beides ist dokumentiert: Die Abhängigkeitsrichtung ist als Entscheidung OE-1 festgehalten, die Umstellung auf Domain Events folgt mit B-39 in R2. |
| v1.3 (RV-A-01 bis 20) | Kein Befund zu `PaymentPort` oder Deal-Ereignissen. RV-A-03 verlangte das neue Modul `reporting` (DAC7) in der Bausteinsicht; das ist nachgezogen. `reporting` liest Deals nur über das öffentliche API von `messaging`. |

## Ergebnis gegen die Konformitätsprüfung

| Prüfung (REQ-ARCH-001) | Kriterium | Befund am Code | Ergebnis |
|---|---|---|---|
| Architektur-Review | Schnittstelle `PaymentPort` vorhanden | `apps/server/src/modules/payments/payment-port.ts` definiert `PaymentPort` mit `onboardSeller`, `createCheckout`, `releaseFunds`, `refund` und `getStatus` sowie `Money { amountCents, currency }`. Es gibt bewusst keine Implementierung (EPIC-09). | erfüllt |
| Architektur-Review | Deal-Ereignisse `DealAgreed`, `DealCompleted`, `DealCancelled` werden veröffentlicht | `messaging/service.ts` reiht die Ereignisse in derselben Transaktion wie die Statusänderung in die Queue `deal-events` ein (`tx.enqueue(DEAL_EVENTS, …)`, transaktionaler Outbox über pg-boss). Das gilt für `deal()` und `onListingStatusChanged()`. `messaging/index.ts` definiert die Queue mit `retryLimit: 5`. | erfüllt |
| Schema-Review | alle Geldspalten als Cent-Integer plus Währung | `listings.listing.price_cents integer` + `currency char(3)`, `messaging.deal.agreed_price_cents integer` + `currency char(3)`. Es gibt keine `numeric`-, `real`- oder `double`-Spalten, siehe [MAN-ARCH-004](MAN-ARCH-004.md). | erfüllt |
| dependency-cruiser | kein Fachmodul hängt von einem Zahlungsanbieter ab | `pnpm lint:deps`: keine Verstöße bei 76 Modulen und 254 Abhängigkeiten. Die Regeln `modules-only-know-ports` und `no-infrastructure-libs-in-modules` verbieten Adapter und Infrastruktur-Bibliotheken in Fachmodulen. Eine eigene Regel gegen SDKs von Zahlungsdienstleistern fehlt (Befund B-1). | erfüllt, mit Hinweis |

**QS-5 als Gedankenexperiment:** Ein PSP-Adapter bräuchte die folgenden Ergänzungen:
- ein neues Modul `modules/payments/` mit Service, Routen und Konsument der Queue `deal-events`;
- einen Adapter `platform/adapters/<psp>.ts`, der `PaymentPort` implementiert;
- eine additive Migration, z. B. `payments.payment` mit Bezug auf `deal_id`.

In `listings`, `identity` und `messaging` muss sich dafür nichts ändern. Der Deal trägt Preis, Währung, Anbieter und Interessent bereits, und die Ereignisse enthalten diese Felder. **QS-5 ist erfüllt.**

## Befunde

| ID | Schwere | Befund | Vorschlag |
|---|---|---|---|
| B-1 | niedrig | Es gibt keine dependency-cruiser-Regel, die SDKs von Zahlungsdienstleistern (z. B. `stripe`, `@mollie/*`, `@adyen/*`) in Fachmodulen ausdrücklich verbietet. Heute deckt das nur die allgemeine Regel zu Adaptern ab, sobald ein SDK in `platform/adapters` liegt; ein direkter Import aus einem Modul würde nicht erkannt. | Regel `no-psp-sdk-in-modules` mit `to: { path: 'node_modules/(stripe\|@mollie\|@adyen)/' }` ergänzen. |
| B-2 | niedrig | Deal-Ereignisse tragen keine eigene Ereignis-ID. Konsumenten sollen laut REQ-ARCH-001 über die Ereignis-ID idempotent sein; verfügbar sind heute nur die Job-ID von pg-boss und `id` des Deals mit `type`. | `eventId` (UUID) und `occurredAt` beim Einreihen ergänzen. Das ist additiv und vor EPIC-09 zu erledigen. |
| B-3 | niedrig | Das Modul `payments` enthält nur die Schnittstelle. Es ist nicht in `main.ts` verdrahtet und hat keinen Platzhalter-Konsumenten. | Bewusst so (EPIC-09). Kein Handlungsbedarf vor R2. |

## Ergebnis

**MAN-ARCH-001 ist erfüllt.** Alle vier Prüfungen aus REQ-ARCH-001 sind bestanden, und QS-5 gilt nach dem Gedankenexperiment. Die Befunde B-1 und B-2 sind Härtungen vor EPIC-09, keine Verstöße.

## Folgeaufgaben

- B-1: Regel in `.dependency-cruiser.cjs` ergänzen (Backlog, zusammen mit B-06 CI-Scans)
- B-2: `eventId` und `occurredAt` in den Deal-Ereignissen ergänzen (vor EPIC-09)
