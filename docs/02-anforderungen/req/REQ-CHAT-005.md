---
id: REQ-CHAT-005
title: Ungelesene Nachrichten erkennen
type: user-story
class: functional
status: implemented
owner: team-kommunikation
risk: low
release: R1
moscow: S
kano: leistung
epic: EPIC-04
source: Wettbewerbsanalyse
use_cases: [UC-21]
version: 1.2
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-CHAT-005]
---

# REQ-CHAT-005 Ungelesene Nachrichten erkennen

## Anforderung
Als Teilnehmer möchte ich ungelesene Nachrichten an einem Zähler erkennen und sehen, ob meine Nachrichten gelesen wurden, damit ich weiß, wo eine Antwort aussteht.

## Begründung
Ohne Hinweis gehen Anfragen unter; Lesestatus ist Messenger-Standard.

## Akzeptanzkriterien
```gherkin
Szenario: Zähler
  Angenommen Ben hat mir 2 Nachrichten geschickt, die ich nicht geöffnet habe
  Dann zeigt die Navigation "Nachrichten 2"
  Und die Konversation in der Liste zeigt 2 ungelesene

Szenario: Gelesen
  Wenn ich die Konversation öffne
  Dann sinkt mein Zähler auf 0
  Und Ben sieht bei seinen Nachrichten "gelesen"
```

Systemnachrichten und eigene Nachrichten zählen nicht als ungelesen.

## INVEST
I: unabhängig · N: Darstellung verhandelbar · V: Übersicht · E/S: klein · T: automatisierbar.

## Nachweis
- `AT-CHAT-005`: Smoke-Test – Ungelesen-Zähler; Lesestatus nach Öffnen (Lesestatus-Prüfung neu zu ergänzen).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei, Akzeptanzkriterien |
| 1.2 | 2026-10-23 | Review v0.2: formale Prüfung ohne inhaltliche Änderung |
