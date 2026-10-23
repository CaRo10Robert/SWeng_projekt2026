---
id: REQ-ARCH-002
title: Keine Verwahrung von Kundengeldern
type: architecture
class: constraint
status: in-review
owner: team-plattform
risk: high
reviewers: [product-owner, architecture-lead]
release: EPIC-09
moscow: M
kano: n/a
epic: EPIC-09
source: ZAG, ADR-0006
version: 1.1
created: 2026-10-20
last_updated: 2026-10-23
verification: [MAN-ARCH-002]
---

# REQ-ARCH-002 Keine Verwahrung von Kundengeldern
## Anforderung
Die Plattform darf Kundengelder niemals selbst entgegennehmen oder halten. Zahlungen laufen ausschließlich über einen lizenzierten Zahlungsdienstleister mit Marktplatzprodukt; Kartendaten werden nicht verarbeitet.

## Begründung
Zahlungsdiensteaufsichtsgesetz (ZAG): Wer fremde Gelder weiterleitet, braucht eine BaFin-Erlaubnis. ADR-0006.

## Konformitätsprüfung
| Prüfung | Kriterium |
|---|---|
| Architektur-Review vor EPIC-09 | Geldfluss ausschließlich über den Zahlungsdienstleister; kein Konto der Plattform im Geldfluss |
| Datenmodell-Review | keine Karten- oder Kontodaten in eigenen Tabellen |

## Nachweis
- `MAN-ARCH-002`: Review-Protokoll im Spike PAY-02 (rechtliche Prüfung). Gilt ab EPIC-09; im MVP wird kein Geld verarbeitet.


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei mit Front Matter, Kano und Nachweis-IDs |
