---
id: REQ-PRIV-004
title: Moderation sieht nur gemeldeten Chat-Kontext
type: privacy
class: constraint
status: implemented
owner: team-produkt
risk: high
reviewers: [product-owner, security-lead]
release: R1
moscow: M
kano: basis
epic: EPIC-06
source: DSGVO Art. 5 Abs. 1 c, Vertraulichkeit privater Kommunikation
use_cases: [UC-32]
depends_on: [REQ-MOD-002]
version: 1.1
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-PRIV-004]
---

# REQ-PRIV-004 Moderation sieht nur gemeldeten Chat-Kontext

## Anforderung
Moderatoren dürfen Chat-Inhalte **nur** sehen, wenn eine Nachricht gemeldet wurde, und dann nur die gemeldete Nachricht mit höchstens **5 Nachrichten davor und 5 danach**. Jeder Zugriff wird mit Person, Zeitpunkt und Fall unveränderlich protokolliert.

## Begründung
Private Kommunikation ist vertraulich; Moderation braucht Kontext, aber nicht den ganzen Verlauf.

## Akzeptanzkriterien
```gherkin
Szenario: Gemeldete Nachricht
  Angenommen in einer Konversation mit 30 Nachrichten wurde Nachricht 15 gemeldet
  Wenn ein Moderator den offenen Fall öffnet
  Dann sieht er höchstens die Nachrichten 10 bis 20
  Und im Audit-Log steht ein Eintrag "Nachrichtenkontext angesehen" mit Moderator und Fall

Szenario: Nicht gemeldete Konversation
  Wenn ein Moderator eine Konversation ohne Meldung abrufen will
  Dann gibt es dafür keine Funktion
```

## Nachweis
- `AT-PRIV-004`: neu zu schreiben – Meldung einer Nachricht in einer langen Konversation; Moderationsfall enthält höchstens 11 Nachrichten; Audit-Log enthält den Zugriff.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei, Szenarien |
