---
id: REQ-PERF-002
title: Zustellzeit von Chatnachrichten
type: quality
class: quality
status: approved
owner: team-plattform
risk: medium
reviewers: [qa-lead]
release: R1
moscow: M
moscow_reason: [1]
kano: leistung
epic: EPIC-04
source: BG-3
use_cases: [UC-21]
depends_on: [REQ-CHAT-003]
version: 2.3
created: 2026-10-20
last_updated: 2026-10-26
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
| Fehlerbudget | 0 verlorene und 0 doppelte Nachrichten (kein Budget); höchstens 5 % der Nachrichten über 2 s |
| Last- und Datenprofil | Textnachrichten 20–500 Zeichen; Konversationen mit vorhandenem Verlauf; Abhängigkeiten: PostgreSQL und In-Process-Broker |
| Timeout, Retry, Idempotenz | Wiederverbindung des WebSockets mit Backoff, Polling alle 10 s als Rückfall; Senden idempotent über `clientMsgId`, erneutes Senden ohne Duplikat |
| Wiederherstellung | Nachrichten sind vor dem Publish gespeichert (ADR-0004); RTO/RPO der Daten siehe REQ-AVAIL-003 |
| Verantwortung und Eskalation | Service-Owner team-plattform; Eskalation über den Incident-Prozess (`docs/07-betrieb/incident-prozess.md`), Rufbereitschaft im Echtbetrieb (fiktiv) |

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Echtzeitverbindung getrennt | automatische Wiederverbindung; bis dahin Polling, Nachrichten kommen verzögert, aber vollständig an |
| Doppeltes Senden (Wiederholung, Doppelklick) | idempotent über `clientMsgId`, keine doppelte Nachricht |
| Senden scheitert | Nachricht bleibt im Eingabefeld mit Fehlerhinweis; erneutes Senden mit derselben `clientMsgId` |
| Rate-Limit | 60 Nachrichten je Minute, danach 429 mit Wartezeit |
| Empfänger offline | Nachricht gespeichert, gebündelte E-Mail ohne Inhalt nach 15 min (REQ-NOTI-002) |
| Datenbank nicht erreichbar | Senden scheitert sichtbar; keine scheinbar gesendete Nachricht |

## Nachweis
- `AT-PERF-002`: k6-Lasttest Chat (neu zu schreiben; Umsetzungsstand ⬜ – nicht gemessen).


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 2.0 | 2026-10-23 | Merkmal/Metrik/Akzeptanzkriterium/Messverfahren getrennt (Fallstudie FS-M3) |
| 2.1 | 2026-10-23 | Review v0.2: R-15 |
| 2.2 | 2026-10-26 | Guideline-Review: GL-05 Fehler- und Missbrauchsfälle ergänzt |
| 2.3 | 2026-10-26 | Guideline-Review: GL-10 Felder aus der NFR-/SLO-Vorlage ergänzt (Fehlerbudget, Lastprofil, Timeout/Retry, Wiederherstellung, Eskalation) |
