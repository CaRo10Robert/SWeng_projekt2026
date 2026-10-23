---
id: REQ-MOD-004
title: Vorläufiges Ausblenden ab drei Meldungen
type: business-rule
class: functional
status: approved
owner: team-vertrauen
risk: medium
release: R2
moscow: S
kano: basis
epic: EPIC-06
source: BG-1
use_cases: [UC-30]
depends_on: [REQ-MOD-001]
version: 1.3
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-MOD-004]
---

# REQ-MOD-004 Vorläufiges Ausblenden ab drei Meldungen
## Anforderung
Das System soll einen gemeldeten Inhalt vorläufig für andere Mitglieder ausblenden, sobald **drei unterschiedliche Mitglieder** ihn gemeldet haben, bis ein Moderator entschieden hat.

## Begründung
Begrenzt den Schaden offensichtlich problematischer Inhalte außerhalb der Moderationszeiten.

## Akzeptanzkriterien
| Unterschiedliche Meldende | Anzeige | Nachricht | Profil |
|---|---|---|---|
| 1–2 | sichtbar | sichtbar | sichtbar |
| ≥ 3 | ausgeblendet (nicht in der Suche; Detail nur für Anbieter und Moderation) | Text für den Empfänger ausgeblendet | Anzeigen des Profils ausgeblendet |
| danach Entscheidung „keine Maßnahme“ | wieder sichtbar | wieder sichtbar | wieder sichtbar |

Mehrfachmeldungen desselben Mitglieds zählen einmal; Systemmeldungen (Wortfilter) zählen nicht.

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Absprache mehrerer Mitglieder zum Ausblenden | Ausblenden ist vorläufig; der Fall ist in der Queue als „ausgeblendet“ markiert und wird vorrangig entschieden |

## Nachweis
- `AT-MOD-004`: Smoke-Test – drei Mitglieder melden eine Anzeige, sie verschwindet aus der Suche.
- Umsetzungsstand 🟡: für Anzeigen umgesetzt; für Nachrichten und Profile wird bisher nur der Fall markiert.


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei mit Front Matter, Kano und Nachweis-IDs |
| 1.2 | 2026-10-23 | Review v0.2: Status nach Review |
| 1.3 | 2026-10-23 | Sprintplanung nach Architektur-Review: Ausblenden für Nachrichten und Profile in R2 verschoben (Backlog B-15); für Anzeigen bereits umgesetzt |
