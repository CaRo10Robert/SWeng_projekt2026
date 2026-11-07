---
id: REQ-OPS-005
title: Automatische, idempotente Datenbankmigration
type: operational
class: quality
status: verified
owner: team-plattform
risk: medium
reviewers: [qa-lead]
release: R1
moscow: M
moscow_reason: [3]
kano: n/a
epic: EPIC-00
source: Guideline Kap. 05
version: 2.3
created: 2026-10-20
last_updated: 2026-11-07
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
| Datenbank neuer als der Code (Rollback auf ältere Version) | Start bricht mit klarer Meldung ab, wenn `schema_migrations` Einträge enthält, die der Code nicht kennt (`unknownMigrations` in `platform/migrate.ts`, Unit-Test `migrate.test.ts`); Abhilfe: passendes Image oder Sicherung mit passendem Stand (REQ-AVAIL-003) |
| Datenbank während der Migration nicht erreichbar | Start scheitert, Container wird neu gestartet; Lock wird mit der Verbindung freigegeben |
| Rückwärts inkompatible Änderung | nur additive Migrationen; destruktive Änderungen in zwei Schritten über zwei Releases |

## Nachweis
- `AT-OPS-005`: Integrationstest (`privacy.integration.test.ts`) – ein zweiter Migrationslauf wendet nichts neu an und die Datenbank bleibt bereit. Den Neustart des ganzen Stacks prüft zusätzlich der Restore-Test (AT-AVAIL-003).


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 2.0 | 2026-10-23 | Merkmal/Metrik/Akzeptanzkriterium/Messverfahren getrennt (Fallstudie FS-M3) |
| 2.1 | 2026-10-23 | Review v0.2: R-15 |
| 2.2 | 2026-10-26 | Guideline-Review: GL-05 Fehler- und Missbrauchsfälle ergänzt |
| 2.3 | 2026-11-07 | Nachweis AT-OPS-005 als Integrationstest umgesetzt und grün (Testbericht 2026-11-07); Fehlerfall „Datenbank neuer als der Code“ ist umgesetzt (Startabbruch); Status → verified |
