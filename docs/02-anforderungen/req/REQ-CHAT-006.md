---
id: REQ-CHAT-006
title: Sicherheitshinweis bei Links, IBAN und Telefonnummern
type: security
class: functional
status: implemented
owner: team-kommunikation
risk: low
release: R1
moscow: S
kano: basis
epic: EPIC-06
source: Wettbewerbsanalyse (Betrugsmuster Vorkasse, Phishing)
use_cases: [UC-21]
version: 1.1
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-CHAT-006]
---

# REQ-CHAT-006 Sicherheitshinweis bei Links, IBAN und Telefonnummern

## Anforderung
Das System **soll** bei Nachrichten, die externe Links, IBAN oder Telefonnummern enthalten, beiden Teilnehmern einen Sicherheitshinweis anzeigen. Die Nachricht wird nicht blockiert.

## Begründung
Vorkasse-Betrug und Phishing-Links sind die häufigsten Betrugsmuster auf Kleinanzeigen-Plattformen.

## Akzeptanzkriterien
| Nachricht | Hinweis |
|---|---|
| „Schau mal: https://example.com/deal“ | ja |
| „www.irgendwas.de“ | ja |
| „Überweis auf DE89 3704 0044 0532 0130 00“ | ja |
| „Ruf an: 0621 1234567“ / „+49 170 1234567“ | ja |
| „Ist das Buch noch da?“ | nein |
| „Treffen um 12:30 in Raum A 1.05?“ | nein |
| „Preis 15 €, 2. Auflage von 2019“ | nein |

## Nachweis
- `AT-CHAT-006`: Unit-Test der Erkennung (Entscheidungstabelle).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei, Entscheidungstabelle |
