---
id: REQ-AUTH-006
title: Passwort per E-Mail-Link zurücksetzen
type: user-story
class: functional
status: implemented
owner: team-identity
risk: medium
release: R1
moscow: M
kano: basis
epic: EPIC-01
source: BG-2
use_cases: [UC-03]
depends_on: [REQ-NOTI-001]
version: 1.1
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-AUTH-006]
---

# REQ-AUTH-006 Passwort per E-Mail-Link zurücksetzen

## Anforderung
Als Gast möchte ich mein Passwort über einen Link in einer E-Mail zurücksetzen, damit ich den Zugang wiederherstellen kann.

Der Link ist **1 Stunde** gültig und **einmal** verwendbar. Nur der zuletzt angeforderte Link gilt. Nach dem Zurücksetzen werden alle bestehenden Sitzungen beendet.

## Begründung
Vergessene Passwörter dürfen nicht zum Kontoverlust führen (BG-2), ohne die Sicherheit zu schwächen.

## Akzeptanzkriterien
```gherkin
Szenario: Passwort zurücksetzen
  Angenommen ich habe einen Reset-Link angefordert
  Wenn ich innerhalb einer Stunde ein neues gültiges Passwort setze
  Dann kann ich mich mit dem neuen Passwort anmelden
  Und alle meine bisherigen Sitzungen sind beendet

Szenario: Link wiederverwendet
  Angenommen ich habe den Link bereits benutzt
  Wenn ich ihn erneut öffne
  Dann sehe ich "Der Link wurde bereits verwendet"

Szenario: Neuer Link entwertet alten
  Angenommen ich habe zwei Reset-Links angefordert
  Wenn ich den älteren Link öffne
  Dann ist er ungültig
```

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Unbekannte Adresse | neutrale Meldung (REQ-AUTH-004) |
| Viele Anforderungen | max. 3 pro Stunde und Adresse (REQ-SEC-005) |
| Neues Passwort verletzt die Richtlinie | Grund wird genannt (REQ-SEC-003), Link bleibt gültig |

## INVEST
I: ja · N: Gültigkeitsdauer · V: Zugang wiederherstellen · E: klein · S: ja · T: automatisierbar.

## Nachweis
- `AT-AUTH-006`: neu zu schreiben – Reset-Mail aus Mailpit, neues Passwort setzen, Anmeldung mit neuem Passwort, alte Sitzung liefert 401, zweite Nutzung liefert `token_used`.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei, Akzeptanzkriterien ergänzt |
