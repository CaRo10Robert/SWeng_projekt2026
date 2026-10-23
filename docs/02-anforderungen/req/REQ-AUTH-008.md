---
id: REQ-AUTH-008
title: Gesperrte Adressen nicht erneut registrieren
type: business-rule
class: functional
status: implemented
owner: team-identity
risk: medium
release: R1
moscow: M
kano: basis
epic: EPIC-01
source: DSA Art. 23 (Missbrauch)
use_cases: [UC-01, UC-33]
depends_on: [REQ-MOD-002]
version: 1.1
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-AUTH-008]
---

# REQ-AUTH-008 Gesperrte Adressen nicht erneut registrieren

## Anforderung
Eine E-Mail-Adresse, deren Konto durch die Moderation gesperrt wurde, darf nicht erneut registriert werden. Maßgeblich ist die kanonische Adresse (ohne `+`-Suffix, REQ-AUTH-001).

## Begründung
Ohne diese Regel wäre eine Sperre durch Neuregistrierung sofort umgehbar.

## Akzeptanzkriterien
```gherkin
Szenario: Neuregistrierung nach Sperre
  Angenommen das Konto "sara@studmail.hwg-lu.de" wurde gesperrt
  Wenn sich jemand mit "sara+neu@studmail.hwg-lu.de" registriert
  Dann erscheint die neutrale Bestätigungsmeldung
  Und es wird kein Konto angelegt
  Und es wird keine E-Mail versendet
```

Die Antwort ist neutral, damit sich die Sperre nicht von außen abfragen lässt (REQ-AUTH-004).

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Groß-/Kleinschreibung, `+`-Alias | über kanonische Adresse erkannt |
| Sperre wird aufgehoben (EPIC-08) | Adresse wird freigegeben, protokolliert |

## Nachweis
- `AT-AUTH-008`: neu zu schreiben – Konto per Moderationsentscheidung sperren, Neuregistrierung mit `+`-Alias legt kein Konto an und versendet keine Mail.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei, Szenario und neutrale Antwort präzisiert |
