---
id: REQ-AUTH-003
title: Nutzertyp aus der Domain ableiten
type: business-rule
class: domain
status: implemented
owner: team-identity
risk: low
release: R1
moscow: S
kano: n/a
epic: EPIC-01
source: BG-1
use_cases: [UC-01]
depends_on: [REQ-AUTH-001]
version: 1.1
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-AUTH-003, AT-AUTH-003-2]
---

# REQ-AUTH-003 Nutzertyp aus der Domain ableiten

## Anforderung
Das System muss den Nutzertyp aus dem Whitelist-Eintrag der Domain ableiten. Der Nutzertyp ist für andere Mitglieder sichtbar (z. B. „Studierende“ im Profil des Anbieters).

## Begründung
Mitglieder schätzen ein, mit wem sie handeln; die Zuordnung darf nicht frei wählbar sein.

## Akzeptanzkriterien
| Domain | Nutzertyp |
|---|---|
| `studmail.hwg-lu.de` | Studierende |
| `hwg-lu.de` | Beschäftigte |
| weitere Domain (EPIC-10) | laut Whitelist-Eintrag |

Der Nutzertyp kann vom Mitglied nicht geändert werden.

## Nachweis
- `AT-AUTH-003`: Unit-Test – BR-01-Tabelle prüft den abgeleiteten Typ je zugelassener Zeile.
- `AT-AUTH-003-2`: Smoke-Test – nach Bestätigung einer `@studmail.hwg-lu.de`-Adresse ist der Typ „Studierende“.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei |
