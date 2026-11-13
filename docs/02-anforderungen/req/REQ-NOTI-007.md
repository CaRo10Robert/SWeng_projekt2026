---
id: REQ-NOTI-007
title: Mailserver per Konfiguration austauschbar
type: architecture
class: constraint
status: verified
owner: team-kommunikation
risk: low
release: R1
moscow: M
moscow_reason: [3]
kano: n/a
epic: EPIC-05
source: ADR-0005, ADR-0010, Twelve-Factor
use_cases: [UC-23]
version: 1.3
created: 2026-10-20
last_updated: 2026-11-13
verification: [AT-NOTI-007]
---

# REQ-NOTI-007 Mailserver per Konfiguration austauschbar

## Anforderung
Der Mailserver (Host, Port, Verschlüsselung, Zugangsdaten, Absender) **muss** allein über Umgebungsvariablen konfigurierbar sein, ohne neues Image. Standard im Docker-Beispiel ist der lokale Mail-Catcher Mailpit. Begründung und Umsetzung: ADR-0005, ADR-0010.

## Begründung
Ein späterer Echtbetrieb tauscht nur die Konfiguration, nicht den Code (BG-5).

**Must-Begründung:** Kriterium 3 (Betreibbarkeit des Beispiels).

## Akzeptanzkriterien
| Konfiguration | Ergebnis |
|---|---|
| keine Angaben | Versand an Mailpit (`mailpit:1025` im Compose-Setup) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM` gesetzt | Versand über den angegebenen Server mit diesem Absender |
| Zugangsdaten | stehen nicht im Image und nicht im Repository |

## Nachweis
- `AT-NOTI-007`: Konfigurationstest – Konfiguration allein aus Umgebungsvariablen laden und über einen alternativen SMTP-Server versenden: Absender, Empfänger und Zugangsdaten kommen dort an; ohne Angaben zeigt die Konfiguration auf den lokalen Mail-Catcher (`smtp-mail.test.ts`). Dass Zugangsdaten nicht in Image und Repository stehen, prüfen `.dockerignore` (`.env`, `.env.*`) und der Secret-Scan (gitleaks) in CI.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei, Entscheidungstabelle |
| 1.2 | 2026-10-23 | Review v0.2: Must-Begründung (moscow_reason) |
| 1.3 | 2026-11-13 | Nachweis AT-NOTI-007 umgesetzt; Status → verified |
