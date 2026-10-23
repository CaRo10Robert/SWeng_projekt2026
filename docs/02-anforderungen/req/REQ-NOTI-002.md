---
id: REQ-NOTI-002
title: Gebündelte Benachrichtigung über neue Nachrichten ohne Inhalt
type: business-rule
class: functional
status: implemented
owner: team-kommunikation
risk: medium
release: R1
moscow: M
kano: leistung
epic: EPIC-05
source: BG-3, DSGVO Art. 5 (Datenminimierung)
use_cases: [UC-21, UC-23]
depends_on: [REQ-NOTI-001]
version: 1.1
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-NOTI-002]
---

# REQ-NOTI-002 Gebündelte Benachrichtigung über neue Nachrichten ohne Inhalt

## Anforderung
Benachrichtigungen über neue Chatnachrichten **müssen** gebündelt werden: höchstens **eine E-Mail pro Konversation und Empfänger innerhalb von 15 Minuten**, nur wenn zum Versandzeitpunkt noch eine Nachricht ungelesen ist, und **ohne Nachrichteninhalt** (nur Anzeigentitel und Link).

## Begründung
Ohne Benachrichtigung bleiben Anfragen unbeantwortet (BG-3); zu viele Mails werden als Spam empfunden. Chatinhalte sind vertraulich und gehören nicht in E-Mails.

## Akzeptanzkriterien
| Situation | E-Mail |
|---|---|
| Nachricht ungelesen 15 min nach Eingang | 1 E-Mail |
| Nachricht innerhalb von 15 min gelesen | keine |
| 5 Nachrichten derselben Konversation in 15 min | 1 E-Mail |
| Nachrichten in 2 verschiedenen Konversationen | je 1 E-Mail |
| Weitere Nachricht 10 min nach der letzten E-Mail | keine zweite vor Ablauf der 15 min |
| Empfänger hat „Neue Nachrichten“ abbestellt | keine (REQ-NOTI-003) |
| Systemnachricht (z. B. Reservierung) | keine |

Inhalt der E-Mail: Betreff „Neue Nachricht zu „<Anzeigentitel>““, Link zur Konversation, kein Nachrichtentext, kein Absendername außer dem Anzeigennamen.

## Nachweis
- `AT-NOTI-002`: Szenario-Test mit verkürzter Wartezeit – Bündelung, Lesen vor Versand, kein Inhalt in der Mail (neu zu schreiben).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei, Entscheidungstabelle |
