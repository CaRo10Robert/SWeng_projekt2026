---
id: TESTREPORT-2026-10-24
type: test-report
status: done
owner: qa-lead
version: 1.0
created: 2026-10-24
last_updated: 2026-10-24
---

# Testbericht Sprint 1 (finaler Lauf 2026-10-24)

## Gegenstand

| Punkt | Stand |
|---|---|
| Code | Branch `feature/fallstudie-req-c4`, Commit `fc39661` (nach Code-Review v1.1) |
| Image | `campusmarkt:local`, neu gebaut mit `docker compose build --no-cache` (461 MB, Benutzer `node`) |
| Umgebung | Docker-Beispiel aus `compose.yaml` (app + db + mailpit) mit frischem Volume (`down -v`), Windows 11, Docker Desktop. Ports 8082 und 8026, weil 8080 lokal belegt war |
| CI | GitHub Actions, Workflow `CI`: Läufe für `de07d54` und `fc39661` grün (Prüfungen, Diagramme, Compose mit E2E und Smoke) |

## Ergebnisse

| Prüfung | Befehl | Ergebnis |
|---|---|---|
| Build | `docker compose build --no-cache` | 41 s |
| Start bis „healthy“ | `docker compose up -d` | 12 s (Ziel ≤ 3 min, ADR-0010) |
| Smoke- und Akzeptanztests | `node scripts/smoke-test.mjs http://localhost:8082 http://localhost:8026` | 76 von 76 bestanden |
| E2E (Tastatur, axe-core, 360 px, Datenschutz) | `pnpm e2e` (Edge/Chromium) | 13 von 13 bestanden |
| Unit-Tests | `pnpm test` | 66 von 66 bestanden |
| Typprüfung | `pnpm typecheck` | 5 von 5 Paketen ohne Fehler |
| Modulgrenzen (`CTRL-DEPCRUISE`) | `pnpm lint:deps` | keine Verstöße (69 Module) |
| Image-Prüfung (`CTRL-IMAGE-INSPECT`) | `docker inspect`, `docker exec … touch` | Benutzer `node`, Dateisystem schreibgeschützt, keine Geheimnisse in der Umgebung, Status „healthy“ |
| Nachverfolgbarkeit | `node scripts/trace.mjs --report` | ok: 103 Anforderungen, 85 markierte Tests |
| Diagramme | `node scripts/check-diagrams.mjs` | 26 von 26 rendern |

## Statusänderungen

36 Anforderungen stehen jetzt auf `verified`. Die Regel dafür: Jeder Nachweis ist ein automatisierter Test, der in den Testquellen markiert ist und in diesem Lauf bestanden hat, oder eine Kontrolle, die in diesem Lauf ausgeführt wurde. Manuelle Nachweise (`MAN-…`) und nicht ausgeführte Kontrollen halten eine Anforderung auf `implemented` bzw. `approved`.

**Verifizierungsquote:** 27 von 69 R1-Musts (39 %), gesamt 35 %. Das Ziel für Sprint 1 (≥ 40 %, [Vorgehen](../02-anforderungen/04-vorgehen.md)) ist **knapp verfehlt**.

**Gründe:**
- 18 Anforderungen warten auf manuelle Nachweise oder Kontrollen. Beispiele:
  - MAN-A11Y-001/002: Screenreader und Dateidialog.
  - CTRL-CI-IMAGE: SemVer-Tag und `docker save`-Artefakt in CI.
  - CTRL-CI-SCAN: B-06.
- 41 Anforderungen fehlt mindestens ein automatisierter Test. Diese Tests sind für die Sprints 2 und 3 eingeplant, z. B. Leistung (REQ-PERF-*), Benachrichtigungen (REQ-NOTI-*) und Löschfristen (REQ-PRIV-003).

## Bekannte Einschränkungen

- Smoke-Test und E2E-Suite verändern Daten. Wegen der Registrierungsgrenze (Q-18: 30 je IP und Stunde) laufen beide zusammen etwa zweimal je Stunde und Stack; danach den Stack mit `docker compose down -v` neu aufsetzen.
- Die Anmeldung über die Hochschulkennung (FS-C3) ist eine dokumentierte Abweichung (Q-12). Der SSO-Adapter wartet auf Spike S-01.
