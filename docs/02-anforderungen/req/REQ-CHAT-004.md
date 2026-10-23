---
id: REQ-CHAT-004
title: Nachrichten genau einmal anzeigen, keine verlieren
type: business-rule
class: quality
status: implemented
owner: team-kommunikation
risk: medium
release: R1
moscow: M
kano: basis
epic: EPIC-04
source: QS-4
use_cases: [UC-21]
version: 2.0
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-CHAT-004, AT-CHAT-004-2]
---

# REQ-CHAT-004 Nachrichten genau einmal anzeigen, keine verlieren

## Anforderung
Eine gesendete Nachricht **muss** genau einmal gespeichert und angezeigt werden, auch wenn der Client sie nach einem Verbindungsabbruch erneut sendet. Nach einer Unterbrechung **müssen** alle in der Zwischenzeit eingegangenen Nachrichten ohne Lücke nachgeladen werden. Jede Nachricht trägt dafür eine vom Client vergebene, eindeutige Kennung.

## Begründung
Doppelte oder fehlende Nachrichten führen zu Missverständnissen bei Preis und Treffpunkt (Qualitätsszenario QS-4).

## Qualitätsmerkmal, Metrik, Messverfahren
| Feld | Festlegung |
|---|---|
| Qualitätsmerkmal (ISO 25010) | Reliability → Fault Tolerance |
| Metrik | Anzahl doppelter bzw. fehlender Nachrichten nach Wiederholung und Reconnect |
| Akzeptanzkriterium | **0** Duplikate, **0** Lücken; Reconnect inklusive Nachladen < 5 s |
| Messverfahren | API-Test: dieselbe Nachricht mit derselben Kennung zweimal senden; Verbindung trennen, Nachrichten senden, wieder verbinden und ab der letzten bekannten Nachricht nachladen |
| Messkontext | Docker-Beispiel, eine Konversation, 20 Nachrichten |

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Wiederholung mit gleicher Kennung | Antwort mit der bereits gespeicherten Nachricht, keine Benachrichtigung |
| Gleiche Kennung in einer anderen Konversation | unabhängige Nachricht |

## Nachweis
- `AT-CHAT-004`: Smoke-Test – gleiche Kennung erzeugt keine zweite Nachricht.
- `AT-CHAT-004-2`: API-Test – Nachladen ab der letzten bekannten Nachricht ohne Lücke (neu zu schreiben).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 2.0 | 2026-10-23 | Nachladen ohne Lücke ergänzt, Metrik und Messverfahren (FS-M3) |
