---
id: REQ-OPS-011
title: Betriebshandbuch, Störungs- und Notfallprozess
type: operational
class: constraint
status: approved
owner: team-plattform
risk: medium
release: R1
moscow: M
moscow_reason: [3]
kano: n/a
epic: EPIC-13
source: Guideline Kap. 11, Q-23
depends_on: [REQ-OPS-003]
version: 1.0
created: 2026-10-24
last_updated: 2026-10-24
verification: [CTRL-DOC-BETRIEB, MAN-OPS-011]
---

# REQ-OPS-011 Betriebshandbuch, Störungs- und Notfallprozess
## Anforderung
Es muss ein Betriebshandbuch mit Störungs- und Notfallprozess vorliegen, das eine Person ohne Projektwissen befähigt, das System zu betreiben, eine Störung zu bearbeiten und eine Version zurückzurollen.

## Begründung
REQ-OPS-003 deckt den Schnellstart ab, nicht den laufenden Betrieb. Ohne Prozess hängen Störungen an einzelnen Personen.

## Akzeptanzkriterien
`docs/07-betrieb/` enthält:
- Betriebshandbuch: Start, Stopp, Update, Rollback, Konfiguration und Geheimnisse (Rotation), Datensicherung (REQ-AVAIL-003), Wartungsmodus (REQ-OPS-006), Alarme mit Runbooks (REQ-OPS-008), Sicherheitsmeldungen (REQ-SEC-012), Kontakte `[Platzhalter]`.
- Störungsprozess: Schweregrade (S1–S4) mit Reaktionszeiten, Rollen (Incident-Lead, Kommunikation), Kommunikation über Statusseite und Ankündigung, Übergang in den Datenpannen-Prozess (REQ-LEGAL-013), Nachbetrachtung (Vorlage ohne Schuldzuweisung).
- Go-live-Checkliste mit allen Voraussetzungen eines Echtbetriebs (u. a. keine Platzhalter mehr, Penetrationstest, AVV, Backups).

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Runbook veraltet nach Änderung | Definition of Done: betriebsrelevante Änderungen aktualisieren das Handbuch |
| Geheimnis kompromittiert | Rotationsablauf im Handbuch, danach Datenpannen-Prozess prüfen |

## Nachweis
- `CTRL-DOC-BETRIEB`: Kontrolle `docs/07-betrieb/` – Betriebshandbuch, Störungsprozess und Prozess für Sicherheitsmeldungen vorhanden.
- `MAN-OPS-011`: Protokoll einer Störungsübung (z. B. Datenbank gestoppt) nach dem Handbuch.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-24 | Erstfassung aus dem Abgleich Recht, Auftritt und Betrieb ([06-abgleich-recht-betrieb.md](../06-abgleich-recht-betrieb.md)); als Übung mit Platzhaltern freigegeben (Q-23) |
