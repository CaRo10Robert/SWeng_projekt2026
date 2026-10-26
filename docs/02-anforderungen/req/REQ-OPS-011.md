---
id: REQ-OPS-011
title: Betriebshandbuch, Störungs- und Notfallprozess
type: operational
class: constraint
status: implemented
owner: team-plattform
risk: medium
release: R1
moscow: M
moscow_reason: [3]
kano: n/a
epic: EPIC-13
source: Guideline Kap. 11, Q-23
depends_on: [REQ-OPS-003]
version: 1.3
created: 2026-10-24
last_updated: 2026-10-26
verification: [CTRL-DOC-BETRIEB, MAN-OPS-011]
---

# REQ-OPS-011 Betriebshandbuch, Störungs- und Notfallprozess
## Anforderung
Es muss ein Betriebshandbuch mit Störungs- und Notfallprozess vorliegen, das eine Person ohne Projektwissen befähigt, das System zu betreiben, eine Störung zu bearbeiten und eine Version zurückzurollen.

## Begründung
REQ-OPS-003 deckt den Schnellstart ab, nicht den laufenden Betrieb. Ohne Prozess hängen Störungen an einzelnen Personen.

## Akzeptanzkriterien
`docs/07-betrieb/` enthält:
- Betriebshandbuch: Start, Stopp, Update, Rollback, Konfiguration und Geheimnisse (Rotation), Datensicherung (REQ-AVAIL-003), Wartungsmodus (REQ-OPS-006), Alarme mit Runbooks (REQ-OPS-008), Sicherheitsmeldungen (REQ-SEC-012), Kontakte (fiktive Übungswerte, Q-28).
- Störungsprozess: Schweregrade (S1–S4) mit Reaktionszeiten, Rollen (Incident-Lead, Kommunikation), Kommunikation über Statusseite und Ankündigung, Übergang in den Datenpannen-Prozess (REQ-LEGAL-013), Nachbetrachtung (Vorlage ohne Schuldzuweisung).
- Go-live-Checkliste mit allen Voraussetzungen eines Echtbetriebs (u. a. keine Platzhalter mehr, Penetrationstest, AVV, Backups).

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Runbook veraltet nach Änderung | Definition of Done: betriebsrelevante Änderungen aktualisieren das Handbuch |
| Geheimnis kompromittiert | Rotationsablauf im Handbuch, danach Datenpannen-Prozess prüfen |

## Nachweis
- `CTRL-DOC-BETRIEB`: Kontrolle `docs/07-betrieb/` – Betriebshandbuch, Störungsprozess und Prozess für Sicherheitsmeldungen vorhanden.
- `MAN-OPS-011`: Protokoll einer Störungsübung (z. B. Datenbank gestoppt) nach dem Handbuch – [MAN-OPS-011](../../05-umsetzung/nachweise/MAN-OPS-011.md): Störung nach 3 min 32 s behoben. Der Code-Befund B-1 (App-Absturz bei Datenbankausfall) ist behoben und durch AT-OPS-001-3 abgesichert; die Handbuch-Befunde H-1 bis H-4 sind im Betriebshandbuch und im Störungsprozess eingearbeitet (Schweregrade S1–S4 mit Reaktionszeiten, Runbook „Datenbank nicht erreichbar“, Ausweichkanal).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-24 | Erstfassung aus dem Abgleich Recht, Auftritt und Betrieb ([06-abgleich-recht-betrieb.md](../06-abgleich-recht-betrieb.md)); als Übung mit Platzhaltern freigegeben (Q-23) |
| 1.1 | 2026-10-25 | Review v1.3 (RV-R-11, RV-A-10): Status nach Umsetzung; Betriebshandbuch und Go-live-Checkliste vervollständigt |
| 1.2 | 2026-10-25 | Q-28: Platzhalter durch fiktive Übungswerte und offene Prüfpunkte durch Übungsannahmen ersetzt |
| 1.3 | 2026-10-26 | Nachweis MAN-OPS-011 mit Protokoll verlinkt; B-1 behoben, H-1…H-4 eingearbeitet |
