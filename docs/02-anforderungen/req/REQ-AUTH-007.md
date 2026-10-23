---
id: REQ-AUTH-007
title: Mitgliedschaft jährlich re-verifizieren
type: business-rule
class: domain
status: approved
owner: team-identity
risk: medium
release: R2
moscow: S
kano: n/a
epic: EPIC-01
source: BG-1
use_cases: [UC-07]
depends_on: [REQ-NOTI-001]
version: 2.0
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-AUTH-007]
---

# REQ-AUTH-007 Mitgliedschaft jährlich re-verifizieren

## Anforderung
Das System soll die Hochschulzugehörigkeit **12 Monate** nach der letzten Bestätigung erneut per E-Mail-Link bestätigen lassen. Wird der Link nicht innerhalb von **30 Tagen** genutzt, wird das Konto eingeschränkt: lesen ja, keine neuen Anzeigen und keine neuen Nachrichten.

Zu dieser Anforderung gehört die E-Mail „Mitgliedschaft bestätigen“ (sicherheitsrelevant, nicht abbestellbar). Sie ist nicht Teil von REQ-NOTI-001, damit REQ-NOTI-001 in R1 vollständig erfüllbar ist.

**Release:** R2 (Entscheidung Q-14). In R1 gilt die einmalige Bestätigung nach REQ-AUTH-002.

## Begründung
Exmatrikulierte und ausgeschiedene Beschäftigte verlieren ihr Hochschulpostfach. Ohne erneute Bestätigung bliebe die Community nicht auf Hochschulangehörige beschränkt (Risiko R-3).

## Akzeptanzkriterien
| Zeit seit letzter Bestätigung | Zustand | Verhalten |
|---|---|---|
| < 12 Monate | bestätigt | keine Aktion |
| = 12 Monate | Bestätigung angefordert | E-Mail „Mitgliedschaft bestätigen“ mit Link |
| 12 Monate + 30 Tage, Link nicht genutzt | eingeschränkt | Anzeige erstellen und Nachricht senden werden abgelehnt mit Hinweis „Bitte Mitgliedschaft bestätigen“ |
| Link genutzt | bestätigt | Frist beginnt neu, Einschränkung aufgehoben |

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Mailserver nicht erreichbar | Versand wird wiederholt (REQ-NOTI-005); Frist läuft ab dem erfolgreichen Versand |
| Link abgelaufen | erneut anfordern möglich |
| Adresse nicht mehr zustellbar | erst mit Bounce-Verarbeitung erkennbar (nur Echtbetrieb, EPIC-12); bis dahin wie „Link nicht genutzt“ |

## Nachweis
- `AT-AUTH-007`: (neu) Szenario-Test mit vorgestellter Zeit über alle Tabellenzeilen inkl. Versand der Bestätigungsmail.
- Stand: nicht umgesetzt, geplant für R2.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei, Entscheidungstabelle ergänzt |
| 2.0 | 2026-10-23 | Review v0.2: R-09/R-15 Release R2 (Q-14); Re-Verifikationsmail aus REQ-NOTI-001 hierher verschoben; Bounce-Fall als EPIC-12 gekennzeichnet (R-30) |
