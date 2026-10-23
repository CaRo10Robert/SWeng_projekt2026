---
id: REQ-SRCH-001
title: Freitextsuche mit Wortstämmen und Tippfehlertoleranz
type: user-story
class: functional
status: implemented
owner: team-marktplatz
risk: medium
release: R1
moscow: M
moscow_reason: [1]
kano: leistung
epic: EPIC-03
source: BG-2
use_cases: [UC-13]
depends_on: [REQ-PERF-001]
version: 1.2
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-SRCH-001, AT-SRCH-001-2]
---

# REQ-SRCH-001 Freitextsuche mit Wortstämmen und Tippfehlertoleranz

## Anforderung
Als Mitglied möchte ich per Freitext in Titel und Beschreibung suchen, wobei deutsche Wortformen (z. B. „Buch“/„Bücher“) und einfache Tippfehler (z. B. „Fahrad“) berücksichtigt werden, damit ich passende Anzeigen finde, ohne die genaue Schreibweise zu kennen.

## Begründung
Suchen ist eine kritische Nutzerreise. Ohne Toleranz finden Mitglieder vorhandene Angebote nicht und weichen auf andere Kanäle aus (BG-2).

**Must-Begründung:** Kriterium 1 (Release-Ziel nicht ohne sie erreichbar).

## Akzeptanzkriterien
```gherkin
Szenario: Wortstamm
  Angenommen es gibt eine aktive Anzeige "Statistik-Buch Bamberg/Baur/Krapp"
  Wenn ich nach "Bücher Statistik" suche
  Dann ist die Anzeige unter den Treffern

Szenario: Tippfehler
  Angenommen es gibt eine aktive Anzeige "Fahrrad 28 Zoll"
  Wenn ich nach "Fahrad" suche
  Dann ist die Anzeige unter den Treffern

Szenario: Relevanz
  Wenn ich mit Suchbegriff suche und keine Sortierung wähle
  Dann stehen Treffer im Titel vor Treffern nur in der Beschreibung

Szenario: Eingeschränkte Suche
  Angenommen die Volltextsuche ist gestört
  Wenn ich suche
  Dann erhalte ich Treffer aus einer einfachen Titelsuche
  Und sehe den Hinweis "eingeschränkte Suche"
```

Suchbegriff: höchstens 100 Zeichen. Nur sichtbare Anzeigen (aktiv, reserviert) werden gefunden.

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Sonderzeichen, Operatoren, SQL-ähnliche Eingaben | werden als Text behandelt, keine Fehler |
| Begriff > 100 Zeichen | 422 |

## INVEST
I: unabhängig von Filtern (REQ-SRCH-002) · N: Toleranzgrad verhandelbar · V: Kernnutzen · E: mittel · S: ein Sprint · T: Testkorpus automatisierbar.

## Nachweis
- `AT-SRCH-001`: Smoke-Test – Suche mit Tippfehler findet die Anzeige.
- `AT-SRCH-001-2`: Smoke-Test – Suche mit abweichender Wortform findet Anzeigen.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei, Akzeptanzkriterien inkl. Degradation |
| 1.2 | 2026-10-23 | Review v0.2: Must-Begründung (moscow_reason) |
