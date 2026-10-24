---
id: OPS-RUNBOOK
type: operational
status: in-review
owner: architecture-lead
version: 1.1
created: 2026-10-24
last_updated: 2026-10-24
---

# Betriebshandbuch

> **Muster im Rahmen einer Übungsaufgabe.** Anforderung: REQ-OPS-011. Befehle gelten für das Docker-Beispiel; Abweichungen im Echtbetrieb sind markiert.

## 1. Komponenten

| Dienst (Compose) | Image | Aufgabe | Daten | Profil |
|---|---|---|---|---|
| `app` | `campusmarkt:local` (eigener Build) | REST-API, WebSocket, Web-App, Job-Worker | Volume `uploads` (Bilder) | Standard |
| `db` | PostgreSQL 17 | Datenbank, Job-Queue (pg-boss), Rate-Limits | Volume `pgdata` | Standard |
| `mailpit` | Mailpit | fängt alle E-Mails ab (Weboberfläche Port 8025) | – | Standard |
| `proxy` | `caddy:2.11.6-alpine`, Konfiguration `docker/caddy/Caddyfile` | TLS mit interner CA, HSTS, Weiterleitung http → https; Ports `PROXY_HTTPS_PORT` (8443), `PROXY_HTTP_PORT` (8088) | Volume für Zertifikate | `proxy` |
| `prometheus` | `prom/prometheus:v3.15.0`, Konfiguration `ops/prometheus/` | sammelt Metriken von `/metrics`, wertet Alarmregeln aus; nur `127.0.0.1:${PROMETHEUS_PORT:-9090}` | Volume für Metriken | `monitoring` |
| `alertmanager` | `prom/alertmanager:v0.34.1`, Konfiguration `ops/alertmanager/` | verschickt Alarme per Mail (an Mailpit), nach Schweregrad an zwei Empfänger; nur `127.0.0.1:${ALERTMANAGER_PORT:-9093}` | – | `monitoring` |

