---
id: CTRL-DOC-LEGAL-TEXTE
type: evidence
requirement: REQ-LEGAL-001, REQ-LEGAL-002, REQ-LEGAL-003, REQ-LEGAL-004, REQ-LEGAL-005
status: done
owner: product-owner
date: 2026-10-26
---

# CTRL-DOC-LEGAL-TEXTE: Kontrolle apps/web/src/content/legal/*.de.md und *.en.md

> Übungsaufgabe: Prüfer und Freigabe sind fiktive Rollen (Q-28).

## Ziel

Kontrolle laut Nachweiskatalog für REQ-LEGAL-001, REQ-LEGAL-002, REQ-LEGAL-003, REQ-LEGAL-004, REQ-LEGAL-005: Das Dokument ist vorhanden, vollständig, mit fiktiven Übungswerten statt Platzhaltern und stimmt mit Code und anderen Dokumenten überein.

## Gegenstand

`apps/web/src/content/legal/*.de.md und *.en.md` im Stand von Branch `feature/fallstudie-req-c4` am 2026-10-26.

## Prüfpunkte

| Prüfpunkt | Ergebnis | Fundstelle bzw. Beleg |
|---|---|---|
| Alle sechs Rechtstexte in Deutsch und als englische Lesefassung | erfüllt | Impressum, Datenschutz, Nutzungsbedingungen, Community-Regeln, Barrierefreiheit, Kontakt; `check-i18n` prüft Version und Anker |
| Muster-Kennzeichnung über `sample: true` | erfüllt | in allen 12 Dateien gesetzt; `LEGAL_STRICT` verhindert einen Echtbetrieb mit Mustertexten |
| Keine Platzhalter, nur fiktive Übungswerte (Q-28) | erfüllt | 0 Vorkommen von `[Platzhalter:`; fiktive Angaben je Text mit „(fiktiv)“ gekennzeichnet |
| Pflichtabschnitte Datenschutzerklärung (12) | erfüllt | E2E AT-LEGAL-002 prüft die Abschnitte 1–12 |
| Erreichbarkeit ohne Anmeldung und von jeder Seite | erfüllt | Footer auf allen Seiten, E2E AT-LEGAL-001/-004/-005, AT-UX-006 |
| Versionierung und erneute Zustimmung | erfüllt | Front Matter `version`; AT-LEGAL-003, AT-LEGAL-002-3 |

## Ergebnis

Bestanden. Keine Korrekturen nötig.

## Freigabe

| Rolle | Name | Datum | Ergebnis |
|---|---|---|---|
| Prüfer | Product Owner mit DSB (fiktive Rollen) | 2026-10-26 | bestanden; Dokument auf `approved` gesetzt |
