---
id: MAN-OPS-008
type: evidence
requirement: REQ-OPS-008
status: done
owner: ops-lead
date: 2026-10-25
---

# MAN-OPS-008 Alarmübung „Anwendung nicht erreichbar“

## Ziel

Nachweis für REQ-OPS-008, Akzeptanzkriterium (2): Von Störungsbeginn bis zur Alarm-Mail vergehen **höchstens 5 min**. Zusätzlich gemessen: wie lange es nach Behebung bis zur Entwarnung dauert.

## Umgebung

| Punkt | Wert |
|---|---|
| Stack | Compose-Projekt `cmh1`, Profil `monitoring`, frisch gebaut (`docker compose -p cmh1 --profile monitoring up --build -d --wait`) |
| Ports | App 8089, Mailpit 8032, Prometheus 9190, Alertmanager 9193 (alle an 127.0.0.1) |
| Images | `prom/prometheus:v3.15.0`, `prom/alertmanager:v0.34.1`, `axllent/mailpit:v1.27` |
| Konfiguration | `ops/prometheus/alerts.yml` (Regel `AppDown`: `up == 0` für 2 min, SEV-1), `ops/alertmanager/alertmanager.yml` (`group_wait` 30 s, `group_interval` 5 min, SEV-1 an `rufbereitschaft@campusmarkt.example`, `send_resolved: true`) |
| Vorbedingung | Ziel `campusmarkt` in Prometheus `up = 1`, alle 8 Regeln geladen und `inactive`, Mailpit leer |
| Durchgeführt von | Fork H1 (automatisiert per Skript, Zeitstempel in UTC) |

## Ablauf

| Zeit (UTC) | Schritt | Beobachtung |
|---|---|---|
| 22:03:52 | `docker compose -p cmh1 stop app` | Störungsbeginn |
| 22:07:08 | Mail in Mailpit | `[FIRING:1] AppDown (app:8080 campusmarkt SEV-1)` an `rufbereitschaft@campusmarkt.example` |
| 22:07:13 | Abfrage des Skripts erkennt die Mail; `docker compose -p cmh1 start app` | Behebung |
| 22:12:08 | Mail in Mailpit | `[RESOLVED] AppDown (app:8080 campusmarkt SEV-1)` |

## Messwerte

| Messgröße | Wert |
|---|---|
| Störungsbeginn bis Alarm-Mail (Zeitstempel Mailpit) | **196 s** (Abfrage im 5-s-Takt erkannte sie nach 201 s) |
| Behebung bis Entwarnungs-Mail | **295 s** |
| Doppelte Mails | keine (eine FIRING-, eine RESOLVED-Mail) |
| Empfänger nach Schweregrad | korrekt: SEV-1 an die Rufbereitschaft |

Die 196 s setzen sich so zusammen: Scrape-Intervall (15 s) + `for: 2m` + Auswertungsintervall + `group_wait` (30 s). Dass die Entwarnung erst nach knapp 5 min kommt, liegt an `group_interval: 5m`.

## Ergebnis gegen das Akzeptanzkriterium

| Kriterium | Soll | Ist | Bewertung |
|---|---|---|---|
| (2) Störungsbeginn bis Mail | ≤ 5 min | 3 min 16 s | **bestanden** |
| (1) Regeln vorhanden, Folgealarme unterdrückt | laut Liste | 8 Regeln geladen; unterdrückt wird nur ausgelöst, wenn `AppDown` feuert (keine weiteren Mails während der Übung) | bestanden; im Detail per `promtool test rules` geprüft (CTRL-ALERT-RULES) |

Eine zweite Übung `NotReady` ergab sich in der Störungsübung [MAN-OPS-011](MAN-OPS-011.md): `NotReady` löste dort **nicht** aus, weil die App beim Datenbankausfall abstürzt (Befund B-1). Stattdessen kam wieder `AppDown`, nach **181 s**.

`BackupMissing` und `HighErrorRate` lassen sich lokal nicht sinnvoll üben: `BackupMissing` braucht 26 h Laufzeit, `HighErrorRate` eine Last von ≥ 0,1 Anfragen/s mit über 5 % 5xx. Beide sind durch die Regeltests in `ops/prometheus/alerts.test.yml` abgedeckt.

## Abweichungen und Befunde

| Nr. | Befund | Wirkung | Vorschlag |
|---|---|---|---|
| A-1 | Die Entwarnung kommt erst bis zu 5 min nach Behebung (`group_interval: 5m`). | Rufbereitschaft weiß bis zu 5 min nicht, dass alles wieder läuft. | In `monitoring-alarmierung.md` dokumentieren oder `group_interval` für SEV-1 auf 1 min senken. |
| A-2 | Die Links in den Alarm-Mails zeigen auf interne Container-Namen (`http://b0001be50373:9090/graph…`, `http://47621f87b561:9093`), weil `--web.external-url` nicht gesetzt ist. | Links aus der Mail sind nicht klickbar. | Bei Prometheus und Alertmanager `--web.external-url=http://127.0.0.1:${PROMETHEUS_PORT}` bzw. `…:${ALERTMANAGER_PORT}` setzen. |

## Folgeaufgaben

- A-1 und A-2 in `docs/07-betrieb/monitoring-alarmierung.md` bzw. `compose.yaml` übernehmen.
- Befund B-1 aus [MAN-OPS-011](MAN-OPS-011.md) beheben, danach `NotReady` erneut üben.
