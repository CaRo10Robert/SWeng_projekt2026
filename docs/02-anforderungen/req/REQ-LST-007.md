---
id: REQ-LST-007
title: Anzeige als reserviert oder abgegeben markieren
type: user-story
class: functional
status: implemented
owner: team-marktplatz
risk: low
release: R1
moscow: M
kano: basis
epic: EPIC-02
source: BG-3
use_cases: [UC-12]
depends_on: [REQ-LST-006]
version: 2.0
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-LST-007, AT-LST-007-2]
---

# REQ-LST-007 Anzeige als reserviert oder abgegeben markieren

## Anforderung
Als Anbieter möchte ich meine Anzeige als **reserviert** oder **abgegeben** markieren, damit Interessenten den Stand sehen und keine überflüssigen Anfragen schicken. Die Reservierung kann allgemein oder für eine bestimmte Person aus dem Chat erfolgen (REQ-CHAT-009).

Übergänge gemäß **Zustandsmodell Anzeige** ([Anforderungskatalog §1.2](../02-anforderungen.md)).

## Begründung
Der Ablauf „Anzeige → Chat → reserviert → abgegeben“ ist der vorführbare Abschluss (BG-3).

## Akzeptanzkriterien
| Aktion | Von | Nach | Sichtbarkeit in der Suche |
|---|---|---|---|
| Reservieren | aktiv | reserviert | ja, mit Kennzeichen „Reserviert“ |
| Reservierung aufheben | reserviert | aktiv | ja |
| Als abgegeben markieren | aktiv, reserviert | abgegeben | **nein** |

```gherkin
Szenario: Abgegebene Anzeige
  Angenommen meine Anzeige ist reserviert
  Wenn ich sie als abgegeben markiere
  Dann erscheint sie nicht mehr in der Suche
  Und bestehende Konversationen bleiben mit dem Hinweis "Anzeige abgegeben" lesbar
  Und sie wird 30 Tage später gelöscht (REQ-LST-008)
```

## INVEST
I: kann ohne Chat genutzt werden · N: Kennzeichnung verhandelbar · V: weniger Fehlanfragen · E/S: klein · T: automatisierbar.

## Nachweis
- `AT-LST-007`: Unit-Test der Übergänge reservieren, aufheben, abgeben.
- `AT-LST-007-2`: Smoke-Test – Reservierung aus dem Chat setzt die Anzeige auf `reserviert`.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 2.0 | 2026-10-23 | Sichtbarkeit abgegebener Anzeigen festgelegt (sofort nicht mehr in der Suche, Löschung nach 30 Tagen) – löst Widerspruch zu UC-12 („nach 7 Tagen“) |
