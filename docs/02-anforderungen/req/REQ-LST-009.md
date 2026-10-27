---
id: REQ-LST-009
title: Teilbarer Link mit Vorschau für Nicht-Mitglieder
type: user-story
class: functional
status: approved
owner: team-marktplatz
risk: medium
release: R1
moscow: C
kano: begeisterung
epic: EPIC-02
source: Wettbewerbsanalyse, Review Q-1
use_cases: [UC-14]
version: 2.0
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-LST-009]
---

# REQ-LST-009 Teilbarer Link mit Vorschau für Nicht-Mitglieder

## Anforderung
Als Mitglied möchte ich einen Link auf meine Anzeige teilen (z. B. in einer Semestergruppe), damit sie mehr Interessenten erreicht. Für Nicht-Angemeldete zeigt der Link nur eine **Vorschau** (Titel und Preis, **ohne Bild**) und den Hinweis, sich mit der Hochschuladresse anzumelden.

## Begründung
Externe Kanäle (WhatsApp-Gruppen) sind laut Wettbewerbsanalyse der Hauptkonkurrent; Teilen holt Nutzer auf die Plattform. Entscheidung Q-1: Gäste sehen keine Bilder, weil Bilder nur an Mitglieder ausgeliefert werden (REQ-SEC-007).

## Akzeptanzkriterien
```gherkin
Szenario: Vorschau für Gäste
  Angenommen eine Anzeige ist aktiv
  Wenn ein nicht angemeldeter Besucher den geteilten Link öffnet
  Dann sieht er Titel und Preis
  Und weder Bilder, Beschreibung, Anbietername noch Übergabeorte
  Und den Hinweis "Mit Hochschuladresse anmelden, um zu antworten"

Szenario: Nicht öffentlich sichtbare Anzeige
  Angenommen die Anzeige ist pausiert, in Prüfung oder gelöscht
  Wenn ein Gast den Link öffnet
  Dann sieht er "Anzeige nicht verfügbar"
```

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Durchprobieren von Links (Enumeration) | nicht erratbare IDs, Rate-Limit pro IP |
| Ausgeblendete oder gesperrte Inhalte | keine Vorschau |

## INVEST
I: unabhängig · N: Umfang der Vorschau verhandelbar · V: Reichweite · E/S: klein · T: automatisierbar.

## Nachweis
- `AT-LST-009`: API-/E2E-Test der Gast-Vorschau ohne Bild (neu). Noch nicht umgesetzt (⬜).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei, Akzeptanzkriterien |
| 2.0 | 2026-10-23 | Review v0.2: R-29 Vorschau ohne Bild nach Entscheidung Q-1 |
