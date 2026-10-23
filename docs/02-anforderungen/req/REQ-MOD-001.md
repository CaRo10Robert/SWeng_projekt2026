---
id: REQ-MOD-001
title: Inhalte und Mitglieder melden
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
source: DSA Art. 16, BG-4
use_cases: [UC-30]
depends_on: [REQ-MOD-002]
version: 1.1
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-MOD-001, AT-MOD-001-2]
---

# REQ-MOD-001 Inhalte und Mitglieder melden
## Anforderung
Als Mitglied möchte ich Anzeigen, Chatnachrichten und Profile unter Angabe eines Grundes melden, damit regelwidrige oder rechtswidrige Inhalte geprüft und entfernt werden.

Zulässige Gründe: verbotener Artikel, Betrug, Belästigung, Spam, falsche Kategorie, Sonstiges; optional Freitext bis 1.000 Zeichen.

## Begründung
Melde- und Abhilfeverfahren nach DSA Art. 16; schützt die Vertrauensbasis der Community (BG-1, BG-4).

## Akzeptanzkriterien
```gherkin
Szenario: Anzeige melden
  Angenommen ich bin als Ben angemeldet und sehe die Anzeige "Fahrrad 28 Zoll" von Sara
  Wenn ich sie mit dem Grund "Betrug" melde
  Dann erhalte ich eine Eingangsbestätigung
  Und in der Moderations-Queue erscheint ein offener Fall zu dieser Anzeige

Szenario: Nachricht melden
  Angenommen ich bin Teilnehmer einer Konversation
  Wenn ich eine Nachricht meines Gegenübers melde
  Dann erscheint ein offener Fall vom Typ "Nachricht"

Szenario: Doppelte Meldung
  Angenommen ich habe die Anzeige bereits gemeldet
  Wenn ich sie erneut melde
  Dann sehe ich "Du hast diesen Inhalt bereits gemeldet"
  Und es entsteht keine zweite Meldung
```

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Eigener Inhalt wird gemeldet | abgelehnt mit Hinweis, keine Meldung |
| Nachricht einer fremden Konversation | 404, keine Existenzpreisgabe (REQ-SEC-006) |
| Mitglied wählt den Systemgrund „Wortfilter“ | abgelehnt, nur das System setzt ihn |
| Massenmeldungen zur Schikane | eine Meldung pro Mitglied und Inhalt; entschieden wird immer durch einen Menschen |

## INVEST
I: ohne Moderationsoberfläche testbar · N: Gründe verhandelbar · V: Rechtspflicht und Schutz · E: klein · S: ein Sprint · T: Szenarien automatisierbar.

## Nachweis
- `AT-MOD-001`: Smoke-Test – Mitglied meldet eine Anzeige über die API, der Fall erscheint in der Queue.
- `AT-MOD-001-2`: Smoke-Test – zweite Meldung desselben Mitglieds ergibt 409, Meldung eigener Inhalte 422.


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei mit Front Matter, Kano und Nachweis-IDs |
