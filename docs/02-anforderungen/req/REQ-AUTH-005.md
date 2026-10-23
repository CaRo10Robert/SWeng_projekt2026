---
id: REQ-AUTH-005
title: Anmelden und Abmelden
type: user-story
class: functional
status: implemented
owner: team-identity
risk: medium
release: R1
moscow: M
kano: basis
epic: EPIC-01
source: BG-1
use_cases: [UC-02]
depends_on: [REQ-AUTH-002]
version: 1.1
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-AUTH-005, AT-AUTH-005-2]
---

# REQ-AUTH-005 Anmelden und Abmelden

## Anforderung
Als Mitglied möchte ich mich mit meiner Hochschuladresse und meinem Passwort anmelden und wieder abmelden, damit ich die Plattform nutzen und meine Sitzung beenden kann.

## Begründung
Zugang zu allen Mitgliederfunktionen (BG-1). Die Art der Anmeldung ist über REQ-AUTH-009 austauschbar (Q-12).

## Akzeptanzkriterien
```gherkin
Szenario: Anmeldung
  Angenommen mein Konto ist bestätigt
  Wenn ich mich mit "lea@studmail.hwg-lu.de" und meinem Passwort anmelde
  Dann bin ich angemeldet und sehe die Suche

Szenario: Falsches Passwort
  Wenn ich ein falsches Passwort eingebe
  Dann sehe ich "E-Mail-Adresse oder Passwort ist falsch"

Szenario: Abmelden
  Angenommen ich bin angemeldet
  Wenn ich "Abmelden" wähle
  Dann ist meine Sitzung serverseitig beendet
  Und eine erneute Anfrage mit der alten Sitzung wird als nicht angemeldet behandelt
```

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Brute Force | 5 Fehlversuche / 15 min pro Konto und IP (REQ-SEC-005) |
| Unbestätigtes Konto, korrektes Passwort | „Bitte bestätige zuerst deine E-Mail-Adresse“ |
| Gesperrtes Konto, korrektes Passwort | „Dieses Konto ist gesperrt“ |
| Löschung beantragt | Anmeldung bricht die Löschung ab (REQ-ACC-002) |

## INVEST
I: ja · N: Sitzungsdauer verhandelbar · V: Zugang · E: klein · S: ja · T: automatisierbar.

## Nachweis
- `AT-AUTH-005`: Smoke-Test – Anmeldung der Demo-Konten liefert das Profil und eine Sitzung.
- `AT-AUTH-005-2`: neu zu schreiben – nach Abmelden liefert `/me` mit der alten Sitzung 401.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei, Akzeptanzkriterien ergänzt |
