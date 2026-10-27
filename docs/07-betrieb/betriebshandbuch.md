---
id: OPS-RUNBOOK
type: operational
status: approved
owner: architecture-lead
version: 1.4
created: 2026-10-24
last_updated: 2026-10-26
review_due: 2027-04-26
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
| Zustand prüfen | `docker compose ps -a` (Spalte „healthy“; `-a` zeigt auch gestoppte Container, z. B. eine gestoppte Datenbank – Befund H-1 aus [MAN-OPS-011](../05-umsetzung/nachweise/MAN-OPS-011.md)) |
| Protokolle | `docker compose logs -f app` |
| stoppen (Daten bleiben) | `docker compose down` |
| alles zurücksetzen (**löscht Daten**) | `docker compose down -v` |
| Image neu bauen | `docker compose build` |

App, Mailpit, Prometheus und Alertmanager sind nur an `127.0.0.1` gebunden. Nach dem Start: Web-App unter `http://localhost:8080` (mit Proxy `https://campusmarkt.localhost:8443`), Mailpit unter `http://localhost:8025`, mit Profil `monitoring` Prometheus unter `http://127.0.0.1:9090` und Alertmanager unter `http://127.0.0.1:9093`.

## 3. Konfiguration (Umgebungsvariablen)

| Variable | Standard | Bedeutung |
|---|---|---|
| `APP_PORT` / `MAILPIT_PORT` | 8080 / 8025 | Ports auf dem Host |
| `APP_MODE` | `all` | `all`, `api` oder `worker` |
| `PUBLIC_URL` | `http://localhost:8080` | Basis für Links in E-Mails; im Echtbetrieb `https://…` (Voraussetzung für RFC-konforme `security.txt` und `List-Unsubscribe`) |
| `TRUST_PROXY` | `false` | `true` hinter einem Reverse Proxy: Client-IP aus `X-Forwarded-For`, genau ein Hop |
| `DATABASE_URL` | Compose-intern | Verbindung zur Datenbank |
| `DB_POOL_SIZE` | 10 | Verbindungen je Prozess |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE` | Mailpit | Mailversand; im Echtbetrieb SMTP-Relay (siehe [Zustellbarkeit](mail-zustellbarkeit.md)) |
| `MAIL_FROM` | `CampusMarkt HWG LU <no-reply@campusmarkt.example>` | Absender; Domain muss zu SPF/DKIM/DMARC passen (Befund N-1 aus MAN-NOTI-004) |
| `MAIL_REPLY_TO` | `CampusMarkt Support <campusmarkt-support@hwg-lu.example>` (fiktiv) | Antwortadresse aller E-Mails = Kontaktstelle (REQ-LEGAL-005, Befund N-2) |
| `API_DOCS` | wie `DEMO_MODE` | `true`: OpenAPI-Dokumentation unter `/api/docs`; im Echtbetrieb **false** (Pentest-Befund PT-F-17) |
| `TERMS_VERSION` | leer | nur **Override**: Die Version der Nutzungsbedingungen kommt aus dem Front Matter (`legal-manifest.json`, ADR-0015). Ein gesetzter Wert überschreibt sie und kann zu Abweichungen führen – im Normalfall nicht setzen |
| `LEGAL_STRICT` | `false` | `true`: Die App startet nicht, solange Rechtstexte Platzhalter enthalten (Pflicht im Echtbetrieb) |
| `SESSION_TTL_DAYS` | 30 | maximale Sitzungsdauer |
| `COOKIE_SECURE` | `true` | `Secure`-Attribut des Sitzungscookies |
| `SEED_DEMO`, `DEMO_MODE` | `true` | Demo-Daten und Demo-Werkzeuge; im Echtbetrieb **false**. Mit `SEED_DEMO=true` hebt jeder Start die Demo-Konten auf die aktuelle Fassung der Rechtstexte und legt fehlende Demo-Konten an (Tim bleibt auf der alten Fassung) |
| `UNSUBSCRIBE_SECRET` | leer | optionaler Override; ohne Wert erzeugt die App beim ersten Start ein zufälliges Geheimnis in `platform.setting` (kein öffentlicher Standardwert) |
| `SECURITY_CONTACT` | `mailto:security@hwg-lu.example` | Kontakt in `security.txt`; im Echtbetrieb echte Adresse |
| `JOURNAL_DIR` | `/data/journal` (Volume `journal`) | Ablage des Löschjournals (ADR-0019) |
| `MAINTENANCE_MODE` / `MAINTENANCE_UNTIL` | `false` / leer | harter Wartungsmodus mit voraussichtlichem Ende (Neustart nötig); daneben gibt es den weichen Modus über die Admin-Oberfläche, siehe [Wartung](wartung-statusseite.md) |
| `LOG_LEVEL` | `info` | Protokollstufe; das Request-Log enthält Methode, Route ohne Query, Status, Dauer und Request-ID, keine IP-Adresse. Eine Request-ID vom Client (`x-request-id`) wird nur übernommen, wenn sie eine UUID ist; unbekannte Pfade erscheinen als `unmatched`. Sicherheitsereignisse (`auth.login`, `auth.login_failed`, `auth.login_throttled`, `access_denied`) tragen nur Pseudonyme |
| `PROMETHEUS_PORT`, `ALERTMANAGER_PORT`, `PROXY_HTTPS_PORT`, `PROXY_HTTP_PORT` | 9090, 9093, 8443, 8088 | Host-Ports der Profile `monitoring` und `proxy` |
| `DEV_DB_PORT`, `DEV_SMTP_PORT`, `DEV_MAILPIT_PORT` | 5432, 1025, 8025 | nur Entwicklungsumgebung (`compose.dev.yaml`), an `127.0.0.1` gebunden; Vite liest `VITE_API_TARGET` bzw. den `PORT` des Servers aus `.env` |
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
| **Datenbank nicht erreichbar** (Alarm `NotReady`, Statusseite „Datenbank gestört“, `/health/ready` 503) | `db`-Container gestoppt oder abgestürzt, Volume voll, Verbindungsabbruch | Runbook siehe unten (Abschnitt 6.1) |
| Port belegt | anderer Dienst auf 8080/8025 | `APP_PORT=8081 docker compose up -d` |
| keine E-Mails | Mailpit nicht erreichbar | Jobs werden wiederholt (ADR-0005); nach Neustart von Mailpit kommen sie an |
| Demo-Konto muss nach einem Update den Nutzungsbedingungen zustimmen | Installation ohne `SEED_DEMO=true` gestartet, daher kein Abgleich | mit `SEED_DEMO=true` neu starten oder einmal zustimmen; Tim ist absichtlich der Testfall |
| alle Anfragen 503 | Wartungsmodus aktiv | weicher Modus: als Administrator in der Admin-Oberfläche ausschalten (Admins sind vom Wartungsmodus ausgenommen); harter Modus: `MAINTENANCE_MODE=false`, Neustart von `app` |
| Registrierung liefert 429 | Registrierungsgrenze je IP erreicht (Q-18) | eine Stunde warten; im Test Stack neu aufsetzen |

### 6.1 Runbook „Datenbank nicht erreichbar“

Ergebnis der Störungsübung [MAN-OPS-011](../05-umsetzung/nachweise/MAN-OPS-011.md) (Befund H-2). Die App bleibt bei einem Datenbankausfall erreichbar (Lebendigkeit „ok“, Bereitschaft 503, Status-, Rechts- und Wartungsseiten laden; abgesichert durch AT-OPS-001-3) und verbindet sich nach dem Start der Datenbank selbst wieder.

1. Einstufen: SEV-1 ([Incident-Prozess](incident-prozess.md)); Ankündigungsbanner ist bei ausgefallener Datenbank nicht setzbar – Ausweichkanal nutzen (siehe Incident-Prozess, Kommunikation).
2. Zustand: `docker compose ps -a` (läuft `db`? Exit-Code?), `docker compose logs --tail 100 db`.
3. Speicher prüfen: `docker system df -v` bzw. freier Platz des Volumes `pgdata`; bei vollem Volume Platz schaffen, keine Dateien im Volume löschen.
4. Starten: `docker compose start db`, auf „healthy“ warten (`docker compose ps`).
5. Prüfen: `curl -s http://localhost:8080/health/ready` → 200 innerhalb von 60 s; Anmeldung mit einem Testkonto; Alarm `NotReady` wird nach höchstens 5 min als behoben gemeldet.
6. Startet die Datenbank nicht (beschädigte Daten): Wiederherstellung nach [backup-restore.md](backup-restore.md); bei Verdacht auf Datenabfluss zusätzlich [Datenpannen-Prozess](../06-recht/datenpannen-prozess.md).
7. Postmortem nach Incident-Prozess.

