---
id: TESTREPORT-2026-11-07
type: test-report
status: done
owner: qa-lead
version: 1.0
created: 2026-11-07
last_updated: 2026-11-07
---

# Testbericht Testpyramide und Lieferkette (Gesamtlauf 2026-11-07)

## Gegenstand

| Punkt | Stand |
|---|---|
| Code | Branch `feature/fallstudie-req-c4`, Zwischenstand `1b2efa2` plus Abschluss dieses Laufs (Doku, Allowlist-Eintrag gitleaks, Digest des Basis-Images) |
| Image | `campusmarkt:local`, mit `--no-cache` gebaut (157 s), nach dem Wechsel des Basis-Image-Digests erneut gebaut |
| Umgebung | Docker-Beispiel mit frischem Volume (Compose-Projekt `cmtest`, Ports 8082/8026), zusätzlich Profil `proxy`; Windows 11 auf ARM64 (Snapdragon X, 12 Kerne, 16 GB), Docker Desktop 29.5 mit 12 CPUs und 8 GB für die VM |
| CI | Lauf für `1b2efa2` rot, nur im Job `security-scans` (siehe Befunde); alle anderen Jobs grün |
| Vorgehen | [Teststrategie](teststrategie.md) |

## Ergebnisse

| Prüfung | Ergebnis |
|---|---|
| Start bis „healthy“ | 13 s |
| Unit-Tests Server | 281 von 281 |
| Integrationstests Server (Testcontainers, PostgreSQL 17) | 59 von 59 |
| Coverage Fachmodule | 88,65 % Zeilen, 71,99 % Zweige, 89,2 % Funktionen (Schwellen 86/70/86); `domain.ts` 100/99,4/100 % |
| Komponententests Web | 20 von 20 |
| Typprüfung, Modulgrenzen, Nachverfolgbarkeit | ohne Fehler (80 Module, 132 Anforderungen, 148 markierte Tests) |
| JS-Budget (`CTRL-BUNDLE`) | initial 160,6 von 177 kB, größter Chunk 48,0 von 53 kB (gzip) |
| Smoke- und Akzeptanztests | 103 von 103 |
| E2E | 32 von 32 (vor und nach dem Wechsel des Basis-Images) |
| Wiederherstellung mit Löschjournal (AT-AVAIL-003) | bestanden (46 s) |
| Löschfristen (AT-PRIV-003-2/-3) | bestanden |
| Datenbankausfall (AT-OPS-001-3) | bestanden |
| Dead Letters bei Mailausfall (CTRL-DLQ) | bestanden (302 s) |
| Proxy mit TLS und HSTS (AT-OPS-009) | bestanden |
| Sicherheitsscans | gitleaks (Historie und Arbeitsstand), Semgrep (83 Regeln, 165 Dateien) und Trivy ohne Funde; `pnpm audit`: keine hohen oder kritischen, 14 mittlere und 2 niedrige |
| Logs nach allen Läufen | keine Client-IP-Adressen, keine E-Mail-Adressen, keine Tokens; einzige Treffer der IP-Suche sind die Adressen, an denen der Server im Container lauscht (Startmeldung) |

### Lasttests (k6, je 5 min nach 1 min Aufwärmen, `RATE_LIMIT_FACTOR=100`)

| Szenario | Grenze | Gemessen | Ergebnis |
|---|---|---|---|
| Suche, 20 Anfragen/s, 10.000 Anzeigen (AT-PERF-001) | p95 < 500 ms, p99 < 1.500 ms, 0 % 5xx | p95 14,9 ms, p99 37,9 ms, 0 % bei 6.000 Anfragen | bestanden |
| Chat, 200 Verbindungen, 5 Nachrichten/s (AT-PERF-002) | p95 < 2 s, 0 verloren, 0 doppelt | p95 24 ms, p99 77 ms, 0 verloren, 0 doppelt, 300.200 Zustellungen | bestanden |
| Anzeige anlegen, 2 Anfragen/s (AT-PERF-003) | p95 < 800 ms, 0 % Fehler | p95 19,1 ms, 0 % bei 600 Anfragen | bestanden |
| Registrierung, 50/min, bis zur Mail (AT-PERF-004) | p95 < 10 s, 0 verlorene Mails | p95 949 ms, 0 verloren bei 251 Registrierungen | bestanden |

**Abweichung vom Messkontext:** Die Anforderungen nennen einen Referenzrechner mit 4 Kernen und 16 GB. Gemessen wurde auf 12 Kernen. Der Abstand zur Grenze liegt zwischen Faktor 10 (Registrierung) und Faktor 80 (Chat). Der wöchentliche CI-Lauf auf dem Standard-Runner (4 vCPU, 16 GB) entspricht dem Referenzrechner und liefert die Messung im vorgesehenen Kontext.

