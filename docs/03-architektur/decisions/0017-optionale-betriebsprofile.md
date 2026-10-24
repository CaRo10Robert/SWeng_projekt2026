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
1. **Dienst:** `proxy` mit `caddy:2-alpine` (exakte Version gepinnt), Konfiguration in `docker/Caddyfile`.
2. **Eigener Hostname** `campusmarkt.localhost`. Moderne Browser lösen `*.localhost` auf die eigene Maschine auf, eine Hosts-Datei ist nicht nötig. HSTS gilt damit **nur** für diesen Namen, nicht für `localhost`. Port: `PROXY_HTTPS_PORT`, Standard 8443; dazu `PROXY_HTTP_PORT` für die Weiterleitung http → https.
3. **Zertifikat:** `tls internal`, also Caddys lokale CA, ohne Internet. Die README erklärt, wie man die CA vertraut oder die Warnung einmalig bestätigt.
4. **Header:**
   - `Strict-Transport-Security: max-age=31536000` im Beispiel ohne `includeSubDomains` und ohne `preload`; im Echtbetrieb mit beidem, siehe docs/07-betrieb/tls-reverse-proxy.md;
   - Weiterleitung http → https;
   - WebSocket-Weiterleitung für `/ws`;
   - `X-Forwarded-For` an die App, mit `TRUST_PROXY=true` im Profil (B-41).
5. **`/metrics`** wird am Proxy gesperrt (404). Erreichbar ist es nur im internen Compose-Netz (Abschnitt 7.2 der Architektur).

**Profil `monitoring` (REQ-OPS-008):**
1. **Dienste:**
   - `prometheus`: liest `app:8080/metrics` alle 15 s und prüft `/health/ready` über die eigene Metrik `app_ready`; die App liefert sie aus der Readiness-Prüfung.
   - `alertmanager`: sendet Alarme per SMTP an Mailpit (`mailpit:1025`), Empfänger `[Platzhalter: betrieb@campusmarkt.example]`.
   - Exakte Versionen gepinnt.
2. **Ports** 9090 und 9093 nur an `127.0.0.1` gebunden.
3. **Alarmregeln** in `ops/prometheus/alerts.yml`, je Regel ein Runbook-Link (docs/07-betrieb/monitoring-alarmierung.md):

   | Alarm | Bedingung | Schwere |
   |---|---|---|
   | `AppDown` | `up == 0` für 1 min | kritisch |
   | `AppNotReady` | `app_ready == 0` für 2 min (Datenbank nicht erreichbar) | kritisch |
   | `HighErrorRate` | Anteil 5xx > 5 % über 5 min | hoch |
   | `HighLatency` | p95 Suche > 500 ms über 10 min (REQ-PERF-001) | mittel |
   | `DeadLetterJobs` | Dead-Letter-Queue > 0 | mittel |
   | `MaintenanceModeOn` | Wartungsmodus > 2 h aktiv | info |

4. **Kein Grafana:** Es bleibt Could. Die Prometheus-Oberfläche reicht für die Übung.

**Gemeinsam:**
- Der Standardbefehl `docker compose up` startet weiter nur `app`, `db` und `mailpit`. ADR-0010 bleibt gültig und wird durch dieses ADR **erweitert**.
- CI prüft die Profile:
  - `caddy validate`;
  - `promtool check rules` sowie `amtool check-config`;
  - ein Lauf mit Profil `proxy` fragt `https://campusmarkt.localhost:8443/health/ready` mit der internen CA ab und prüft, dass der HSTS-Header gesetzt ist.

## Konsequenzen
- (+) TLS, HSTS und Alarmierung sind vorführbar und testbar, ohne den Standardstart zu ändern.
- (+) HSTS kann andere lokale Dienste nicht stören (eigener Hostname).
- (+) Alarme gehen in dieselbe Mailpit-Oberfläche wie alle Mails, ohne externe Konten.
- (−) Beim ersten Start mit Profil werden zusätzliche Images geladen (Internet nötig). Danach läuft es offline.
- (−) Zertifikatswarnung, solange der lokalen CA nicht vertraut wird.
- (−) Im Echtbetrieb ersetzen ein zentraler Proxy bzw. Load Balancer und das Monitoring der Hochschule diese Profile. Die Konfigurationen dienen dann als Vorlage.
- Umsetzung: Backlog B-54 (Monitoring), B-55 (Proxy).
