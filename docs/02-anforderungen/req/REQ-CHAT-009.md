---
id: REQ-CHAT-009
title: Preisvorschlag und Reservierung (Deal) im Chat
type: user-story
class: functional
status: in-review
owner: team-kommunikation
risk: low
release: R1
moscow: C
kano: begeisterung
epic: EPIC-04
source: ADR-0006 (Vorbereitung EPIC-09)
use_cases: [UC-21, UC-12]
depends_on: [REQ-LST-007]
version: 2.0
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-CHAT-009, AT-CHAT-009-2]
---

# REQ-CHAT-009 Preisvorschlag und Reservierung (Deal) im Chat

## Anforderung
Als Teilnehmer möchte ich einen **Preisvorschlag** als strukturierte Nachricht senden, den der Anbieter annehmen oder ablehnen kann. Als Anbieter möchte ich die Anzeige direkt aus der Konversation **für genau diesen Interessenten reservieren** und später als **abgegeben** markieren. Die so entstandene Vereinbarung (Deal: Anzeige, Anbieter, Interessent, vereinbarter Preis, Status) bleibt nachvollziehbar.

## Begründung
Strukturierte Absprachen vermeiden Missverständnisse. Der Deal ist die fachliche Vorleistung für die spätere optionale Bezahlung (ADR-0006, REQ-ARCH-001).

## Akzeptanzkriterien
```gherkin
Szenario: Reservieren für eine Person
  Angenommen Lea fragt Bens aktive Anzeige an
  Wenn Ben in der Konversation "Für Lea reservieren" wählt
  Dann ist die Anzeige reserviert
  Und Lea sieht die Systemnachricht "Die Anzeige wurde für dich reserviert"
  Und eine zweite Reservierung für eine andere Person ist nicht möglich

Szenario: Nur der Anbieter steuert den Deal
  Wenn Lea als Interessentin "abgegeben" auslösen will
  Dann wird das abgelehnt (403)

Szenario: Preisvorschlag annehmen
  Angenommen Lea schlägt 12,00 € vor
  Wenn Ben annimmt
  Dann gilt 12,00 € als vereinbarter Preis des Deals
  Und beide sehen die Annahme im Verlauf
```

| Aktion | Vorher | Nachher (Deal / Anzeige) |
|---|---|---|
| reservieren | kein offener Deal, Anzeige aktiv | vereinbart / reserviert |
| abgeben | Deal dieser Konversation oder keiner | abgeschlossen / abgegeben |
| Reservierung aufheben | vereinbart | storniert / aktiv |

## INVEST
I: setzt REQ-LST-007 voraus · N: Preisvorschlag ist abtrennbar · V: klare Absprache · E: mittel · S: ein Sprint · T: automatisierbar.

## Nachweis
- `AT-CHAT-009`: Smoke-Test – Reservierung durch den Anbieter, Interessent darf den Deal nicht steuern.
- `AT-CHAT-009-2`: API-Test Preisvorschlag annehmen/ablehnen (neu zu schreiben).

**Teilweise umgesetzt (🟡):** Reservieren, Abgeben und Aufheben inkl. Domain Events; der strukturierte Preisvorschlag fehlt.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog (nur Preisvorschlag) |
| 2.0 | 2026-10-23 | Reservierung für eine Person und Deal-Zustände aufgenommen (wie umgesetzt), Akzeptanzkriterien |
