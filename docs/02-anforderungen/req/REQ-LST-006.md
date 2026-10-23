---
id: REQ-LST-006
title: Eigene Anzeige bearbeiten, pausieren, reaktivieren, löschen
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
use_cases: [UC-11]
depends_on: [REQ-LST-010]
version: 1.1
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-LST-006, AT-LST-006-2]
---

# REQ-LST-006 Eigene Anzeige bearbeiten, pausieren, reaktivieren, löschen

## Anforderung
Als Anbieter möchte ich meine Anzeige bearbeiten, pausieren, reaktivieren und löschen, damit sie aktuell bleibt und nur sichtbar ist, solange ich wirklich anbiete.

Erlaubte Übergänge gemäß dem normativen **Zustandsmodell Anzeige** ([Anforderungskatalog §1.2](../02-anforderungen.md)).

## Begründung
Veraltete Anzeigen frustrieren Interessenten und erzeugen unnötige Nachrichten (BG-3).

## Akzeptanzkriterien
| Aktion | Erlaubt aus Status | Ergebnis |
|---|---|---|
| Bearbeiten | Entwurf, in Prüfung, aktiv, pausiert, reserviert, abgelaufen | Inhalt geändert; geänderter Titel/Beschreibung durchläuft erneut den Wortfilter |
| Pausieren | aktiv | pausiert, nicht in der Suche |
| Reaktivieren | pausiert | aktiv |
| Löschen | jeder Status außer entfernt | gelöscht, Bilder entfernt, für andere nicht mehr abrufbar |
| jede Aktion | anderer Status | ❌ 409 „im aktuellen Zustand nicht möglich“ |

```gherkin
Szenario: Fremde Anzeige
  Angenommen die Anzeige gehört Ben
  Wenn Lea sie bearbeiten, pausieren oder löschen will
  Dann erhält Lea "nicht gefunden" (404)
```

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Nicht Eigentümer | 404, keine Existenzpreisgabe (REQ-SEC-006) |
| Unzulässiger Übergang | 409, Zustand unverändert |
| Bearbeitung fügt verbotene Begriffe ein | Anzeige geht in Prüfung (REQ-LST-010) |
| Löschen mit offener Reservierung | Reservierung wird aufgehoben |

## INVEST
I: unabhängig von Suche und Chat · N: Aktionsumfang verhandelbar · V: Aktualität · E/S: klein · T: Übergangstabelle automatisierbar.

## Nachweis
- `AT-LST-006`: Unit-Test des Zustandsautomaten (erlaubte und verbotene Übergänge).
- `AT-LST-006-2`: API-Test – pausieren, reaktivieren, löschen, fremde Anzeige → 404 (neu zu schreiben).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei, Übergangstabelle |