### 6.2 Notfall: alle Sitzungen beenden

Bei Verdacht auf gestohlene Sitzungen oder Zugangsdaten beendet ein Administrator in der Admin-Oberfläche (Bereich „Sicherheit“, zweistufige Bestätigung) **alle** Sitzungen einschließlich der eigenen (`POST /api/v1/admin/security/end-sessions`, Eintrag im Audit-Log). Optional wird beim nächsten Login ein Passwortwechsel erzwungen: Die Anmeldung antwortet dann mit `password_change_required` und schickt einen Link zum Zurücksetzen. Für die Information **aller** Mitglieder gibt es bewusst keine Rundmail (Missbrauchsrisiko); genutzt wird das Ankündigungsbanner bzw. bei ausgefallener App der Ausweichkanal.

### 6.3 Runbook AppDown

Alarm: Prometheus erreicht `/metrics` der App seit 2 min nicht (SEV-1).

- **Diagnose:** `docker compose ps -a app` (läuft der Container, Neustarts?), `docker compose logs --tail 200 app` (Absturz, Fehler beim Start, Migration). Erreichbarkeit von außen: `curl -i http://localhost:8080/health/live`.
- **Maßnahme:** Absturz beim Start → Ursache im Log beheben (z. B. fehlende Variable, Migration, siehe REQ-OPS-005), dann `docker compose up -d app`. Container läuft, aber `/metrics` nicht erreichbar → Netzwerk bzw. Prometheus-Ziel prüfen (`http://127.0.0.1:9090/targets`). Nach einem fehlerhaften Release: vorheriges Image-Tag starten.
- **Entwarnung:** `/health/live` 200, `/health/ready` 200, Ziel in Prometheus „up“; die Entwarnung kommt mit bis zu 5 min Verzögerung (`group_interval`). Danach Postmortem nach dem [Incident-Prozess](incident-prozess.md).

