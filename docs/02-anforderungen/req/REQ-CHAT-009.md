---
id: REQ-CHAT-009
title: Preisvorschlag im Chat
type: user-story
class: functional
status: approved
owner: team-kommunikation
risk: low
release: R1
moscow: C
kano: begeisterung
epic: EPIC-04
source: BG-3
use_cases: [UC-21]
depends_on: [REQ-CHAT-011]
version: 3.0
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-CHAT-009-2]
---

# REQ-CHAT-009 Preisvorschlag im Chat

## Anforderung
Als Interessent möchte ich dem Anbieter einen **Preisvorschlag** als eigene, strukturierte Nachricht senden, den er annehmen oder ablehnen kann, damit wir uns ohne Missverständnisse auf einen Preis einigen. Ein angenommener Vorschlag wird zum vereinbarten Betrag des Deals (REQ-CHAT-011).

## Begründung
Strukturierte Absprachen vermeiden Missverständnisse bei Verhandlungsbasis-Anzeigen. Der vereinbarte Betrag ist Grundlage einer späteren optionalen Bezahlung (ADR-0006).

## Akzeptanzkriterien
```gherkin
Szenario: Preisvorschlag annehmen
  Angenommen Bens Anzeige hat den Preistyp "VB" und 15,00 €
  Und Lea schlägt 12,00 € vor
  Wenn Ben annimmt
  Dann gilt 12,00 € als vereinbarter Betrag
  Und beide sehen die Annahme im Verlauf

Szenario: Preisvorschlag ablehnen
  Angenommen Lea schlägt 5,00 € vor
  Wenn Ben ablehnt
  Dann sieht Lea die Ablehnung im Verlauf
  Und sie kann einen neuen Vorschlag senden
```

| Regel | Festlegung |
|---|---|
| Betrag | 0,01 € bis 10.000 € (wie REQ-LST-002) |
| Offene Vorschläge | höchstens einer je Interessent und Konversation; ein neuer ersetzt den alten |
| Annehmen/Ablehnen | nur der Anbieter |
| Anzeige nicht mehr aktiv oder reserviert | Vorschlag nicht möglich |

## INVEST
I: unabhängig vom Deal-Kern nutzbar, nutzt ihn nur beim Annehmen · N: Gegenvorschläge verhandelbar · V: klare Preisabsprache · E: mittel · S: ein Sprint · T: automatisierbar.

## Nachweis
- `AT-CHAT-009-2`: API-Test Preisvorschlag senden, annehmen, ablehnen (neu). Noch nicht umgesetzt (⬜).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog (nur Preisvorschlag) |
| 2.0 | 2026-10-23 | Reservierung für eine Person und Deal-Zustände aufgenommen (wie umgesetzt), Akzeptanzkriterien |
| 3.0 | 2026-10-23 | Review v0.2: R-15/R-21 Deal-Kern nach REQ-CHAT-011 abgespalten (Q-17); wieder reiner Preisvorschlag mit Nutzen („damit …“, R-17) |
