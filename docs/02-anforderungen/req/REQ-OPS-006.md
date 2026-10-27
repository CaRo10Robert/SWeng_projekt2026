---
id: REQ-OPS-006
title: Wartungsmodus und Ankündigungen
type: operational
class: quality
status: verified
owner: team-plattform
risk: medium
reviewers: [qa-lead]
release: R1
moscow: S
kano: n/a
epic: EPIC-13
source: Guideline Kap. 11, Q-27
use_cases: [UC-44]
version: 1.4
created: 2026-10-24
last_updated: 2026-10-26
verification: [AT-OPS-006, AT-OPS-006-2]
---

# REQ-OPS-006 Wartungsmodus und Ankündigungen
## Anforderung
Der Betrieb muss das System in einen Wartungsmodus versetzen können, in dem alle Anfragen außer den Ausnahmen mit einer Wartungsseite (HTML) bzw. 503 `maintenance` mit `Retry-After` (API) beantwortet werden. Ausnahmen: Gesundheitsprüfung (`/health/*`), Metriken, Statusseite und Status-API, `robots.txt` und `/.well-known/`, statische Dateien der App, Rechtsseiten, Anmeldung und Abmeldung, `GET /meta` und `GET /me` sowie **alle Anfragen von Administratoren**, damit sie den Modus wieder ausschalten können. Der Modus lässt sich über `MAINTENANCE_MODE=true` (Neustart nötig) oder als weicher Modus über die Admin-Oberfläche (`platform.setting`) schalten. Administratoren müssen eine Ankündigung (z. B. geplante Wartung) setzen können, die allen Besuchern als Banner angezeigt wird.

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
| Fehlerbudget | angekündigte Wartung zählt nicht gegen das Verfügbarkeitsbudget aus REQ-AVAIL-001 |
| Last- und Datenprofil | nicht anwendbar |
| Timeout, Retry, Idempotenz | `Retry-After` 60 s bis 1 Tag; Clients wiederholen erst danach; Ein- und Ausschalten ist idempotent |
| Wiederherstellung | Ausschalten des Wartungsmodus stellt den Normalbetrieb ohne Neustart her |
| Verantwortung und Eskalation | Service-Owner team-plattform; Eskalation über den Incident-Prozess (`docs/07-betrieb/incident-prozess.md`), Rufbereitschaft im Echtbetrieb (fiktiv) |

## Akzeptanzkriterien
```gherkin
Szenario: Ankündigung
  Angenommen ich bin Administrator
  Wenn ich die Ankündigung "Wartung am Samstag 8–10 Uhr" setze
  Dann sehen alle Besucher spätestens nach 60 Sekunden ein Banner mit diesem Text
  Und das Setzen steht im Audit-Log
```

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Datenbank beim Lesen der Einstellung nicht erreichbar | letzter bekannter Zustand bleibt 5 s gültig, danach normaler Betrieb mit Fehlern laut REQ-OPS-001 |
| Wartungsmodus per Umgebungsvariable aktiv | Abschalten über die Admin-Oberfläche nicht möglich (422 `maintenance_env`); Hinweis in der Oberfläche |
| Umgehungsversuche über Pfade | Ausnahmeliste prüft normalisierte Pfade; Varianten mit `;`, `#`, `?`, `//` liefern 503 bzw. 404 |
| Unplausibles `Retry-After` | auf 60 s bis 1 Tag begrenzt |
| Unberechtigtes Umschalten | nur Administration; jeder Wechsel im Audit-Log |
| Ankündigung mit Schadcode | Text ohne HTML, Länge begrenzt, Darstellung escaped |

## Nachweis
- `AT-OPS-006`: Smoke-Test – mit `MAINTENANCE_MODE=true` liefern Seiten und API 503 mit `Retry-After`, Health, Status und Rechtsseiten nicht.
- `AT-OPS-006-2`: Smoke-Test – Administrator setzt und entfernt eine Ankündigung (Mitglied 403), die Ankündigung ist öffentlich abrufbar, Audit-Log-Eintrag.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-24 | Erstfassung aus dem Abgleich Recht, Auftritt und Betrieb ([06-abgleich-recht-betrieb.md](../06-abgleich-recht-betrieb.md)); als Übung mit Platzhaltern freigegeben (Q-23) |
| 1.1 | 2026-10-25 | Review v1.3 (RV-R-14): Ausnahmen vollständig inkl. Administratoren, beide Schaltwege; Status nach Umsetzung |
| 1.2 | 2026-10-25 | Verifiziert im finalen Lauf gegen das Docker-Beispiel (AT-OPS-006, AT-OPS-006-2 bestanden bzw. ausgeführt); Status → verified |
| 1.3 | 2026-10-26 | Guideline-Review: GL-05 Fehler- und Missbrauchsfälle ergänzt |
| 1.4 | 2026-10-26 | Guideline-Review: GL-10 Felder aus der NFR-/SLO-Vorlage ergänzt (Fehlerbudget, Lastprofil, Timeout/Retry, Wiederherstellung, Eskalation) |
