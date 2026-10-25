# CampusMarkt HWG LU (Arbeitstitel)

Tausch- und Verkaufsplattform für Studierende und Beschäftigte der Hochschule für Wirtschaft und Gesellschaft Ludwigshafen (HWG LU). Funktional angelehnt an Kleinanzeigen. Zugang nur mit verifizierter Hochschul-E-Mail-Adresse.

> **Status:** v0.3 (2026-10-23): erster lauffähiger MVP. Dokumente sind weiterhin `draft`.
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
| `tim@studmail.hwg-lu.de` | Mitglied | Hat einer älteren Version der Nutzungsbedingungen zugestimmt: Nach der Anmeldung erscheint der Dialog zur erneuten Zustimmung (REQ-LEGAL-003) |
| `jonas.weber@hwg-lu.de` | Mitglied (Beschäftigte) | Beschäftigten-Konto |
| `mod@hwg-lu.de` | Moderator | Moderations-Queue: Meldung + vom Wortfilter angehaltene Anzeige |
| `admin@hwg-lu.de` | Admin | Rollen, Audit-Log, Jobs/Dead-Letter-Queue, „Fällige Jobs jetzt ausführen“ |

Eigene Registrierung: Mit einer beliebigen Adresse `…@studmail.hwg-lu.de` oder `…@hwg-lu.de` registrieren. Die Bestätigungsmail erscheint in Mailpit, sie verlässt den Rechner nicht.

### Konfiguration

Alle Einstellungen laufen über Umgebungsvariablen (siehe [.env.example](.env.example)). Für Compose genügt eine `.env` im Projektordner, z. B.:

```bash
APP_PORT=8090        # anderer Host-Port für die App
MAILPIT_PORT=8026    # anderer Host-Port für Mailpit
SEED_DEMO=false      # ohne Demo-Daten starten
```

### Troubleshooting

| Problem | Lösung |
|---|---|
| `Bind for 0.0.0.0:8080 failed: port is already allocated` | Port belegt: `APP_PORT=8090 docker compose up` (Linux/macOS) bzw. `APP_PORT` in einer `.env` setzen (Windows) |
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

| Befehl | Zweck |
|---|---|
| `pnpm test` | Unit-Tests der Fachregeln (u. a. Entscheidungstabelle BR-01) |
| `pnpm typecheck` | TypeScript in allen Paketen |
| `pnpm lint:deps` | Fitness Function: Modulgrenzen und Ports (dependency-cruiser) |
| `node scripts/check-diagrams.mjs` | Alle Mermaid-Diagramme der Doku rendern (Syntaxprüfung; lokal mit `CHROME_PATH` auf einen installierten Browser) |
| `node scripts/trace.mjs --report` | Nachverfolgbarkeit Anforderung → Nachweis → Test prüfen, Status aggregieren (`--write` aktualisiert den Katalog-Index) |
| `node scripts/smoke-test.mjs [app-url] [mailpit-url]` | End-to-End-Smoke-Test gegen ein laufendes Compose-Setup |

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
| 5b | [Entscheidungslog](docs/02-anforderungen/05-entscheidungen.md) | Fachliche Entscheidungen Q-1 … Q-19 (vorläufig, zu bestätigen) | Reference |
| 6 | [Architekturdokumentation (arc42 + C4)](docs/03-architektur/architektur.md) | C4-Systemkontext, -Container, -Komponenten und -Verteilung (Mermaid-C4), Laufzeitsicht, Konzepte | Explanation |
| 7 | [Architekturentscheidungen (ADRs)](docs/03-architektur/decisions/) | Eine Datei pro Entscheidung | Explanation |
| 8 | [Review v0.1](docs/04-review/review-v0.1.md) | Kritisches Review dieses Entwurfs, offene Fragen | – |
| 8a | [Requirements-Review v0.2](docs/04-review/review-v0.2-anforderungen.md) | 32 Befunde zu den Anforderungen und ihre Behebung | – |
| 8b | [Architektur-Review v1.0](docs/04-review/review-v1.0-architektur.md) | 23 Befunde zur C4-Architektur und ihre Behebung | – |
| 8c | [Code-Review v1.1](docs/04-review/review-v1.1-code.md) | 15 Befunde zum Sprint-1-Code und ihre Behebung | – |
| 8d | [Testbericht Sprint 1](docs/05-umsetzung/testbericht-2026-10-24.md) | Finaler Lauf: Build, Smoke, E2E, Unit-Tests, Statusänderungen | – |
| 9 | [Umsetzungsstand MVP](docs/05-umsetzung/mvp-umsetzungsstand.md) | abgelöst durch den generierten Katalog-Index | – |

## Änderungshistorie

| Version | Datum | Änderung |
|---|---|---|
| 0.1 | 2026-10-20 | Erster Entwurf: Analyse, Use Cases, Anforderungen, Architektur, ADR-0001…0009, Review |
| 0.2 | 2026-10-20 | Kein Hosting, nur Docker-Beispiel: ADR-0010, schlanker Stack (ohne Redis/S3, React-SPA in Fastify, pg-boss), Betriebsanforderungen N/A → EPIC-12, Demo-Anforderungen REQ-DEMO-* |
| 0.3 | 2026-10-23 | Lauffähiger MVP als Docker-Compose-Setup (app + db + mailpit), Demo-Daten, Unit- und Smoke-Tests, ADR-0011, Umsetzungsstand |

## Diagramme

- **Mermaid** für Kontext-, Container-, Sequenz-, Zustands- und ER-Diagramme. Wird in GitHub und VS Code nativ gerendert.
- **PlantUML** für die UML-Use-Case-Diagramme, weil Mermaid keine normgerechte Use-Case-Notation mit Systemgrenze, `<<include>>` und `<<extend>>` hat. Zur Anzeige in VS Code wird die Extension *PlantUML* (jebbs.plantuml) oder *Markdown Preview Enhanced* benötigt (siehe [Review](docs/04-review/review-v0.1.md), Punkt D-1).
