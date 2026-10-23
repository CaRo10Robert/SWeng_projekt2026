---
id: REQ-PERF-004
title: Zeit bis zum Versand der Bestätigungsmail
type: quality
class: quality
status: in-review
owner: team-plattform
risk: medium
release: R1
moscow: M
kano: basis
epic: EPIC-01
source: BG-2
use_cases: [UC-01]
depends_on: [REQ-NOTI-005]
version: 2.0
created: 2026-10-20
last_updated: 2026-10-23
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

## Nachweis
- `AT-PERF-004`: k6-Lasttest Registrierung mit Mailpit-Abgleich (neu zu schreiben; Umsetzungsstand ⬜).


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 2.0 | 2026-10-23 | Merkmal/Metrik/Akzeptanzkriterium/Messverfahren getrennt (Fallstudie FS-M3) |
