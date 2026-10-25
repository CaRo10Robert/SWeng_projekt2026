---
id: REQ-UX-006
title: Rechtliche Links auf jeder Seite und in jeder E-Mail
type: business-rule
class: constraint
status: verified
owner: team-produkt
risk: medium
release: R1
moscow: M
moscow_reason: [2]
kano: basis
epic: EPIC-13
source: DDG § 5, DSGVO Art. 12, Q-23
depends_on: [REQ-LEGAL-001, REQ-NOTI-001]
version: 1.2
created: 2026-10-24
last_updated: 2026-10-25
verification: [AT-UX-006, AT-UX-006-2]
---

# REQ-UX-006 Rechtliche Links auf jeder Seite und in jeder E-Mail
## Anforderung
Jede Seite des Systems (auch Anmeldung, Registrierung, Fehler- und Wartungsseiten) muss im Seitenfuß Links zu Impressum, Datenschutz, Nutzungsbedingungen, Barrierefreiheit, Kontakt und Hilfe enthalten. Jede E-Mail des Systems muss in der Fußzeile den Absender und Links zu Impressum und Datenschutz enthalten.

## Begründung
„Leicht erkennbar, unmittelbar erreichbar und ständig verfügbar“ (DDG § 5) gilt für jede Seite; E-Mails sind Teil des Dienstes und tragen ebenfalls die Anbieterkennzeichnung.

## Akzeptanzkriterien
| Ort | Pflichtlinks |
|---|---|
| Seitenfuß jeder Route | Impressum, Datenschutz, Nutzungsbedingungen, Barrierefreiheit, Kontakt, Hilfe |
| Fußzeile jeder E-Mail-Vorlage | Absender `[Platzhalter: Name der Hochschule]`, Impressum, Datenschutz; bei Benachrichtigungen zusätzlich Abmeldelink (REQ-NOTI-003) |

Links sind per Tastatur erreichbar und haben eindeutige Namen (REQ-A11Y-001).

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Neue Route ohne Layout | AT-UX-006 schlägt fehl |
| Neue E-Mail-Vorlage ohne Fußzeile | AT-UX-006-2 schlägt fehl |

## Nachweis
- `AT-UX-006`: E2E-Test – alle öffentlichen und internen Routen sowie die 404-Seite enthalten die sechs Links im Seitenfuß.
- `AT-UX-006-2`: Unit-Test – jede E-Mail-Vorlage enthält Absender, Impressum- und Datenschutz-Link.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-24 | Erstfassung aus dem Abgleich Recht, Auftritt und Betrieb ([06-abgleich-recht-betrieb.md](../06-abgleich-recht-betrieb.md)); als Übung mit Platzhaltern freigegeben (Q-23) |
| 1.1 | 2026-10-25 | Review v1.3 (RV-R-11): Status nach Umsetzung |
| 1.2 | 2026-10-25 | Verifiziert im finalen Lauf gegen das Docker-Beispiel (AT-UX-006, AT-UX-006-2 bestanden bzw. ausgeführt); Status → verified |
