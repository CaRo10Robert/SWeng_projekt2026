---
id: MAN-PORT-001
type: evidence
requirement: REQ-PORT-001
status: done
owner: qa-lead
date: 2026-10-26
---

# MAN-PORT-001 Onboarding-Test Entwicklungsumgebung (simuliert)

> **Simuliert:** frischer Clone, nur README-Abschnitt „Entwicklung“, keine teamfremde Person. Der pnpm-Store war auf dem Rechner bereits gefüllt.

## Ziel

REQ-PORT-001: (1) Entwicklungsumgebung in höchstens 15 min nach README, (2) identisches Datenbank-Image in `compose.yaml` und `compose.dev.yaml`.

## Umgebung

Clone wie in [MAN-OPS-003](MAN-OPS-003.md); Node v24.16.0, pnpm 10.34.7. Ports 8080 (fremder Dienst) und 8025 (anderes Beispiel) belegt.

## Ablauf

| Zeit (UTC) | README-Schritt | Beobachtung |
|---|---|---|
| 07:40:09 | `pnpm install` | fertig nach **14 s** (`--frozen-lockfile`) |
| 07:40:25 | `docker compose -f compose.dev.yaml up -d` | **Fehler**: `Bind for 127.0.0.1:8025 failed: port is already allocated`; Ports in `compose.dev.yaml` fest, README nennt keinen Ausweg (P-1) |
| 07:41:22 | Abweichung: Kopie `compose.dev.local.yaml` mit Ports 5433/1026/8034 | DB und Mailpit „healthy“ |
| 07:41:22 | `cp .env.example .env`, angepasst: `PORT=8092` (8080 belegt), DB-Port 5433, SMTP-Port 1026, `PUBLIC_URL`, `COOKIE_SECURE=false` | README nennt nicht, welche Werte bei Port-Konflikten zu ändern sind (P-2) |
| 07:41:27 | `pnpm --filter @campusmarkt/contracts build` | 5 s |
| 07:41:56 | `pnpm dev` | Der Vite-Proxy liest `VITE_API_TARGET` nur aus der Shell, nicht aus `.env`. Ohne Setzen zielt er auf 8080, hier einen **fremden Dienst** (P-3); gestartet mit `VITE_API_TARGET=http://localhost:8092 pnpm dev` |
| 07:42:16 | Prüfung | Server `/health/ready` 200, Vite `:5173` 200, `/api/v1/meta` über den Proxy 200, Anmeldung über den Proxy 200 (nach **20 s**); Version der Nutzungsbedingungen im Dev-Modus korrekt aus den Inhalten (`2026-10-25`) |

## Messwerte

| Messgröße | Soll | Ist |
|---|---|---|
| (1) Klonen bis laufende Entwicklungsumgebung | ≤ 15 min | **3 min 25 s** inkl. Fehlersuche (ohne Port-Konflikte geschätzt < 1 min) |
| (2) Datenbank-Image | identisch | **identisch**: `postgres:17-alpine` in beiden Dateien; Mailpit ebenfalls (`axllent/mailpit:v1.27`) |

## Ergebnis

**Bestanden (simuliert)**, aber nur mit Abweichungen vom README (eigene Compose-Kopie, eigene Umgebungsvariablen). Eine teamfremde Person ohne Docker-Erfahrung wäre an P-1 und P-3 hängen geblieben, hätte also Rückfragen gehabt.

## Befunde

| Nr. | Befund | Vorschlag |
|---|---|---|
| P-1 | `compose.dev.yaml` hat feste Host-Ports (5432, 1025, 8025), anders als `compose.yaml` mit `APP_PORT`/`MAILPIT_PORT`. Außerdem sind sie an alle Schnittstellen gebunden, nicht an 127.0.0.1 wie im Beispiel. | Variablen `DEV_DB_PORT`, `DEV_SMTP_PORT`, `DEV_MAILPIT_PORT` mit Standardwerten und Bindung an `127.0.0.1` |
| P-2 | Das README sagt nicht, welche Einträge in `.env` bei belegten Ports anzupassen sind (`PORT`, `DATABASE_URL`, `SMTP_PORT`, `PUBLIC_URL`). | Abschnitt „Ports ändern“ im Teil Entwicklung |
| P-3 | Vite liest `VITE_API_TARGET` nicht aus der `.env` im Projektordner (envDir ist `apps/web`). Bei geändertem `PORT` leitet der Proxy ohne Warnung auf 8080. | `loadEnv` mit `envDir` auf die Wurzel oder Ableitung aus `PORT`; im README erwähnen |
| P-4 | Im README fehlt der Befehl `pnpm e2e` (Browser-Tests) in der Befehlstabelle. | ergänzen, mit `E2E_BASE_URL`/`E2E_MAILPIT_URL` |
