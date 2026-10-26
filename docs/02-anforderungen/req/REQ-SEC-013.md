---
id: REQ-SEC-013
title: Penetrationstest vor dem Go-live
type: security
class: constraint
status: verified
owner: team-plattform
risk: medium
release: R1
moscow: S
kano: n/a
epic: EPIC-13
source: REQ-SEC-001, OWASP WSTG, Q-23
depends_on: [REQ-SEC-001, REQ-SEC-009]
version: 1.4
created: 2026-10-24
last_updated: 2026-10-26
verification: [CTRL-DOC-PENTEST, MAN-SEC-013]
---

# REQ-SEC-013 Penetrationstest vor dem Go-live
## Anforderung
Vor einem Echtbetrieb muss ein unabhängiger Penetrationstest nach einem dokumentierten Testplan durchgeführt werden; Befunde der Schwere hoch und kritisch müssen vor dem Go-live behoben sein.

## Begründung
Automatisierte Scans (REQ-SEC-008) und Threat Model (REQ-SEC-009) finden nicht alle Lücken in Geschäftslogik und Autorisierung (z. B. Kontaktfreigabe, Widerspruchslinks).

## Akzeptanzkriterien
- `docs/07-betrieb/pentest-plan.md`: Umfang (Web-Oberfläche, API, WebSocket, Uploads, Widerspruchslinks, Admin-Funktionen), Ausschlüsse, Methode (OWASP WSTG, ASVS Level 2), Testkonten, Zeitraum (fiktiv: KW 10/2027), Ansprechpartner (fiktiv: Musterprüf GmbH), Umgang mit Befunden (Schweregrad nach CVSS, Fristen).
- Go-live-Checkliste verlangt den Abschlussbericht ohne offene hohe oder kritische Befunde.

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Test gegen Produktivdaten | nicht zulässig; Test gegen Staging mit Testdaten |
| Kritischer Befund kurz vor dem Go-live | Go-live verschoben |

## Nachweis
- `CTRL-DOC-PENTEST`: Kontrolle `docs/07-betrieb/pentest-plan.md` – Umfang, Methode, Befundbehandlung vorhanden.
- `MAN-SEC-013`: Abschlussbericht des Penetrationstests – als Übungs-Pentest durchgeführt (kein externer Tester): [MAN-SEC-013](../../05-umsetzung/nachweise/MAN-SEC-013.md), Rohdaten `pentest-results.json`, ZAP-Zusammenfassungen in `zap/`. 49 gezielte Prüfungen, 47 bestanden, 2 akzeptierte Demo-Befunde (PT-F-17 API-Doku im Demo-Modus, PT-F-18 `/metrics` am lokalen Port); kein kritischer oder hoher Befund. Behoben: PT-F-01, 02, 03, 13, 14, 15, 16. Offen als Backlog: PT-F-04 bis PT-F-12 (B-59 bis B-63).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-24 | Erstfassung aus dem Abgleich Recht, Auftritt und Betrieb ([06-abgleich-recht-betrieb.md](../06-abgleich-recht-betrieb.md)); als Übung mit Platzhaltern freigegeben (Q-23) |
| 1.1 | 2026-10-25 | Review v1.3 (RV-R-11): Status nach Umsetzung (Pentest-Plan vorhanden; Durchführung MAN-SEC-013 vor Go-live offen) |
| 1.2 | 2026-10-25 | Q-28: Platzhalter durch fiktive Übungswerte und offene Prüfpunkte durch Übungsannahmen ersetzt |
| 1.3 | 2026-10-26 | Übungs-Pentest MAN-SEC-013 verlinkt; offene Empfehlungen als B-59…B-63 |
| 1.4 | 2026-10-26 | Verifiziert im finalen Lauf gegen das Docker-Beispiel (CTRL-DOC-PENTEST, MAN-SEC-013 bestanden bzw. ausgeführt); Status → verified |
