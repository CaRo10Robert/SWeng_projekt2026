---
id: REQ-NOTI-006
title: Web-Push-Benachrichtigungen
type: user-story
class: functional
status: approved
owner: team-kommunikation
risk: low
release: R1
moscow: C
kano: begeisterung
epic: EPIC-05
source: Wettbewerbsanalyse
use_cases: [UC-23]
depends_on: [REQ-UX-001, REQ-NOTI-003]
version: 1.2
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-NOTI-006]
---

# REQ-NOTI-006 Web-Push-Benachrichtigungen

## Anforderung
Als Mitglied möchte ich Benachrichtigungen über neue Nachrichten als Push-Mitteilung der installierten Web-App erhalten, damit ich schneller antworte als per E-Mail.

## Begründung
Kürzere Reaktionszeiten erhöhen die Abschlussquote; native Apps sind nicht geplant.

## Akzeptanzkriterien
```gherkin
Szenario: Einwilligung
  Wenn ich Push-Mitteilungen im Profil aktiviere
  Dann fragt der Browser nach der Erlaubnis
  Und ohne Erlaubnis werden keine Push-Mitteilungen gesendet

Szenario: Push statt Mail
  Angenommen Push ist aktiv
  Wenn ich eine neue Nachricht erhalte
  Dann erhalte ich eine Push-Mitteilung ohne Nachrichteninhalt
```

## INVEST
I: setzt PWA voraus · N: Ereignisse verhandelbar · V: schnellere Antwort · E: mittel · S: ein Sprint · T: E2E mit Browser-Mock.

## Nachweis
- `AT-NOTI-006`: E2E-Test mit simuliertem Push-Dienst (neu). Noch nicht umgesetzt (⬜); offline nur eingeschränkt vorführbar.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei, Akzeptanzkriterien |
| 1.2 | 2026-10-23 | Review v0.2: Status in-review → approved nach Review |
