---
id: REQ-SRCH-005
title: Suchaufträge mit täglicher E-Mail
type: user-story
class: functional
status: in-review
owner: team-marktplatz
risk: low
release: R1
moscow: C
kano: begeisterung
epic: EPIC-03
source: Wettbewerbsanalyse
use_cases: [UC-16]
depends_on: [REQ-SRCH-002, REQ-NOTI-003]
version: 1.1
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-SRCH-005]
---

# REQ-SRCH-005 Suchaufträge mit täglicher E-Mail

## Anforderung
Als Mitglied möchte ich eine Suche mit ihren Filtern als **Suchauftrag** speichern und **einmal täglich** per E-Mail über neue Treffer informiert werden, damit ich kein passendes Angebot verpasse. Höchstens **10** Suchaufträge pro Mitglied.

## Begründung
Gesuche nach Lehrbüchern sind zeitkritisch zum Semesterstart (Begeisterungsmerkmal).

## Akzeptanzkriterien
```gherkin
Szenario: Täglicher Digest
  Angenommen ich habe den Suchauftrag "Statistik" gespeichert
  Und seit dem letzten Digest wurden 2 passende Anzeigen veröffentlicht
  Wenn der tägliche Versand läuft
  Dann erhalte ich genau eine E-Mail mit 2 Treffern

Szenario: Keine neuen Treffer
  Wenn es keine neuen Treffer gibt
  Dann erhalte ich keine E-Mail

Szenario: Limit
  Angenommen ich habe 10 Suchaufträge
  Wenn ich einen weiteren speichern will
  Dann wird das mit Hinweis auf das Limit abgelehnt
```

Die E-Mail ist abbestellbar (REQ-NOTI-003) und erfordert eine gesonderte Einwilligung (REQ-PRIV-001).

## INVEST
I: setzt Filter voraus · N: Takt verhandelbar · V: verpasst keine Angebote · E: mittel · S: ein Sprint · T: Szenario-Test mit Zeitsteuerung.

## Nachweis
- `AT-SRCH-005`: Szenario-Test des täglichen Digests (neu zu schreiben). Noch nicht umgesetzt (⬜).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei, Akzeptanzkriterien |
