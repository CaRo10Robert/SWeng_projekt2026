---
id: REQ-SEC-011
title: Angebote nur von verifizierten Mitgliedern
type: security
class: constraint
status: verified
owner: team-plattform
risk: high
reviewers: [product-owner, security-lead]
release: R1
moscow: M
moscow_reason: [2, 4]
kano: basis
epic: EPIC-02
source: FS-C4
use_cases: [UC-10, UC-11]
depends_on: [REQ-AUTH-002, REQ-SEC-006]
version: 2.2
created: 2026-10-23
last_updated: 2026-10-24
verification: [AT-SEC-011, AT-SEC-011-2, AT-SEC-011-3]
---

# REQ-SEC-011 Angebote nur von verifizierten Mitgliedern

## Anforderung
Das System darf Anzeigen ausschließlich von Mitgliedern annehmen, deren Hochschulzugehörigkeit bestätigt ist und deren Konto aktiv ist. Dasselbe gilt für das **Hochladen von Bildern** und das **Ändern bestehender Anzeigen** (Bearbeiten, Statusänderung, Löschen).

## Begründung
Constraint FS-C4 der Fallstudie; Grundlage des Vertrauens (BG-1). Bisher nur implizit über die Anmeldung erfüllt, jetzt als prüfbare Kontrolle.

## Akzeptanzkriterien
```gherkin
Szenario: Verifiziertes Mitglied
  Angenommen ich bin mit einem bestätigten, aktiven Konto angemeldet
  Wenn ich eine gültige Anzeige absende
  Dann wird sie angelegt

Szenario: Unbestätigtes Konto
  Angenommen ich habe mich registriert, aber den Bestätigungslink nicht geöffnet
  Wenn ich mich anmelden will
  Dann sehe ich "Bitte bestätige zuerst deine E-Mail-Adresse"
  Und ich kann keine Anzeige anlegen

Szenario: Ohne Anmeldung
  Angenommen ich bin nicht angemeldet
  Wenn ich eine Anzeige absende, ein Bild hochlade oder eine Anzeige bearbeite
  Dann wird das mit "Bitte melde dich an" abgelehnt

Szenario: Konto gesperrt
  Angenommen mein Konto wurde von der Moderation gesperrt
  Und mein Browser hat noch die alte Sitzung
  Wenn ich eine Anzeige anlege, ein Bild hochlade oder meine Anzeige bearbeite
  Dann wird das mit "Bitte melde dich an" abgelehnt
```

## Fehler- und Missbrauchsfälle
| Fall (Abuse Case) | Erwartung |
|---|---|
| Konto unbestätigt (Link nicht geöffnet) | Anmeldung nicht möglich; Anlegen, Hochladen, Bearbeiten → 401 |
| Konto gesperrt, alte Sitzung noch im Browser | Sitzungen sind widerrufen; Anlegen, Hochladen, Bearbeiten → 401 |
| Konto mit beantragter Löschung, alte Sitzung | Sitzungen sind widerrufen; Anlegen, Hochladen, Bearbeiten → 401 |
| Abgelaufene Sitzung | → 401 |
| Mitgliedschaft nicht re-verifiziert | **ab Umsetzung von REQ-AUTH-007 (R2)**: Anlegen abgelehnt mit Hinweis; in R1 nicht anwendbar |
| Direkter Aufruf der Schnittstelle unter Umgehung der Oberfläche | gleiche Prüfungen serverseitig |

## Nachweis
- `AT-SEC-011`: (neu) Registrierung ohne Bestätigung: Anmeldung liefert `not_verified`; Anzeige anlegen, Bild hochladen und Anzeige bearbeiten ohne Sitzung liefern 401.
- `AT-SEC-011-2`: (neu) nach Sperre durch die Moderation liefern Anzeige anlegen, Bild hochladen und Bearbeiten mit der alten Sitzung 401.
- `AT-SEC-011-3`: (neu) nach beantragter Kontolöschung liefert Anzeige anlegen mit der alten Sitzung 401.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-23 | Erstfassung aus Fallstudie FS-C4 (Abgleich A-4) |
| 2.0 | 2026-10-23 | Review v0.2: R-12 Szenarien für Bild-Upload, Bearbeiten, Sperre und unbestätigtes Konto; Re-Verifikationszeile „ab REQ-AUTH-007 (R2)“; Nachweise erweitert; Status `approved` |
| 2.1 | 2026-10-23 | Umgesetzt (Schritt 6): Anlegen/Upload nur mit bestätigtem, aktivem Konto; Sitzungen nach Sperre ungültig; AT-SEC-011/-2 im Smoke-Test; Status → implemented |
| 2.2 | 2026-10-24 | Verifiziert im finalen Lauf gegen das Docker-Beispiel (AT-SEC-011, AT-SEC-011-2, AT-SEC-011-3 bestanden bzw. ausgeführt); Status → verified |
