---
id: REQ-SRCH-006
title: Keine Anzeigen blockierter oder gesperrter Nutzer in der Suche
type: business-rule
class: functional
status: implemented
owner: team-marktplatz
risk: medium
release: R1
moscow: M
kano: basis
epic: EPIC-03
source: BG-1
use_cases: [UC-13, UC-31, UC-33]
depends_on: [REQ-MOD-005]
version: 1.1
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-SRCH-006]
---

# REQ-SRCH-006 Keine Anzeigen blockierter oder gesperrter Nutzer in der Suche

## Anforderung
Anzeigen **dürfen nicht** in Suchergebnissen und auf der Merkliste erscheinen, wenn ihr Anbieter gesperrt ist, wenn der Suchende den Anbieter blockiert hat oder wenn der Anbieter den Suchenden blockiert hat. Vorläufig ausgeblendete Anzeigen (REQ-MOD-004) erscheinen ebenfalls nicht.

## Begründung
Blockieren und Sperren müssen wirksam sein, sonst verlieren Mitglieder das Vertrauen (BG-1).

## Akzeptanzkriterien
| Beziehung zwischen Suchendem S und Anbieter A | Anzeige von A sichtbar für S |
|---|---|
| keine | ✅ |
| S hat A blockiert | ❌ |
| A hat S blockiert | ❌ |
| A ist gesperrt | ❌ (für alle) |
| Anzeige vorläufig ausgeblendet | ❌ (für alle außer A und Moderation) |
| Blockierung aufgehoben | ✅ wieder sichtbar |

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Direktaufruf der Anzeige eines Gesperrten | 404 |
| Blockierter versucht Kontakt | abgelehnt (REQ-CHAT-001) |

## Nachweis
- `AT-SRCH-006`: API-Test – Blockierung in beide Richtungen und Sperre blenden Anzeigen aus (neu zu schreiben).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei, Entscheidungstabelle, Merkliste und Ausblendung eingeschlossen |
