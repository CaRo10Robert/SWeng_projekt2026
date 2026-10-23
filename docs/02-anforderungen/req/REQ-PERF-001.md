---
id: REQ-PERF-001
title: Antwortzeit der Suche
type: quality
class: quality
status: approved
owner: team-marktplatz
risk: medium
reviewers: [qa-lead]
release: R1
moscow: M
moscow_reason: [1]
kano: leistung
epic: EPIC-03
source: BG-2
use_cases: [UC-13]
depends_on: [REQ-SRCH-001]
version: 2.1
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-PERF-001]
---

# REQ-PERF-001 Antwortzeit der Suche

## Anforderung
Die Suche muss Ergebnisse so schnell liefern, dass Mitglieder ohne spürbare Wartezeit filtern und blättern können.

## Begründung
Suchen ist eine der vier kritischen Nutzerreisen (Registrieren, Suchen, Anzeige erstellen, Nachricht senden). Langsame Suche senkt die Nutzung und damit die kritische Masse (BG-2).

## Qualitätsmerkmal, Metrik, Messverfahren
| Feld | Festlegung |
|---|---|
| Qualitätsmerkmal (ISO 25010) | Performance Efficiency → Time Behaviour |
| Metrik (SLI) | Serverseitige Antwortzeit erfolgreicher Suchanfragen, gemessen vom Lastgenerator |
| Akzeptanzkriterium (SLO) | **p95 < 500 ms** und **p99 < 1.500 ms**; Fehlerquote (5xx) = 0 % |
| Messverfahren | Lasttest mit k6, 5 min Dauerlast nach 1 min Aufwärmphase; Mischung aus Freitext (50 %), Filter (30 %) und Blättern (20 %) |
| Messkontext | Docker-Beispiel (`docker compose up`), gemessen am Suchendpunkt `GET /api/v1/listings` (HTTP 2xx), Seed mit **10.000 Anzeigen**, **20 Anfragen/s**, Referenzrechner: Laptop mit 4 Kernen und 16 GB RAM; Ergebnis als k6-Report im CI-Artefakt |
| Fenster | je Lasttestlauf; im Echtbetrieb 28 Tage (EPIC-12) |
| Degradation | Fällt die Volltextsuche aus, wird auf Titelsuche umgeschaltet und „eingeschränkte Suche“ angezeigt |

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Sehr lange oder sonderzeichenreiche Suchbegriffe | Begrenzung auf 100 Zeichen, Anfrage bleibt innerhalb des Ziels |
| Tiefe Seiten (große Offsets) | Blättern ist auf 10.000 Treffer begrenzt |
| Datenbankfehler bei der Volltextsuche | Fallback (siehe Degradation), kein 5xx |

## Nachweis
- `AT-PERF-001`: k6-Lasttest `tests/load/search.js` (geplant, siehe Umsetzungsstand).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 2.0 | 2026-10-23 | Eigene Datei; Merkmal/Metrik/Akzeptanzkriterium/Messverfahren getrennt (Fallstudie FS-M3) |
| 2.1 | 2026-10-23 | Review v0.2: R-22 (Endpunkt in den Messkontext), R-15 |
