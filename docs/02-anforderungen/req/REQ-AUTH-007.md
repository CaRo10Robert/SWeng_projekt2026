---
id: REQ-AUTH-007
title: Mitgliedschaft jährlich re-verifizieren
type: business-rule
class: domain
status: in-review
owner: team-identity
risk: medium
release: R1
moscow: S
kano: n/a
epic: EPIC-01
source: Risiko R-3
use_cases: [UC-07]
depends_on: [REQ-NOTI-001]
version: 1.1
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-AUTH-007]
---

# REQ-AUTH-007 Mitgliedschaft jährlich re-verifizieren

## Anforderung
Das System soll die Hochschulzugehörigkeit **12 Monate** nach der letzten Bestätigung erneut per E-Mail-Link bestätigen lassen. Wird der Link nicht innerhalb von **30 Tagen** genutzt, wird das Konto eingeschränkt: lesen ja, keine neuen Anzeigen und keine neuen Nachrichten.

## Begründung
Exmatrikulierte und ausgeschiedene Beschäftigte verlieren ihr Hochschulpostfach. Ohne erneute Bestätigung bliebe die Community nicht auf Hochschulangehörige beschränkt (Risiko R-3).

## Akzeptanzkriterien
| Zeit seit letzter Bestätigung | Zustand | Verhalten |
|---|---|---|
| < 12 Monate | bestätigt | keine Aktion |
| = 12 Monate | Bestätigung angefordert | E-Mail mit Link (sicherheitsrelevant, nicht abbestellbar) |
| 12 Monate + 30 Tage, Link nicht genutzt | eingeschränkt | Anzeige erstellen und Nachricht senden werden abgelehnt mit Hinweis „Bitte Mitgliedschaft bestätigen“ |
| Link genutzt | bestätigt | Frist beginnt neu, Einschränkung aufgehoben |

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Mailserver nicht erreichbar | Versand wird wiederholt (REQ-NOTI-005); Frist läuft ab dem erfolgreichen Versand |
| Link abgelaufen | erneut anfordern möglich |

## Nachweis
- `AT-AUTH-007`: neu zu schreiben – Szenario-Test mit vorgestellter Zeit über alle Tabellenzeilen.
- Stand: **nicht umgesetzt** (Umsetzungsstand ⬜).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei, Entscheidungstabelle ergänzt |
