---
id: LEGAL-DAC7
type: concept
status: in-review
owner: product-owner
version: 1.0
created: 2026-10-24
last_updated: 2026-10-24
---

# Konzept Steuermeldepflicht für Plattformen (DAC7 / PStTG)

> **Muster im Rahmen einer Übungsaufgabe – keine rechtsverbindlichen Angaben; mit der Steuerabteilung der Hochschule zu prüfen.** Anforderung: REQ-LEGAL-009, Entscheidung Q-26.

## Hintergrund

Die EU-Richtlinie 2021/514 (DAC7) wurde in Deutschland mit dem **Plattformen-Steuertransparenzgesetz (PStTG)** umgesetzt. Plattformbetreiber müssen dem Bundeszentralamt für Steuern (BZSt) jährlich Anbieter melden, die über die Plattform Waren verkaufen. Ob eine Hochschule als „meldender Plattformbetreiber“ gilt, ist zu klären [Platzhalter: Prüfung durch Steuerabteilung]. Das Muster geht vorsorglich davon aus.

## Begriffe

| Begriff | Bedeutung für CampusMarkt |
|---|---|
| Relevante Tätigkeit | Verkauf von Waren gegen Vergütung. Verschenken und Tausch ohne Geld zählen nicht |
| Vergütung | vereinbarter Preis eines **abgeschlossenen Deals** (REQ-CHAT-011). Ohne Bezahlfunktion kennt die Plattform den tatsächlich gezahlten Betrag nicht; maßgeblich ist im Muster der vereinbarte Preis |
| Freigestellter Anbieter | weniger als **30 Verkäufe** und insgesamt weniger als **2.000 €** Vergütung im Kalenderjahr (§ 4 Abs. 5 Nr. 4 PStTG) |
| Meldepflichtiger Anbieter | Schwelle erreicht: ≥ 30 Verkäufe **oder** ≥ 2.000 € |
| Meldezeitraum | Kalenderjahr |

## Datenfelder (§§ 13, 14 PStTG)

| Feld | In CampusMarkt vorhanden? |
|---|---|
| Vor- und Nachname | nein – nur Anzeigename; muss bei Schwellenüberschreitung erhoben werden |
| Hauptwohnsitzanschrift | nein – erheben |
| Geburtsdatum | nein – erheben |
| Steuer-Identifikationsnummer | nein – erheben |
| Gesamtvergütung je Quartal | ja (abgeschlossene Deals mit Preis) |
| Anzahl der Verkäufe je Quartal | ja |
| Gebühren der Plattform | entfällt (kostenlos) |
| Finanzkonto | entfällt (keine Bezahlfunktion) |

## Fristen

| Frist | Pflicht |
|---|---|
| laufend | Abschlüsse je Anbieter zählen |
| bei Annäherung an die Schwelle (z. B. 25 Verkäufe oder 1.500 €) | Anbieter informieren, Daten anfordern [Platzhalter: Schwelle für Vorabhinweis] |
| 31. Januar des Folgejahres | Meldung an das BZSt (elektronisch) |
| gleichzeitig | Information der gemeldeten Anbieter über die gemeldeten Daten |
| 10 Jahre | Aufbewahrung der Unterlagen |
| nach 2 Erinnerungen ohne Angaben | Konto für Verkäufe sperren bzw. Auszahlung zurückhalten (§ 22 PStTG) |

## Umsetzung im Beispiel

| Teil | Im Beispiel | Begründung |
|---|---|---|
| Auswertung je Anbieter und Kalenderjahr (Anzahl, Summe, Quartale) | **umgesetzt**: `GET /admin/reports/dac7?year=YYYY`, nur Administration, Eintrag im Audit-Log | Kern der Pflicht; aus vorhandenen Deals ableitbar |
| CSV-Export für die Meldestelle | **umgesetzt**: `…&format=csv` | Übergabe an die Steuerabteilung |
| Erhebung von Name, Anschrift, Geburtsdatum, Steuer-ID | nicht umgesetzt | Datenminimierung; erst sinnvoll mit echter Meldepflicht |
| Elektronische Meldung an das BZSt | nicht umgesetzt | keine externen Konten im Beispiel (C-06); im Echtbetrieb über das BZSt-Portal [Platzhalter] |
| Vorabhinweis an Anbieter | nicht umgesetzt | Echtbetrieb |
| Deals gelöschter Konten | **Lücke**: Löscht ein Mitglied sein Konto, werden seine Deals mit den Konversationen gelöscht und fehlen in der Auswertung | Im Echtbetrieb müssen die meldepflichtigen Angaben vor der Löschung gesichert werden; die Aufbewahrungspflicht (§ 22 PStTG, 10 Jahre) geht dem Löschanspruch vor (Art. 17 Abs. 3 lit. b DSGVO). Offener Punkt für EPIC-12 |

## Datenschutz

Rechtsgrundlage ist Art. 6 Abs. 1 lit. c DSGVO i. V. m. PStTG. Die Auswertung ist nur für Administratoren abrufbar und wird protokolliert (VVT V-11).
