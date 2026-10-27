---
id: REQ-NOTI-005
title: Zuverlässige E-Mail-Zustellung
type: quality
class: quality
status: implemented
owner: team-kommunikation
risk: medium
reviewers: [qa-lead]
release: R1
moscow: M
moscow_reason: [1, 3]
kano: basis
epic: EPIC-05
source: QS-3, BG-1
use_cases: [UC-01, UC-23]
depends_on: [REQ-NOTI-001]
version: 2.2
created: 2026-10-20
last_updated: 2026-10-26
verification: [AT-NOTI-005, CTRL-DLQ]
---

# REQ-NOTI-005 Zuverlässige E-Mail-Zustellung

## Anforderung
Eine fachlich ausgelöste E-Mail **darf nicht verloren gehen** und **darf nicht ohne die auslösende Änderung** versendet werden (z. B. keine Verifikationsmail für ein nicht angelegtes Konto). Ist der Mailserver nicht erreichbar, **muss** das System die Zustellung automatisch wiederholen, und zwar so, dass **Ausfälle des Mailservers bis 30 Minuten ohne Verlust überbrückt** werden. Die Wiederholungen sind begrenzt (höchstens 5 Versuche) und werden mit wachsendem Abstand ausgeführt, damit ein ausgefallener Mailserver nicht überlastet wird; dieselbe E-Mail kommt beim Empfänger nicht mehrfach an. Nach Erschöpfung der Wiederholungen **muss** die E-Mail in der Übersicht fehlgeschlagener Zustellungen (Dead-Letter-Übersicht) für Administratoren sichtbar sein. Die auslösende Benutzeraktion wartet nicht auf den Versand.

Technische Umsetzung siehe ADR-0005.

## Begründung
Ohne Verifikationsmail keine Registrierung (BG-1). Qualitätsszenario QS-3.

**Must-Begründung:** Kriterium 1 (Release-Ziel nicht ohne sie erreichbar); Kriterium 3 (Betreibbarkeit des Beispiels).

## Qualitätsmerkmal, Metrik, Messverfahren
| Feld | Festlegung |
|---|---|
| Qualitätsmerkmal (ISO 25010) | Reliability → Recoverability, Fault Tolerance |
| Metrik | Anteil ausgelöster E-Mails, die nach Wiederherstellung des Mailservers zugestellt werden; Anzahl Duplikate |
| Akzeptanzkriterium | **100 %** zugestellt bei einem Mailserver-Ausfall von **bis zu 30 min**; **0** Duplikate; bei dauerhaftem Ausfall erscheint jede betroffene E-Mail in der Dead-Letter-Übersicht; Antwortzeit der Registrierung unabhängig vom Mailserver (< 800 ms) |
| Messverfahren | Resilienztest (a): Mail-Catcher stoppen, Registrierung auslösen, nach **30 min** Mail-Catcher starten, Eingang innerhalb weiterer 30 min prüfen, Anzahl Duplikate zählen. Resilienztest (b): Mail-Catcher dauerhaft gestoppt, nach Erschöpfung der Wiederholungen Eintrag in der Dead-Letter-Übersicht prüfen. Für den CI-Lauf darf die Wartezeit per Konfiguration verkürzt werden, das Verhältnis Ausfalldauer zu Wiederholungsplan bleibt gleich |
| Messkontext | Docker-Beispiel (`docker compose stop mailpit` / `start`) |
| Verhalten bei Verfehlung | Fehlgeschlagene Zustellung sichtbar im Admin-Bereich und im Log; Nutzer kann Verifikation erneut anfordern |

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Mailserver dauerhaft weg | nach 5 Versuchen „fehlgeschlagen“, sichtbar für Admins |
| Fachliche Änderung wird zurückgerollt | keine E-Mail |
| Zeitüberschreitung beim Mailserver | Versuch gilt als fehlgeschlagen (Timeout ≤ 10 s), Wiederholung |

## Nachweis
- `AT-NOTI-005`: Resilienztest QS-3 mit gestopptem Mail-Catcher (neu).
- `CTRL-DLQ`: Admin-Ansicht „Jobs/Dead Letters“ zeigt endgültig fehlgeschlagene Zustellungen – geprüft mit `tests/ops/dlq-test.mjs` (Mailpit gestoppt, Passwort-Reset angefordert, nach 302 s steht der Job mit Vorlage `password_reset` in der Ansicht, die App bleibt erreichbar); Protokoll [CTRL-DLQ](../../05-umsetzung/nachweise/CTRL-DLQ.md). Läuft wegen der Dauer wöchentlich im Workflow `ops-weekly.yml`, nicht bei jedem Push.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog („transaktional eingereihter Job“) |
| 2.0 | 2026-10-23 | Lösungsneutral als Zuverlässigkeitsanforderung (Fallstudie FS-M5), Metrik und Messverfahren |
| 2.1 | 2026-10-23 | Review v0.2: R-24 Ziel „Ausfälle bis 30 min ohne Verlust“ statt offener Wiederholungsparameter, Dead-Letter-Übersicht, Messverfahren angepasst; Must-Begründung |
| 2.2 | 2026-10-26 | CTRL-DLQ mit Test und Protokoll belegt, wöchentlicher Workflow |
