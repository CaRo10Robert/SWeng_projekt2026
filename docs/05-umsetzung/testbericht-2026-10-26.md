---
id: TESTREPORT-2026-10-26
type: test-report
status: done
owner: qa-lead
version: 1.0
created: 2026-10-26
last_updated: 2026-10-26
---

# Testbericht Nachweise und Kontrollen (finaler Lauf 2026-10-26)

## Gegenstand

| Punkt | Stand |
|---|---|
| Code | Branch `feature/fallstudie-req-c4`, Commit `856905f` |
| Image | `campusmarkt:local`, neu gebaut mit `--no-cache` (123 s), Benutzer `node` |
| Umgebung | Docker-Beispiel mit frischem Volume, zusätzlich Profil `proxy`; Windows 11, Docker Desktop, Ports 8082/8026 |
| CI | Lauf für `2b2dbee` grün, alle sieben Jobs inklusive Sicherheitsscans und Multi-Arch-Build |

## Ergebnisse

| Prüfung | Ergebnis |
|---|---|
| Start bis „healthy“ | 12 s |
| E2E | 31 von 31 |
| Smoke- und Akzeptanztests | 101 von 101 |
| Wiederherstellung mit Löschjournal (AT-AVAIL-003) | bestanden |
| Löschfristen (AT-PRIV-003-2/-3) | bestanden |
| Datenbankausfall (AT-OPS-001-3) | bestanden |
| Proxy mit TLS und HSTS (AT-OPS-009) | bestanden |
| Unit-Tests mit Coverage-Schwellen | 256 von 256 |
| Typprüfung, Modulgrenzen, Übersetzungen, Nachverfolgbarkeit | ohne Fehler (77 Module, 613 Schlüssel, 124 markierte Tests) |
| Diagramme | 39 von 39 |
| Logs nach allen Läufen | keine Tokens, keine IP-Adressen, keine E-Mail-Adressen |

## Statusänderungen

15 Anforderungen stehen jetzt zusätzlich auf `verified`:

| Anforderungen | Belegt durch |
|---|---|
| REQ-OPS-008, REQ-OPS-011, REQ-LEGAL-013, REQ-NOTI-004 | durchgeführte Übungen |
| REQ-OPS-003, REQ-PORT-001 | simuliertes Onboarding |
| REQ-ARCH-001, REQ-ARCH-004, REQ-OPS-002, REQ-UX-002 | Reviews |
| REQ-SEC-009, REQ-SEC-013, REQ-PRIV-007 | Threat Model, Übungs-Pentest, Übungs-DSFA |
| REQ-SEC-008, REQ-PORT-002 | Kontrollen in CI |

Die Protokolle stehen im [Nachweis-Index](nachweise/README.md).

**Verifizierungsquote:** 49 von 83 R1-Musts (59 %), gesamt 59 %.

**Bewusst nicht verifiziert:**
- REQ-A11Y-001/002 (Screenreader) und REQ-LST-001 (Usability): Dafür braucht es Tests mit echten Personen. Leitfäden und Vorlagen liegen vor, die fiktiven Beispiele sind kein Nachweis.
- REQ-SEC-001: ASVS-L2-Quote 84 %. Sechs Kontrollen sind nicht erfüllt (B-59 bis B-63).
- REQ-AVAIL-002: Ein RPO von 1 h ist mit täglicher Sicherung nicht erreichbar, im Echtbetrieb ist PITR nötig.
- REQ-MAINT-001: Die Coverage der Fachmodule liegt bei 15,9 % statt 80 % (B-64).
- 42 Anforderungen fehlt mindestens ein automatisierter Test. Diese Tests sind für spätere Sprints geplant.