### 6.4 Runbook HighErrorRate

Alarm: mehr als 5 % Serverfehler (5xx) über 5 min bei mindestens 0,1 Anfragen/s, nicht im Wartungsmodus (SEV-2).

- **Diagnose:** In Prometheus `sum by (route, status) (rate(http_request_duration_seconds_count{status=~"5.."}[5m]))` – welche Route? Im Log nach `"level":50` und der `requestId` aus Fehlermeldungen suchen: `docker compose logs --since 15m app`. Datenbank und Mail prüfen (`/api/v1/status`).
- **Maßnahme:** Abhängigkeit gestört → passendes Runbook (6.1 Datenbank, „keine E-Mails“ in der Tabelle oben). Fehler seit einem Release → Rollback auf das vorherige Image-Tag ([Update-Prozess](update-prozess.md)). Bei länger dauernder Behebung Wartungsmodus mit Ankündigung (REQ-OPS-006).
- **Entwarnung:** Fehlerquote 15 min unter 1 %; Ursache im Postmortem.

### 6.5 Runbook SlowSearch

Alarm: p95 der Suche (`GET /api/v1/listings`) über 500 ms für 10 min (SEV-3, Ziel aus REQ-PERF-001).

- **Diagnose:** Last prüfen (`rate(http_request_duration_seconds_count{route="/api/v1/listings"}[5m])`); langsame Abfragen in PostgreSQL: `docker compose exec db psql -U campusmarkt -c "SELECT query, calls, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 5"` (falls die Erweiterung aktiv ist), sonst `SELECT * FROM pg_stat_activity WHERE state <> 'idle'`. CPU und Speicher: `docker stats`.
- **Maßnahme:** Ungewöhnliche Last durch einzelne Clients → Rate-Limits greifen lassen, ggf. Grenzen senken. Fehlender Index bzw. Abfrageplan → `EXPLAIN ANALYZE` der Suchabfrage, Index als Migration nachziehen. Ressourcen zu knapp → Container-Limits anheben.
- **Entwarnung:** p95 30 min unter 500 ms; dauerhafte Maßnahme als Backlog-Eintrag.

