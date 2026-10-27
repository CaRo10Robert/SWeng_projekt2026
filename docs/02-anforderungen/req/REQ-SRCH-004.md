---
id: REQ-SRCH-004
title: Anzeigen merken
type: user-story
class: functional
status: verified
owner: team-marktplatz
risk: low
release: R1
moscow: S
kano: leistung
epic: EPIC-03
source: Wettbewerbsanalyse
use_cases: [UC-15]
version: 1.3
created: 2026-10-20
last_updated: 2026-10-24
verification: [AT-SRCH-004]
---

# REQ-SRCH-004 Anzeigen merken

## Anforderung
Als Mitglied möchte ich Anzeigen auf eine Merkliste setzen und diese Liste ansehen, damit ich interessante Angebote später wiederfinde.

## Begründung
Erhöht die Wiederkehr und die Abschlussquote; Standard bei Wettbewerbern.

## Akzeptanzkriterien
```gherkin
Szenario: Merken und Entfernen
  Angenommen eine fremde Anzeige ist aktiv
  Wenn ich sie merke
  Dann erscheint sie auf meiner Merkliste
  Und wenn ich sie wieder entferne, ist sie nicht mehr darauf

Szenario: Eigene Anzeige
  Wenn ich meine eigene Anzeige merken will
  Dann wird das nicht angeboten

Szenario: Nicht mehr verfügbare Anzeige
  Angenommen eine gemerkte Anzeige wird abgegeben, gelöscht oder ausgeblendet
  Wenn ich meine Merkliste öffne
  Dann erscheint sie dort nicht mehr
```

Merken ist idempotent (zweimal merken = einmal gemerkt).

## INVEST
I: unabhängig · N: Benachrichtigung bei Preisänderung (UC-15 optional) nicht Teil dieser Story · V: Wiederkehr · E/S: klein · T: automatisierbar.

## Nachweis
- `AT-SRCH-004`: API-Test – merken, Liste, entfernen, eigene Anzeige abgelehnt (neu).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei, Akzeptanzkriterien |
| 1.2 | 2026-10-23 | Review v0.2: formale Prüfung ohne inhaltliche Änderung |
| 1.3 | 2026-10-24 | Verifiziert im finalen Lauf gegen das Docker-Beispiel (AT-SRCH-004 bestanden bzw. ausgeführt); Status → verified |