## Befunde und Behebung

| # | Befund | Ursache | Behebung |
|---|---|---|---|
| F-1 | CI für `1b2efa2` rot im Job `security-scans` | gitleaks meldet ein festes Testpasswort im neuen Integrationstest (`identity.integration.test.ts`, zweiter Reset-Versuch, der scheitern muss) als `generic-api-key`. Weil der Job beim ersten Schritt abbrach, liefen Semgrep, `pnpm audit` und Trivy nicht. | Wert mit Begründung in die Allowlist von `.gitleaks.toml` aufgenommen (wie die übrigen festen Testwerte, kein Pfad-Ausschluss); die drei übrigen Scans lokal nachgeholt |
| F-2 | Trivy: 2 × HIGH in `apt`/`libapt-pkg6.0` 2.6.1 (CVE-2026-109518) | neue Schwachstelle im Debian-Basis-Image seit dem letzten grünen Scan | Digest von `node:22-bookworm-slim` auf den aktuellen Stand angehoben (apt 2.6.2, Node 22.23.4); danach Trivy ohne Funde, Smoke und E2E grün |
| F-3 | Erster E2E-Versuch: 22 Fehler, 10 nicht gelaufen | Playwright wurde im Zwischenstand aktualisiert, der passende Browser war lokal nicht installiert | `playwright install chromium`; danach 32 von 32. In CI installiert der Job `compose` den Browser selbst. Hinweis: E2E braucht einen frischen Stack, der Smoke-Test verändert Demo-Konten (z. B. Tims erneute Zustimmung). Ein E2E-Lauf nach dem Smoke-Test schlug deshalb fehl, auf frischem Stack wieder 32 von 32; CI hält diese Reihenfolge ein. |
| F-4 | Doku hinter dem Code | Der Zwischenstand enthielt Tests und Funktionen ohne passende Doku: 24 Anforderungen mit vollständigen Nachweisen standen noch auf `approved`/`implemented`, Teststrategie fehlte, Architektur 8.4 nannte umgesetzte Löschläufe „geplant“, zwei Fehlerfälle standen als „offener Punkt“ | Teststrategie, Architektur v1.6, Nachweiskatalog, Backlog, CHANGELOG und Anforderungen nachgezogen |

## Statusänderungen

24 Anforderungen stehen jetzt zusätzlich auf `verified`:

| Anforderungen | Belegt durch |
|---|---|
| REQ-AUTH-002, REQ-ACC-002, REQ-SEC-002, REQ-SEC-005, REQ-SEC-006, REQ-PRIV-002, REQ-PRIV-003, REQ-PRIV-004, REQ-OPS-005, REQ-MOD-003, REQ-LST-008, REQ-LST-011, REQ-SRCH-002, REQ-SRCH-006, REQ-CHAT-007, REQ-NOTI-002, REQ-NOTI-003 | Integrationstests |
| REQ-CHAT-003 | E2E-Test bei getrennter Echtzeitverbindung |
| REQ-LST-007 | Smoke-Test (vorhandene Prüfung, jetzt mit ID markiert) und Rückfall nach 30 Tagen (AT-LST-008) |
| REQ-MAINT-001 | Coverage 88,65 % (Kriterium ≥ 80 %), Mutation-Score 73,8 % |
| REQ-PERF-001, REQ-PERF-002, REQ-PERF-003, REQ-PERF-004 | k6-Lasttests |

Weitere Doku-Korrekturen ohne Statuswechsel: REQ-PERF-005 (neue Kontrolle `CTRL-BUNDLE`), REQ-OPS-002 (Log-Rotation umgesetzt).

**Verifizierungsquote:** 71 von 85 R1-Musts (84 %, vorher 60 %), gesamt 102 von 132 (77 %).

**Weiterhin nicht verifiziert (R1-Must):**
- REQ-A11Y-001/002 (Screenreader) und REQ-LST-001 (Usability): Dafür braucht es Tests mit echten Personen. Leitfäden und Vorlagen liegen vor.
- REQ-SEC-001: ASVS-L2-Quote 84 %, offene Kontrollen in EX-04 (B-59 bis B-63).
- Ein automatisierter Nachweis fehlt noch bei REQ-ARCH-003, REQ-AUTH-004, REQ-LST-003, REQ-NOTI-001, REQ-NOTI-005, REQ-NOTI-007, REQ-OPS-001, REQ-PRIV-001, REQ-SEC-007 und REQ-UX-001.
