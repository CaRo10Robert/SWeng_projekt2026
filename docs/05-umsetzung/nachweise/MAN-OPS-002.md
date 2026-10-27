---
id: MAN-OPS-002
type: evidence
requirement: REQ-OPS-002
status: done
owner: qa-lead
date: 2026-10-25
---

# MAN-OPS-002 Review der Protokollfelder

## Ziel

Dieser Nachweis prüft gegen [REQ-OPS-002](../../02-anforderungen/req/REQ-OPS-002.md):
- Jede Anfrage im Protokoll trägt eine Korrelations-ID.
- Das Protokoll enthält keine personenbezogenen Daten: keine IP, keine E-Mail-Adresse, keine Inhalte, keine Passwörter, keine Tokens, keine Cookies.
- Die Labels der Metriken haben keinen Personenbezug.

## Gegenstand

- `apps/server/src/platform/logger.ts`: pino mit `redact`.
- `apps/server/src/platform/http/server.ts`: `LogController({ disableRequestLogging: true })`, eigener Protokolleintrag in `onResponse` über `requestLogEntry()` und Metrik `http_request_duration_seconds`.
- `apps/server/src/platform/metrics.ts`.
- Echte Protokollzeilen aus dem laufenden Stack `cmtest` (`docker logs cmtest-app-1`). Der Stack war mit neuem Image (Commit `37ac306`) gestartet und hat Restore-, Proxy- und Login-Aufrufe verarbeitet: 421 Zeilen, davon 406 Request-Einträge. Abgerufen am 2026-10-25.
- `/metrics` desselben Stacks.

## Vorgehen

1. Den Code gelesen: welche Felder entstehen je Eintrag?
2. Die echten Zeilen nach Mustern durchsucht:
   - E-Mail-Adressen `@…`;
   - Demo- und Testpasswort;
   - `cm_session`, `cookie`, `token=`;
   - `remoteAddress`, `ip`, `hostname`.
3. Zwei Anfragen gezielt gegen die Regeln gesendet:
   - `x-request-id: max@studmail.hwg-lu.de`;
   - `GET /api/v1/gibtsnicht/max@studmail.hwg-lu.de?token=abc`.
4. Alle Label-Namen und Werte von `/metrics` ausgewertet.

## Felder im Protokoll

| Feld | Herkunft | Personenbezug | Bewertung |
|---|---|---|---|
| `level`, `time`, `service`, `msg` | pino-Basis | nein | ok |
| `reqId` | `genReqId` (UUID) **oder der Header `x-request-id` des Clients** (`requestIdHeader`) | nein, solange UUID; **frei wählbar durch den Client** | **Befund P-1** |
| `method`, `status`, `ms` | `requestLogEntry` | nein | ok |
| `route` | Routenmuster (`routeOptions.url`), sonst **Pfad ohne Query** | Muster nein; Pfad bei unbekannten Routen frei wählbar | **Befund P-2** |
| `err` (nur bei 5xx) | Fastify-Fehlerobjekt | Stacktrace ohne Request-Body | ok |
| Fachmeldungen (`template`, `stats`, `accounts`, `termsVersion`, `legalProblems`) | Module | nein; Mails werden nur mit Vorlagenname protokolliert, `to` wird geschwärzt | ok |
| `userId` in „Konto endgültig gelöscht“ (`privacy/index.ts`) | Löschlauf | pseudonyme Konto-ID, keine Klardaten | ok, vertretbar für den Löschnachweis |
| Redaktion | `req.headers.cookie`, `authorization`, `set-cookie`, `*.password`, `*.email`, `*.token`, `to` | – | greift, wird aber durch `disableRequestLogging` kaum noch gebraucht |

## Ergebnis gegen das Akzeptanzkriterium

