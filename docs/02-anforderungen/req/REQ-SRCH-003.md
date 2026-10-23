---
id: REQ-SRCH-003
title: Aktualität der Suche
type: quality
class: quality
status: implemented
owner: team-marktplatz
risk: low
reviewers: [qa-lead]
release: R1
moscow: S
kano: leistung
epic: EPIC-03
source: BG-2
use_cases: [UC-10, UC-13]
version: 1.2
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-SRCH-003, AT-SRCH-003-2]
---

# REQ-SRCH-003 Aktualität der Suche

## Anforderung
Neue oder geänderte Anzeigen müssen kurzfristig in der Suche erscheinen; nicht mehr sichtbare Anzeigen (pausiert, abgegeben, gelöscht, in Prüfung) müssen ebenso schnell verschwinden.

## Begründung
Mitglieder prüfen nach dem Einstellen, ob ihre Anzeige gefunden wird. Verzögerung erzeugt Doppelanlagen.

## Qualitätsmerkmal, Metrik, Messverfahren
| Feld | Festlegung |
|---|---|
| Qualitätsmerkmal (ISO 25010) | Functional Suitability → Functional Correctness (Aktualität) |
| Metrik | Zeit von der erfolgreichen Antwort auf Anlage, Änderung oder Statuswechsel bis zum ersten Suchergebnis, das den neuen Stand enthält (Treffer erscheint bzw. verschwindet) |
| Akzeptanzkriterium | **≤ 10 s** in 100 % der Messungen |
| Messverfahren | API-Test: (a) Anzeige anlegen, dann im Abstand von 500 ms suchen, bis der Treffer erscheint; (b) dieselbe Anzeige pausieren, dann im Abstand von 500 ms suchen, bis sie **nicht mehr gefunden** wird; beide Zeiten ≤ 10 s |
| Messkontext | Docker-Beispiel mit Seed-Daten, ohne Last |

## Nachweis
- `AT-SRCH-003`: Smoke-Test – neu angelegte Anzeige wird unmittelbar gefunden.
- `AT-SRCH-003-2`: Smoke-Test – pausierte Anzeige wird ≤ 10 s danach nicht mehr gefunden (neu).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei, Metrik und Messverfahren; Verschwinden nicht sichtbarer Anzeigen ergänzt |
| 1.2 | 2026-10-23 | Review v0.2: R-24 Messverfahren um „Pausieren → nicht mehr gefunden ≤ 10 s“ ergänzt |
