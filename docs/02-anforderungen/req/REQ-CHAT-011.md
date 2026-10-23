---
id: REQ-CHAT-011
title: Reservierung und Abgabe für eine Person (Deal-Kern)
type: user-story
class: functional
status: verified
owner: team-kommunikation
risk: medium
release: R1
moscow: M
moscow_reason: [1, 4]
kano: basis
epic: EPIC-04
source: BG-3, BG-5, ADR-0006
use_cases: [UC-12, UC-21]
depends_on: [REQ-CHAT-002, REQ-LST-007]
version: 1.1
created: 2026-10-23
last_updated: 2026-10-24
verification: [AT-CHAT-011, AT-CHAT-011-2]
---

# REQ-CHAT-011 Reservierung und Abgabe für eine Person (Deal-Kern)

## Anforderung
Als Anbieter möchte ich die Anzeige direkt aus einer Konversation **für genau diesen Interessenten reservieren**, die Reservierung wieder aufheben und die Anzeige als **an diese Person abgegeben** markieren, damit beide denselben Stand der Absprache sehen und die Anzeige nicht doppelt vergeben wird.

Die so entstandene Vereinbarung (**Deal**: Anzeige, Anbieter, Interessent, vereinbarter Betrag in Cent mit Währung, Status *vereinbart / abgeschlossen / storniert*) bleibt nachvollziehbar. Jede Statusänderung eines Deals wird als fachliches Ereignis (`DealAgreed`, `DealCompleted`, `DealCancelled`) veröffentlicht, das eine spätere Bezahlfunktion ohne Änderung an diesem Ablauf nutzen kann.

## Begründung
Der Ablauf „Anzeige → Chat → reserviert → abgegeben“ ist der vorführbare Abschluss (BG-3). Deal und Ereignisse sind die fachliche Vorleistung für die Bezahlung (REQ-ARCH-001, ADR-0006). Abgespalten aus REQ-CHAT-009, damit dieses Must nicht von einer Could-Anforderung abhängt (Review v0.2 R-15/R-21, Entscheidung Q-17).

**Must-Begründung:** Kriterium 1 (Release-Ziel BG-3 nicht erreichbar ohne Abschluss) und 4 (Vorleistung für EPIC-09, REQ-ARCH-001).

## Akzeptanzkriterien
```gherkin
Szenario: Reservieren für eine Person
  Angenommen Lea fragt Bens aktive Anzeige an
  Wenn Ben in der Konversation "Für Lea reservieren" wählt
  Dann ist die Anzeige reserviert
  Und Lea sieht die Systemnachricht "Die Anzeige wurde für dich reserviert"
  Und eine zweite Reservierung für eine andere Person ist nicht möglich

Szenario: Abgabe
  Angenommen die Anzeige ist für Lea reserviert
  Wenn Ben "Als abgegeben markieren" wählt
  Dann ist die Anzeige abgegeben und nicht mehr in der Suche
  Und beide sehen die Abgabe im Verlauf

Szenario: Nur der Anbieter steuert den Deal
  Wenn Lea als Interessentin "abgegeben" auslösen will
  Dann wird das abgelehnt
```

| Aktion (nur Anbieter) | Vorher | Nachher Deal / Anzeige | Ereignis |
|---|---|---|---|
| reservieren | kein offener Deal, Anzeige aktiv | vereinbart / reserviert | `DealAgreed` |
| abgeben | offener Deal dieser Konversation oder keiner; Anzeige aktiv oder reserviert | abgeschlossen / abgegeben | `DealCompleted` |
| Reservierung aufheben | vereinbart (diese Konversation) | storniert / aktiv | `DealCancelled` |
| Anbieter ändert den Status direkt an der Anzeige (aufheben, abgeben, löschen) | offener Deal | storniert bzw. abgeschlossen | entsprechend |
| Reservierung läuft nach 30 Tagen ab (REQ-LST-008) | vereinbart | storniert / aktiv | `DealCancelled` |

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Interessent oder Fremder löst eine Deal-Aktion aus | abgelehnt (Fremde: nicht gefunden, REQ-SEC-006) |
| Zweite Reservierung für eine andere Person | abgelehnt („bereits reserviert“) |
| Abgabe an Person B, während für Person A reserviert | abgelehnt |
| Gleichzeitige Aktionen | höchstens ein offener Deal je Anzeige |
| Ereignis kann nicht sofort verarbeitet werden | wird wiederholt, geht nicht verloren (wie REQ-NOTI-005) |

## INVEST
I: unabhängig vom Preisvorschlag (REQ-CHAT-009) · N: Wortlaut der Systemnachrichten verhandelbar · V: klarer Abschluss · E/S: klein, bereits umgesetzt · T: Szenarien automatisierbar.

## Nachweis
- `AT-CHAT-011`: Smoke-Test – der Anbieter reserviert aus der Konversation, Deal ist „vereinbart“, Anzeige „reserviert“.
- `AT-CHAT-011-2`: Smoke-Test – der Interessent darf den Deal nicht steuern.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-23 | Abgespalten aus REQ-CHAT-009 v2.0 (Review v0.2 R-15/R-21, Q-17) |
| 1.1 | 2026-10-24 | Verifiziert im finalen Lauf gegen das Docker-Beispiel (AT-CHAT-011, AT-CHAT-011-2 bestanden bzw. ausgeführt); Status → verified |