### 6.6 Runbook JobFailures

Alarm: mindestens ein Hintergrund-Job ist in den letzten 15 min endgültig gescheitert (`outcome="dead"`, SEV-3).

- **Diagnose:** Admin-Oberfläche → Abschnitt „Dead-Letter-Queue“ (Queue, Fehlermeldung, Zeitpunkt); Log mit `docker compose logs --since 30m app`. Häufigste Ursache: Mail-Relay bzw. Mailpit nicht erreichbar (CTRL-DLQ).
- **Maßnahme:** Ursache beheben (Relay starten, Konfiguration). Betroffene Mitglieder können Mails selbst neu anfordern (Bestätigung, Passwort); für Benachrichtigungen ist kein erneuter Versand nötig. Im Demo-Modus können fällige Jobs über „Fällige Jobs jetzt ausführen“ angestoßen werden.
- **Entwarnung:** keine neuen Dead Letters in 30 min; Einträge in der Dead-Letter-Ansicht dokumentiert und bewertet.

### 6.7 Runbook WebSocketDrop

Alarm: offene Echtzeitverbindungen fallen innerhalb von 5 min auf unter 20 %, bei zuvor mindestens 5 Verbindungen (SEV-2).

- **Diagnose:** Neustart der App? (`docker compose ps app`, Startzeit). Proxy-Profil aktiv → `docker compose logs proxy` (Timeouts, Zertifikat). Browser-Konsole eines Testkontos: Verbindungsfehler bzw. Statuscodes beim Upgrade.
- **Maßnahme:** Nach einem Neustart verbinden sich Clients automatisch neu, Chat läuft über Polling weiter (REQ-PERF-002) – beobachten. Proxy-Problem → Proxy-Konfiguration prüfen ([TLS und Reverse Proxy](tls-reverse-proxy.md)) und neu laden.
- **Entwarnung:** Verbindungszahl wieder auf dem Niveau vor dem Abfall; Nachrichten wurden laut Stichprobe vollständig zugestellt.

### 6.8 Runbook MaintenanceModeOn

Alarm: Wartungsmodus seit mehr als 2 h aktiv (SEV-3).

- **Diagnose:** Ist eine Wartung angekündigt und läuft sie noch (Ankündigung in der Admin-Oberfläche, Audit-Log „maintenance“)? Weicher Modus (Einstellung) oder harter Modus (`MAINTENANCE_MODE`)?
- **Maßnahme:** Wartung beendet → Modus ausschalten (Tabelle oben, Zeile „alle Anfragen 503“). Wartung dauert länger → Ankündigung und `Retry-After` anpassen ([Wartung und Statusseite](wartung-statusseite.md)).
- **Entwarnung:** `campusmarkt_maintenance_mode` = 0, Statusseite „normal“.

### 6.9 Runbook BackupMissing

Alarm: seit mehr als 26 h keine erfolgreiche Sicherung (SEV-2; RPO ≤ 24 h aus REQ-AVAIL-003).

- **Diagnose:** Letzte Sicherung in `backups/` (Verzeichnisse mit `manifest.json`; `.partial` bedeutet abgebrochen); Zeitplan bzw. Cronjob des Betriebs prüfen; freien Speicher prüfen.
- **Maßnahme:** Sicherung von Hand starten: `node scripts/backup.mjs` ([Datensicherung](backup-restore.md)); bei vollem Datenträger Platz schaffen, keine gültigen Sicherungen löschen. Abgebrochene `.partial`-Verzeichnisse nach Prüfung entfernen.
- **Entwarnung:** Metrik `campusmarkt_backup_last_success_timestamp_seconds` aktuell; Ursache des Ausfalls behoben.

Weitere Hinweise: README des Repos, Abschnitt Fehlerbehebung (REQ-OPS-003).
