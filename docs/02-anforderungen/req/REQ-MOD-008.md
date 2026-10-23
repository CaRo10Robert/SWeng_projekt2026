---
id: REQ-MOD-008
title: Whitelist-Domains über eine Oberfläche verwalten
type: user-story
class: functional
status: approved
owner: team-vertrauen
risk: medium
release: R1
moscow: C
kano: n/a
epic: EPIC-06
source: EPIC-10, REQ-ARCH-003
use_cases: [UC-40]
depends_on: [REQ-ARCH-003]
version: 1.2
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-MOD-008]
---

# REQ-MOD-008 Whitelist-Domains über eine Oberfläche verwalten
## Anforderung
Als Administrator möchte ich zugelassene E-Mail-Domains hinzufügen, deaktivieren und einem Nutzertyp zuordnen, damit weitere Hochschulen ohne neue Softwareversion freigeschaltet werden können.

## Begründung
Vorbereitung EPIC-10. Im MVP genügt die Pflege als Daten (REQ-ARCH-003). Die Whitelist selbst ist eine Domänenregel (REQ-AUTH-001); diese Anforderung beschreibt nur die Verwaltungsfunktion.

## Akzeptanzkriterien
```gherkin
Szenario: Domain hinzufügen
  Wenn ich "stud.hs-mannheim.de" mit dem Typ "Studierende" hinzufüge
  Dann können sich Adressen dieser Domain registrieren

Szenario: Domain deaktivieren
  Wenn ich "hwg-lu.de" deaktiviere
  Dann werden neue Registrierungen dieser Domain abgelehnt
  Und bestehende Konten bleiben aktiv
```

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Ungültige Domain oder Platzhalter („*.hwg-lu.de“) | abgelehnt, BR-01 verlangt exakte Domains |
| Aufruf durch Nicht-Administrator | 403; jede Änderung wird protokolliert |

## INVEST
I: unabhängig · N · V: Skalierung auf weitere Hochschulen · E: klein · S · T: automatisierbar.

## Nachweis
- `AT-MOD-008`: Smoke-Test – Domain anlegen und deaktivieren. Umsetzungsstand ⬜ (Could für R1).


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei mit Front Matter, Kano und Nachweis-IDs |
| 1.2 | 2026-10-23 | Review v0.2: R-17 (class functional) |
