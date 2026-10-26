---
id: REQ-ARCH-004
title: Mandantenfähigkeit vorbereitet
type: architecture
class: constraint
status: implemented
owner: team-plattform
risk: low
release: R1
moscow: S
kano: n/a
epic: EPIC-10
source: EPIC-10
version: 1.3
created: 2026-10-20
last_updated: 2026-10-26
verification: [MAN-ARCH-004]
---

# REQ-ARCH-004 Mandantenfähigkeit vorbereitet
## Anforderung
Jedes Mitglied und jede Anzeige muss einer Institution zugeordnet sein. Im MVP gibt es genau eine Institution (HWG LU).

## Begründung
Spätere Öffnung für weitere Hochschulen ohne Datenmigration (EPIC-10).

## Konformitätsprüfung
| Prüfung | Kriterium |
|---|---|
| Schema-Review | Institutionsbezug als Pflichtfeld bei Mitglied, Anzeige und Campus-Standort |
| Suche | Suchergebnisse sind auf die Institution des Mitglieds beschränkt |

## Nachweis
- `MAN-ARCH-004`: Schema-Review der Migrationen – [MAN-ARCH-004](../../05-umsetzung/nachweise/MAN-ARCH-004.md). Die Index-Befunde S-1 bis S-6 und S-4 (Zustimmungsnachweise ohne Profilbezug) sind mit Migration `0005_nachweise_korrekturen.sql` behoben; S-9 (Institutionsprüfung bei `GET /listings/:id`) ist vor EPIC-10 einzuplanen.


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei mit Front Matter, Kano und Nachweis-IDs |
| 1.2 | 2026-10-23 | Review v0.2: R-17 (class constraint) |
| 1.3 | 2026-10-26 | Nachweis MAN-ARCH-004 verlinkt; Migration 0005 |
