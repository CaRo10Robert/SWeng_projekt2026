---
id: REQ-LST-010
title: Verbotene Inhalte vor Veröffentlichung in die Moderation
type: business-rule
class: constraint
status: verified
owner: team-marktplatz
risk: medium
release: R1
moscow: M
moscow_reason: [2]
kano: basis
epic: EPIC-06
source: BG-4, DSA, Hochschulordnung
use_cases: [UC-10, UC-11, UC-32]
depends_on: [REQ-MOD-002]
version: 1.3
created: 2026-10-20
last_updated: 2026-10-24
verification: [AT-LST-010, AT-LST-010-2]
---

# REQ-LST-010 Verbotene Inhalte vor Veröffentlichung in die Moderation

## Anforderung
Das System muss Anzeigen, deren Titel oder Beschreibung Begriffe aus der **Verbotsliste** enthalten (z. B. Waffen, Drogen, verschreibungspflichtige Medikamente, Prüfungslösungen, gefälschte Ausweise), **vor** der Veröffentlichung in die Moderation leiten. Das gilt bei Neuanlage und bei Bearbeitung: Eine aktive Anzeige wechselt bei einem Treffer nach „in Prüfung“ ([Zustandsmodell Anzeige](../02-anforderungen.md#4-zustandsmodell-anzeige-normativ)). Die Verbotsliste ist pflegbare Konfiguration.

## Begründung
Schutz vor rechtswidrigen und hochschulschädlichen Angeboten (BG-4); reduziert die Moderationslast gegenüber nachträglicher Entfernung.

**Must-Begründung:** Kriterium 2 (Sicherheits-, Datenschutz- oder Rechtsrisiko bei Fehlen).

## Akzeptanzkriterien
| Text | Treffer | Ergebnis |
|---|---|---|
| „Verkaufe KLAUSURLÖSUNGEN Mikro“ | ja (Groß-/Kleinschreibung egal) | in Prüfung, Fall in der Moderations-Queue |
| „Schreckschuss-Pistole“ | ja (mehrere Begriffe) | in Prüfung |
| „Waffeleisen zu verschenken“ | nein (kein Treffer in Teilwörtern) | aktiv |
| Bearbeitung einer aktiven Anzeige fügt „Tilidin“ ein | ja | in Prüfung |

```gherkin
Szenario: Anzeige in Prüfung
  Wenn meine Anzeige vom Filter angehalten wird
  Dann sehe ich "Deine Anzeige wird vor der Veröffentlichung geprüft"
  Und sie erscheint nicht in der Suche
  Und Moderatoren sehen den Fall mit den gefundenen Begriffen
```

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Umgehung durch Schreibvarianten | bewusst nicht vollständig abgedeckt; Meldungen (REQ-MOD-001) ergänzen den Filter |
| Fehlalarm | Moderator gibt frei („keine Maßnahme“), Anzeige wird aktiv |

## Nachweis
- `AT-LST-010`: Unit-Test des Wortfilters (Entscheidungstabelle).
- `AT-LST-010-2`: Smoke-Test – gefilterte Anzeige ist `in_review` und nicht suchbar.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei, Entscheidungstabelle, Bearbeitung eingeschlossen |
| 1.2 | 2026-10-23 | Review v0.2: R-05 Übergang aktiv → in Prüfung bei Bearbeitung mit Verweis auf §4; Must-Begründung; „Moderations-Queue“ |
| 1.3 | 2026-10-24 | Verifiziert im finalen Lauf gegen das Docker-Beispiel (AT-LST-010, AT-LST-010-2 bestanden bzw. ausgeführt); Status → verified |
