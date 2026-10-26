---
id: REQ-LEGAL-005
title: Zentrale Kontaktstelle
type: business-rule
class: constraint
status: verified
owner: team-produkt
risk: low
release: R1
moscow: M
moscow_reason: [2]
kano: basis
epic: EPIC-13
source: DSA Art. 11, Art. 12, Q-23
use_cases: [UC-08]
version: 1.3
created: 2026-10-24
last_updated: 2026-10-25
verification: [AT-LEGAL-005, CTRL-DOC-LEGAL-TEXTE]
---

# REQ-LEGAL-005 Zentrale Kontaktstelle
## Anforderung
Das System muss eine Kontaktseite bereitstellen, die die zentrale Kontaktstelle für Nutzer (DSA Art. 12) und für Behörden (DSA Art. 11) mit elektronischem Kontaktweg und Sprachen nennt und auf Melden, Widerspruch, Datenschutzanfragen und Sicherheitslücken verweist.

> Übungsaufgabe: Betreiberangaben sind fiktive Übungswerte (z. B. Musternamen, Anschriften mit „(fiktiv)“, Domains `.example`); offene Rechtsfragen sind als Übungsannahmen festgelegt (Q-23, Q-28). Kein Rechtsrat, keine Nutzung im Echtbetrieb.

## Begründung
Vermittlungsdienste müssen eine Kontaktstelle benennen, die schnell und direkt elektronisch erreichbar ist und nicht ausschließlich automatisiert antwortet.

## Akzeptanzkriterien
| Anliegen | Weg auf der Kontaktseite |
|---|---|
| Allgemeine Fragen, Kontaktstelle für Nutzer | `kontakt-dsa@hwg-lu.example`, Sprachen Deutsch und Englisch |
| Kontaktstelle für Behörden | `behoerden@hwg-lu.example`, Sprachen Deutsch und Englisch |
| Rechtswidrigen Inhalt melden | Verweis auf „Melden“ an Anzeige, Nachricht, Profil (REQ-MOD-001) |
| Widerspruch gegen eine Moderationsentscheidung | Verweis auf „Meine Mitteilungen“ (REQ-LEGAL-007) |
| Datenschutzanfragen | Datenschutzbeauftragte/r (Platzhalter), Export und Löschung im Profil |
| Barriere melden | Erklärung zur Barrierefreiheit (REQ-LEGAL-004) |
| Sicherheitslücke melden | `/.well-known/security.txt` (REQ-SEC-012) |

## Fehler- und Missbrauchsfälle
N/A – reine Informationsseite; Risiko niedrig.

## Nachweis
- `AT-LEGAL-005`: E2E-Test – Kontaktseite ohne Anmeldung erreichbar, alle 7 Anliegen mit Weg sichtbar.
- `CTRL-DOC-LEGAL-TEXTE`: Kontrolle der Rechtstexte (siehe REQ-LEGAL-001).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-24 | Erstfassung aus dem Abgleich Recht, Auftritt und Betrieb ([06-abgleich-recht-betrieb.md](../06-abgleich-recht-betrieb.md)); als Übung mit Platzhaltern freigegeben (Q-23) |
| 1.1 | 2026-10-25 | Review v1.3 (RV-R-11, RV-R-10): Status nach Umsetzung; Kontaktseite nennt jetzt Widerspruch und eigene Behördenadresse |
| 1.2 | 2026-10-25 | Verifiziert im finalen Lauf gegen das Docker-Beispiel (AT-LEGAL-005, CTRL-DOC-LEGAL-TEXTE bestanden bzw. ausgeführt); Status → verified |
| 1.3 | 2026-10-25 | Q-28: Platzhalter durch fiktive Übungswerte und offene Prüfpunkte durch Übungsannahmen ersetzt |
