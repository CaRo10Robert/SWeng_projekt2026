---
id: CTRL-DOC-DAC7
type: evidence
requirement: REQ-LEGAL-009
status: done
owner: product-owner
date: 2026-10-26
---

# CTRL-DOC-DAC7: Kontrolle docs/06-recht/dac7-konzept.md

> Übungsaufgabe: Prüfer und Freigabe sind fiktive Rollen (Q-28).

## Ziel

Kontrolle laut Nachweiskatalog für REQ-LEGAL-009: Das Dokument ist vorhanden, vollständig, mit fiktiven Übungswerten statt Platzhaltern und stimmt mit Code und anderen Dokumenten überein.

## Gegenstand

`docs/06-recht/dac7-konzept.md` im Stand von Branch `feature/fallstudie-req-c4` am 2026-10-26.

## Prüfpunkte

| Prüfpunkt | Ergebnis | Fundstelle bzw. Beleg |
|---|---|---|
| Zählregeln und Schwellen | erfüllt | 30 Verkäufe oder 2.000 € je Kalenderjahr; Tausch zählt nicht (Übungsannahme A-12) |
| Fehlende Stammdaten benannt | erfüllt | Steuer-ID, Anschrift, Geburtsdatum werden im Beispiel nicht erhoben |
| Meldeweg und Fristen | erfüllt | BZSt, Frist 31.01.; im Beispiel nur Auswertung und CSV |
| Lücke bei gelöschten Konten | erfüllt | als offener Punkt für EPIC-12 dokumentiert |

## Ergebnis

Bestanden. Keine Korrekturen nötig.

## Freigabe

| Rolle | Name | Datum | Ergebnis |
|---|---|---|---|
| Prüfer | Product Owner mit DSB (fiktive Rollen) | 2026-10-26 | bestanden; Dokument auf `approved` gesetzt |
