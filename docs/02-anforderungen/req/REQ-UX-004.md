---
id: REQ-UX-004
title: Startseite für Gäste
type: user-story
class: functional
status: approved
owner: team-produkt
risk: low
release: R1
moscow: S
kano: leistung
epic: EPIC-13
source: BG-2, Q-1
use_cases: [UC-08]
version: 1.0
created: 2026-10-24
last_updated: 2026-10-24
verification: [AT-UX-004]
---

# REQ-UX-004 Startseite für Gäste
## Anforderung
Als Gast möchte ich auf der Startseite verstehen, was CampusMarkt ist, wer mitmachen darf und wie es funktioniert, damit ich mich registriere oder anmelde.

## Begründung
Bisher landen Gäste direkt auf der Anmeldung. Eine Startseite senkt die Einstiegshürde (BG-2) und erklärt die Zugangsbeschränkung.

## Akzeptanzkriterien
- Inhalte: Nutzenversprechen in einem Satz; „Nur für Hochschulangehörige mit `@hwg-lu.de` oder `@studmail.hwg-lu.de`“; Ablauf in drei Schritten (registrieren → anbieten oder finden → auf dem Campus übergeben); Sicherheitshinweise in Kurzform mit Link zur Hilfe; Schaltflächen „Registrieren“ und „Anmelden“; Seitenfuß.
- Keine Anzeigen, keine Bilder von Mitgliedern (Q-1).
- Angemeldete Mitglieder werden zur Suche weitergeleitet.

## INVEST
I: unabhängig · N: Texte verhandelbar · V: Einstieg · E: klein · S: ein Tag · T: E2E-Test.

## Nachweis
- `AT-UX-004`: E2E-Test – Gast sieht die Startseite mit Zugangsregel, drei Schritten, Registrieren und Anmelden; angemeldetes Mitglied wird zur Suche weitergeleitet; axe-core ohne Verstöße `serious`/`critical`.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-24 | Erstfassung aus dem Abgleich Recht, Auftritt und Betrieb ([06-abgleich-recht-betrieb.md](../06-abgleich-recht-betrieb.md)); als Übung mit Platzhaltern freigegeben (Q-23) |
