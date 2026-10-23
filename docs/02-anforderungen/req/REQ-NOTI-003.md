---
id: REQ-NOTI-003
title: Benachrichtigungen pro Kategorie abbestellen
type: user-story
class: functional
status: implemented
owner: team-kommunikation
risk: low
release: R1
moscow: S
kano: leistung
epic: EPIC-05
source: DSGVO Art. 21, UWG § 7
use_cases: [UC-24]
version: 1.2
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-NOTI-003]
---

# REQ-NOTI-003 Benachrichtigungen pro Kategorie abbestellen

## Anforderung
Als Mitglied möchte ich Benachrichtigungs-E-Mails **pro Kategorie** abbestellen, damit ich nur die Mails bekomme, die ich will. Sicherheits- und vorgangsrelevante E-Mails (siehe REQ-NOTI-001, „nicht abbestellbar“) sind ausgenommen.

| Kategorie | Abbestellbar | MVP |
|---|---|---|
| Neue Nachrichten | ja | ✅ |
| Ablauf-Erinnerungen | ja | ✅ |
| Suchaufträge | ja | mit REQ-SRCH-005 |

## Begründung
Selbstbestimmung über Werbe- und Hinweis-Mails; reduziert Spam-Beschwerden.

## Akzeptanzkriterien
```gherkin
Szenario: Nachrichten-Mails abbestellen
  Angenommen ich habe "Neue Nachrichten" im Profil deaktiviert
  Wenn mir jemand schreibt und ich die Nachricht 15 Minuten nicht lese
  Dann erhalte ich keine E-Mail
  Und die Nachricht ist in der Plattform sichtbar

Szenario: Sicherheitsmail
  Angenommen ich habe alle Kategorien deaktiviert
  Wenn ich ein neues Passwort anfordere
  Dann erhalte ich trotzdem die E-Mail
```

## INVEST
I: unabhängig · N: Kategorien verhandelbar · V: Kontrolle · E/S: klein · T: automatisierbar.

## Nachweis
- `AT-NOTI-003`: Szenario-Test – abbestellte Kategorie erzeugt keine Mail, Sicherheitsmail trotzdem (neu).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei, Kategorien und Akzeptanzkriterien |
| 1.2 | 2026-10-23 | Review v0.2: formale Prüfung ohne inhaltliche Änderung |
