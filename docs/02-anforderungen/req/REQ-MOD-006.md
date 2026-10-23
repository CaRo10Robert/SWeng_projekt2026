---
id: REQ-MOD-006
title: Übergabepartner bewerten
type: user-story
class: functional
status: in-review
owner: team-vertrauen
risk: medium
release: R1
moscow: C
kano: begeisterung
epic: EPIC-06
source: Wettbewerbsanalyse
use_cases: [UC-22]
depends_on: [REQ-CHAT-009]
version: 1.1
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-MOD-006]
---

# REQ-MOD-006 Übergabepartner bewerten
## Anforderung
Als Mitglied möchte ich nach einer abgeschlossenen Übergabe den anderen Teilnehmer einmal bewerten (positiv oder negativ, optional Text bis 280 Zeichen), damit andere die Zuverlässigkeit einschätzen können.

## Begründung
Vertrauenssignal wie bei Kleinanzeigen; sinnvoll erst, wenn Übergaben als abgeschlossener Deal erfasst sind.

## Akzeptanzkriterien
```gherkin
Szenario: Bewertung nach Abgabe
  Angenommen ein Deal zwischen Lea und Ben ist "abgeschlossen"
  Wenn Lea Ben mit "positiv" bewertet
  Dann zeigt Bens Profil eine positive Bewertung mehr

Szenario: Keine Bewertung ohne Übergabe
  Angenommen es gibt nur eine Konversation ohne abgeschlossenen Deal
  Dann wird "Bewerten" nicht angeboten

Szenario: Nur einmal
  Angenommen Lea hat Ben für diesen Deal bewertet
  Dann kann sie keine zweite Bewertung abgeben
```

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Beleidigender Bewertungstext | meldbar wie eine Nachricht (REQ-MOD-001) |
| Racheabwertung | Bewertungen werden erst sichtbar, wenn beide bewertet haben oder 14 Tage vergangen sind |

## INVEST
I: hängt an REQ-CHAT-009 · N: Skala verhandelbar · V: Vertrauen · E: mittel · S: ein Sprint · T: automatisierbar.

## Nachweis
- `AT-MOD-006`: Smoke-Test – Bewertung nach abgeschlossenem Deal. Umsetzungsstand ⬜ (Could für R1).


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei mit Front Matter, Kano und Nachweis-IDs |
