---
id: TESTREPORT-2026-11-13
type: test-report
status: done
owner: qa-lead
version: 1.0
created: 2026-11-13
last_updated: 2026-11-13
---

# Testbericht offene R1-Nachweise (Lauf 2026-11-13)

## Gegenstand

| Punkt | Stand |
|---|---|
| Code | Branch `feature/r1-nachweise` auf Basis von `a9ce0cf` (0.4.1) |
| Ziel | Die im [Testbericht 2026-11-07](testbericht-2026-11-07.md) offenen automatisierten Nachweise der R1-Musts schreiben und die Doku konsistent machen |
| Umgebung | Docker-Beispiel (Compose-Projekt `campusmarkt`, frisches Volume für E2E); Windows 11 auf ARM64, Docker Desktop 29.9 mit WSL 2 |
| Vorgehen | [Teststrategie](teststrategie.md) v1.1 |

## Ergebnisse

| Prüfung | Ergebnis |
|---|---|
| Unit- und Integrationstests Server (Testcontainers, PostgreSQL 17) | 368 von 368 (29 Dateien) |
| Coverage Fachmodule | 88,77 % Zeilen, 72,15 % Zweige, 89,22 % Funktionen (Schwellen 86/70/86) |
| Typprüfung, Nachverfolgbarkeit | ohne Fehler (138 Anforderungen, 172 markierte Tests) |
| Smoke- und Akzeptanztests | alle bestanden |
| E2E | 42 von 42: 41 im Gesamtlauf; AT-UX-001-2 nach Korrektur des Tests (F-4) dreimal einzeln bestanden |
| Mailserver-Ausfall 30 min, skaliert 1:12 (AT-NOTI-005) | bestanden: Registrierung 63 ms bei ausgefallenem Mailserver, Mail 5 s nach dem Ende des Ausfalls, genau eine Zustellung |
| Herunterfahren unter Last (AT-OPS-001-2) | 3 von 3 bestanden: Prozessende nach 1,0–1,1 s, Exit-Code 0, 0 abgebrochene Anfragen bei 27.000–30.000 Anfragen je Lauf |

### Neue Nachweise

| Nachweis | Anforderung | Art |
|---|---|---|
| AT-ARCH-003 | REQ-ARCH-003 | Integrationstest: Domain zur Laufzeit ergänzen und deaktivieren |
| AT-AUTH-004-2 | REQ-AUTH-004 | Integrationstest: Antwortinhalt und Median der Antwortzeit je 30 Anfragen, Toleranz 50 ms |
| AT-LST-003-3, AT-SEC-007-4 | REQ-LST-003, REQ-SEC-007 | Integrationstest: JPEG mit GPS-EXIF, alle Größen ohne Metadaten |
| AT-NOTI-001-2 | REQ-NOTI-001 | Integrationstest: alle acht Mailarten über die API ausgelöst, Fußzeile, Kontosprache |
| AT-NOTI-005 | REQ-NOTI-005 | Ops-Test `mail-outage-test.mjs` (wöchentlich) |
| AT-NOTI-007 | REQ-NOTI-007 | Konfigurationstest gegen einen eigenen SMTP-Empfänger |
| AT-OPS-001-2 | REQ-OPS-001 | Ops-Test `shutdown-test.mjs` (Job `compose`) |
| AT-PRIV-001-2 | REQ-PRIV-001 | vorhandener Integrationstest mit der ID markiert |
| AT-UX-001-2 | REQ-UX-001 | E2E-Test: Manifest, Service Worker, App-Shell offline |

## Befunde und Behebung

| # | Befund | Ursache | Behebung |
|---|---|---|---|
| F-1 | Konten einer deaktivierten Domain konnten sich nicht mehr anmelden (gefunden mit AT-ARCH-003) | Die Anmeldung prüfte die Domain mit derselben Regel wie die Registrierung, einschließlich „aktiv“ | Anmeldung verlangt nur noch, dass die Domain auf der Whitelist steht; Unit-Test in `identity-provider.test.ts` (REQ-ARCH-003, REQ-MOD-008) |
| F-2 | Der Wiederholungsplan für E-Mails überbrückte nur etwa 2,5 min statt 30 min (gefunden beim Schreiben von AT-NOTI-005) | Im Code stand fest `retryDelaySeconds: 10`, ADR-0005 verlangt 120 s; B-36 war damit nur in der Doku erledigt | `MAIL_RETRY_DELAY_SECONDS` (Standard 120 s) in Konfiguration, Compose und `.env.example`; Ops-Tests starten den Stack mit 10 s und verkürzen den Ausfall im selben Verhältnis ([CTRL-DLQ](nachweise/CTRL-DLQ.md) ergänzt) |
| F-3 | Herunterfahren unter Last hing bis zum Shutdown-Zeitlimit (25 s, Exit-Code 1), einzelne Anfragen mit `ECONNRESET` | Messung über den Port des Hosts: Der Port-Proxy von Docker Desktop (Windows) hält beim Stopp halb übertragene Anfragen offen. Aus dem Docker-Netz endet die App nach etwa 1 s mit Exit-Code 0. Verbleibende `ECONNRESET` betreffen Verbindungen, die nur der Kernel angenommen hatte | Test erzeugt die Last aus dem Docker-Netz; Messverfahren und Metrik in REQ-OPS-001 v2.4 präzisiert (Entscheidung Product Owner): Kernel-Resets und 503 beim Schließen zählen als abgewiesen. Das Herunterfahren protokolliert jetzt die Dauer je Schritt |
| F-4 | Erster Lauf von AT-UX-001-2 rot | Testfehler: `serviceWorker.ready` liefert den Worker schon im Zustand `activating` | Test wartet auf `activated` |
| F-5 | Doku hinter dem Stand | REQ-SEC-001 erfüllte laut eigener Bewertung (v1.4) das Akzeptanzkriterium, stand aber auf `implemented`; REQ-SEC-007 stand auf `approved`, obwohl umgesetzt und weitgehend getestet; AT-PRIV-001-2 war als „entfällt“ geführt und zählte deshalb nie | Status nachgezogen, AT-PRIV-001-2 am vorhandenen Integrationstest markiert |

## Statusänderungen

Elf Anforderungen stehen jetzt auf `verified`: REQ-ARCH-003, REQ-AUTH-004, REQ-LST-003, REQ-NOTI-001, REQ-NOTI-005, REQ-NOTI-007, REQ-OPS-001, REQ-PRIV-001, REQ-SEC-001, REQ-SEC-007, REQ-UX-001.

**Verifizierungsquote:** 82 von 85 R1-Musts (96 %, vorher 84 %), gesamt 117 von 138 (85 %).

**Weiterhin nicht verifiziert (R1-Must):** REQ-A11Y-001/002 (Screenreader) und REQ-LST-001 (Usability-Test). Dafür braucht es Tests mit echten Personen; Leitfäden und Protokollvorlagen liegen in [nachweise/](nachweise/README.md).

## Maßnahme gegen Wiederholung

`scripts/trace.mjs` prüft seit diesem Lauf die Readiness: Ab Status `approved` braucht eine Anforderung mindestens eine Nachweis-ID und Abnahmekriterien, sonst bricht die CI ab. Steht eine Anforderung auf `implemented` und kommt ein automatisierter Nachweis in keinem Test vor, gibt es eine Warnung. So fallen Katalogeinträge mit „(neu)“, zu denen nie ein Test entstand, sofort auf.
