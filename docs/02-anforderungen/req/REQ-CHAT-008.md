---
id: REQ-CHAT-008
title: Bilder im Chat senden
type: user-story
class: functional
status: in-review
owner: team-kommunikation
risk: medium
release: R1
moscow: C
kano: begeisterung
epic: EPIC-04
source: Wettbewerbsanalyse
use_cases: [UC-21]
depends_on: [REQ-LST-003]
version: 1.1
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-CHAT-008]
---

# REQ-CHAT-008 Bilder im Chat senden

## Anforderung
Als Teilnehmer möchte ich Bilder im Chat senden (z. B. ein Detailfoto eines Mangels), damit Rückfragen zum Zustand schnell geklärt werden.

## Begründung
Spart Treffen, bei denen sich ein Mangel erst vor Ort zeigt.

## Akzeptanzkriterien
```gherkin
Szenario: Bild senden
  Angenommen ich bin Teilnehmer einer Konversation
  Wenn ich ein JPEG bis 10 MB sende
  Dann sieht mein Gegenüber das Bild im Verlauf
  Und das Bild enthält keine Metadaten (wie REQ-LST-003)

Szenario: Fremder Zugriff
  Wenn eine Person, die nicht Teilnehmer ist, das Bild abruft
  Dann erhält sie 404
```

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Keine Bilddatei | 415 |
| Gemeldetes Bild | Moderation sieht es nur im gemeldeten Kontext (REQ-PRIV-004) |

## INVEST
I: setzt Bildverarbeitung voraus · N: Anzahl pro Nachricht verhandelbar · V: weniger Fehlkäufe · E: mittel · S: ein Sprint · T: automatisierbar.

## Nachweis
- `AT-CHAT-008`: API-Test Bild senden und Zugriffsschutz (neu zu schreiben). Noch nicht umgesetzt (⬜).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei, Akzeptanzkriterien |
