---
id: MAN-OPS-003
type: evidence
requirement: REQ-OPS-003
status: done
owner: qa-lead
date: 2026-10-26
---

# MAN-OPS-003 Onboarding-Test Docker-Beispiel (simuliert)

> **Simuliert:** Keine teamfremde Person, sondern ein frischer Clone. Der Tester (Fork H1) befolgt nur die Schritte aus dem README. Docker-Build-Cache und Basis-Images lagen auf dem Rechner bereits vor, die Zeiten sind deshalb kürzer als bei einem wirklich ersten Start.

## Ziel

REQ-OPS-003: (a) höchstens 10 min mit Internetzugang, (b) höchstens 3 min offline nach dem Build, (c) 0 Rückfragen.

## Umgebung

Windows 11, Docker Desktop, Git Bash. Clone des lokalen Repos (Stand `37ac306`) in ein leeres Verzeichnis. Port 8080 ist auf dem Rechner durch einen fremden Dienst belegt, 8025 durch ein anderes CampusMarkt-Beispiel.

## Ablauf

| Zeit (UTC) | README-Schritt | Beobachtung |
|---|---|---|
| 07:38:51 | `git clone` | in < 1 s |
| 07:38:51 | Schnellstart `docker compose up --build` | Port 8080 belegt → README, Troubleshooting: `.env` mit `APP_PORT=8091`, `MAILPIT_PORT=8033` (Windows-Hinweis befolgt) |
| 07:39:53 | `docker compose up --build -d --wait` fertig | alle Container „healthy“ nach **62 s** |
| 07:39:53 | Aufrufe laut Tabelle | App `/` 200, `/api/docs` 200, `/health/ready` 200, Mailpit 200 |
| 07:40:07 | Anmeldung mit Demo-Konto `lea@studmail.hwg-lu.de` | 200 |

## Messwerte

| Messgröße | Soll | Ist |
|---|---|---|
| (a) Klonen bis Anmeldung mit Internet | ≤ 10 min | **1 min 16 s** (mit warmem Build-Cache) |
| (b) offline nach dem Build | ≤ 3 min | nicht offline gemessen; Start ohne Build dauerte in allen Läufen 10–12 s ([Testbericht](../testbericht-2026-10-25.md)) |
| (c) Rückfragen | 0 | **0**, aber 2 Stolpersteine (O-1, O-2) |

## Ergebnis

**Bestanden (simuliert)** für (a) und (c). (b) ist durch die Startzeiten der Testläufe gedeckt, ein echter Offline-Lauf fehlt. Für einen echten Nachweis braucht es einen Lauf mit einer teamfremden Person auf einem Rechner ohne Build-Cache.

## Befunde

| Nr. | Befund | Vorschlag |
|---|---|---|
| O-1 | Das README nennt im Troubleshooting die Meldung `Bind for 0.0.0.0:8080 failed`. Seit die Ports an `127.0.0.1` gebunden sind, lautet sie `Bind for 127.0.0.1:8080 failed`. | Text angleichen |
| O-2 | Die Statuszeile oben im README ist veraltet („v0.3 (2026-10-23): erster lauffähiger MVP. Dokumente sind weiterhin `draft`“). | auf den aktuellen Stand bringen |

Die Befunde zur Entwicklungsumgebung stehen in [MAN-PORT-001](MAN-PORT-001.md).
