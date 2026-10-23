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
moscow_reason: [4]
kano: n/a
epic: EPIC-00
source: Auftraggeber, ADR-0010
version: 1.2
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

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Host-Port belegt | Port per Umgebungsvariable änderbar (REQ-OPS-003) |
| Datenbank startet langsamer als die Anwendung | Anwendung wartet per Healthcheck bzw. Wiederholung, statt abzubrechen |
| Kein Internetzugang beim Start | Start und Smoke-Test funktionieren nach dem Build offline |
| Secrets oder externe Schlüssel werden benötigt | unzulässig; Compose-Review lehnt ab |
| Vierter Dienst wird vorgeschlagen (z. B. Virenscanner) | nur mit neuer ADR; Entscheidungslog Q-16 |

## Nachweis
- `AT-ARCH-005`: `scripts/smoke-test.mjs` gegen ein frisch gestartetes Setup (bestehend).


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei mit Front Matter, Kano und Nachweis-IDs |
| 1.2 | 2026-10-23 | Review v0.2: R-04, R-15 |
