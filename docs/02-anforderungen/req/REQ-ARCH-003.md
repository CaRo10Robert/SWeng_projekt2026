---
id: REQ-ARCH-003
title: Whitelist als Daten statt Code
type: architecture
class: domain
status: implemented
owner: team-plattform
risk: medium
release: R1
moscow: M
kano: n/a
epic: EPIC-10
source: BG-5, EPIC-10
depends_on: [REQ-AUTH-001]
version: 1.1
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-ARCH-003]
---

# REQ-ARCH-003 Whitelist als Daten statt Code
## Anforderung
Die zugelassenen E-Mail-Domains müssen als Daten gepflegt werden; eine neue Domain darf keine neue Softwareversion erfordern.

## Begründung
Vorbereitung weiterer Hochschulen (EPIC-10, QS-6).

## Konformitätsprüfung
| Prüfung | Kriterium |
|---|---|
| Test | Eine zur Laufzeit ergänzte Domain wird ohne Neustart bei der Registrierung akzeptiert |
| Code-Review | keine Domain-Literale in der Fachlogik außer im Seed |

## Nachweis
- `AT-ARCH-003`: Integrationstest – Domain in der Datenbank ergänzen, Registrierung mit dieser Domain gelingt (neu zu schreiben).


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei mit Front Matter, Kano und Nachweis-IDs |