Architektur und Begründung: [Architektur, Verteilungssicht](../03-architektur/architektur.md#7-verteilungssicht), ADR-0010, ADR-0017.

## 2. Starten und Stoppen

| Aufgabe | Befehl |
|---|---|
| Standard starten | `docker compose up -d` |
| mit TLS-Proxy | `PUBLIC_URL=https://campusmarkt.localhost:8443 TRUST_PROXY=true docker compose --profile proxy up -d` |
| mit Überwachung | `docker compose --profile monitoring up -d` |
| Zustand prüfen | `docker compose ps` (Spalte „healthy“) |
| Protokolle | `docker compose logs -f app` |
| stoppen (Daten bleiben) | `docker compose down` |
| alles zurücksetzen (**löscht Daten**) | `docker compose down -v` |
| Image neu bauen | `docker compose build` |

Nach dem Start: Web-App unter `http://localhost:8080` (mit Proxy `https://campusmarkt.localhost:8443`), Mailpit unter `http://localhost:8025`, mit Profil `monitoring` Prometheus unter `http://127.0.0.1:9090` und Alertmanager unter `http://127.0.0.1:9093`.

## 3. Konfiguration (Umgebungsvariablen)

| Variable | Standard | Bedeutung |
|---|---|---|
| `APP_PORT` / `MAILPIT_PORT` | 8080 / 8025 | Ports auf dem Host |
| `APP_MODE` | `all` | `all`, `api` oder `worker` |
| `PUBLIC_URL` | `http://localhost:8080` | Basis für Links in E-Mails |
| `DATABASE_URL` | Compose-intern | Verbindung zur Datenbank |
| `DB_POOL_SIZE` | 10 | Verbindungen je Prozess |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `MAIL_FROM` | Mailpit | Mailversand; im Echtbetrieb SMTP-Relay (siehe [Zustellbarkeit](mail-zustellbarkeit.md)) |
| `TERMS_VERSION` | `2026-10` | Version der Nutzungsbedingungen; Änderung erzwingt erneute Zustimmung |
| `SESSION_TTL_DAYS` | 30 | maximale Sitzungsdauer |
| `COOKIE_SECURE` | `true` | `Secure`-Attribut des Sitzungscookies |
| `SEED_DEMO`, `DEMO_MODE` | `true` | Demo-Daten und Demo-Werkzeuge; im Echtbetrieb **false** |
| `IP_HASH_SALT` | intern | Startwert für die IP-Pseudonymisierung (ADR-0014) |
| `MAINTENANCE_MODE` | `false` | Wartungsmodus, siehe [Wartung](wartung-statusseite.md) |
| `LOG_LEVEL` | `info` | Protokollstufe |
| `SHUTDOWN_TIMEOUT_MS` | Standardwert im Code | Zeit für geordnetes Herunterfahren |

Geheimnisse (Datenbankpasswort, SMTP-Zugang) gehören im Echtbetrieb nicht in `compose.yaml`, sondern in eine `.env`-Datei außerhalb des Repos oder einen Secret-Store [Platzhalter: Verfahren des RZ].

## 4. Rollen

| Rolle | Aufgabe | Im Muster |
|---|---|---|
| Betriebsverantwortliche/r | Verfügbarkeit, Updates, Backups | [Platzhalter: RZ-Team] |
| Rufbereitschaft | nimmt Alarme der Stufe SEV-1/SEV-2 an | [Platzhalter: Bereitschaftsplan, Erreichbarkeit] |
| `security-lead` | Sicherheitsvorfälle, Datenpannen, Pentest | Team |
| Moderationsleitung | DSA-Prozesse | [Platzhalter] |
| Administrator/in (App) | Rollen, Wartungsankündigung, DAC7-Auswertung | Rolle `admin` in der App |

## 5. Regelmäßige Aufgaben

| Häufigkeit | Aufgabe | Wie |
|---|---|---|
| täglich (automatisch) | Fristen löschen, Erinnerungen, Ablauf von Anzeigen | Job-Worker (pg-boss) |
| täglich | Datensicherung | `node scripts/backup.mjs` per Zeitplan [Platzhalter: Cron/Timer des Hosts] |
| wöchentlich | Abhängigkeits-Updates prüfen und mergen | Renovate-Pull-Requests ([Update-Prozess](update-prozess.md)) |
| wöchentlich | Alarme und Fehlerrate durchsehen | Prometheus / Alertmanager |
| monatlich | Restore-Übung auf Testumgebung | [Backup und Restore](backup-restore.md) |
| je Semester | Rollenliste prüfen, Datenpannen-Planspiel | Admin-Oberfläche, [Datenpannen-Prozess](../06-recht/datenpannen-prozess.md) |
| jährlich | VVT, TOMs, Rechtstexte prüfen; Transparenzbericht; `security.txt`-Ablaufdatum erneuern | DSB, [DSA-Prozesse](../06-recht/dsa-prozesse.md) |
| bis 31. Januar | DAC7-Auswertung erstellen und weitergeben | Admin-Oberfläche → Steuerabteilung |

## 6. Häufige Störungen

| Symptom | Ursache | Abhilfe |
|---|---|---|
| `app` wird nicht „healthy“ | Datenbank noch nicht bereit, Migration fehlgeschlagen | `docker compose logs app`; Migrationen laufen beim Start automatisch (REQ-OPS-005) |
| Port belegt | anderer Dienst auf 8080/8025 | `APP_PORT=8081 docker compose up -d` |
| keine E-Mails | Mailpit nicht erreichbar | Jobs werden wiederholt (ADR-0005); nach Neustart von Mailpit kommen sie an |
| alle Anfragen 503 | Wartungsmodus aktiv | `MAINTENANCE_MODE=false`, Neustart von `app` |
| Registrierung liefert 429 | Registrierungsgrenze je IP erreicht (Q-18) | eine Stunde warten; im Test Stack neu aufsetzen |

Weitere Hinweise: README des Repos, Abschnitt Fehlerbehebung (REQ-OPS-003).
