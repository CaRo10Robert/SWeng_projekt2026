---
id: REQ-NOTI-007
title: Mailserver per Konfiguration austauschbar
type: architecture
class: constraint
status: implemented
owner: team-kommunikation
risk: low
release: R1
moscow: M
kano: n/a
epic: EPIC-05
source: ADR-0005, ADR-0010, Twelve-Factor
use_cases: [UC-23]
version: 1.1
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-NOTI-007]
---

# REQ-NOTI-007 Mailserver per Konfiguration austauschbar

## Anforderung
Der Mailserver (Host, Port, Verschlüsselung, Zugangsdaten, Absender) **muss** allein über Umgebungsvariablen konfigurierbar sein, ohne neues Image. Standard im Docker-Beispiel ist der lokale Mail-Catcher Mailpit. Begründung und Umsetzung: ADR-0005, ADR-0010.

## Begründung
Ein späterer Echtbetrieb tauscht nur die Konfiguration, nicht den Code (BG-5).

## Akzeptanzkriterien
| Konfiguration | Ergebnis |
|---|---|
| keine Angaben | Versand an Mailpit (`mailpit:1025` im Compose-Setup) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM` gesetzt | Versand über den angegebenen Server mit diesem Absender |
| Zugangsdaten | stehen nicht im Image und nicht im Repository |

## Nachweis
- `AT-NOTI-007`: Konfigurationstest – App mit alternativem SMTP-Ziel starten, Mail kommt dort an (neu zu schreiben).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei, Entscheidungstabelle |
