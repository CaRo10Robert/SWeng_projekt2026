---
id: TESTREPORT-2026-10-25
type: test-report
status: done
owner: qa-lead
version: 1.0
created: 2026-10-25
last_updated: 2026-10-25
---

# Testbericht EPIC-13 „Recht, Auftritt und Betrieb“ (finaler Lauf 2026-10-25)

## Gegenstand

| Punkt | Stand |
|---|---|
| Code | Branch `feature/fallstudie-req-c4`, Commit `fd845ac` + Nachweis-Tag AT-AUTH-009, nach [Review v1.3](../04-review/review-v1.3-recht-betrieb.md) |
| Image | `campusmarkt:local`, neu gebaut mit `docker compose build --no-cache` (462 MB, Benutzer `node`, Dateisystem schreibgeschützt) |
| Umgebung | Docker-Beispiel (app + db + mailpit), frisches Volume, zusätzlich Profil `proxy` mit `.env.proxy.example`; Windows 11, Docker Desktop, Ports 8082/8026 |
| CI | GitHub Actions: Läufe für `836e1c3`, `a359f83`, `6e6fe40` und `fd845ac` grün (Prüfungen, Diagramme, Ops-Konfiguration, Compose mit E2E, Smoke, Restore- und Proxy-Test, Image-Archiv) |

## Ergebnisse

| Prüfung | Befehl | Ergebnis |
|---|---|---|
| Build | `docker compose build --no-cache` | 53 s |
| Start bis „healthy“ | `docker compose up -d --wait` | 10 s (Ziel ≤ 3 min) |
| E2E (Tastatur, axe, Rechtsseiten, DSA, Sprache, Speicherung) | `pnpm e2e` | 31 von 31 |
| Smoke- und Akzeptanztests | `node scripts/smoke-test.mjs …` | 96 von 96 |
| Wiederherstellung inkl. Löschjournal (AT-AVAIL-003) | `node tests/ops/restore-test.mjs … --project cmtest` | bestanden |
| Proxy mit TLS und HSTS (AT-OPS-009) | `node tests/ops/proxy-test.mjs --project cmtest` | 4 von 4 |
| Unit-Tests | `pnpm test` | 214 von 214 |
| Typprüfung | `pnpm typecheck` | 5 von 5 Paketen |
| Modulgrenzen (`CTRL-DEPCRUISE`) | `pnpm lint:deps` | keine Verstöße (76 Module) |
| Übersetzungen | `node scripts/check-i18n.mjs`, `node --test tests/i18n/i18n.test.mjs` | 605 Schlüssel de/en, 7 Lesefassungen; Test bestanden |
| Alarmregeln (`CTRL-ALERT-RULES`) | `promtool check config`, `promtool test rules`, `amtool check-config` | gültig, 8 Regeln, Regeltests bestanden |
| Proxy-Konfiguration | `caddy validate` | gültig |
| Renovate (`CTRL-RENOVATE`) | `renovate-config-validator --strict` | gültig |
| Image (`CTRL-IMAGE-INSPECT`) | `docker inspect`, `docker exec … touch` | Benutzer `node`, schreibgeschützt |
| Logs | `docker logs` nach allen Läufen | keine Client-IP, kein Token |
| Nachverfolgbarkeit | `node scripts/trace.mjs --report` | ok: 132 Anforderungen, 121 markierte Tests |
| Diagramme | `node scripts/check-diagrams.mjs` | 36 von 36 |

## Statusänderungen

27 Anforderungen stehen jetzt auf `verified`. Die Regel ist dieselbe wie im [Testbericht Sprint 1](testbericht-2026-10-24.md): Jeder automatisierte Nachweis ist in einer Testquelle markiert und hat in diesem Lauf bestanden. Jede Kontrolle wurde in diesem Lauf ausgeführt.

Zu den ausgeführten Kontrollen zählen auch die Dokument-Kontrollen `CTRL-DOC-…`: Dokument vorhanden, Platzhalter markiert, Review v1.3 durchgeführt und Befunde behoben.

Die 27 Anforderungen:
- REQ-LEGAL-001 bis 012
- REQ-UX-003 bis 007
- REQ-OPS-004, 006, 007, 009, 010, 012
- REQ-PRIV-008, REQ-SEC-012, REQ-AVAIL-003, REQ-AUTH-009

**Verifizierungsquote:** 41 von 83 R1-Musts (49 %), gesamt 48 %.

**Bewusst nicht verifiziert:**
- **REQ-LEGAL-013** (Datenpannen-Prozess): Die Übung MAN-LEGAL-013 steht aus.
- **REQ-OPS-008** (Alarmierung): Die Alarmübung MAN-OPS-008 wurde einmal mit 184 s durchgeführt, das Protokoll gehört aber in den Echtbetrieb.
- **REQ-OPS-011** (Betriebshandbuch): Die Begehung MAN-OPS-011 steht aus.
- **REQ-SEC-013** (Penetrationstest): Der Test MAN-SEC-013 ist nur geplant.
- **REQ-PRIV-007** (DSFA): Die DSFA ist nach der Schwellwertanalyse erforderlich und vom DSB durchzuführen.

## Offene Prüfpunkte außerhalb der Technik

Die Rechtstexte sind Muster mit Platzhaltern. Folgende Fragen müssen von Fachstellen beantwortet werden (Details im Review-Protokoll v1.3):
- Anwendbarkeit von DSA, § 5 DDG und PStTG auf ein kostenloses Angebot einer Hochschule
- Rechtsgrundlage lit. c oder lit. e DSGVO
- Bestätigung der DSFA
- Fundstellen im PStTG

## Bekannte Einschränkungen

- Der Smoke-Test prüft die erneute Zustimmung mit dem Demo-Konto Tim, deshalb läuft er je Stack nur einmal. E2E-Suite und Smoke-Test zusammen laufen wegen der Registrierungsgrenze (Q-18) etwa zweimal je Stunde und Stack.
- Ein abgelaufenes Einmal-Token für den Widerspruch ist nur per Unit-Test geprüft.
