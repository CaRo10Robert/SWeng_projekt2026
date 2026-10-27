---
id: REQ-AVAIL-002
title: Wiederherstellungsziele der Datenhaltung
type: operational
class: quality
status: approved
owner: team-plattform
risk: medium
reviewers: [qa-lead]
release: R1
moscow: W
kano: n/a
epic: EPIC-12
source: Guideline Kap. 01
version: 2.4
created: 2026-10-20
last_updated: 2026-10-26
verification: [MAN-AVAIL-002]
---

# REQ-AVAIL-002 Wiederherstellungsziele der Datenhaltung
## Anforderung
Im Echtbetrieb müssen Datenverluste und Ausfallzeiten nach einem Datenbankausfall begrenzt sein.

**N/A im Docker-Beispiel → EPIC-12.** Das Docker-Beispiel hat eigene, schwächere Ziele (RTO ≤ 15 min, RPO ≤ 24 h) mit getesteter Sicherung und Wiederherstellung, siehe REQ-AVAIL-003. Ein RPO von 1 h braucht Point-in-Time-Recovery, die erst mit einem Echtbetrieb kommt.

## Begründung
Guideline Kap. 01: RTO und RPO sind für zustandsbehaftete Dienste Pflicht; im Projekt ohne Betrieb nicht anwendbar.

## Qualitätsmerkmal, Metrik, Messverfahren
| Feld | Festlegung |
|---|---|
| Qualitätsmerkmal (ISO 25010) | Reliability → Recoverability |
| Metrik | Recovery Point Objective (RPO) und Recovery Time Objective (RTO) |
| Akzeptanzkriterium | **RPO ≤ 1 h**, **RTO ≤ 4 h** |
| Messverfahren | Halbjährliche Restore-Übung aus Backup mit Point-in-Time-Recovery |
| Messkontext | Echtbetrieb (EPIC-12) |
| Verhalten bei Verfehlung | Incident mit Nachbereitung, Anpassung des Backup-Konzepts |
| Fehlerbudget | kein Datenverlust über das RPO hinaus |
| Last- und Datenprofil | produktiver Datenbestand; Übung mit einer Kopie in einer getrennten Umgebung |
| Timeout, Retry, Idempotenz | Wiederherstellung ist wiederholbar; Löschjournal ist idempotent (REQ-AVAIL-003) |
| Wiederherstellung | RTO ≤ 4 h, RPO ≤ 1 h; Auslöser: Datenverlust oder defekter Datenträger, Entscheidung durch den Incident-Lead |
| Verantwortung und Eskalation | Service-Owner team-plattform; Eskalation über den Incident-Prozess (`docs/07-betrieb/incident-prozess.md`), Rufbereitschaft im Echtbetrieb (fiktiv) |

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Datenbank-Datenträger defekt | Wiederherstellung aus der letzten Sicherung; im Echtbetrieb PITR für das RPO-Ziel (EPIC-12) |
| Sicherung beschädigt oder unvollständig | Prüfsummen im Manifest; Wiederherstellung bricht vor jeder Änderung ab |
| Wiederherstellung scheitert mittendrin | Einspielen in eine temporäre Datenbank und Tausch erst nach Erfolg; der alte Stand bleibt erhalten (ADR-0018) |
| Sicherung fehlt (Job läuft nicht) | Alarm `BackupMissing` nach 26 h |
| Gelöschte Daten kommen mit einer älteren Sicherung zurück | Löschjournal wird nach der Wiederherstellung erneut angewendet (REQ-AVAIL-003) |

## Nachweis
- `MAN-AVAIL-002`: Protokoll der Restore-Übung – im Docker-Beispiel als Übung durchgeführt: [MAN-AVAIL-002](../../05-umsetzung/nachweise/MAN-AVAIL-002.md). RTO gemessen 26 s (Restore-Skript 12,7 s) – erfüllt; das RPO dieser Anforderung ist mit der täglichen Sicherung des Beispiels **nicht** erreichbar und braucht im Echtbetrieb PITR bzw. WAL-Archivierung (EPIC-12).


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 2.0 | 2026-10-23 | Merkmal/Metrik/Messverfahren ergänzt; als N/A für das Beispiel markiert |
| 2.1 | 2026-10-23 | Review v0.2: Status nach Review |
| 2.2 | 2026-10-26 | Restore-Übung als Protokoll verlinkt: RTO erfüllt, RPO im Beispiel nicht erreichbar |
| 2.3 | 2026-10-26 | Guideline-Review: GL-05 Fehler- und Missbrauchsfälle ergänzt |
| 2.4 | 2026-10-26 | Guideline-Review: GL-04 N/A-Begründung an REQ-AVAIL-003 angepasst; GL-10 Felder aus der NFR-/SLO-Vorlage ergänzt (Fehlerbudget, Lastprofil, Timeout/Retry, Wiederherstellung, Eskalation) |
