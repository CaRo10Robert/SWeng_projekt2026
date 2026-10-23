---
id: REQ-ACC-001
title: Profil pflegen
type: user-story
class: functional
status: verified
owner: team-produkt
risk: low
release: R1
moscow: M
moscow_reason: [1]
kano: basis
epic: EPIC-07
source: BG-2
use_cases: [UC-04]
depends_on: [REQ-PRIV-002]
version: 2.1
created: 2026-10-20
last_updated: 2026-10-24
verification: [AT-ACC-001]
---

# REQ-ACC-001 Profil pflegen
## Anforderung
Als Mitglied möchte ich meinen Anzeigenamen, meinen Studiengang und meine bevorzugten Übergabeorte pflegen, damit andere Mitglieder mich wiedererkennen und Übergaben leichter planen können.

Die E-Mail-Adresse ist nie Teil des öffentlichen Profils (REQ-PRIV-002). Das Profilbild ist als eigene Anforderung REQ-ACC-004 abgespalten (Entscheidungslog Q-14).

## Begründung
Ein erkennbares Profil schafft Vertrauen (BG-1) und senkt den Abstimmungsaufwand (BG-2).

## Akzeptanzkriterien
```gherkin
Szenario: Profil ändern
  Angenommen ich bin als Lea angemeldet
  Wenn ich meinen Anzeigenamen in "Lea M." und meinen Studiengang in "BWL" ändere
  Dann zeigen meine Anzeigen den Namen "Lea M."

Szenario: Ungültige Eingaben
  Wenn ich einen Anzeigenamen mit weniger als 2 oder mehr als 40 Zeichen speichere
  Dann wird das abgelehnt und das Feld markiert
```

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Unbekannter Übergabeort | abgelehnt |
| Anstößiger Anzeigename | meldbar als Profil (REQ-MOD-001) |

## INVEST
I: unabhängig · N: Felder verhandelbar · V: Vertrauen · E: klein · S: ein Sprint · T: automatisierbar.

## Nachweis
- `AT-ACC-001`: Smoke-Test – Anzeigename, Studiengang und Übergabeorte ändern und Änderung im eigenen Profil prüfen (neu).


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei mit Front Matter, Kano und Nachweis-IDs |
| 2.0 | 2026-10-23 | Review v0.2: R-09, R-21 (Profilbild nach REQ-ACC-004 abgespalten), R-15 |
| 2.1 | 2026-10-24 | Verifiziert im finalen Lauf gegen das Docker-Beispiel (AT-ACC-001 bestanden bzw. ausgeführt); Status → verified |
