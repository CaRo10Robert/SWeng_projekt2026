---
id: REQ-MOD-007
title: Rollen vergeben und entziehen
type: user-story
class: functional
status: implemented
owner: team-vertrauen
risk: high
reviewers: [product-owner, security-lead]
release: R1
moscow: M
kano: n/a
epic: EPIC-06
source: REQ-SEC-006
use_cases: [UC-42]
version: 1.1
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-MOD-007, AT-MOD-007-2]
---

# REQ-MOD-007 Rollen vergeben und entziehen
## Anforderung
Als Administrator möchte ich Mitgliedern die Rollen Moderator oder Administrator vergeben und wieder entziehen, damit Moderation und Verwaltung auf mehrere Personen verteilt werden können. Jede Änderung wird protokolliert.

## Begründung
Rollen steuern den Zugriff auf vertrauliche Daten (gemeldete Chatinhalte); Änderungen müssen nachvollziehbar sein.

## Akzeptanzkriterien
```gherkin
Szenario: Rolle vergeben
  Angenommen ich bin Administrator
  Wenn ich Mia die Rolle "Moderator" gebe
  Dann sieht Mia nach erneuter Anmeldung die Moderations-Queue
  Und das Audit-Log enthält die Änderung mit alter und neuer Rolle

Szenario: Eigene Rolle
  Wenn ich meine eigene Rolle ändern will
  Dann wird das abgelehnt
```

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Nicht-Administrator ruft die Funktion auf | 403 |
| Rollenwechsel bei aktiver Sitzung | alle Sitzungen der Person werden beendet; neue Rechte gelten ab der nächsten Anmeldung |
| Letzter Administrator entzieht sich die Rolle | durch „eigene Rolle nicht änderbar“ ausgeschlossen |

## INVEST
I: unabhängig · N · V: verteilte Verantwortung · E: klein · S · T: automatisierbar.

## Nachweis
- `AT-MOD-007`: Smoke-Test – Admin vergibt eine Rolle, das Audit-Log enthält `role.changed`.
- `AT-MOD-007-2`: Smoke-Test – Mitglied erhält 403 auf die Nutzerverwaltung.


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei mit Front Matter, Kano und Nachweis-IDs |
