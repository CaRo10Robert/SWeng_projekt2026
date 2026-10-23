---
id: REQ-AUTH-008
title: Gesperrte Adressen nicht erneut registrieren
type: business-rule
class: functional
status: verified
owner: team-identity
risk: medium
release: R1
moscow: M
moscow_reason: [2]
kano: basis
epic: EPIC-01
source: DSA Art. 23 (Missbrauch)
use_cases: [UC-01, UC-33]
depends_on: [REQ-MOD-002]
version: 1.3
created: 2026-10-20
last_updated: 2026-10-24
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
| Sperre soll aufgehoben werden | in R1 keine Funktion: Widerspruch per E-Mail an die Moderation, Freigabe durch einen Admin außerhalb der Oberfläche, Eintrag im Audit-Log (Q-15) |

## Nachweis
- `AT-AUTH-008`: neu zu schreiben – Konto per Moderationsentscheidung sperren, Neuregistrierung mit `+`-Alias legt kein Konto an und versendet keine Mail.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei, Szenario und neutrale Antwort präzisiert |
| 1.2 | 2026-10-23 | Review v0.2: R-08 Aufhebung der Sperre nach Q-15; R-15 moscow_reason |
| 1.3 | 2026-10-24 | Verifiziert im finalen Lauf gegen das Docker-Beispiel (AT-AUTH-008 bestanden bzw. ausgeführt); Status → verified |
