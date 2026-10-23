---
id: REQ-MOD-005
title: Mitglieder blockieren
type: user-story
class: functional
status: implemented
owner: team-vertrauen
risk: medium
release: R1
moscow: S
kano: leistung
epic: EPIC-06
source: BG-1
use_cases: [UC-31]
version: 1.1
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-MOD-005]
---

# REQ-MOD-005 Mitglieder blockieren
## Anforderung
Als Mitglied möchte ich andere Mitglieder blockieren und wieder entsperren, damit ich keine Nachrichten mehr von ihnen erhalte und ihre Anzeigen nicht mehr sehe.

## Begründung
Selbstschutz vor Belästigung ohne Moderationsaufwand.

## Akzeptanzkriterien
```gherkin
Szenario: Blockieren
  Angenommen Ben blockiert Lea
  Dann können sich Lea und Ben gegenseitig keine Nachrichten mehr senden ("Kontakt nicht möglich")
  Und die Anzeigen der jeweils anderen Person erscheinen nicht in der Suche
  Und Lea wird nicht über die Blockierung informiert

Szenario: Entsperren
  Wenn Ben die Blockierung in seinem Profil aufhebt
  Dann ist der Kontakt wieder möglich
```

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Sich selbst blockieren | abgelehnt |
| Unbekanntes Mitglied | 404 |
| Erneutes Blockieren | idempotent |

## INVEST
I: unabhängig · N: Umfang der Ausblendung verhandelbar · V: Schutz · E: klein · S: wenige Tage · T: automatisierbar.

## Nachweis
- `AT-MOD-005`: Smoke-Test – nach Blockierung liefert das Senden 403 `contact_not_possible` und die Suche blendet die Anzeigen aus.


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei mit Front Matter, Kano und Nachweis-IDs |
