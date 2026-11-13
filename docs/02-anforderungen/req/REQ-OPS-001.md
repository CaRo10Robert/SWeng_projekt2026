---
id: REQ-OPS-001
title: Gesundheitsprüfung und geordnetes Herunterfahren
type: operational
class: quality
status: verified
owner: team-plattform
risk: medium
reviewers: [qa-lead]
release: R1
moscow: M
moscow_reason: [3]
kano: n/a
epic: EPIC-00
source: Guideline Kap. 05
version: 2.4
created: 2026-10-20
last_updated: 2026-11-13
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
| Metrik | (1) Status der Lebendigkeits- und Bereitschaftsprüfung; (2) Dauer vom Stoppsignal bis zum Prozessende; (3) Anzahl abgebrochener Anfragen beim Stoppen. Abgebrochen ist eine von der App angenommene Anfrage ohne vollständige Antwort. Verbindungen, die nur der Kernel angenommen hatte und beim Schließen des Listeners zurücksetzt (die App hat sie nie gesehen), sowie Antworten mit 503 während des Schließens gelten wie ECONNREFUSED als abgewiesen: Der Client kann sie gefahrlos wiederholen |
| Akzeptanzkriterium | (1) Bereitschaft meldet „nicht bereit“, solange die Datenbank fehlt, Lebendigkeit bleibt „ok“; (2) **≤ 30 s**; (3) **0** |
| Messverfahren | Smoke-Test der Endpunkte; `docker compose stop app` während Dauerlast von 16 parallelen Clients **aus dem Docker-Netz** (nicht über den Port des Hosts: der Port-Proxy von Docker Desktop hält halb übertragene Anfragen offen und verfälscht die Messung). Kriterium 3 belegen Exit-Code 0 und „Beendet“ im Log (alle laufenden Anfragen abgeschlossen, kein Abbruch durch das Shutdown-Zeitlimit) und dass keine begonnene Antwort abreißt |
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
- `AT-OPS-001-2`: Ops-Test `tests/ops/shutdown-test.mjs` – Stopp unter Last aus dem Docker-Netz: Prozessende ≤ 30 s (gemessen etwa 1 s), Exit-Code 0, 0 abgebrochene Anfragen, keine 5xx außer 503 beim Schließen; danach wieder bereit. Läuft in CI im Job `compose`.
- `AT-OPS-001-3`: Ops-Test `tests/ops/db-outage-test.mjs` – Datenbank-Container gestoppt: Bereitschaft meldet „nicht bereit“ (503), Lebendigkeit bleibt „ok“, der App-Prozess läuft ohne Neustart weiter, Status-API meldet die Datenbank als gestört, Rechts- und Statusseite laden; nach dem Datenbankstart innerhalb von 60 s wieder bereit. Läuft in CI im Job `compose`. Hintergrund: Befund B-1 aus der Störungsübung [MAN-OPS-011](../../05-umsetzung/nachweise/MAN-OPS-011.md); behoben durch Error-Handler an allen Pools, Ping-Timeout 2 s und Rückgriff auf den zuletzt bekannten Wartungszustand bei Lesefehlern.


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 2.0 | 2026-10-23 | Merkmal/Metrik/Akzeptanzkriterium/Messverfahren getrennt (Fallstudie FS-M3) |
| 2.1 | 2026-10-23 | Review v0.2: R-15 |
| 2.2 | 2026-10-26 | Nachweis AT-OPS-001-3 (Datenbankausfall) ergänzt |
| 2.3 | 2026-10-26 | Guideline-Review: GL-05 Fehler- und Missbrauchsfälle ergänzt |
| 2.4 | 2026-11-13 | Nachweis AT-OPS-001-2 umgesetzt; Messverfahren und Metrik (3) präzisiert: Last aus dem Docker-Netz, „abgebrochen“ = von der App angenommene Anfrage ohne vollständige Antwort; Kernel-Resets nicht angenommener Verbindungen und 503 beim Schließen zählen als abgewiesen (Entscheidung Product Owner 2026-11-13). Herunterfahren protokolliert die Dauer je Schritt; Status → verified |
