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
moscow_reason: [1]
kano: leistung
epic: EPIC-03
source: BG-2, Wettbewerbsanalyse
use_cases: [UC-13]
version: 1.2
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-SRCH-002]
---

# REQ-SRCH-002 Filtern und Sortieren

## Anforderung
Als Mitglied möchte ich die Trefferliste nach **Kategorie, Angebot/Gesuch, Preistyp, Preisspanne, Übergabeort und Zustand** filtern und nach **Relevanz, Datum (neueste zuerst) oder Preis (auf-/absteigend)** sortieren, damit ich schnell nur die für mich passenden Anzeigen sehe.

## Begründung
Filter verkürzen die Suche und sind bei allen Wettbewerbern Standard (Leistungsmerkmal).

**Must-Begründung:** Kriterium 1 (Release-Ziel nicht ohne sie erreichbar).

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

**Sortierregeln**

| Sortierung | Verfügbar | Reihenfolge | Anzeigen ohne Preis (verschenken, Tausch) | Gleichstand |
|---|---|---|---|---|
| Relevanz | nur mit Suchbegriff (Standard, wenn ein Suchbegriff eingegeben ist) | beste Übereinstimmung zuerst | wie alle anderen nach Übereinstimmung | neueste zuerst |
| Neueste zuerst | immer (Standard ohne Suchbegriff) | Einstelldatum absteigend | wie alle anderen | – |
| Preis aufsteigend | immer | Preis aufsteigend | **am Anfang** | neueste zuerst |
| Preis absteigend | immer | Preis absteigend | **am Ende** | neueste zuerst |

Wird „Relevanz“ ohne Suchbegriff angefordert, gilt „Neueste zuerst“. Filter sind in der Adresse der Seite gespeichert (teilbar, Zurück-Taste funktioniert). Ein Filter „Studiengang“ (UC-13) ist in R1 bewusst nicht enthalten.

## INVEST
I: unabhängig vom Freitext · N: Filterumfang verhandelbar · V: schnellere Suche · E/S: klein · T: automatisierbar.

## Nachweis
- `AT-SRCH-002`: API-Test – Filterkombinationen und Sortierungen gegen Seed-Daten (neu).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei, Akzeptanzkriterien; Filter „Studiengang“ aus UC-13 bewusst nicht aufgenommen |
| 1.2 | 2026-10-23 | Review v0.2: R-07/R-24 vollständige Sortierregeln (preislose Anzeigen, Relevanz nur mit Suchbegriff, Gleichstand); Must-Begründung |
