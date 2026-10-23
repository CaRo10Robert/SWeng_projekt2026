---
id: REQ-MOD-002
title: Moderations-Queue bearbeiten
type: user-story
class: functional
status: implemented
owner: team-vertrauen
risk: high
reviewers: [product-owner, security-lead]
release: R1
moscow: M
kano: basis
epic: EPIC-06
source: DSA Art. 16/17, BG-4
use_cases: [UC-32, UC-33, UC-34]
depends_on: [REQ-MOD-001, REQ-SEC-006]
version: 1.1
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-MOD-002, AT-MOD-002-2]
---

# REQ-MOD-002 Moderations-Queue bearbeiten
## Anforderung
Als Moderator möchte ich offene Meldungen mit ihrem Kontext in einer Queue sehen und je Fall eine der Entscheidungen *keine Maßnahme*, *Inhalt entfernen*, *verwarnen* oder *sperren* mit Begründung treffen, damit Verstöße zeitnah und nachvollziehbar behandelt werden.

## Begründung
Ohne Bearbeitung laufen Meldungen ins Leere; DSA Art. 16/17 verlangt eine begründete Entscheidung.

## Akzeptanzkriterien
```gherkin
Szenario: Inhalt entfernen
  Angenommen in der Queue liegt ein Fall zur Anzeige "Altklausuren mit Klausurlösungen"
  Wenn ich als Moderator "Inhalt entfernen" mit der Begründung "Prüfungslösungen sind verboten" wähle
  Dann ist die Anzeige für Mitglieder nicht mehr sichtbar
  Und der Fall wechselt nach "Entschieden"

Szenario: Wortfilter-Fall freigeben
  Angenommen eine Anzeige wurde vom Wortfilter angehalten
  Wenn ich "keine Maßnahme" wähle
  Dann wird die Anzeige veröffentlicht

Szenario: Sperren
  Wenn ich "sperren" wähle
  Dann kann sich das betroffene Mitglied nicht mehr anmelden
  Und seine Anzeigen sind nicht mehr sichtbar
  Und die Adresse kann nicht erneut registriert werden (REQ-AUTH-008)
```

| Entscheidung | Anzeige | Nachricht | Profil |
|---|---|---|---|
| keine Maßnahme | wird (wieder) sichtbar | bleibt | bleibt |
| entfernen | entfernt | Text durch Hinweis ersetzt | wie verwarnen |
| verwarnen | bleibt, Mitteilung an Betroffene | bleibt, Mitteilung | Mitteilung |
| sperren | entfernt, Konto gesperrt | Text ersetzt, Konto gesperrt | Konto gesperrt |

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Mitglied ohne Moderatorrolle ruft die Queue auf | 403 |
| Fall wurde parallel bereits entschieden | 409, keine zweite Entscheidung |
| Moderator ist selbst betroffen | Entscheidung abgelehnt |
| Begründung fehlt oder kürzer als 5 Zeichen | Validierungsfehler |

## INVEST
I: setzt REQ-MOD-001 voraus · N: Darstellung verhandelbar · V: Rechtspflicht · E: mittel · S: ein Sprint · T: Entscheidungstabelle automatisierbar.

## Nachweis
- `AT-MOD-002`: Smoke-Test – Moderator sieht Seed-Meldung und Wortfilter-Fall und entscheidet „entfernen“ (bestehend: „Moderations-Queue …“, „Moderationsentscheidung“).
- `AT-MOD-002-2`: Smoke-Test – Mitglied erhält 403 auf die Queue (bestehend: „Mitglied hat keinen Zugriff auf Moderation“).


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei mit Front Matter, Kano und Nachweis-IDs |
