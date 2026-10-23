---
id: REQ-SEC-003
title: Passwortrichtlinie
type: security
class: constraint
status: implemented
owner: team-plattform
risk: medium
release: R1
moscow: M
kano: basis
epic: EPIC-01
source: NIST SP 800-63B
use_cases: [UC-01, UC-03]
version: 1.1
created: 2026-10-20
last_updated: 2026-10-23
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

## Nachweis
- `AT-SEC-003`: Unit-Test der Tabelle (Grundlage: `apps/server/src/modules/identity/domain.test.ts`, „Passwortrichtlinie“).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei, Entscheidungstabelle |
