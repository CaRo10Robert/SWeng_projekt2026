---
id: REQ-ARCH-004
title: Mandantenfähigkeit vorbereitet
type: architecture
class: domain
status: implemented
owner: team-plattform
risk: low
release: R1
moscow: S
kano: n/a
epic: EPIC-10
source: EPIC-10
version: 1.1
created: 2026-10-20
last_updated: 2026-10-23
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
- `MAN-ARCH-004`: Schema-Review der Migrationen.


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei mit Front Matter, Kano und Nachweis-IDs |