| Kriterium | Messung | Ergebnis |
|---|---|---|
| (1) Korrelations-ID in 100 % der Anfragen, auch im Antwortheader | 406 von 406 Request-Einträgen mit `reqId`; Header `x-request-id` in jeder Antwort | erfüllt |
| (2) 0 Fundstellen von E-Mail, Passwort, Token oder Cookie nach Smoke-Test | Vor den gezielten Anfragen 0 Fundstellen in allen Kategorien. Mit den zwei gezielten Anfragen landen E-Mail-Adressen im Protokoll (P-1, P-2). Der normale Smoke-Test erzeugt keine. | erfüllt für den regulären Ablauf; **zwei Lücken bei manipulierten Anfragen** |
| (3) Metriken zu Antwortzeiten, Jobs und Echtzeitverbindungen | `http_request_duration_seconds` (Histogramm), `jobs_processed_total` (`queue`, `outcome`), `ws_connections`, dazu `app_ready`, `campusmarkt_maintenance_mode` und `campusmarkt_backup_last_success_timestamp_seconds` | erfüllt |
| Labels ohne Personenbezug | Label-Namen: `method`, `route`, `status`, `queue`, `outcome`, `kind`, `type`, `space`, `le`, `version`/`major`/`minor`/`patch`. `route` ist das Muster oder `unmatched`, gefunden nur `/api/v1/auth/login`, `/health/ready`, `/metrics`, `unmatched`. | erfüllt |
| Verteiltes Tracing zuschaltbar | nicht vorhanden (REQ-OPS-002, Stand 🟡) | **nicht erfüllt**, bekannter Backlog-Punkt |

## Befunde

| ID | Schwere | Befund | Beleg | Vorschlag |
|---|---|---|---|---|
| P-1 | mittel | Fastify übernimmt den Header `x-request-id` des Clients ungeprüft als `reqId` und schreibt ihn in jede Protokollzeile sowie in den Antwortheader. Ein Client kann so beliebigen Text ins Protokoll schreiben: personenbezogene Daten oder gefälschte Einträge, falls Zeilenumbrüche nicht escaped würden (pino escaped JSON, Fälschung also nur innerhalb des Feldes). | `curl -H "x-request-id: max@studmail.hwg-lu.de" …/health/ready` erzeugt `"reqId":"max@studmail.hwg-lu.de"` | `genReqId(req)` übernimmt den Header nur, wenn er dem UUID-Format entspricht (Hinter-Proxy-Fall); sonst neue UUID. `requestIdHeader` dann auf `false` setzen. Unit-Test „fremde Request-ID wird ersetzt“. |
| P-2 | niedrig | Bei unbekannten Routen protokolliert `requestLogEntry` den rohen Pfad ohne Query. Die Metrik nutzt dafür bereits `unmatched`. Ein Pfad kann vom Client eingegebene Daten enthalten. | `GET /api/v1/gibtsnicht/max@studmail.hwg-lu.de?token=abc` erzeugt `"route":"/api/v1/gibtsnicht/max@studmail.hwg-lu.de"`; die Query ist korrekt entfernt | Wie bei der Metrik `route: 'unmatched'` protokollieren, oder nur das erste Pfadsegment. |
| P-3 | niedrig | Verteiltes Tracing ist nicht zuschaltbar. | REQ-OPS-002, Umsetzungsstand 🟡 | OpenTelemetry über `OTEL_EXPORTER_OTLP_ENDPOINT`, standardmäßig aus (Backlog). |

## Ergebnis

**MAN-OPS-002 ist teilweise erfüllt.** Korrelations-ID und Metriken erfüllen das Akzeptanzkriterium. Der reguläre Betrieb protokolliert keine personenbezogenen Daten mehr; das ist ein klarer Fortschritt seit Review v1.3, wo IP-Adresse und Query im Protokoll standen.

Offen sind zwei Dinge:
- Manipulierte Anfragen können über `x-request-id` (P-1) und unbekannte Pfade (P-2) Text ins Protokoll bringen. Nach REQ-OPS-002 ist das ein Release-Blocker, weil personenbezogene Daten im Protokoll landen können.
- Tracing fehlt (P-3).

Nach der Korrektur von P-1 und P-2 ist der Review zu wiederholen; der Abschnitt mit den Feldern bleibt dann unverändert gültig.

## Folgeaufgaben

- P-1 und P-2 im Code beheben (`server.ts`), mit Unit-Tests in `server.test.ts` (AT-OPS-002 erweitern)
- P-3 im Backlog belassen
