---
id: REQ-OPS-006
title: Wartungsmodus und Ankündigungen
type: operational
class: quality
status: approved
owner: team-plattform
risk: medium
reviewers: [qa-lead]
release: R1
moscow: S
kano: n/a
epic: EPIC-13
source: Guideline Kap. 11, Q-27
use_cases: [UC-44]
version: 1.0
created: 2026-10-24
last_updated: 2026-10-24
verification: [AT-OPS-006, AT-OPS-006-2]
---

# REQ-OPS-006 Wartungsmodus und Ankündigungen
## Anforderung
Der Betrieb muss das System in einen Wartungsmodus versetzen können, in dem alle Anfragen außer Gesundheitsprüfung, Statusseite und Rechtsseiten mit einer Wartungsseite beantwortet werden. Administratoren müssen eine Ankündigung (z. B. geplante Wartung) setzen können, die allen Besuchern als Banner angezeigt wird.

## Begründung
Wartungen ohne Ankündigung und mit kryptischen Fehlern schaden dem Vertrauen; Health-Endpunkte müssen für Orchestrierung und Monitoring erreichbar bleiben.

## Qualitätsmerkmal, Metrik, Messverfahren
| Feld | Festlegung |
|---|---|
| Qualitätsmerkmal (ISO 25010) | Reliability → Availability; Interaction Capability → Operability |
| Metrik | (1) Anteil der Anfragen im Wartungsmodus mit Status 503 und `Retry-After` (ohne Ausnahmen); (2) Erreichbarkeit der Ausnahmen; (3) Zeit, bis eine Ankündigung auf offenen Seiten erscheint |
| Akzeptanzkriterium | (1) **100 %**; (2) `/health/*`, `/status`, Rechtsseiten antworten normal; (3) **≤ 60 s** ohne Neuladen |
| Messverfahren | Smoke-Test mit `MAINTENANCE_MODE=true`; E2E-Test für das Banner |
| Messkontext | Docker-Beispiel |
| Verhalten bei Verfehlung | Fehler im Sprint beheben |

## Akzeptanzkriterien
```gherkin
Szenario: Ankündigung
  Angenommen ich bin Administrator
  Wenn ich die Ankündigung "Wartung am Samstag 8–10 Uhr" setze
  Dann sehen alle Besucher spätestens nach 60 Sekunden ein Banner mit diesem Text
  Und das Setzen steht im Audit-Log
```

## Nachweis
- `AT-OPS-006`: Smoke-Test – mit `MAINTENANCE_MODE=true` liefern Seiten und API 503 mit `Retry-After`, Health, Status und Rechtsseiten nicht.
- `AT-OPS-006-2`: Smoke-Test – Administrator setzt und entfernt eine Ankündigung (Mitglied 403), die Ankündigung ist öffentlich abrufbar, Audit-Log-Eintrag.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-24 | Erstfassung aus dem Abgleich Recht, Auftritt und Betrieb ([06-abgleich-recht-betrieb.md](../06-abgleich-recht-betrieb.md)); als Übung mit Platzhaltern freigegeben (Q-23) |
