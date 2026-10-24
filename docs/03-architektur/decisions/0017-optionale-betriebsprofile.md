# ADR-0017: Optionale Compose-Profile für Reverse Proxy und Überwachung

- **Status:** Accepted (vorläufig, Q-27; Bestätigung mit dem Architektur-Review ausstehend)
- **Datum:** 2026-10-24
- **Bezug:** REQ-OPS-008, REQ-OPS-009, REQ-OPS-002, REQ-ARCH-005, ADR-0010 (erweitert, nicht ersetzt), Backlog B-54, B-55; Betrieb in [docs/07-betrieb/](../../07-betrieb/README.md)

## Kontext
Das Docker-Beispiel startet bewusst nur `app`, `db` und `mailpit` (ADR-0010, REQ-ARCH-005). Für einen professionellen Betrieb gehören eine verschlüsselte Verbindung mit HSTS (REQ-OPS-009) sowie Überwachung mit Alarmierung (REQ-OPS-008) dazu. Diese Teile sollen als Übung vorführbar sein, ohne den Standardstart zu verändern oder zu verlangsamen und ohne externe Konten.

Zwei Besonderheiten:
- **HSTS gilt je Hostname, nicht je Port.** Ein HSTS-Header für `localhost` würde der Browser für **alle** Dienste auf `localhost` anwenden, auch für andere lokale Projekte auf anderen Ports. Ein nicht vertrauenswürdiges Zertifikat lässt sich unter HSTS nicht mehr wegklicken.
- Die Leitlinie zur Alarmierung verlangt Alarme auf Symptome, die eine handelnde Person brauchen, und ein Runbook je Alarm (Guideline Kap. 11).

## Optionen
| Option | Pro | Contra |
|---|---|---|
| **A: Compose-Profile `proxy` und `monitoring` in `compose.yaml`** | Standardstart unverändert; ein Befehl zum Zuschalten (`docker compose --profile proxy up`); offline lauffähig, sobald die Images einmal geladen sind | Mehr Konfiguration im Repo; die Images müssen einmal geladen werden |
| B: Fester Bestandteil des Standardstarts | Immer aktiv | Widerspricht ADR-0010 und REQ-ARCH-005 (drei Dienste); längerer Start; Zertifikatswarnung bei jedem Start |
| C: Nur dokumentieren, nichts mitliefern | Kein Aufwand | Nicht vorführbar; Alarmregeln und Proxy-Konfiguration ungetestet |
| D: TLS direkt in Fastify | Kein weiterer Dienst | Zertifikatsverwaltung in der Anwendung; im Echtbetrieb übernimmt das ohnehin ein Proxy |

## Entscheidung
**Option A.**

**Profil `proxy` (REQ-OPS-009):**
1. **Dienst:** `proxy` mit `caddy:2.11.6-alpine`, Konfiguration in `docker/caddy/Caddyfile` (lokale CA, `admin off`, eigener Block für die Weiterleitung http → https auf den äußeren Port).
2. **Eigener Hostname** `campusmarkt.localhost`. Moderne Browser lösen `*.localhost` auf die eigene Maschine auf, eine Hosts-Datei ist nicht nötig. HSTS gilt damit **nur** für diesen Namen, nicht für `localhost`. Port: `PROXY_HTTPS_PORT`, Standard 8443; dazu `PROXY_HTTP_PORT`, Standard 8088, für die Weiterleitung http → https (308). Die App läuft im Profil mit `PUBLIC_URL=https://campusmarkt.localhost:8443` und `TRUST_PROXY=true`.
3. **Zertifikat:** `tls internal`, also Caddys lokale CA, ohne Internet. Die CA lässt sich mit `docker compose exec proxy cat /data/caddy/pki/authorities/local/root.crt` auslesen; [TLS und Reverse Proxy](../../07-betrieb/tls-reverse-proxy.md) erklärt, wie man ihr vertraut oder die Warnung einmalig bestätigt.
4. **Header:**
   - `Strict-Transport-Security: max-age=31536000` im Beispiel ohne `includeSubDomains` und ohne `preload`; im Echtbetrieb mit beidem, siehe docs/07-betrieb/tls-reverse-proxy.md;
   - Weiterleitung http → https;
   - WebSocket-Weiterleitung für `/ws`;
   - `X-Forwarded-For` an die App, mit `TRUST_PROXY=true` im Profil (B-41). *Stand 2026-10-24:* Compose reicht `TRUST_PROXY` an die App durch, die App wertet die Variable aber noch nicht aus (Fastify `trustProxy`); bis dahin sehen Rate-Limits hinter dem Proxy die IP des Proxys.
