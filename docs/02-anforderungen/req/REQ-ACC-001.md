---
id: REQ-ACC-001
title: Profil pflegen
type: user-story
class: functional
status: in-review
owner: team-produkt
risk: low
release: R1
moscow: M
kano: basis
epic: EPIC-07
source: BG-2
use_cases: [UC-04]
depends_on: [REQ-PRIV-002]
version: 1.1
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-ACC-001]
---

# REQ-ACC-001 Profil pflegen
## Anforderung
Als Mitglied möchte ich meinen Anzeigenamen, ein Profilbild, meinen Studiengang und meine bevorzugten Übergabeorte pflegen, damit andere Mitglieder mich wiedererkennen und Übergaben leichter planen können.

Die E-Mail-Adresse ist nie Teil des öffentlichen Profils (REQ-PRIV-002).

## Begründung
Ein erkennbares Profil schafft Vertrauen (BG-1) und senkt den Abstimmungsaufwand (BG-2).

## Akzeptanzkriterien
```gherkin
Szenario: Profil ändern
  Angenommen ich bin als Lea angemeldet
  Wenn ich meinen Anzeigenamen in "Lea M." und meinen Studiengang in "BWL" ändere
  Dann zeigen meine Anzeigen den Namen "Lea M."

Szenario: Profilbild
  Wenn ich ein Profilbild hochlade
  Dann wird es ohne Metadaten neu gespeichert und neben meinen Anzeigen angezeigt

Szenario: Ungültige Eingaben
  Wenn ich einen Anzeigenamen mit weniger als 2 oder mehr als 40 Zeichen speichere
  Dann wird das abgelehnt und das Feld markiert
```

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Unbekannter Übergabeort | abgelehnt |
| Anstößiger Anzeigename oder Profilbild | meldbar als Profil (REQ-MOD-001) |
| Profilbild ohne gültiges Bildformat | abgelehnt wie bei Anzeigenbildern (REQ-LST-003) |

## INVEST
I: unabhängig · N: Felder verhandelbar · V: Vertrauen · E: klein · S: ein Sprint · T: automatisierbar.

## Nachweis
- `AT-ACC-001`: Smoke-Test – Profil ändern und Änderung über `GET /me` prüfen.
- Umsetzungsstand 🟡: Profilbild fehlt noch.


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei mit Front Matter, Kano und Nachweis-IDs |
