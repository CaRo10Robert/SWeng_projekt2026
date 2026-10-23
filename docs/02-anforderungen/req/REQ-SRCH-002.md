---
id: REQ-SRCH-002
title: Filtern und Sortieren
type: user-story
class: functional
status: implemented
owner: team-marktplatz
risk: low
release: R1
moscow: M
kano: leistung
epic: EPIC-03
source: BG-2, Wettbewerbsanalyse
use_cases: [UC-13]
version: 1.1
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-SRCH-002]
---

# REQ-SRCH-002 Filtern und Sortieren

## Anforderung
Als Mitglied möchte ich die Trefferliste nach **Kategorie, Angebot/Gesuch, Preistyp, Preisspanne, Übergabeort und Zustand** filtern und nach **Relevanz, Datum (neueste zuerst) oder Preis (auf-/absteigend)** sortieren, damit ich schnell nur die für mich passenden Anzeigen sehe.

## Begründung
Filter verkürzen die Suche und sind bei allen Wettbewerbern Standard (Leistungsmerkmal).

## Akzeptanzkriterien
```gherkin
Szenario: Kombinierte Filter
  Wenn ich Kategorie "Bücher & Skripte", Preistyp "Festpreis" und Preis bis 20 € wähle
  Dann enthält die Trefferliste nur Festpreis-Anzeigen dieser Kategorie mit Preis ≤ 20,00 €

Szenario: Sortierung nach Preis
  Wenn ich "Preis aufsteigend" wähle
  Dann sind die Treffer nach Preis aufsteigend geordnet
  Und Anzeigen ohne Preis (verschenken, Tausch) stehen am Anfang

Szenario: Standardsortierung
  Wenn ich ohne Suchbegriff suche
  Dann sind die Treffer nach Einstelldatum absteigend sortiert

Szenario: Blättern
  Wenn es mehr Treffer als eine Seite gibt
  Dann kann ich weitere Treffer nachladen, ohne Duplikate
```

Filter sind in der Adresse der Seite gespeichert (teilbar, Zurück-Taste funktioniert).

## INVEST
I: unabhängig vom Freitext · N: Filterumfang verhandelbar · V: schnellere Suche · E/S: klein · T: automatisierbar.

## Nachweis
- `AT-SRCH-002`: API-Test – Filterkombinationen und Sortierungen gegen Seed-Daten (neu zu schreiben).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei, Akzeptanzkriterien; Filter „Studiengang“ aus UC-13 bewusst nicht aufgenommen |
