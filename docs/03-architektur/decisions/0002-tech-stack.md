# ADR-0002: Tech-Stack (TypeScript durchgängig, schlank für das Docker-Beispiel)

- **Status:** Accepted (nach Architektur-Review v1.0, 2026-10-23); teilweise ersetzt: Query-Layer durch [ADR-0020](0020-datenzugriff-pg-sql-template.md), Umsetzungsdetails durch [ADR-0011](0011-mvp-umsetzung.md)
- **Teilweise präzisiert durch:** [ADR-0011](0011-mvp-umsetzung.md) Nr. 1 (SQL ohne ORM statt Drizzle), Nr. 3 (E-Mail-Templates ohne MJML), Nr. 6 (keine eigene UI-Bibliothek)
- **Datum:** 2026-10-20 (überarbeitet für ADR-0010)

## Kontext
Die Guideline (Kap. 14) definiert einen Default-Stack. Abweichungen brauchen eine ADR. Rahmenbedingungen: Auslieferung als lokales Docker-Beispiel (ADR-0010), kleine Teamkapazität. Entscheidend sind die Vorkenntnisse im Team (**Q-8**).

## Entscheidung (Vorschlag)
| Schicht | Wahl | Guideline-Default | Abweichung? |
|---|---|---|---|
| Web | **React + Vite als SPA**, PWA (vite-plugin-pwa), TanStack Router/Query | React + Next.js | **Ja**, siehe unten |
| UI | Tailwind + shadcn/ui (Radix, zugänglich) | – | – |
| API | **Node.js 22 LTS + Fastify**, `@fastify/websocket`, `@fastify/static` | Fastify | nein |
| DB | **PostgreSQL 17** | PostgreSQL | nein |
| Query-Layer | ~~Drizzle ORM~~ → **`pg` mit `sql`-Template** und SQL-Migrationen | Type-safe Query Builder | **Ja**, [ADR-0020](0020-datenzugriff-pg-sql-template.md) |
| Job-Queue / Scheduler | **pg-boss** (Postgres-basiert) | Redis Streams / Queue-Bibliothek | nein (Option „lightweight queue library“) |
| Cache / Rate-Limit / Sessions | Postgres bzw. im Speicher hinter Ports | Redis | **Ja**, ADR-0010 |
| Bildverarbeitung | sharp | – | – |
| E-Mail | Nodemailer (SMTP) → Mailpit | – | – |
| API-Vertrag | OpenAPI 3.1, generierter Client. AsyncAPI für den Chat | OpenAPI | nein |
| Monorepo | pnpm workspaces + Turborepo | pnpm + Turborepo | nein |
| Tests | Vitest, Testcontainers, Playwright, axe-core | – | – |
| CI | GitHub Actions (Build, Test, Image-Build) | GitHub Actions | nein |
| Logs/Metriken | pino (JSON, stdout), `/metrics` (Prometheus-Format), OTel noch nicht umgesetzt | OpenTelemetry (normativ) | **Ja**, Ausnahme [EX-02](../ausnahmen.md#ex-02-kein-verteiltes-tracing-mit-opentelemetry) |

**Abweichung Next.js → Vite-SPA:** Next.js bringt SSR, SSG und SEO. Diese Vorteile sind hier wertlos: Alle Inhalte sind nur für angemeldete Mitglieder sichtbar, es gibt also kein SEO. Next.js bräuchte außerdem einen eigenen Node-Prozess neben Fastify. Eine SPA, die als statische Dateien von Fastify ausgeliefert wird, ergibt **einen Prozess und ein Image** (ADR-0010) und weniger Konzepte zum Lernen. Wird später Public-SEO gebraucht (Gäste-Vorschau, Q-1), wird diese Entscheidung neu bewertet.

**Repo-Struktur:**

```text
apps/web             React-SPA (Vite), Build-Output wird ins Server-Image kopiert
apps/server          Fastify: API, WebSocket, statische SPA, Worker (Startmodus all | api | worker)
packages/contracts   OpenAPI/AsyncAPI-Spezifikation + generierte Typen/Client
packages/ui          Komponenten
packages/config      ESLint, TS-Config
docker/              Dockerfile (multi-stage), compose.yaml, Seed-Daten
docs/                Diese Dokumentation
```

## Alternativen
| Option | Bewertung |
|---|---|
| Next.js Fullstack (ohne Fastify) | Ein Prozess, aber WebSockets passen schlecht zum Next-Modell, es gibt keinen sauberen OpenAPI-Vertrag und die Modulgrenzen sind schwächer → verworfen |
| **Java/Spring Boot (+ Spring Modulith) + React-SPA** | Ebenfalls ein Image (SPA in `static/`), sehr gut zu ADR-0001 passend. → **Gleichwertige Alternative, falls das Team primär Java kann (Q-8)** |
| Managed Backend (Supabase/Firebase) | Widerspricht dem Offline-Docker-Beispiel → verworfen |

## Konsequenzen
- Ein Multi-Stage-Dockerfile baut die SPA und den Server und erzeugt ein schlankes Runtime-Image (Node Alpine/Distroless, Non-root-User).
- Durchgängig TypeScript, gemeinsame Typen über `packages/contracts`.
