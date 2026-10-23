---
id: REQ-ARCH-002
title: Keine Verwahrung von Kundengeldern
type: architecture
class: constraint
status: approved
owner: team-plattform
risk: high
reviewers: [product-owner, architecture-lead]
release: EPIC-09
moscow: M
moscow_reason: [2]
kano: n/a
epic: EPIC-09
source: ZAG, ADR-0006
version: 1.2
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

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Vorschlag, Zahlungen über ein Konto der Plattform abzuwickeln | Architektur-Review lehnt ab (ZAG) |
| Kartendaten erreichen die Plattform (z. B. über ein eigenes Formular) | unzulässig; nur gehostete Bezahlseiten oder Komponenten des Zahlungsdienstleisters |
| Zahlungsdienstleister fällt aus | Bezahlung ist optional; Übergabe gegen Barzahlung bleibt möglich |

## Nachweis
- `MAN-ARCH-002`: Review-Protokoll im Spike PAY-02 (rechtliche Prüfung). Gilt ab EPIC-09; im MVP wird kein Geld verarbeitet.


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei mit Front Matter, Kano und Nachweis-IDs |
| 1.2 | 2026-10-23 | Review v0.2: R-04, R-15 |
