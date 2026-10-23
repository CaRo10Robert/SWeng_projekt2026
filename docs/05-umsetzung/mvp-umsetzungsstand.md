---
id: IMPL-MVP
type: implementation-status
status: draft
owner: team-entwicklung
version: 0.1
created: 2026-10-23
last_updated: 2026-10-23
---

# Umsetzungsstand MVP (Release R1)

Stand des lauffähigen Docker-Beispiels gegenüber dem [Anforderungskatalog](../02-anforderungen/02-anforderungen.md). Umsetzungsentscheidungen und Abweichungen stehen in [ADR-0011](../03-architektur/decisions/0011-mvp-umsetzung.md).

**Legende:** ✅ umgesetzt · 🟡 teilweise · ⬜ offen · N/A nicht anwendbar (Beispiel, EPIC-12)
**Nachweise:** `U` = Unit-Test (`apps/server/src/**/*.test.ts`, 52 Tests) · `S` = Smoke-Test gegen das laufende Compose-Setup (`scripts/smoke-test.mjs`, 36 Prüfungen) · `B` = manueller Browser-Durchlauf (Edge, Desktop und 360 px) · `F` = Fitness Function (`pnpm lint:deps`)

## Funktionale Anforderungen

| ID | Prio | Stand | Umsetzung / Lücke | Nachweis |
|---|---|---|---|---|
| REQ-AUTH-001 | M | ✅ | BR-01 exakt nach Entscheidungstabelle, Whitelist in `identity.allowed_domain` | U, S |
| REQ-AUTH-002 | M | ✅ | Link 24 h gültig, einmalig, `token_expired`/`token_used`, danach angemeldet | S |
| REQ-AUTH-003 | S | ✅ | Nutzertyp aus dem Whitelist-Eintrag | U, S |
| REQ-AUTH-004 | M | ✅ | Neutrale Antworten bei Registrierung/Reset, „Konto existiert“-Mail, Dummy-Hash gegen Timing-Unterschiede | S |
| REQ-AUTH-005 | M | ✅ | Login/Logout, serverseitige Sessions | S, B |
| REQ-AUTH-006 | M | ✅ | Reset-Link 1 h, einmalig, widerruft alle Sessions | – |
| REQ-AUTH-007 | S | ⬜ | Re-Verifikation alle 12 Monate fehlt noch | – |
| REQ-AUTH-008 | M | ✅ | Sperre schreibt `identity.banned_email`, Neuregistrierung wird still verworfen | – |
| REQ-LST-001 | M | ✅ | Angebot/Gesuch mit Bildern | S, B |
| REQ-LST-002 | M | ✅ | Preistypen, 0 < Preis ≤ 10.000 € (App + DB-Constraint) | U, S |
| REQ-LST-003 | M | 🟡 | JPEG/PNG/WebP, Magic Bytes, WebP-Neukodierung ohne EXIF, 3 Größen. **HEIC wird abgelehnt** (ADR-0011 #5) | U, S |
| REQ-LST-004 | M | ✅ | Mind. ein Campus-Standort (3 Startwerte) | S |
| REQ-LST-005 | S | ✅ | Studiengang/Modul/ISBN bei „Bücher & Skripte“ | B |
| REQ-LST-006 | M | ✅ | Bearbeiten, pausieren, reaktivieren, löschen | U |
| REQ-LST-007 | M | ✅ | Reserviert/abgegeben, auch über den Deal im Chat | U, S |
| REQ-LST-008 | S | ✅ | Stündlicher Wartungsjob: Erinnerung 7 Tage vorher, Ablauf nach 60 Tagen, Verlängern, Löschfristen | – |
| REQ-LST-009 | C | ⬜ | Teilbarer Vorschau-Link für Nicht-Mitglieder | – |
| REQ-LST-010 | M | ✅ | Wortfilter → `in_review` + Systemfall in der Moderations-Queue | U, S |
| REQ-LST-011 | S | ✅ | Max. 30 aktive Anzeigen (Advisory Lock gegen Parallelität) | – |
| REQ-SRCH-001 | M | ✅ | `tsvector` (german) + `pg_trgm` (Tippfehler) | S, B |
| REQ-SRCH-002 | M | ✅ | Alle Filter und Sortierungen | B |
| REQ-SRCH-003 | S | ✅ | Sofort durchsuchbar (generierte Spalte) | S |
| REQ-SRCH-004 | S | ✅ | Merkliste | – |
| REQ-SRCH-005 | C | ⬜ | Suchaufträge | – |
| REQ-SRCH-006 | M | ✅ | Blockierte und gesperrte Anbieter werden ausgefiltert | – |
| REQ-CHAT-001 | M | ✅ | Anzeigenbezogener Chat ohne E-Mail-Adressen, nicht bei eigener Anzeige, nicht bei Blockierung | S, B |
| REQ-CHAT-002 | M | ✅ | `UNIQUE(listing_id, buyer_id)` | S |
| REQ-CHAT-003 | M | ✅ | WebSocket `/ws`, Polling alle 10 s als Degradation | S, B |
| REQ-CHAT-004 | M | ✅ | `UNIQUE(conversation_id, client_msg_id)`, Nachladen per `?after=` | S |
| REQ-CHAT-005 | S | ✅ | Ungelesen-Zähler, „gelesen“ | S, B |
| REQ-CHAT-006 | S | ✅ | Hinweis bei Links, IBAN, Telefonnummern | U |
| REQ-CHAT-007 | M | ✅ | 2.000 Zeichen, 20 Konversationen/h, 60 Nachrichten/min | – |
| REQ-CHAT-008 | C | ⬜ | Bilder im Chat | – |
| REQ-CHAT-009 | C | 🟡 | Deal (reservieren/abgeben/aufheben) mit Domain Events. Strukturierter Preisvorschlag fehlt | S |
| REQ-NOTI-001 | M | 🟡 | Alle Mailarten außer Re-Verifikation (hängt an REQ-AUTH-007) | S |
| REQ-NOTI-002 | M | ✅ | Max. 1 Mail/Konversation in 15 min, nur ungelesen, ohne Inhalt | – |
| REQ-NOTI-003 | S | ✅ | Abbestellbar: neue Nachrichten, Ablauf-Erinnerungen. Sicherheitsmails nicht | – |
| REQ-NOTI-004 | – | N/A | → EPIC-12 | – |
| REQ-NOTI-005 | M | ✅ | pg-boss im selben Commit, 5 Versuche mit Backoff, Dead-Letter-Queue im Admin-Bereich | – |
| REQ-NOTI-006 | C | ⬜ | Web-Push | – |
| REQ-NOTI-007 | M | ✅ | `SMTP_*`-Umgebungsvariablen | – |
| REQ-MOD-001 | M | ✅ | Melden von Anzeigen, Nachrichten, Profilen | S, B |
| REQ-MOD-002 | M | ✅ | Queue mit Kontext, Entscheidungen keine Maßnahme/entfernen/verwarnen/sperren | S, B |
| REQ-MOD-003 | M | ✅ | Mail an Betroffene und Meldende, `trust.decision` und Audit-Log append-only (Trigger) | S |
| REQ-MOD-004 | S | 🟡 | Ab 3 Meldungen wird eine Anzeige ausgeblendet. Für Nachrichten/Profile nur Markierung im Fall | – |
| REQ-MOD-005 | S | ✅ | Blockieren/Entsperren | – |
| REQ-MOD-006 | C | ⬜ | Bewertungen | – |
| REQ-MOD-007 | M | ✅ | Rollenwechsel mit Audit-Log, widerruft Sessions | B |
| REQ-MOD-008 | C | ⬜ | Whitelist-UI (Whitelist ist bereits Daten, REQ-ARCH-003) | – |
| REQ-ACC-001 | M | 🟡 | Anzeigename, Studiengang, Übergabeorte. **Profilbild fehlt** | B |
| REQ-ACC-002 | M | ✅ | 14 Tage Karenz, Login bricht ab, täglicher Löschjob über alle Module | – |
| REQ-ACC-003 | S | ✅ | JSON-Export aus allen Modulen | S |

## Nicht-funktionale Anforderungen und Constraints

| ID | Stand | Umsetzung / Lücke |
|---|---|---|
| REQ-PERF-001…005 | ⬜ | Noch nicht gemessen. Nächster Schritt: k6-Lasttest mit 10.000 Seed-Anzeigen, Lighthouse CI |
| REQ-SEC-001 | 🟡 | ASVS-L2-Checkliste noch nicht durchgeführt |
| REQ-SEC-002/003 | ✅ | Argon2id (OWASP-Parameter), ≥ 12 Zeichen, lokale Leak-Liste (klein, per `PASSWORD_BLOCKLIST_FILE` austauschbar) |
| REQ-SEC-004 | ✅ | `HttpOnly; Secure; SameSite=Lax`, serverseitiger Widerruf, CSRF-Header + Origin (ADR-0011 #4) |
| REQ-SEC-005 | ✅ | Postgres-Store: Login 5/15 min (Konto + IP), Registrierung 5/h (IP), Reset 3/h (Adresse), Chat |
| REQ-SEC-006 | ✅ | Zentrale Prüfung pro Ressource, fremde Ressourcen → 404 |
| REQ-SEC-007 | 🟡 | Magic Bytes, Neukodierung, außerhalb des Web-Roots. Auslieferung nur mit Session statt signierter URLs (ADR-0007) |
| REQ-SEC-008 | ⬜ | CI-Pipeline (SAST, SCA, Secret-Scan, Image-Scan, SBOM) fehlt |
| REQ-SEC-009 | ⬜ | STRIDE-Threat-Model fehlt |
| REQ-SEC-010 | ✅ | Non-root, `read_only: true`, `no-new-privileges`, keine Secrets im Image |
| REQ-PRIV-001 | ✅ | `identity.consent` mit Version und Zeitstempel |
| REQ-PRIV-002 | ✅ | E-Mail nie öffentlich, IP nur gehasht in Rate-Limit-Schlüsseln, nach ≤ 1 Tag gelöscht |
| REQ-PRIV-003 | 🟡 | Fristen für Anzeigen und Konten umgesetzt. Chats (12 Monate), Meldungen (12 Monate), Audit-Log (24 Monate) fehlen |
| REQ-PRIV-004 | ✅ | Nur gemeldete Nachricht ± 5, jeder Zugriff im Audit-Log |
| REQ-PRIV-006 | ✅ | Keine externen Ressourcen, strikte CSP |
| REQ-A11Y-001 | 🟡 | Semantisches HTML, Labels, Fokus, ARIA-Live im Chat. axe-core in CI und Screenreader-Test fehlen |
| REQ-UX-001 | ✅ | Mobile-first (kein horizontales Scrollen bei 360 px), PWA-Manifest + Service Worker |
| REQ-UX-002 | 🟡 | Deutsch. Texte noch nicht in i18n-Dateien ausgelagert |
| REQ-MAINT-001 | 🟡 | Unit-Tests der Fachregeln. Abdeckung und Mutation-Score noch nicht gemessen |
| REQ-MAINT-002 | ✅ | dependency-cruiser-Regeln für Modulgrenzen, Ports und reine Domain | 
| REQ-PORT-001 | ✅ | `compose.dev.yaml` + `pnpm dev`, gleiches Postgres-Image |
| REQ-PORT-002 | ⬜ | Multi-Arch-Build in CI fehlt (Basis-Images sind multi-arch, lokal baut das Image auf amd64 und arm64) |
| REQ-ARCH-001…006 | ✅ | PaymentPort, Deal + Events, Whitelist als Daten, `institution_id`, Compose, alle Infrastruktur hinter Ports |
| REQ-OPS-001 | ✅ | `/health/live`, `/health/ready`, Docker-`HEALTHCHECK`, Graceful Shutdown |
| REQ-OPS-002 | 🟡 | JSON-Logs ohne PII, Request-ID, `/metrics`. OpenTelemetry fehlt |
| REQ-OPS-003 | ✅ | README mit Schnellstart und Troubleshooting |
| REQ-OPS-004 | ⬜ | CI-Build und GHCR-Veröffentlichung fehlen |
| REQ-OPS-005 | ✅ | Migrationen beim Start, idempotent, Advisory Lock |
| REQ-DEMO-001 | ✅ | 7 Konten (Mitglieder, Moderator, Admin), 30 Anzeigen mit Bildern, Konversationen, offene Meldung, Wortfilter-Fall |
| REQ-DEMO-002 | ✅ | Admin: „Fällige Jobs jetzt ausführen“ (nur `DEMO_MODE=true`) |

## Nächste Schritte (Vorschlag)
1. CI-Pipeline (REQ-SEC-008, REQ-OPS-004, REQ-PORT-002): Build, Tests, `lint:deps`, Smoke-Test von `docker compose up`, Trivy, SBOM, Multi-Arch-Push nach GHCR.
2. Integrationstests mit Testcontainers für Repositories und Autorisierungsmatrix (QS-2).
3. Threat Model (REQ-SEC-009) und ASVS-L2-Checkliste.
4. Lasttest k6 (REQ-PERF-*), Lighthouse CI und axe-core.
5. Should-Lücken: Re-Verifikation (REQ-AUTH-007), Aufbewahrungsfristen Chat/Meldungen/Audit (REQ-PRIV-003), Profilbild (REQ-ACC-001).
