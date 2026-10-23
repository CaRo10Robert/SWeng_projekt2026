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
moscow_reason: [2]
kano: basis
epic: EPIC-06
source: DSA Art. 17, BG-4
use_cases: [UC-32]
depends_on: [REQ-MOD-002]
version: 2.0
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-MOD-003, AT-MOD-003-2]
---

# REQ-MOD-003 Entscheidungen begründen und unveränderlich protokollieren
## Anforderung
Das System muss jede Moderationsentscheidung mit Begründung den Beteiligten gemäß der Entscheidungstabelle (Akzeptanzkriterien) mitteilen – meldende Mitglieder immer, das betroffene Mitglied immer dann, wenn es belastet oder sein angehaltener Inhalt freigegeben wird – und sie so protokollieren, dass sie nachträglich nicht verändert werden kann (wer, wann, welcher Fall, welche Entscheidung, welche Begründung).

## Begründung
DSA Art. 17 (Begründungspflicht) und Nachvollziehbarkeit bei Widerspruch (DSA Art. 20). Der Widerspruch selbst läuft in R1 außerhalb des Systems per E-Mail (Entscheidungslog Q-15).

## Akzeptanzkriterien
| Fall | Entscheidung | Mitteilung an Betroffene | Mitteilung an Meldende | Protokoll |
|---|---|---|---|---|
| Meldung durch Mitglieder | *entfernen*, *verwarnen*, *sperren* | ja: Entscheidung, Begründung, Hinweis auf Widerspruch per E-Mail | ja: Entscheidung und Begründung | ja |
| Meldung durch Mitglieder | *keine Maßnahme* | nein (Betroffene wurden nicht belastet) | ja | ja |
| vom System angehaltener Inhalt (Inhaltsprüfung, REQ-LST-010) | *keine Maßnahme* (Freigabe) | ja: Inhalt ist veröffentlicht | – (keine Meldenden) | ja |
| vom System angehaltener Inhalt | *entfernen*, *verwarnen*, *sperren* | ja | – | ja |
| jede Entscheidung | – | – | – | Eintrag mit Akteur, Zeitpunkt, Fall, Entscheidung und Begründung |
| Versuch, einen Protokolleintrag zu ändern | – | – | – | wird von der Datenhaltung abgewiesen |

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
| 2.0 | 2026-10-23 | Review v0.2: R-08 (Entscheidungstabelle mit Betroffenen und Meldenden), R-15, R-16 |
