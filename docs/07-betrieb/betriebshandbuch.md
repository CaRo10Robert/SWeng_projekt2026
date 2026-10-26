---
id: OPS-RUNBOOK
type: operational
status: in-review
owner: architecture-lead
version: 1.2
created: 2026-10-24
last_updated: 2026-10-25
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
| mit TLS-Proxy | `docker compose --env-file .env.proxy.example --profile proxy up -d` |
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
| `PUBLIC_URL` | `http://localhost:8080` | Basis für Links in E-Mails; im Echtbetrieb `https://…` (Voraussetzung für RFC-konforme `security.txt` und `List-Unsubscribe`) |
| `TRUST_PROXY` | `false` | `true` hinter einem Reverse Proxy: Client-IP aus `X-Forwarded-For`, genau ein Hop |
| `DATABASE_URL` | Compose-intern | Verbindung zur Datenbank |
| `DB_POOL_SIZE` | 10 | Verbindungen je Prozess |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `MAIL_FROM` | Mailpit | Mailversand; im Echtbetrieb SMTP-Relay (siehe [Zustellbarkeit](mail-zustellbarkeit.md)) |
| `TERMS_VERSION` | leer | nur **Override**: Die Version der Nutzungsbedingungen kommt aus dem Front Matter (`legal-manifest.json`, ADR-0015). Ein gesetzter Wert überschreibt sie und kann zu Abweichungen führen – im Normalfall nicht setzen |
| `LEGAL_STRICT` | `false` | `true`: Die App startet nicht, solange Rechtstexte Platzhalter enthalten (Pflicht im Echtbetrieb) |
| `SESSION_TTL_DAYS` | 30 | maximale Sitzungsdauer |
| `COOKIE_SECURE` | `true` | `Secure`-Attribut des Sitzungscookies |
| `SEED_DEMO`, `DEMO_MODE` | `true` | Demo-Daten und Demo-Werkzeuge; im Echtbetrieb **false**. Mit `SEED_DEMO=true` hebt jeder Start die Demo-Konten auf die aktuelle Fassung der Rechtstexte und legt fehlende Demo-Konten an (Tim bleibt auf der alten Fassung) |
| `UNSUBSCRIBE_SECRET` | leer | optionaler Override; ohne Wert erzeugt die App beim ersten Start ein zufälliges Geheimnis in `platform.setting` (kein öffentlicher Standardwert) |
| `SECURITY_CONTACT` | `mailto:security@hwg-lu.example` | Kontakt in `security.txt`; im Echtbetrieb echte Adresse |
| `JOURNAL_DIR` | `/data/journal` (Volume `journal`) | Ablage des Löschjournals (ADR-0018) |
| `MAINTENANCE_MODE` / `MAINTENANCE_UNTIL` | `false` / leer | harter Wartungsmodus mit voraussichtlichem Ende (Neustart nötig); daneben gibt es den weichen Modus über die Admin-Oberfläche, siehe [Wartung](wartung-statusseite.md) |
| `LOG_LEVEL` | `info` | Protokollstufe |
| `SHUTDOWN_TIMEOUT_MS` | Standardwert im Code | Zeit für geordnetes Herunterfahren |

Die IP-Pseudonymisierung braucht keine Variable mehr: Der Schlüssel wird zufällig erzeugt und täglich in der Datenbank rotiert (`platform.ip_pepper`, ADR-0014).

Geheimnisse (Datenbankpasswort, SMTP-Zugang) gehören im Echtbetrieb nicht in `compose.yaml`, sondern in eine `.env`-Datei außerhalb des Repos oder einen Secret-Store (Verfahren des RZ: age mit Schlüssel im Tresor der Stabsstelle, fiktiv).

## 4. Rollen

| Rolle | Aufgabe | Im Muster |
|---|---|---|
| Betriebsverantwortliche/r | Verfügbarkeit, Updates, Backups | Team Plattformbetrieb im RZ (fiktiv) |
| Rufbereitschaft | nimmt Alarme der Stufe SEV-1/SEV-2 an | Bereitschaftsplan des RZ, +49 621 555-0199 (fiktiv) |
| `security-lead` | Sicherheitsvorfälle, Datenpannen, Pentest | Team |
| Moderationsleitung | DSA-Prozesse | Max Moderato (fiktiv) |
| Administrator/in (App) | Rollen, Wartungsankündigung, DAC7-Auswertung | Rolle `admin` in der App |

## 5. Regelmäßige Aufgaben

| Häufigkeit | Aufgabe | Wie |
|---|---|---|
| täglich (automatisch) | Fristen löschen, Erinnerungen, Ablauf von Anzeigen | Job-Worker (pg-boss) |
| täglich | Datensicherung | `node scripts/backup.mjs` per Zeitplan (systemd-Timer des Hosts, täglich 02:30 Uhr – Übungswert) |
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
| Demo-Konto muss nach einem Update den Nutzungsbedingungen zustimmen | Installation ohne `SEED_DEMO=true` gestartet, daher kein Abgleich | mit `SEED_DEMO=true` neu starten oder einmal zustimmen; Tim ist absichtlich der Testfall |
| alle Anfragen 503 | Wartungsmodus aktiv | weicher Modus: als Administrator in der Admin-Oberfläche ausschalten (Admins sind vom Wartungsmodus ausgenommen); harter Modus: `MAINTENANCE_MODE=false`, Neustart von `app` |
| Registrierung liefert 429 | Registrierungsgrenze je IP erreicht (Q-18) | eine Stunde warten; im Test Stack neu aufsetzen |

Weitere Hinweise: README des Repos, Abschnitt Fehlerbehebung (REQ-OPS-003).
