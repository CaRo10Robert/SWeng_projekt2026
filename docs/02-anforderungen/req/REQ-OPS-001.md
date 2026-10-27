---
id: REQ-OPS-001
title: Gesundheitsprüfung und geordnetes Herunterfahren
type: operational
class: quality
status: implemented
owner: team-plattform
risk: medium
reviewers: [qa-lead]
release: R1
moscow: M
moscow_reason: [3]
kano: n/a
epic: EPIC-00
source: Guideline Kap. 05
version: 2.3
created: 2026-10-20
last_updated: 2026-10-26
verification: [AT-OPS-001, AT-OPS-001-2, AT-OPS-001-3]
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

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Datenbank nicht erreichbar | `/health/live` 200, `/health/ready` 503; App stürzt nicht ab (Pool-Error-Handler), wird nach Rückkehr der DB ohne Neustart wieder bereit (AT-OPS-001-3) |
| SIGTERM während laufender Anfragen | keine neuen Verbindungen, laufende Anfragen werden beendet; Zeitlimit, danach Abbruch |
| Job läuft beim Herunterfahren | pg-boss stoppt geordnet; nicht abgeschlossene Jobs werden nach dem Neustart erneut ausgeführt (idempotente Jobs) |
| Gesundheitsprüfung hängt (DB antwortet nicht) | Ping mit Zeitlimit 2 s; keine hängenden Anfragen |
| Missbrauch der Endpunkte | keine internen Details (Versionen, Hostnamen); Status-API ist begrenzt (50 Anfragen je 10 s) |

## Nachweis
- `AT-OPS-001`: Smoke-Test „Readiness /health/ready“ (bestehend).
- `AT-OPS-001-2`: Resilienztest – Stopp unter Last ohne abgebrochene Anfragen (neu zu schreiben).
- `AT-OPS-001-3`: Ops-Test `tests/ops/db-outage-test.mjs` – Datenbank-Container gestoppt: Bereitschaft meldet „nicht bereit“ (503), Lebendigkeit bleibt „ok“, der App-Prozess läuft ohne Neustart weiter, Status-API meldet die Datenbank als gestört, Rechts- und Statusseite laden; nach dem Datenbankstart innerhalb von 60 s wieder bereit. Läuft in CI im Job `compose`. Hintergrund: Befund B-1 aus der Störungsübung [MAN-OPS-011](../../05-umsetzung/nachweise/MAN-OPS-011.md); behoben durch Error-Handler an allen Pools, Ping-Timeout 2 s und Rückgriff auf den zuletzt bekannten Wartungszustand bei Lesefehlern.


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 2.0 | 2026-10-23 | Merkmal/Metrik/Akzeptanzkriterium/Messverfahren getrennt (Fallstudie FS-M3) |
| 2.1 | 2026-10-23 | Review v0.2: R-15 |
| 2.2 | 2026-10-26 | Nachweis AT-OPS-001-3 (Datenbankausfall) ergänzt |
| 2.3 | 2026-10-26 | Guideline-Review: GL-05 Fehler- und Missbrauchsfälle ergänzt |
