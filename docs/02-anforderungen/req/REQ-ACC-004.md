---
id: REQ-ACC-004
title: Profilbild
type: user-story
class: functional
status: approved
owner: team-produkt
risk: medium
release: R2
moscow: S
kano: leistung
epic: EPIC-07
source: UC-04, Entscheidungslog Q-14
use_cases: [UC-04]
depends_on: [REQ-ACC-001, REQ-LST-003]
version: 1.0
created: 2026-10-23
last_updated: 2026-10-23
verification: [AT-ACC-004]
---

# REQ-ACC-004 Profilbild
## Anforderung
Als Mitglied möchte ich ein Profilbild hochladen, ersetzen und entfernen, damit andere Mitglieder mich bei der Übergabe auf dem Campus leichter wiedererkennen.

Das Profilbild ist freiwillig. Es wird nur angemeldeten Mitgliedern angezeigt (REQ-SEC-007).

## Begründung
Abgespalten aus REQ-ACC-001 (Review v0.2, R-09/R-21), damit das Must-Profil vollständig prüfbar ist. Ein Bild stärkt das Vertrauen, ist für den Ablauf aber nicht notwendig; deshalb Should und Release R2 (Entscheidungslog Q-14).

## Akzeptanzkriterien
```gherkin
Szenario: Profilbild hochladen
  Angenommen ich bin als Lea angemeldet
  Wenn ich in meinem Profil ein Foto im Format JPEG, PNG oder WebP auswähle und speichere
  Dann sehen andere Mitglieder das Bild neben meinem Anzeigenamen in meinen Anzeigen
  Und das gespeicherte Bild enthält keine Metadaten wie Aufnahmeort

Szenario: Profilbild entfernen
  Angenommen ich habe ein Profilbild
  Wenn ich "Profilbild entfernen" bestätige
  Dann wird statt des Bildes ein neutraler Platzhalter angezeigt

Szenario: Ungültige Datei
  Wenn ich eine Datei hochlade, die kein Bild ist, oder die größer als 10 MB ist
  Dann wird das abgelehnt und ich sehe den Grund
```

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Datei ist kein Bild oder zu groß | abgelehnt wie bei Anzeigenbildern (REQ-LST-003, REQ-SEC-007) |
| Anstößiges Profilbild | meldbar als Profil (REQ-MOD-001); Moderation kann es entfernen |
| Abruf ohne Anmeldung | nicht möglich (REQ-SEC-007) |
| Kontolöschung | Bild wird mit dem Konto gelöscht (REQ-ACC-002) |

## INVEST
I: hängt nur am vorhandenen Profil · N: Bildgröße und Zuschnitt verhandelbar · V: Wiedererkennung bei der Übergabe · E: klein · S: wenige Tage · T: Szenarien automatisierbar.

## Nachweis
- `AT-ACC-004`: Smoke-Test – Profilbild hochladen, Metadaten entfernt, Bild für andere Mitglieder sichtbar, Entfernen setzt Platzhalter (neu).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-23 | Abgespalten aus REQ-ACC-001 (Review v0.2: R-09, R-21; Entscheidungslog Q-14) |
