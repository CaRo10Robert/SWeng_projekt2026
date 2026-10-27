---
id: REQ-OPS-005
title: Automatische, idempotente Datenbankmigration
type: operational
class: quality
status: implemented
owner: team-plattform
risk: medium
reviewers: [qa-lead]
release: R1
moscow: M
moscow_reason: [3]
kano: n/a
epic: EPIC-00
source: Guideline Kap. 05
version: 2.2
created: 2026-10-20
last_updated: 2026-10-26
verification: [AT-OPS-005]
---

# REQ-OPS-005 Automatische, idempotente Datenbankmigration
## Anforderung
Das Datenbankschema muss beim Start automatisch auf den aktuellen Stand gebracht werden; wiederholte oder gleichzeitige Starts dürfen nichts doppelt anwenden.

## Begründung
Ein-Befehl-Start des Beispiels (BG-6) und sichere Mehrfachstarts.

## Qualitätsmerkmal, Metrik, Messverfahren
| Feld | Festlegung |
|---|---|
| Qualitätsmerkmal (ISO 25010) | Reliability → Fault Tolerance; Flexibility → Installability |
| Metrik | Anzahl Fehler oder doppelt angewendeter Migrationen bei zweimaligem bzw. parallelem Start |
| Akzeptanzkriterium | **0** |
| Messverfahren | Container zweimal starten bzw. zwei Instanzen parallel starten und das Migrationsprotokoll prüfen |
| Messkontext | Docker-Beispiel, leere und bereits migrierte Datenbank |
| Verhalten bei Verfehlung | Start bricht mit Fehlermeldung ab, keine Teilmigration |

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Zwei Instanzen starten gleichzeitig | Advisory-Lock: nur eine migriert, die andere wartet und findet danach nichts mehr zu tun |
| Migration schlägt fehl | Transaktion je Migration; Start bricht mit Fehlermeldung ab, keine Teilmigration |
| Datenbank neuer als der Code (Rollback auf ältere Version) | wird beim Start **nicht** erkannt: unbekannte Einträge in `schema_migrations` werden ignoriert (offener Punkt, Prüfung beim Start nachrüsten). Die Wiederherstellung prüft den Fall (REQ-AVAIL-003) |
| Datenbank während der Migration nicht erreichbar | Start scheitert, Container wird neu gestartet; Lock wird mit der Verbindung freigegeben |
| Rückwärts inkompatible Änderung | nur additive Migrationen; destruktive Änderungen in zwei Schritten über zwei Releases |

## Nachweis
- `AT-OPS-005`: Neustart-Test – zweiter Start meldet keine neue Migration und wird gesund (Grundlage: Frischstart-Zyklen; als Skript neu zu schreiben).


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 2.0 | 2026-10-23 | Merkmal/Metrik/Akzeptanzkriterium/Messverfahren getrennt (Fallstudie FS-M3) |
| 2.1 | 2026-10-23 | Review v0.2: R-15 |
| 2.2 | 2026-10-26 | Guideline-Review: GL-05 Fehler- und Missbrauchsfälle ergänzt |
