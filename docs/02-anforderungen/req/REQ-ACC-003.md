---
id: REQ-ACC-003
title: Daten exportieren
type: user-story
class: functional
status: implemented
owner: team-produkt
risk: medium
release: R1
moscow: S
kano: leistung
epic: EPIC-07
source: DSGVO Art. 15, 20
use_cases: [UC-06]
version: 1.1
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-ACC-003]
---

# REQ-ACC-003 Daten exportieren
## Anforderung
Als Mitglied möchte ich alle über mich gespeicherten Daten in einem maschinenlesbaren Format herunterladen, damit ich mein Auskunfts- und Übertragungsrecht wahrnehmen kann.

## Begründung
DSGVO Art. 15 und 20.

## Akzeptanzkriterien
```gherkin
Szenario: Export
  Angenommen ich bin angemeldet
  Wenn ich "Daten exportieren" wähle
  Dann erhalte ich sofort eine JSON-Datei
  Und sie enthält Profil, Einwilligungen, Anzeigen, Merkliste, eigene Nachrichten, Meldungen und Blockierungen
  Und sie enthält keine Daten anderer Mitglieder außer IDs
```

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Nicht angemeldet | 401 |
| Fremde Daten anfordern | nicht möglich; der Export bezieht sich immer auf das eigene Konto |

## INVEST
I · N: Format verhandelbar · V: Rechtspflicht · E: klein · S · T: automatisierbar.

## Nachweis
- `AT-ACC-003`: Smoke-Test „Datenexport (Art. 15/20)“ (bestehend).


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei; Export als direkter Download (statt Mail-Link aus UC-06) festgelegt |
