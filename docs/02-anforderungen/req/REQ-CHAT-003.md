---
id: REQ-CHAT-003
title: Nachrichten in Echtzeit empfangen
type: user-story
class: functional
status: implemented
owner: team-kommunikation
risk: medium
release: R1
moscow: M
kano: leistung
epic: EPIC-04
source: BG-3
use_cases: [UC-21]
depends_on: [REQ-PERF-002]
version: 1.1
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-CHAT-003, AT-CHAT-003-2]
---

# REQ-CHAT-003 Nachrichten in Echtzeit empfangen

## Anforderung
Als Teilnehmer einer Konversation möchte ich neue Nachrichten erhalten, ohne die Seite neu zu laden, damit eine Absprache zügig wie in einem Messenger möglich ist. Ist keine Echtzeitverbindung möglich, aktualisiert sich die Ansicht spätestens alle 10 Sekunden.

## Begründung
Kurze Antwortzeiten führen zu mehr Abschlüssen (BG-3). Die Zielwerte stehen in REQ-PERF-002; Technik siehe ADR-0004.

## Akzeptanzkriterien
```gherkin
Szenario: Empfang ohne Neuladen
  Angenommen Lea hat die Konversation mit Ben geöffnet
  Wenn Ben eine Nachricht sendet
  Dann erscheint sie bei Lea ohne Neuladen
  Und der Ungelesen-Zähler im Kopfbereich aktualisiert sich

Szenario: Verbindung unterbrochen
  Angenommen Leas Echtzeitverbindung ist getrennt
  Wenn Ben eine Nachricht sendet
  Dann erscheint sie bei Lea spätestens nach 10 Sekunden
  Und Lea sieht einen Hinweis auf die eingeschränkte Verbindung
```

## INVEST
I: setzt REQ-CHAT-001 voraus · N: Hinweistext verhandelbar · V: zügige Absprache · E: mittel · S: ein Sprint · T: E2E-Test mit zwei Browsern.

## Nachweis
- `AT-CHAT-003`: Smoke-Test – Anbieter erhält die Nachricht in Echtzeit; zusätzlich Browser-Durchlauf mit zwei Konten.
- `AT-CHAT-003-2`: E2E-Test – bei getrennter Verbindung erscheint die Nachricht durch Aktualisierung (neu zu schreiben).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei, Degradationsverhalten als Akzeptanzkriterium |
