---
id: REQ-LST-011
title: Höchstens 30 aktive Anzeigen pro Mitglied
type: business-rule
class: functional
status: implemented
owner: team-marktplatz
risk: low
release: R1
moscow: S
kano: n/a
epic: EPIC-02
source: Abuse-Schutz
use_cases: [UC-10]
version: 1.2
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-LST-011]
---

# REQ-LST-011 Höchstens 30 aktive Anzeigen pro Mitglied

## Anforderung
Ein Mitglied **darf** höchstens **30** Anzeigen gleichzeitig in den Status in Prüfung, aktiv, pausiert oder reserviert haben. Weitere Anlagen werden mit einem Hinweis abgelehnt.

## Begründung
Schutz vor Spam und gewerblicher Nutzung; Privatpersonen am Campus erreichen das Limit nicht.

## Akzeptanzkriterien
| Anzahl gezählter Anzeigen | Neue Anzeige |
|---|---|
| 29 | ✅ |
| 30 | ❌ 422 „Du kannst höchstens 30 aktive Anzeigen haben.“ |
| 30, davon eine abgegeben oder abgelaufen | ✅ (zählt nicht) |
| 29, zwei gleichzeitige Anlagen | genau eine erfolgreich |

## Nachweis
- `AT-LST-011`: API-Test – 31. Anzeige wird abgelehnt, auch bei gleichzeitigen Anfragen (neu).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei, gezählte Status und Nebenläufigkeit präzisiert |
| 1.2 | 2026-10-23 | Review v0.2: formale Prüfung ohne inhaltliche Änderung |
