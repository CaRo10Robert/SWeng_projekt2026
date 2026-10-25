---
id: REQ-OPS-007
title: Öffentliche Statusseite
type: operational
class: quality
status: verified
owner: team-plattform
risk: low
release: R1
moscow: C
kano: leistung
epic: EPIC-13
source: Guideline Kap. 11, Q-27
depends_on: [REQ-OPS-001]
version: 1.2
created: 2026-10-24
last_updated: 2026-10-25
verification: [AT-OPS-007]
---

# REQ-OPS-007 Öffentliche Statusseite
## Anforderung
Das System muss unter `/status` ohne Anmeldung den Zustand der Dienste (Anwendung, Datenbank, E-Mail-Versand, Echtzeit) und aktuelle Ankündigungen anzeigen, ohne interne Details preiszugeben.

## Begründung
Bei Störungen fragen Nutzer sonst per E-Mail; eine Statusseite entlastet und schafft Transparenz.

## Qualitätsmerkmal, Metrik, Messverfahren
| Feld | Festlegung |
|---|---|
| Qualitätsmerkmal (ISO 25010) | Interaction Capability → Operability; Security → Confidentiality |
| Metrik | (1) Aktualität der Anzeige; (2) Anzahl interner Details in der Antwort (Versionen, Hostnamen, Fehlermeldungen, IPs) |
| Akzeptanzkriterium | (1) Stand **≤ 60 s** alt, mit Zeitpunkt; (2) **0** |
| Messverfahren | Smoke-Test der JSON-Antwort und der Seite |
| Messkontext | Docker-Beispiel |
| Verhalten bei Verfehlung | Could – Aufgabe im nächsten Sprint |

## Nachweis
- `AT-OPS-007`: Smoke-Test – `/status` (Seite) und die zugehörige API sind ohne Anmeldung erreichbar, zeigen je Dienst „in Betrieb“ bzw. „gestört“ mit Zeitpunkt und enthalten keine Versionen, Hostnamen oder Fehlertexte.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-24 | Erstfassung aus dem Abgleich Recht, Auftritt und Betrieb ([06-abgleich-recht-betrieb.md](../06-abgleich-recht-betrieb.md)); als Übung mit Platzhaltern freigegeben (Q-23) |
| 1.1 | 2026-10-25 | Review v1.3 (RV-R-11, RV-A-11, RV-A-19): Status nach Umsetzung; Bereiche app, database, email, realtime einheitlich; Prüfung dedupliziert und begrenzt |
| 1.2 | 2026-10-25 | Verifiziert im finalen Lauf gegen das Docker-Beispiel (AT-OPS-007 bestanden bzw. ausgeführt); Status → verified |
