---
id: REQ-OPS-005
title: Automatische, idempotente Datenbankmigration
type: operational
class: quality
status: implemented
owner: team-plattform
risk: medium
release: R1
moscow: M
kano: n/a
epic: EPIC-00
source: Guideline Kap. 05
version: 2.0
created: 2026-10-20
last_updated: 2026-10-23
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

## Nachweis
- `AT-OPS-005`: Neustart-Test – zweiter Start meldet keine neue Migration und wird gesund (Grundlage: Frischstart-Zyklen; als Skript neu zu schreiben).


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 2.0 | 2026-10-23 | Merkmal/Metrik/Akzeptanzkriterium/Messverfahren getrennt (Fallstudie FS-M3) |
