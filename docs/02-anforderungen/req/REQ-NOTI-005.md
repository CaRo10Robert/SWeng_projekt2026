---
id: REQ-NOTI-005
title: Zuverlässige E-Mail-Zustellung
type: quality
class: quality
status: implemented
owner: team-kommunikation
risk: medium
release: R1
moscow: M
kano: basis
epic: EPIC-05
source: QS-3, BG-1
use_cases: [UC-01, UC-23]
depends_on: [REQ-NOTI-001]
version: 2.0
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-NOTI-005, CTRL-DLQ]
---

# REQ-NOTI-005 Zuverlässige E-Mail-Zustellung

## Anforderung
Eine fachlich ausgelöste E-Mail **darf nicht verloren gehen** und **darf nicht ohne die auslösende Änderung** versendet werden (z. B. keine Verifikationsmail für ein nicht angelegtes Konto). Ist der Mailserver nicht erreichbar, **muss** das System die Zustellung automatisch wiederholen: **höchstens 5 Versuche**, mit **exponentiell wachsendem Abstand**, ohne dass dieselbe E-Mail mehrfach beim Empfänger ankommt. Endgültig fehlgeschlagene Zustellungen **müssen** für Administratoren sichtbar sein. Die auslösende Benutzeraktion wartet nicht auf den Versand.

Technische Umsetzung siehe ADR-0005.

## Begründung
Ohne Verifikationsmail keine Registrierung (BG-1). Qualitätsszenario QS-3.

## Qualitätsmerkmal, Metrik, Messverfahren
| Feld | Festlegung |
|---|---|
| Qualitätsmerkmal (ISO 25010) | Reliability → Recoverability, Fault Tolerance |
| Metrik | Anteil ausgelöster E-Mails, die nach Wiederherstellung des Mailservers zugestellt werden; Anzahl Duplikate |
| Akzeptanzkriterium | **100 %** zugestellt bei Ausfall bis zur Erschöpfung der Wiederholungen; **0** Duplikate; Antwortzeit der Registrierung unabhängig vom Mailserver (< 800 ms) |
| Messverfahren | Resilienztest: Mail-Catcher stoppen, Registrierung auslösen, nach 5 min Mail-Catcher starten, Eingang prüfen; zusätzlich Mail-Catcher dauerhaft gestoppt → Eintrag in der Ansicht fehlgeschlagener Zustellungen |
| Messkontext | Docker-Beispiel (`docker compose stop mailpit` / `start`) |
| Verhalten bei Verfehlung | Fehlgeschlagene Zustellung sichtbar im Admin-Bereich und im Log; Nutzer kann Verifikation erneut anfordern |

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Mailserver dauerhaft weg | nach 5 Versuchen „fehlgeschlagen“, sichtbar für Admins |
| Fachliche Änderung wird zurückgerollt | keine E-Mail |
| Zeitüberschreitung beim Mailserver | Versuch gilt als fehlgeschlagen (Timeout ≤ 10 s), Wiederholung |

## Nachweis
- `AT-NOTI-005`: Resilienztest QS-3 mit gestopptem Mail-Catcher (neu zu schreiben).
- `CTRL-DLQ`: Admin-Ansicht „Jobs/Dead Letters“ zeigt endgültig fehlgeschlagene Zustellungen.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog („transaktional eingereihter Job“) |
| 2.0 | 2026-10-23 | Lösungsneutral als Zuverlässigkeitsanforderung (Fallstudie FS-M5), Metrik und Messverfahren |
