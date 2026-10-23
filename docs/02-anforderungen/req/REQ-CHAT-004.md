---
id: REQ-CHAT-004
title: Nachrichten genau einmal anzeigen, keine verlieren
type: quality
class: quality
status: implemented
owner: team-kommunikation
risk: medium
reviewers: [qa-lead]
release: R1
moscow: M
moscow_reason: [1]
kano: basis
epic: EPIC-04
source: QS-4
use_cases: [UC-21]
version: 2.1
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-CHAT-004, AT-CHAT-004-2]
---

# REQ-CHAT-004 Nachrichten genau einmal anzeigen, keine verlieren

## Anforderung
Eine gesendete Nachricht **muss** genau einmal gespeichert und angezeigt werden, auch wenn der Client sie nach einem Verbindungsabbruch erneut sendet. Nach einer Unterbrechung **müssen** alle in der Zwischenzeit eingegangenen Nachrichten ohne Lücke nachgeladen werden. Eine wiederholt gesendete Nachricht wird dabei als dieselbe Nachricht erkannt (technisch: ADR-0004).

## Begründung
Doppelte oder fehlende Nachrichten führen zu Missverständnissen bei Preis und Treffpunkt (Qualitätsszenario QS-4).

**Must-Begründung:** Kriterium 1 (Release-Ziel nicht ohne sie erreichbar).

## Qualitätsmerkmal, Metrik, Messverfahren
| Feld | Festlegung |
|---|---|
| Qualitätsmerkmal (ISO 25010) | Reliability → Fault Tolerance |
| Metrik | Anzahl doppelter bzw. fehlender Nachrichten nach Wiederholung und Reconnect |
| Akzeptanzkriterium | **0** Duplikate, **0** Lücken; Reconnect inklusive Nachladen < 5 s |
| Messverfahren | API-Test: dieselbe Nachricht zweimal senden (Wiederholung nach simuliertem Abbruch); Verbindung trennen, Nachrichten senden, wieder verbinden und ab der letzten bekannten Nachricht nachladen |
| Messkontext | Docker-Beispiel, eine Konversation, 20 Nachrichten |

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Wiederholung mit gleicher Kennung | Antwort mit der bereits gespeicherten Nachricht, keine Benachrichtigung |
| Gleiche Kennung in einer anderen Konversation | unabhängige Nachricht |

## Nachweis
- `AT-CHAT-004`: Smoke-Test – gleiche Kennung erzeugt keine zweite Nachricht.
- `AT-CHAT-004-2`: API-Test – Nachladen ab der letzten bekannten Nachricht ohne Lücke (neu).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 2.0 | 2026-10-23 | Nachladen ohne Lücke ergänzt, Metrik und Messverfahren (FS-M3) |
| 2.1 | 2026-10-23 | Review v0.2: R-17 Typ `quality`; R-22 Kennung lösungsneutral (Technik in ADR-0004); Must-Begründung |
