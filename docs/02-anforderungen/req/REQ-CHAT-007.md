---
id: REQ-CHAT-007
title: Begrenzung von Nachrichtenlänge und Sendehäufigkeit
type: security
class: constraint
status: implemented
owner: team-kommunikation
risk: medium
release: R1
moscow: M
kano: n/a
epic: EPIC-04
source: Abuse-Schutz, REQ-SEC-005
use_cases: [UC-20, UC-21]
version: 1.1
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-CHAT-007, AT-CHAT-007-2]
---

# REQ-CHAT-007 Begrenzung von Nachrichtenlänge und Sendehäufigkeit

## Anforderung
Nachrichten sind auf **2.000 Zeichen** begrenzt. Ein Konto darf höchstens **20 neue Konversationen pro Stunde** starten und höchstens **60 Nachrichten pro Minute** senden.

## Begründung
Schutz vor Spam und massenhafter Kontaktaufnahme (Abuse Case), ohne normale Nutzung einzuschränken.

## Akzeptanzkriterien
| Situation | Ergebnis |
|---|---|
| Nachricht mit 2.000 Zeichen | ✅ |
| Nachricht mit 2.001 Zeichen oder leer | ❌ 422 |
| 21. neue Konversation innerhalb einer Stunde | ❌ 429 mit Wartezeit (`Retry-After`) |
| Nachricht in bestehender Konversation nach 20 neuen | ✅ |
| 61. Nachricht innerhalb einer Minute | ❌ 429 |

Das Limit gilt über alle Geräte und Fenster eines Kontos.

## Nachweis
- `AT-CHAT-007`: API-Test – Längengrenze (neu zu schreiben).
- `AT-CHAT-007-2`: API-Test – Rate-Limits für Konversationen und Nachrichten (neu zu schreiben).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei, Entscheidungstabelle |
