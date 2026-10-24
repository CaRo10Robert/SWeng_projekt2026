---
id: REQ-SEC-013
title: Penetrationstest vor dem Go-live
type: security
class: constraint
status: approved
owner: team-plattform
risk: medium
release: R1
moscow: S
kano: n/a
epic: EPIC-13
source: REQ-SEC-001, OWASP WSTG, Q-23
depends_on: [REQ-SEC-001, REQ-SEC-009]
version: 1.0
created: 2026-10-24
last_updated: 2026-10-24
verification: [CTRL-DOC-PENTEST, MAN-SEC-013]
---

# REQ-SEC-013 Penetrationstest vor dem Go-live
## Anforderung
Vor einem Echtbetrieb muss ein unabhängiger Penetrationstest nach einem dokumentierten Testplan durchgeführt werden; Befunde der Schwere hoch und kritisch müssen vor dem Go-live behoben sein.

## Begründung
Automatisierte Scans (REQ-SEC-008) und Threat Model (REQ-SEC-009) finden nicht alle Lücken in Geschäftslogik und Autorisierung (z. B. Kontaktfreigabe, Widerspruchslinks).

## Akzeptanzkriterien
- `docs/07-betrieb/pentest-plan.md`: Umfang (Web-Oberfläche, API, WebSocket, Uploads, Widerspruchslinks, Admin-Funktionen), Ausschlüsse, Methode (OWASP WSTG, ASVS Level 2), Testkonten, Zeitraum `[Platzhalter]`, Ansprechpartner `[Platzhalter]`, Umgang mit Befunden (Schweregrad nach CVSS, Fristen).
- Go-live-Checkliste verlangt den Abschlussbericht ohne offene hohe oder kritische Befunde.

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Test gegen Produktivdaten | nicht zulässig; Test gegen Staging mit Testdaten |
| Kritischer Befund kurz vor dem Go-live | Go-live verschoben |

## Nachweis
- `CTRL-DOC-PENTEST`: Kontrolle `docs/07-betrieb/pentest-plan.md` – Umfang, Methode, Befundbehandlung vorhanden.
- `MAN-SEC-013`: Abschlussbericht des Penetrationstests (erst vor einem Echtbetrieb).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-24 | Erstfassung aus dem Abgleich Recht, Auftritt und Betrieb ([06-abgleich-recht-betrieb.md](../06-abgleich-recht-betrieb.md)); als Übung mit Platzhaltern freigegeben (Q-23) |
