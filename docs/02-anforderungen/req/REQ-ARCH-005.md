---
id: REQ-ARCH-005
title: Auslieferung als lokales Docker-Compose-Setup
type: architecture
class: constraint
status: implemented
owner: team-plattform
risk: high
reviewers: [product-owner, architecture-lead]
release: R1
moscow: M
kano: n/a
epic: EPIC-00
source: Auftraggeber, ADR-0010
version: 1.1
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-ARCH-005]
---

# REQ-ARCH-005 Auslieferung als lokales Docker-Compose-Setup
## Anforderung
Die Plattform muss als Docker-Compose-Setup aus Anwendung, Datenbank und Mail-Catcher ausgeliefert werden, das mit einem Befehl ohne externe Konten, API-Schlüssel oder Internetzugang (nach dem Build) startet.

## Begründung
Vorgabe des Auftraggebers: kein öffentliches Hosting (ADR-0010, BG-6).

## Konformitätsprüfung
| Prüfung | Kriterium |
|---|---|
| Smoke-Test nach Frischstart | alle Prüfungen bestanden, Anwendung gesund |
| Netzwerkprüfung | Start und Smoke-Test ohne ausgehende Internetverbindung |
| Compose-Review | genau drei Dienste (`app`, `db`, `mailpit`), keine Secrets im Image |

## Nachweis
- `AT-ARCH-005`: `scripts/smoke-test.mjs` gegen ein frisch gestartetes Setup (bestehend).


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei mit Front Matter, Kano und Nachweis-IDs |
