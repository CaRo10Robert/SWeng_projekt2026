---
id: REQ-PERF-002
title: Zustellzeit von Chatnachrichten
type: quality
class: quality
status: in-review
owner: team-plattform
risk: medium
release: R1
moscow: M
kano: leistung
epic: EPIC-04
source: BG-3
use_cases: [UC-21]
depends_on: [REQ-CHAT-003]
version: 2.0
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-PERF-002]
---

# REQ-PERF-002 Zustellzeit von Chatnachrichten
## Anforderung
Neue Chatnachrichten müssen beim verbundenen Empfänger so schnell ankommen, dass ein Gespräch in Echtzeit möglich ist.

## Begründung
Nachricht senden ist eine kritische Nutzerreise; Verzögerungen führen zu Abbrüchen bei der Übergabeabsprache (BG-3).

## Qualitätsmerkmal, Metrik, Messverfahren
| Feld | Festlegung |
|---|---|
| Qualitätsmerkmal (ISO 25010) | Performance Efficiency → Time Behaviour |
| Metrik (SLI) | Zeit vom Eingang der Nachricht beim Server bis zum Empfang beim verbundenen Empfänger |
| Akzeptanzkriterium (SLO) | **p95 < 2 s**; 0 verlorene und 0 doppelte Nachrichten |
| Messverfahren | Lasttest mit k6 (WebSocket-Szenario), Zeitstempel beim Senden und Empfangen; 5 min Dauerlast |
| Messkontext | Docker-Beispiel, **200 gleichzeitige Verbindungen**, **5 Nachrichten/s**, Referenzrechner 4 Kerne / 16 GB |
| Degradation | Ohne Echtzeitverbindung lädt der Client alle 10 s nach; Nachrichten bleiben gespeichert |

## Nachweis
- `AT-PERF-002`: k6-Lasttest Chat (neu zu schreiben; Umsetzungsstand ⬜ – nicht gemessen).


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 2.0 | 2026-10-23 | Merkmal/Metrik/Akzeptanzkriterium/Messverfahren getrennt (Fallstudie FS-M3) |