5. **`/metrics`** wird am Proxy gesperrt (404). Erreichbar ist es nur im internen Compose-Netz (Abschnitt 7.2 der Architektur).

**Profil `monitoring` (REQ-OPS-008):**
1. **Dienste:**
   - `prometheus` (`prom/prometheus:v3.15.0`, Konfiguration `ops/prometheus/prometheus.yml`): liest `app:8080/metrics` alle 15 s; die Readiness kommt über die Metrik `app_ready` aus der Readiness-Prüfung der App.
   - `alertmanager` (`prom/alertmanager:v0.34.1`, Konfiguration `ops/alertmanager/alertmanager.yml`): sendet Alarme per SMTP an Mailpit (`mailpit:1025`), nach Schweregrad an zwei Empfänger: `[Platzhalter: betrieb@campusmarkt.example]` für alle Alarme, SEV-1 zusätzlich an `[Platzhalter: rufbereitschaft@campusmarkt.example]` mit Erinnerung alle 30 min.
2. **Ports** nur an `127.0.0.1` gebunden, konfigurierbar über `PROMETHEUS_PORT` (Standard 9090) und `ALERTMANAGER_PORT` (Standard 9093).
3. **Alarmregeln** in `ops/prometheus/alerts.yml`, je Regel ein Runbook-Link; maßgeblich ist die Tabelle in [Überwachung und Alarmierung](../../07-betrieb/monitoring-alarmierung.md), Regeltests in `ops/prometheus/alerts.test.yml`:

   | Alarm | Bedingung | Dauer | Schwere |
   |---|---|---|---|
   | `AppDown` | `up == 0` | 2 min | SEV-1 |
   | `NotReady` | `app_ready == 0` (z. B. Datenbank nicht erreichbar) | 5 min | SEV-1 |
   | `HighErrorRate` | Anteil 5xx > 5 % | 5 min | SEV-2 |
   | `SlowSearch` | p95 von `GET /api/v1/listings` > 500 ms (REQ-PERF-001) | 10 min | SEV-3 |
   | `JobFailures` | fehlgeschlagene Jobs in 15 min > 0 | sofort | SEV-3 |
   | `WebSocketDrop` | `ws_connections` < 20 % des Werts vor 5 min, nur wenn vorher ≥ 5 Verbindungen | sofort | SEV-2 |
   | `MaintenanceModeOn` | `campusmarkt_maintenance_mode == 1` | 2 h | SEV-3 |
   | `BackupMissing` | letzte erfolgreiche Sicherung (`campusmarkt_backup_last_success_timestamp_seconds`) älter als 26 h; 0 = nie gesichert | sofort | SEV-2 |

4. **Kein Grafana:** Es bleibt Could. Die Prometheus-Oberfläche reicht für die Übung.

**Gemeinsam:**
- Der Standardbefehl `docker compose up` startet weiter nur `app`, `db` und `mailpit`. ADR-0010 bleibt gültig und wird durch dieses ADR **erweitert**.
- CI prüft die Profile:
  - Job `ops-config`: `docker compose config` mit allen Profilen, `caddy validate`, `promtool check config` und `promtool test rules`, `amtool check-config`, Renovate-Konfiguration (CTRL-ALERT-RULES, CTRL-RENOVATE);
  - Job `compose`: Start mit Profil `proxy` und `node tests/ops/proxy-test.mjs` (AT-OPS-009): Zertifikat der lokalen CA, Weiterleitung 308, HSTS-Header, `/metrics` am Proxy 404, Anmeldung über HTTPS mit `Secure`-Cookie.

## Konsequenzen
- (+) TLS, HSTS und Alarmierung sind vorführbar und testbar, ohne den Standardstart zu ändern.
- (+) HSTS kann andere lokale Dienste nicht stören (eigener Hostname).
- (+) Alarme gehen in dieselbe Mailpit-Oberfläche wie alle Mails, ohne externe Konten.
- (−) Beim ersten Start mit Profil werden zusätzliche Images geladen (Internet nötig). Danach läuft es offline.
- (−) Zertifikatswarnung, solange der lokalen CA nicht vertraut wird.
- (−) Im Echtbetrieb ersetzen ein zentraler Proxy bzw. Load Balancer und das Monitoring der Hochschule diese Profile. Die Konfigurationen dienen dann als Vorlage.
- Umsetzung: Backlog B-54 (Monitoring), B-55 (Proxy).
- *Angleichung 2026-10-24 an die Umsetzung:* Pfad `docker/caddy/Caddyfile`, exakte Image-Versionen, Alarmnamen, Bedingungen und Dauern wie in `monitoring-alarmierung.md`, konfigurierbare Ports, zwei Alarm-Empfänger nach Schweregrad, Teststufen in CI.
