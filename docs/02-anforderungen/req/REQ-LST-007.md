---
id: REQ-LST-007
title: Anzeige als reserviert oder abgegeben markieren
type: user-story
class: functional
status: approved
owner: team-marktplatz
risk: low
release: R1
moscow: M
moscow_reason: [1]
kano: basis
epic: EPIC-02
source: BG-3
use_cases: [UC-12]
depends_on: [REQ-LST-006]
version: 2.1
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-LST-007, AT-LST-007-2]
---

# REQ-LST-007 Anzeige als reserviert oder abgegeben markieren

## Anforderung
Als Anbieter möchte ich meine Anzeige als **reserviert** oder **abgegeben** markieren, damit Interessenten den Stand sehen und keine überflüssigen Anfragen schicken. Die Reservierung kann allgemein oder für eine bestimmte Person aus dem Chat erfolgen (REQ-CHAT-011).

Übergänge gemäß [Zustandsmodell Anzeige](../02-anforderungen.md#4-zustandsmodell-anzeige-normativ).

## Begründung
Der Ablauf „Anzeige → Chat → reserviert → abgegeben“ ist der vorführbare Abschluss (BG-3).

**Must-Begründung:** Kriterium 1 (Release-Ziel nicht ohne sie erreichbar).

## Akzeptanzkriterien
| Aktion | Von | Nach | Sichtbarkeit in der Suche |
|---|---|---|---|
| Reservieren | aktiv | reserviert | ja, mit Kennzeichen „Reserviert“ |
| Reservierung aufheben | reserviert | aktiv | ja |
| Als abgegeben markieren | aktiv, reserviert | abgegeben | **nein** |
| (automatisch) Reservierung läuft ab | reserviert seit 30 Tagen | aktiv | ja |

```gherkin
Szenario: Abgegebene Anzeige
  Angenommen meine Anzeige ist reserviert
  Wenn ich sie als abgegeben markiere
  Dann erscheint sie nicht mehr in der Suche
  Und bestehende Konversationen bleiben mit dem Hinweis "Anzeige abgegeben" lesbar
  Und sie wird 30 Tage später gelöscht (REQ-LST-008)
```

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Unzulässiger Übergang (z. B. pausiert → reserviert) | abgelehnt, Zustand unverändert |
| Reservierung wird vergessen | fällt nach 30 Tagen automatisch auf aktiv zurück (REQ-LST-008) |
| Fremde Anzeige | nicht gefunden (REQ-SEC-006) |

## INVEST
I: kann ohne Chat genutzt werden · N: Kennzeichnung verhandelbar · V: weniger Fehlanfragen · E/S: klein · T: automatisierbar.

## Nachweis
- `AT-LST-007`: Unit-Test der Übergänge reservieren, aufheben, abgeben.
- `AT-LST-007-2`: Smoke-Test – Reservierung aus dem Chat setzt die Anzeige auf `reserviert`.

Teilweise offen: automatischer Rückfall reservierter Anzeigen nach 30 Tagen (siehe REQ-LST-008, neu).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 2.1 | 2026-10-23 | Review v0.2: R-05 Verweis auf §4 korrigiert, Rückfall nach 30 Tagen, Fehlerfälle; R-15 Reservierung für eine Person in REQ-CHAT-011 (Q-17) |
| 2.0 | 2026-10-23 | Sichtbarkeit abgegebener Anzeigen festgelegt (sofort nicht mehr in der Suche, Löschung nach 30 Tagen) – löst Widerspruch zu UC-12 („nach 7 Tagen“) |
