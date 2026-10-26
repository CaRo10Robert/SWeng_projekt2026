---
id: REQ-LST-001
title: Angebot oder Gesuch schnell erstellen
type: user-story
class: functional
status: implemented
owner: team-marktplatz
risk: medium
release: R1
moscow: M
moscow_reason: [1]
kano: basis
epic: EPIC-02
source: BG-2
use_cases: [UC-10]
depends_on: [REQ-LST-002, REQ-LST-003, REQ-LST-004, REQ-SEC-011]
version: 1.3
created: 2026-10-20
last_updated: 2026-10-26
verification: [AT-LST-001, MAN-LST-001]
---

# REQ-LST-001 Angebot oder Gesuch schnell erstellen

## Anforderung
Als Mitglied möchte ich ein **Angebot oder Gesuch** mit Titel, Beschreibung, Kategorie, Preistyp, Übergabeort und optional Bildern in **unter 2 Minuten** erstellen, damit ich Dinge schnell anbieten oder suchen kann.

## Begründung
Eine niedrige Einstiegshürde ist das wichtigste Mittel gegen fehlende kritische Masse (BG-2). Die Anzeige ist das zentrale Objekt des Marktplatzes.

**Must-Begründung:** Kriterium 1 (Release-Ziel nicht ohne sie erreichbar).

## Akzeptanzkriterien
```gherkin
Szenario: Angebot veröffentlichen
  Angenommen ich bin als verifiziertes Mitglied angemeldet
  Wenn ich ein Angebot mit Titel "Taschenrechner FX-991", Beschreibung, Kategorie "Elektronik & Technik",
    Preistyp "Festpreis" 12,00 € und Übergabeort "Ludwigshafen Hauptcampus" absende
  Dann ist die Anzeige im Status "aktiv"
  Und sie läuft in 60 Tagen ab
  Und sie erscheint in meiner Liste "Meine Anzeigen"

Szenario: Gesuch veröffentlichen
  Wenn ich ein Gesuch "Suche Fahrradhelm" mit Preistyp "VB" 15,00 € absende
  Dann ist die Anzeige als "Gesuch" gekennzeichnet und aktiv

Szenario: Pflichtfeld fehlt
  Wenn ich ohne Titel absende
  Dann wird keine Anzeige angelegt
  Und das Feld "Titel" zeigt eine verständliche Fehlermeldung
```

| Feld | Pflicht | Grenzen |
|---|---|---|
| Art | ja | Angebot · Gesuch |
| Titel | ja | 3–80 Zeichen |
| Beschreibung | ja | 10–4.000 Zeichen |
| Kategorie | ja | aus der Kategorieliste |
| Preistyp, Preis | ja | REQ-LST-002 |
| Übergabeort | ja | REQ-LST-004 |
| Zustand | nein | neu · wie neu · gut · akzeptabel · defekt |
| Bilder | nein | REQ-LST-003 |

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Ungültige oder zu lange Eingaben | 422 mit Feldfehlern, nichts gespeichert |
| Nicht angemeldet oder nicht verifiziert | abgelehnt (REQ-SEC-011) |
| Fremde Bild-IDs referenziert | abgelehnt, fremde Bilder werden nie zugeordnet |
| Doppeltes Absenden | zwei Anzeigen möglich, begrenzt durch REQ-LST-011 |
| Verbotene Begriffe | Moderation statt Veröffentlichung (REQ-LST-010) |

## INVEST
I: Bilder separat (REQ-LST-003) · N: Feldumfang verhandelbar · V: Kernnutzen · E: gut schätzbar · S: ein Sprint · T: Szenarien automatisierbar, Zeitziel per Usability-Test.

## Nachweis
- `AT-LST-001`: Smoke-Test – Anzeige mit Bild anlegen, Status `aktiv`.
- `MAN-LST-001`: Usability-Test mit 5 Studierenden, Median der Erstellzeit < 2 min – **noch nicht durchgeführt**. Vorbereitet: [Leitfaden](../../05-umsetzung/nachweise/leitfaden-usability.md), [Protokollvorlage](../../05-umsetzung/nachweise/protokollvorlage-usability.md) und ein [fiktives Beispielprotokoll](../../05-umsetzung/nachweise/MAN-LST-001-fiktiv.md) (ausdrücklich **kein** Nachweis).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei, Akzeptanzkriterien und Feldgrenzen ergänzt |
| 1.2 | 2026-10-23 | Review v0.2: Must-Begründung (moscow_reason) |
| 1.3 | 2026-10-26 | Leitfaden, Vorlage und fiktives Beispiel für MAN-LST-001 verlinkt; Nachweis weiter offen |
