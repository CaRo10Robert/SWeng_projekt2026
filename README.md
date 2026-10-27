# CampusMarkt HWG LU (Arbeitstitel)

Tausch- und Verkaufsplattform für Studierende und Beschäftigte der Hochschule für Wirtschaft und Gesellschaft Ludwigshafen (HWG LU). Funktional angelehnt an Kleinanzeigen. Zugang nur mit verifizierter Hochschul-E-Mail-Adresse.

> **Status:** v0.4 (2026-10-26): MVP mit Fallstudien-Constraints, Recht, Auftritt und Betrieb (EPIC-13, Übung mit fiktiven Werten), englischer Oberfläche und Nachweisrunde (Übungen, Threat Model, ASVS, Pentest, CI-Kontrollen). Stand der Anforderungen im [Katalog-Index](docs/02-anforderungen/02-anforderungen.md#6-katalog-index).
> **Auslieferung:** Kein öffentliches Hosting. Das Ergebnis ist ein lokal lauffähiges Docker-Beispiel, siehe [ADR-0010](docs/03-architektur/decisions/0010-docker-demo-deployment.md).
> **Guideline:** Es gilt die [DEV Guideline](https://github.com/CaRo10Robert/dev_guideline). Abweichungen werden als ADR oder Guideline-Exception dokumentiert ([ADR-0011](docs/03-architektur/decisions/0011-mvp-umsetzung.md)).

## Schnellstart

Voraussetzung: Docker Desktop oder Docker Engine mit Compose v2. Externe Konten und API-Schlüssel sind nicht nötig. Nach dem ersten Build läuft alles offline.

```bash
docker compose up --build
```

| Was | Wo |
|---|---|
| CampusMarkt (App) | http://localhost:8080 |
| Mailpit (alle E-Mails, z. B. Verifikationslinks) | http://localhost:8025 |
| API-Dokumentation (OpenAPI 3.1) | http://localhost:8080/api/docs |
| Health / Metriken | `/health/live`, `/health/ready`, `/metrics` |

Beim ersten Start legt die App das Schema an und befüllt die Datenbank mit Demo-Daten (`SEED_DEMO=true`).

### Demo-Konten

Passwort für alle Konten: `CampusMarkt-Demo-2026`

| Konto | Rolle | Zum Ausprobieren |
|---|---|---|
| `lea@studmail.hwg-lu.de` | Mitglied (Studierende) | Chat mit Ben zum Statistik-Buch (reserviert), eigene Anzeigen |
| `ben@studmail.hwg-lu.de` | Mitglied (Studierende) | Hat eine verdächtige Nachricht von Sara gemeldet |
| `mia@studmail.hwg-lu.de`, `sara@studmail.hwg-lu.de` | Mitglieder | Weitere Anzeigen und Chats |
| `tim@studmail.hwg-lu.de` | Mitglied | Hat einer älteren Version der Nutzungsbedingungen zugestimmt und eine ältere Fassung der Datenschutzerklärung zur Kenntnis genommen: Nach der Anmeldung erscheinen der Dialog zur erneuten Zustimmung (REQ-LEGAL-003) und der Hinweis auf die neue Datenschutzerklärung (REQ-LEGAL-002). Die Zustimmung lässt sich je Stack nur einmal vorführen; danach mit `docker compose down -v` neu aufsetzen |
| `jonas.weber@hwg-lu.de` | Mitglied (Beschäftigte) | Beschäftigten-Konto |
| `mod@hwg-lu.de` | Moderator | Moderations-Queue: Meldung + vom Wortfilter angehaltene Anzeige |
| `admin@hwg-lu.de` | Admin | Rollen, Audit-Log, Jobs/Dead-Letter-Queue, „Fällige Jobs jetzt ausführen“ |

**Neue Fassung der Rechtstexte:** Bei jedem Start im Demo-Modus (`SEED_DEMO=true`) werden die Demo-Konten auf die aktuelle Fassung der Nutzungsbedingungen und der Datenschutzerklärung gehoben, und fehlende Demo-Konten werden angelegt (ohne Anzeigen und Chats). Eine neue Version blockiert die Demo-Konten nach einem Update deshalb nicht. Tim bleibt bewusst auf der alten Fassung, damit sich die erneute Zustimmung vorführen lässt.

Eigene Registrierung: Mit einer beliebigen Adresse `…@studmail.hwg-lu.de` oder `…@hwg-lu.de` registrieren. Die Bestätigungsmail erscheint in Mailpit, sie verlässt den Rechner nicht.

### Konfiguration

Alle Einstellungen laufen über Umgebungsvariablen (siehe [.env.example](.env.example)). Für Compose genügt eine `.env` im Projektordner, z. B.:

```bash
APP_PORT=8090        # anderer Host-Port für die App
MAILPIT_PORT=8026    # anderer Host-Port für Mailpit
# mit Profil monitoring bzw. proxy ggf. auch PROMETHEUS_PORT, ALERTMANAGER_PORT, PROXY_HTTPS_PORT, PROXY_HTTP_PORT
SEED_DEMO=false      # ohne Demo-Daten starten
```

### Troubleshooting

| Problem | Lösung |
|---|---|
| `Bind for 127.0.0.1:8080 failed: port is already allocated` | Port belegt (App, Mailpit, Prometheus und Alertmanager sind nur an `127.0.0.1` gebunden): `APP_PORT=8090 docker compose up` (Linux/macOS) bzw. in einer `.env` im Projektordner `APP_PORT` und ggf. `MAILPIT_PORT` setzen (Windows). In der Entwicklungsumgebung entsprechend `DEV_DB_PORT`, `DEV_SMTP_PORT`, `DEV_MAILPIT_PORT` |
| Anmeldung in **Safari** schlägt still fehl | Safari akzeptiert `Secure`-Cookies auf `http://localhost` nicht: `COOKIE_SECURE=false` setzen |
| Apple Silicon (arm64) / Windows (x86) | Das Image wird lokal für die eigene Architektur gebaut. Alle Basis-Images sind multi-arch, keine Anpassung nötig |
| Alles zurücksetzen (Daten, Bilder, Demo-Daten neu) | `docker compose down -v` und danach `docker compose up --build` |
| Logs ansehen | `docker compose logs -f app` (JSON-Logs, ohne personenbezogene Daten) |

## Entwicklung

```bash
pnpm install                                   # Node.js ≥ 22, pnpm 10 (corepack enable)
docker compose -f compose.dev.yaml up -d       # nur Postgres + Mailpit
cp .env.example .env
pnpm --filter @campusmarkt/contracts build
pnpm dev                                       # Server :8080 (tsx watch) + Vite :5173 mit Proxy
```

Vite leitet API-Aufrufe an `VITE_API_TARGET` weiter; ohne diese Variable an den `PORT` aus `apps/server/.env`, sonst an 8080.

| Befehl | Zweck |
|---|---|
| `pnpm test` | Unit-Tests der Fachregeln (u. a. Entscheidungstabelle BR-01) |
| `pnpm typecheck` | TypeScript in allen Paketen |
| `pnpm lint:deps` | Fitness Function: Modulgrenzen und Ports (dependency-cruiser) |
| `node scripts/check-diagrams.mjs` | Alle Mermaid-Diagramme der Doku rendern (Syntaxprüfung; lokal mit `CHROME_PATH` auf einen installierten Browser) |
| `node scripts/trace.mjs --report` | Nachverfolgbarkeit Anforderung → Nachweis → Test prüfen, Status aggregieren (`--write` aktualisiert den Katalog-Index) |
| `node scripts/smoke-test.mjs [app-url] [mailpit-url]` | End-to-End-Smoke-Test gegen ein laufendes Compose-Setup |
| `node scripts/backup.mjs` / `node scripts/restore.mjs backups/<Zeitstempel>` | Sicherung und Wiederherstellung inkl. Löschjournal ([Backup](docs/07-betrieb/backup-restore.md)) |
| `node tests/ops/restore-test.mjs [app-url] [--project <name>]` | Restore-Test (**zerstört die Daten des Stacks**); bei eigenem Compose-Projekt dieselben `APP_PORT`/`MAILPIT_PORT` wie beim Start setzen |
| `pnpm e2e` | Browser-Tests (Playwright, Tastatur, axe-core, Rechtsseiten, Sprache) gegen einen laufenden Stack; `E2E_BASE_URL`, `E2E_MAILPIT_URL`, optional `E2E_CHANNEL=msedge` |
| `node tests/ops/retention-test.mjs [app-url] [mailpit-url] [--project <name>]` | Löschfristen mit vorgestellter Zeit (AT-PRIV-003-2/-3) |
| `node tests/ops/db-outage-test.mjs [app-url] [--project <name>]` | Datenbankausfall: App bleibt erreichbar, Bereitschaft 503 (AT-OPS-001-3) |
| `node tests/ops/proxy-test.mjs [--project <name>]` | Profil `proxy`: TLS, HSTS, Weiterleitung (AT-OPS-009) |
| `node tests/ops/dlq-test.mjs [app-url] [--project <name>]` | Dead-Letter-Ansicht bei Mailausfall (CTRL-DLQ, dauert etwa 5 min) |
| `node scripts/check-i18n.mjs` | Übersetzungskataloge de/en vollständig und gültig |

### Struktur

```text
apps/server            Fastify: REST /api/v1, WebSocket /ws, SPA-Auslieferung, Job-Worker (Startmodus all | api | worker)
  src/modules/         Fachmodule: identity, listings, search, messaging, notifications, trust, privacy, payments (nur Port)
  src/platform/        Ports (Mail, Storage, Realtime, JobQueue, Search, RateLimit) und ihre Adapter
  migrations/          SQL-Migrationen, laufen beim Start automatisch
apps/web               React-SPA (Vite, TanStack Router/Query, Tailwind, PWA)
packages/contracts     API-Vertrag: TypeBox-Schemas, Quelle für Validierung, OpenAPI und Frontend-Typen
docker/Dockerfile      Multi-Stage-Build, Non-root, Healthcheck
compose.yaml           app + db (postgres:17) + mailpit
```

## Dokumentation

| # | Dokument | Inhalt | Diátaxis-Typ |
|---|---|---|---|
| 1 | [Reverse Engineering Kleinanzeigen](docs/01-analyse/01-reverse-engineering-kleinanzeigen.md) | Fachkonzept, Domänenobjekte, Prozesse und Geschäftsmodell des Vorbilds | Explanation |
| 2 | [Wettbewerbsanalyse](docs/01-analyse/02-wettbewerbsanalyse.md) | Vergleich von 8 Plattformen und Kanälen, Feature-Matrix, SWOT, Positionierung | Explanation |
| 2a | [Abgleich Fallstudie MWI131](docs/02-anforderungen/00-fallstudie-abgleich.md) | Anforderungen der Fallstudie, Abweichungen, offene Entscheidung Q-12 | Explanation |
| 3 | [Use Cases](docs/02-anforderungen/01-use-cases.md) | Akteure, UML-Use-Case-Diagramme, Use-Case-Spezifikationen | Reference |
| 4 | [Anforderungskatalog](docs/02-anforderungen/02-anforderungen.md) | Ziele, Scope, Constraints, Zustandsmodell, Index aller Anforderungen ([req/](docs/02-anforderungen/req/), eine Datei je Anforderung) | Reference |
| 4a | [Nachweiskatalog](docs/02-anforderungen/nachweise.md) | Tests, manuelle Prüfungen und Kontrollen je Anforderung | Reference |
| 5 | [Product Backlog & Release-Planung](docs/02-anforderungen/03-backlog.md) | Epics, Backlog mit Kano, Risiko, Story Points, WSJF; Sprint-Plan | Reference |
| 5a | [Vorgehen](docs/02-anforderungen/04-vorgehen.md) | Scrum, Definition of Ready/Done, Schätzung, Nachverfolgbarkeit, Change-Management | Explanation |
| 5b | [Entscheidungslog](docs/02-anforderungen/05-entscheidungen.md) | Fachliche Entscheidungen Q-1 … Q-28, Übungsannahmen A-1 … A-22 | Reference |
| 5c | [Abgleich Recht, Auftritt und Betrieb](docs/02-anforderungen/06-abgleich-recht-betrieb.md) | Ist/Soll, Rechtskataster, Übungsannahmen (EPIC-13, fiktive Werte) | Explanation |
| 6 | [Architekturdokumentation (arc42 + C4)](docs/03-architektur/architektur.md) | C4-Systemkontext, -Container, -Komponenten und -Verteilung (Mermaid-C4), Laufzeitsicht, Konzepte | Explanation |
| 7 | [Architekturentscheidungen (ADRs)](docs/03-architektur/decisions/) | Eine Datei pro Entscheidung | Explanation |
| 7a | [Threat Model](docs/03-architektur/threat-model.md) | STRIDE je Vertrauensgrenze, 39 Bedrohungen mit Maßnahmen | Explanation |
| 7b | [Ausnahmeregister](docs/03-architektur/ausnahmen.md) | Abweichungen von MUST-Regeln der Guideline mit Ablaufdatum (von `trace.mjs` geprüft) | Reference |
| 7c | [Changelog](CHANGELOG.md) | Änderungen je Version (Keep a Changelog, SemVer) | Reference |
| 8 | [Review v0.1](docs/04-review/review-v0.1.md) | Kritisches Review dieses Entwurfs, offene Fragen | – |
| 8a | [Requirements-Review v0.2](docs/04-review/review-v0.2-anforderungen.md) | 32 Befunde zu den Anforderungen und ihre Behebung | – |
| 8b | [Architektur-Review v1.0](docs/04-review/review-v1.0-architektur.md) | 23 Befunde zur C4-Architektur und ihre Behebung | – |
| 8c | [Code-Review v1.1](docs/04-review/review-v1.1-code.md) | 15 Befunde zum Sprint-1-Code und ihre Behebung | – |
| 8d | [Testbericht Sprint 1](docs/05-umsetzung/testbericht-2026-10-24.md) | Finaler Lauf: Build, Smoke, E2E, Unit-Tests, Statusänderungen | – |
| 8e | [Review v1.3 Recht, Auftritt und Betrieb](docs/04-review/review-v1.3-recht-betrieb.md) | 63 Befunde aus drei unabhängigen Reviews (Anforderungen/Recht, Architektur/Betrieb, Code) und ihre Behebung | – |
| 8f | [Testbericht EPIC-13](docs/05-umsetzung/testbericht-2026-10-25.md) | Finaler Lauf nach Review v1.3: Build, E2E, Smoke, Restore, Proxy, Statusänderungen | – |
| 8h | [Testbericht Nachweise](docs/05-umsetzung/testbericht-2026-10-26.md) | Finaler Lauf nach Übungen, Sicherheitsnachweisen und Kontrollen; 15 weitere Anforderungen verified | – |
| 8g | [Nachweise](docs/05-umsetzung/nachweise/README.md) | Protokolle der manuellen Nachweise und Kontrollen: Übungen, Reviews, ASVS, Pentest, Leitfäden | Reference |
| 9 | [Umsetzungsstand MVP](docs/05-umsetzung/mvp-umsetzungsstand.md) | abgelöst durch den generierten Katalog-Index | – |
| 10 | [Recht und Datenschutz](docs/06-recht/README.md) | VVT, TOMs, Auftragsverarbeitung, DSFA-Schwellwertanalyse, Datenpannen-, DSA- und DAC7-Prozess, DSFA, Rechtskataster (Übung mit fiktiven Werten) | Reference |
| 11 | [Betrieb](docs/07-betrieb/README.md) | Betriebshandbuch, Backup, Monitoring, Incident, Wartung/Status, TLS, Mail-Zustellbarkeit, Updates, Pentest-Plan, Go-live-Checkliste | How-to |

## Änderungshistorie

| Version | Datum | Änderung |
|---|---|---|
| 0.1 | 2026-10-20 | Erster Entwurf: Analyse, Use Cases, Anforderungen, Architektur, ADR-0001…0009, Review |
| 0.2 | 2026-10-20 | Kein Hosting, nur Docker-Beispiel: ADR-0010, schlanker Stack (ohne Redis/S3, React-SPA in Fastify, pg-boss), Betriebsanforderungen N/A → EPIC-12, Demo-Anforderungen REQ-DEMO-* |
| 0.3 | 2026-10-23 | Lauffähiger MVP als Docker-Compose-Setup (app + db + mailpit), Demo-Daten, Unit- und Smoke-Tests, ADR-0011, Umsetzungsstand |
| 0.4 | 2026-10-26 | Fallstudie (Kontaktfreigabe, Tastatur, IdentityProviderPort), EPIC-13 Recht/Auftritt/Betrieb, englische Oberfläche, Reviews v1.1/v1.3, Nachweisrunde mit Protokollen, CI-Kontrollen (Coverage, Mutation, Scans, Multi-Arch) |

## Diagramme

- **Mermaid** für Kontext-, Container-, Sequenz-, Zustands- und ER-Diagramme. Wird in GitHub und VS Code nativ gerendert.
- **PlantUML** für die UML-Use-Case-Diagramme, weil Mermaid keine normgerechte Use-Case-Notation mit Systemgrenze, `<<include>>` und `<<extend>>` hat. Zur Anzeige in VS Code wird die Extension *PlantUML* (jebbs.plantuml) oder *Markdown Preview Enhanced* benötigt (siehe [Review](docs/04-review/review-v0.1.md), Punkt D-1).
