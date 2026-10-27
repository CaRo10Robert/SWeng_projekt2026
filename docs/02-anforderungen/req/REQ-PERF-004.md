---
id: REQ-PERF-004
title: Zeit bis zum Versand der Bestätigungsmail
type: quality
class: quality
status: approved
owner: team-plattform
risk: medium
reviewers: [qa-lead]
release: R1
moscow: M
moscow_reason: [1]
kano: basis
epic: EPIC-01
source: BG-2
use_cases: [UC-01]
depends_on: [REQ-NOTI-005]
version: 2.3
created: 2026-10-20
last_updated: 2026-10-26
verification: [AT-PERF-004]
---

# REQ-PERF-004 Zeit bis zum Versand der Bestätigungsmail
## Anforderung
Nach der Registrierung muss die Bestätigungsmail zügig beim E-Mail-System ankommen, damit Neue die Registrierung ohne Unterbrechung abschließen.

## Begründung
Die Registrierung ist die erste kritische Nutzerreise; eine verspätete Mail kostet Neuanmeldungen (BG-2).

## Qualitätsmerkmal, Metrik, Messverfahren
| Feld | Festlegung |
|---|---|
| Qualitätsmerkmal (ISO 25010) | Performance Efficiency → Time Behaviour |
| Metrik (SLI) | Zeit von der Antwort auf die Registrierung bis zur Annahme der Mail durch den Mail-Catcher (Zeitstempel Mailpit) |
| Akzeptanzkriterium (SLO) | **p95 < 10 s** |
| Messverfahren | k6-Lasttest Registrierung mit eindeutigen Adressen; Abgleich mit der Mailpit-API |
| Messkontext | Docker-Beispiel, **50 Registrierungen/min** über 5 min, Rate-Limit für den Test angehoben |
| Degradation | Wiederholungsversuche mit Backoff; Hinweis „Die E-Mail kann einige Minuten dauern“ |
| Fehlerbudget | höchstens 5 % der Mails über 10 s; keine verlorene Mail (Dead Letter statt Verlust) |
| Last- und Datenprofil | eindeutige Adressen der Whitelist-Domains; Mailpit als Empfänger ohne Latenz; Registrierungsgrenze für den Test angehoben |
| Timeout, Retry, Idempotenz | SMTP-Verbindungs-Timeout 10 s; Versand-Job 120 s × 4 Wiederholungen (ADR-0005), danach Dead Letter; erneutes Anfordern des Links ist rate-limitiert |
| Wiederherstellung | Jobs liegen in der Datenbank und überleben einen Neustart |
| Verantwortung und Eskalation | Service-Owner team-plattform; Eskalation über den Incident-Prozess (`docs/07-betrieb/incident-prozess.md`), Rufbereitschaft im Echtbetrieb (fiktiv) |

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Mail-Relay langsam oder ausgefallen | SLO verfehlt; Wiederholung mit Backoff, danach Dead Letter; Alarm `JobFailures` |
| Warteschlange staut sich | Bestätigungsmails haben eigene Queue; Registrierung bleibt möglich, Link kann erneut angefordert werden |
| Wiederholte Registrierung bzw. erneutes Anfordern | Rate-Limits (3 je Adresse und Stunde, REQ-SEC-005); ältere Links bleiben gültig |
| Adresse existiert nicht | kein Bounce-Handling im Beispiel; unbestätigte Konten werden nach 7 Tagen gelöscht (Q-13) |

## Nachweis
- `AT-PERF-004`: k6-Lasttest Registrierung mit Mailpit-Abgleich (neu zu schreiben; Umsetzungsstand ⬜).


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 2.0 | 2026-10-23 | Merkmal/Metrik/Akzeptanzkriterium/Messverfahren getrennt (Fallstudie FS-M3) |
| 2.1 | 2026-10-23 | Review v0.2: R-15 |
| 2.2 | 2026-10-26 | Guideline-Review: GL-05 Fehler- und Missbrauchsfälle ergänzt |
| 2.3 | 2026-10-26 | Guideline-Review: GL-10 Felder aus der NFR-/SLO-Vorlage ergänzt (Fehlerbudget, Lastprofil, Timeout/Retry, Wiederherstellung, Eskalation) |
