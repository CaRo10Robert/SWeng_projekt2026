---
id: REQ-PRIV-006
title: Kein Tracking, keine Drittanbieter-Ressourcen
type: privacy
class: constraint
status: implemented
owner: team-produkt
risk: medium
release: R1
moscow: M
moscow_reason: [2]
kano: basis
review_due: 2027-04-23
epic: EPIC-07
source: TDDDG § 25, DSGVO Art. 25
version: 1.2
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-PRIV-006, AT-PRIV-006-2]
---

# REQ-PRIV-006 Kein Tracking, keine Drittanbieter-Ressourcen

## Anforderung
Das System darf keine Tracking- oder Werbetechnik einsetzen und keine Ressourcen von Drittanbietern laden (Schriften, Skripte, CDNs, Karten). Es werden ausschließlich technisch notwendige Cookies gesetzt (TDDDG § 25 Abs. 2); ein Cookie-Banner ist damit nicht erforderlich.

## Begründung
Kein Datenabfluss an Dritte; das Docker-Beispiel muss zudem offline funktionieren.

## Akzeptanzkriterien
| Prüfung | Erwartung |
|---|---|
| Browser-Durchlauf über Kernseiten | 0 Anfragen an fremde Hosts |
| Gesetzte Cookies | nur das Sitzungscookie |
| Sicherheitsrichtlinie der Seite | erlaubt Inhalte nur vom eigenen Ursprung |

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Neue Abhängigkeit lädt Schriften oder Skripte von fremden Servern | die Sicherheitsrichtlinie der Seite blockiert sie; der Browser-Test findet die Anfrage |
| Fehler- oder Analysedienst eines Drittanbieters soll eingebunden werden | unzulässig ohne neue Bewertung und Änderung dieser Anforderung |
| Zusätzliches Cookie durch eine Bibliothek | Browser-Test schlägt fehl |

## Nachweis
- `AT-PRIV-006`: neu zu schreiben – Browser-Test protokolliert alle Netzwerkanfragen über Anmelden, Suchen, Anzeige, Chat; keine fremde Domain, nur ein Cookie.
- `AT-PRIV-006-2`: neu zu schreiben – Smoke-Test prüft, dass die Content-Security-Policy nur den eigenen Ursprung erlaubt.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei, Prüftabelle |
| 1.2 | 2026-10-23 | Review v0.2: R-04 Fehler- und Missbrauchsfälle; R-16 review_due; R-15 moscow_reason |
