---
id: REQ-DEMO-002
title: Zeitgesteuerte Abläufe sofort auslösen
type: user-story
class: functional
status: implemented
owner: team-plattform
risk: low
release: R1
moscow: S
kano: n/a
epic: EPIC-00
source: BG-6
use_cases: [UC-07, UC-17]
version: 1.2
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-DEMO-002]
---

# REQ-DEMO-002 Zeitgesteuerte Abläufe sofort auslösen
## Anforderung
Als Administrator möchte ich im Demo-Modus fällige zeitgesteuerte Abläufe (Ablauf-Erinnerungen, Ablauf von Anzeigen, Löschfristen) sofort auslösen, damit ich sie in einer Vorführung zeigen kann, ohne Tage zu warten.

## Begründung
Vorführbarkeit zeitgesteuerter Anforderungen (REQ-LST-008, REQ-ACC-002).

## Akzeptanzkriterien
```gherkin
Szenario: Auslösen im Demo-Modus
  Angenommen der Demo-Modus ist aktiv und eine Anzeige läuft in 6 Tagen ab
  Wenn ich "Fällige Jobs jetzt ausführen" wähle
  Dann erhält der Anbieter die Ablauf-Erinnerung
  Und das Audit-Log enthält die Auslösung

Szenario: Außerhalb des Demo-Modus
  Angenommen der Demo-Modus ist nicht aktiv
  Dann ist die Funktion nicht verfügbar
```

## INVEST
I · N · V: Vorführbarkeit · E: klein · S · T: automatisierbar.

## Nachweis
- `AT-DEMO-002`: Smoke-Test – Auslösen liefert 202 und erzeugt die Erinnerungsmail in Mailpit (neu zu schreiben).


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei mit Front Matter, Kano und Nachweis-IDs |
| 1.2 | 2026-10-23 | Review v0.2: keine inhaltliche Änderung |
