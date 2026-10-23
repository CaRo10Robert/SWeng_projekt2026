---
id: REQ-DEMO-001
title: Demo-Daten auf Knopfdruck
type: operational
class: functional
status: implemented
owner: team-plattform
risk: low
release: R1
moscow: M
kano: n/a
epic: EPIC-00
source: BG-6, Risiko R-1
version: 1.1
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-DEMO-001]
---

# REQ-DEMO-001 Demo-Daten auf Knopfdruck
## Anforderung
Das System muss bei aktivierter Demo-Option eine leere Installation mit realistischen Daten befüllen: Institution mit Whitelist und Campus-Standorten, Kategorien, je mindestens ein Konto für Mitglied, Moderator und Administrator, rund 30 Anzeigen mit Bildern, Beispielkonversationen, eine offene Meldung und eine vom Wortfilter angehaltene Anzeige.

## Begründung
Vorführbarkeit (BG-6); eine leere Plattform wirkt nicht (Risiko R-1).

## Akzeptanzkriterien
```gherkin
Szenario: Frischer Start
  Angenommen die Datenbank ist leer und die Demo-Option ist aktiv
  Wenn das System startet
  Dann kann ich mich mit "lea@studmail.hwg-lu.de" anmelden
  Und die Suche zeigt etwa 30 Anzeigen mit Bildern
  Und die Moderations-Queue enthält mindestens zwei offene Fälle

Szenario: Kein doppelter Seed
  Angenommen es existieren bereits Konten
  Wenn das System erneut startet
  Dann werden keine Demo-Daten hinzugefügt
```

## Nachweis
- `AT-DEMO-001`: Smoke-Test – Login mit Demo-Konto, Suche liefert Anzeigen, Queue ≥ 2 Fälle (bestehend: „Moderations-Queue enthält Seed-Meldung und Wortfilter-Fall“).


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei mit Front Matter, Kano und Nachweis-IDs |
