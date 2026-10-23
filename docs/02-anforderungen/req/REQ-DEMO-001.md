---
id: REQ-DEMO-001
title: Demo-Daten auf Knopfdruck
type: operational
class: constraint
status: implemented
owner: team-plattform
risk: low
release: R1
moscow: M
moscow_reason: [1]
kano: n/a
epic: EPIC-00
source: BG-6, Risiko R-1
version: 1.2
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-DEMO-001]
---

# REQ-DEMO-001 Demo-Daten auf Knopfdruck
## Anforderung
Das System muss bei aktivierter Demo-Option eine leere Installation mit folgenden Daten befüllen:

| Datenart | Umfang |
|---|---|
| Institution | HWG LU mit Whitelist (`hwg-lu.de`, `studmail.hwg-lu.de`) und 3 Campus-Standorten |
| Kategorien | alle Kategorien des Katalogs (≥ 8) |
| Demo-Konten | **7**: mindestens 4 Mitglieder (Studierende und Beschäftigte), 1 Moderator, 1 Administrator, alle mit demselben dokumentierten Passwort |
| Anzeigen | **30** Anzeigen in **≥ 8** Kategorien, davon **≥ 25** mit Bild, Angebote und Gesuche, alle Preistypen |
| Konversationen | **3** Beispielkonversationen, davon eine mit Reservierung |
| Moderation | **1** offene Meldung durch ein Mitglied und **1** von der Inhaltsprüfung angehaltene Anzeige |

## Begründung
Vorführbarkeit (BG-6); eine leere Plattform wirkt nicht (Risiko R-1).

## Akzeptanzkriterien
```gherkin
Szenario: Frischer Start
  Angenommen die Datenbank ist leer und die Demo-Option ist aktiv
  Wenn das System startet
  Dann kann ich mich mit "lea@studmail.hwg-lu.de" anmelden
  Und die Suche zeigt 29 öffentlich sichtbare Anzeigen, davon mindestens 25 mit Bild
  Und die Moderations-Queue enthält genau zwei offene Fälle: eine Mitgliedermeldung und eine angehaltene Anzeige

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
| 1.2 | 2026-10-23 | Review v0.2: R-24 (feste Mengenangaben), R-15, R-17 (class constraint) |
