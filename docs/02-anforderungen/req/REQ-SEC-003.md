---
id: REQ-SEC-003
title: Passwortrichtlinie
type: security
class: constraint
status: verified
owner: team-plattform
risk: medium
release: R1
moscow: M
moscow_reason: [2]
kano: basis
review_due: 2027-04-23
epic: EPIC-01
source: NIST SP 800-63B
use_cases: [UC-01, UC-03]
version: 1.3
created: 2026-10-20
last_updated: 2026-10-24
verification: [AT-SEC-003]
---

# REQ-SEC-003 Passwortrichtlinie

## Anforderung
Neue Passwörter müssen mindestens **12 Zeichen** lang sein und dürfen nicht in einer **lokal mitgelieferten** Liste bekannter, geleakter Passwörter stehen. Es gibt keine Kompositionsregeln (Sonderzeichen, Ziffern). Das Passwort darf die eigene E-Mail-Adresse nicht enthalten. Die Prüfung funktioniert ohne Internetzugang.

## Begründung
Länge und Leak-Abgleich wirken nach NIST besser als Kompositionsregeln; die Offline-Vorgabe folgt aus ADR-0010.

## Akzeptanzkriterien
| Eingabe | Ergebnis |
|---|---|
| 11 Zeichen | abgelehnt: „mindestens 12 Zeichen“ |
| 12+ Zeichen, nur Kleinbuchstaben, nicht in Leak-Liste | zugelassen |
| Eintrag der Leak-Liste (unabhängig von Groß-/Kleinschreibung) | abgelehnt mit Hinweis auf Datenlecks |
| enthält lokalen Teil der eigenen Adresse (≥ 4 Zeichen) | abgelehnt |
| nur ein wiederholtes Zeichen | abgelehnt |

Die Leak-Liste ist ohne neues Image austauschbar.

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Leak-Liste ist veraltet | Datei ist austauschbar; Aktualisierung zum `review_due` |
| Passwort enthält die eigene Adresse in anderer Schreibweise | Vergleich ohne Groß-/Kleinschreibung |
| Extrem lange Eingabe | > 256 Zeichen abgelehnt |
| Leak-Liste nicht lesbar | Prüfung auf Länge und Adresse bleibt aktiv, Warnung im Log |

## Nachweis
- `AT-SEC-003`: Unit-Test der Tabelle (Grundlage: `apps/server/src/modules/identity/domain.test.ts`, „Passwortrichtlinie“).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei, Entscheidungstabelle |
| 1.2 | 2026-10-23 | Review v0.2: R-04 Fehler- und Missbrauchsfälle; R-16 review_due; R-15 moscow_reason |
| 1.3 | 2026-10-24 | Verifiziert im finalen Lauf gegen das Docker-Beispiel (AT-SEC-003 bestanden bzw. ausgeführt); Status → verified |
