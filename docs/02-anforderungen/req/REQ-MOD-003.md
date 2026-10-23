---
id: REQ-MOD-003
title: Entscheidungen begründen und unveränderlich protokollieren
type: security
class: constraint
status: implemented
owner: team-vertrauen
risk: high
reviewers: [product-owner, security-lead]
release: R1
moscow: M
kano: basis
epic: EPIC-06
source: DSA Art. 17, BG-4
use_cases: [UC-32]
depends_on: [REQ-MOD-002]
version: 1.1
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-MOD-003, AT-MOD-003-2]
---

# REQ-MOD-003 Entscheidungen begründen und unveränderlich protokollieren
## Anforderung
Das System muss jede Moderationsentscheidung mit Begründung dem betroffenen Mitglied und allen meldenden Mitgliedern mitteilen und sie so protokollieren, dass sie nachträglich nicht verändert werden kann (wer, wann, welcher Fall, welche Entscheidung, welche Begründung).

## Begründung
DSA Art. 17 (Begründungspflicht) und Nachvollziehbarkeit bei Widerspruch (DSA Art. 20).

## Akzeptanzkriterien
| Bedingung | Erwartung |
|---|---|
| Entscheidung *entfernen*, *verwarnen* oder *sperren* | Mitteilung an Betroffene mit Entscheidung, Begründung und Widerspruchshinweis |
| Entscheidung *keine Maßnahme* zu einer Mitgliedermeldung | Mitteilung nur an die Meldenden |
| Entscheidung *keine Maßnahme* zu einem Wortfilter-Fall | Mitteilung an Betroffene (Freigabe) |
| jede Entscheidung | Protokolleintrag mit Akteur, Zeitpunkt, Fall und Begründung |
| Versuch, einen Protokolleintrag zu ändern | wird von der Datenhaltung abgewiesen |

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| E-Mail-System nicht erreichbar | Mitteilung wird nachgeholt (REQ-NOTI-005), Entscheidung bleibt gültig |
| Administrator versucht das Protokoll zu bereinigen | nicht möglich; Löschung nur über die Aufbewahrungsfrist (REQ-PRIV-003) |

## Nachweis
- `AT-MOD-003`: Smoke-Test – nach der Entscheidung enthält das Audit-Log `moderation.remove` (bestehend: „Audit-Log protokolliert Entscheidung“) und Mailpit die Mitteilung an Betroffene.
- `AT-MOD-003-2`: Integrationstest – Änderung eines Eintrags in Entscheidungs- und Audit-Protokoll schlägt fehl.


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei mit Front Matter, Kano und Nachweis-IDs |
