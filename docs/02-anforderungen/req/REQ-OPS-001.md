---
id: REQ-OPS-001
title: Gesundheitsprüfung und geordnetes Herunterfahren
type: operational
class: quality
status: implemented
owner: team-plattform
risk: medium
release: R1
moscow: M
kano: n/a
epic: EPIC-00
source: Guideline Kap. 05
version: 2.0
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-OPS-001, AT-OPS-001-2]
---

# REQ-OPS-001 Gesundheitsprüfung und geordnetes Herunterfahren
## Anforderung
Das System muss Lebendigkeit und Betriebsbereitschaft getrennt melden und beim Beenden laufende Anfragen und Jobs abschließen, ohne Daten zu verlieren.

## Begründung
Getrennte Liveness/Readiness verhindern Neustartschleifen; geordnetes Herunterfahren verhindert verlorene Anfragen (Guideline Kap. 05).

## Qualitätsmerkmal, Metrik, Messverfahren
| Feld | Festlegung |
|---|---|
| Qualitätsmerkmal (ISO 25010) | Reliability → Availability, Fault Tolerance |
| Metrik | (1) Status der Lebendigkeits- und Bereitschaftsprüfung; (2) Dauer vom Stoppsignal bis zum Prozessende; (3) Anzahl abgebrochener Anfragen beim Stoppen |
| Akzeptanzkriterium | (1) Bereitschaft meldet „nicht bereit“, solange die Datenbank fehlt, Lebendigkeit bleibt „ok“; (2) **≤ 30 s**; (3) **0** |
| Messverfahren | Smoke-Test der Endpunkte; Stoppen des Containers während eines Lasttests und Auswertung der Antworten |
| Messkontext | Docker-Beispiel, `docker compose stop app` |
| Verhalten bei Verfehlung | Release-Blocker |

## Nachweis
- `AT-OPS-001`: Smoke-Test „Readiness /health/ready“ (bestehend).
- `AT-OPS-001-2`: Resilienztest – Stopp unter Last ohne abgebrochene Anfragen (neu zu schreiben).


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 2.0 | 2026-10-23 | Merkmal/Metrik/Akzeptanzkriterium/Messverfahren getrennt (Fallstudie FS-M3) |
