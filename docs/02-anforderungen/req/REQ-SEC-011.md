---
id: REQ-SEC-011
title: Angebote nur von verifizierten Mitgliedern
type: security
class: constraint
status: draft
owner: team-plattform
risk: high
reviewers: [product-owner, security-lead]
release: R1
moscow: M
kano: basis
epic: EPIC-02
source: FS-C4
use_cases: [UC-10]
depends_on: [REQ-AUTH-002, REQ-SEC-006]
version: 1.0
created: 2026-10-23
last_updated: 2026-10-23
verification: [AT-SEC-011, AT-SEC-011-2]
---

# REQ-SEC-011 Angebote nur von verifizierten Mitgliedern

## Anforderung
Das System darf Anzeigen ausschließlich von Mitgliedern annehmen, deren Hochschulzugehörigkeit bestätigt ist und deren Konto aktiv ist. Dasselbe gilt für das Hochladen von Bildern und das Ändern bestehender Anzeigen.

## Begründung
Constraint FS-C4 der Fallstudie; Grundlage des Vertrauens (BG-1). Bisher nur implizit über die Anmeldung erfüllt, jetzt als prüfbare Kontrolle.

## Akzeptanzkriterien
```gherkin
Szenario: Verifiziertes Mitglied
  Angenommen ich bin mit einem bestätigten, aktiven Konto angemeldet
  Wenn ich eine gültige Anzeige absende
  Dann wird sie angelegt

Szenario: Ohne Anmeldung
  Angenommen ich bin nicht angemeldet
  Wenn ich eine Anzeige absende
  Dann wird sie mit "Bitte melde dich an" abgelehnt
```

## Fehler- und Missbrauchsfälle
| Fall (Abuse Case) | Erwartung |
|---|---|
| Konto unbestätigt (Link nicht geöffnet) | Anmeldung nicht möglich; Anzeige anlegen → 401 |
| Konto gesperrt, alte Sitzung noch im Browser | Sitzungen sind widerrufen; Anzeige anlegen → 401 |
| Konto mit beantragter Löschung, alte Sitzung | Sitzungen sind widerrufen; Anzeige anlegen → 401 |
| Abgelaufene Sitzung | Anzeige anlegen → 401 |
| Mitgliedschaft nicht re-verifiziert (REQ-AUTH-007) | Anzeige anlegen → abgelehnt mit Hinweis |
| Direkter Aufruf der Schnittstelle unter Umgehung der Oberfläche | gleiche Prüfungen serverseitig |

## Nachweis
- `AT-SEC-011`: neu zu schreiben – Registrierung ohne Bestätigung: Anmeldung liefert `not_verified`, Anzeige anlegen ohne Sitzung liefert 401.
- `AT-SEC-011-2`: neu zu schreiben – nach Sperre durch die Moderation liefert Anzeige anlegen mit der alten Sitzung 401.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-23 | Erstfassung aus Fallstudie FS-C4 (Abgleich A-4) |
