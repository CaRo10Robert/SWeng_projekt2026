---
id: CTRL-DOC-DSA
type: evidence
requirement: REQ-LEGAL-008
status: done
owner: product-owner
date: 2026-10-26
---

# CTRL-DOC-DSA: Kontrolle docs/06-recht/dsa-prozesse.md

> Übungsaufgabe: Prüfer und Freigabe sind fiktive Rollen (Q-28).

## Ziel

Kontrolle laut Nachweiskatalog für REQ-LEGAL-008: Das Dokument ist vorhanden, vollständig, mit fiktiven Übungswerten statt Platzhaltern und stimmt mit Code und anderen Dokumenten überein.

## Gegenstand

`docs/06-recht/dsa-prozesse.md` im Stand von Branch `feature/fallstudie-req-c4` am 2026-10-26.

## Prüfpunkte

| Prüfpunkt | Ergebnis | Fundstelle bzw. Beleg |
|---|---|---|
| Melde- und Abhilfeverfahren (Art. 16) | erfüllt | Abschnitt mit Ablauf und Mitteilung an Meldende |
| Begründung (Art. 17) inkl. Rechtsgrundlage bei rechtswidrigen Inhalten | erfüllt | Abschnitt mit Vorlage; `legalGround` bei `illegal_content` |
| Widerspruch (Art. 20) mit Frist und Vier-Augen-Prinzip | erfüllt | 6 Monate, anderer Moderator, Ergebnis an beide Seiten |
| Straftatverdacht (Art. 18) | erfüllt | Kennzeichnung, Beweissicherung, Meldeweg (Übungsannahme) |
| Kontaktstellen (Art. 11, 12) | erfüllt | Verweis auf Rechtstext Kontakt |
| Zuständigkeiten | erfüllt | fiktive Rollen nach Q-28 statt Platzhaltern |
| Transparenzbericht | erfüllt nach Korrektur | Abschnitt war doppelt vorhanden; bei dieser Kontrolle zusammengeführt |

## Ergebnis

Bestanden. 1 Punkt(e) wurden bei der Kontrolle korrigiert und danach erneut geprüft.

## Freigabe

| Rolle | Name | Datum | Ergebnis |
|---|---|---|---|
| Prüfer | Product Owner mit DSB (fiktive Rollen) | 2026-10-26 | bestanden; Dokument auf `approved` gesetzt |
