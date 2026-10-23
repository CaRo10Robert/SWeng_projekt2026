---
id: REQ-AUTH-002
title: Hochschuladresse per Link bestätigen
type: user-story
class: functional
status: approved
owner: team-identity
risk: high
reviewers: [product-owner, security-lead]
release: R1
moscow: M
moscow_reason: [1, 2]
kano: basis
epic: EPIC-01
source: BG-1
use_cases: [UC-01]
depends_on: [REQ-AUTH-001, REQ-NOTI-001, REQ-PRIV-003]
version: 3.0
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-AUTH-002, AT-AUTH-002-2, AT-AUTH-002-3, AT-AUTH-002-4]
---

# REQ-AUTH-002 Hochschuladresse per Link bestätigen

## Anforderung
Als Gast möchte ich meine Hochschuladresse über einen Link in einer E-Mail bestätigen, damit nur ich mit meiner Adresse ein Konto eröffnen kann.

- Ein Bestätigungslink ist **24 Stunden** gültig und **einmal** verwendbar.
- Fordert der Gast einen neuen Link an, bleiben ältere, noch nicht abgelaufene Links gültig, bis das Konto bestätigt ist.
- Ein Konto, das **7 Tage** nach der Registrierung noch nicht bestätigt ist, wird gelöscht (Entscheidung Q-13). Bis dahin kann der Link erneut angefordert werden; danach ist eine neue Registrierung mit derselben Adresse möglich.

## Begründung
Nur wer Zugriff auf das Hochschulpostfach hat, kann die Adresse nutzen. Das ist die Verifikation der Hochschulzugehörigkeit (BG-1, Fallstudie FS-C3/FS-C4). Die Löschfrist begrenzt die Speicherung von Daten unbestätigter Konten (REQ-PRIV-003).

## Akzeptanzkriterien
```gherkin
Szenario: Erfolgreiche Bestätigung
  Angenommen ich habe mich mit "lea@studmail.hwg-lu.de" registriert
  Wenn ich den Bestätigungslink innerhalb von 24 Stunden öffne
  Dann ist mein Konto aktiv
  Und ich bin angemeldet

Szenario: Mehrere Links angefordert
  Angenommen ich habe zwei Bestätigungsmails erhalten
  Wenn ich den Link aus der älteren Mail öffne
  Dann ist mein Konto aktiv

Szenario: Abgelaufener Link
  Angenommen mein Bestätigungslink ist älter als 24 Stunden
  Und mein Konto ist jünger als 7 Tage
  Wenn ich ihn öffne
  Dann sehe ich "Link abgelaufen" und die Option "Link erneut senden"
  Und mein Konto bleibt unbestätigt

Szenario: Link ein zweites Mal verwendet
  Angenommen mein Konto ist bereits bestätigt
  Wenn ich einen Bestätigungslink erneut öffne
  Dann wird keine neue Sitzung erzeugt
  Und ich werde zur Anmeldeseite weitergeleitet

Szenario: Unbestätigtes Konto nach 7 Tagen
  Angenommen ich habe mich vor mehr als 7 Tagen registriert und nie bestätigt
  Wenn der tägliche Löschlauf stattgefunden hat
  Dann existiert das Konto nicht mehr
  Und eine neue Registrierung mit derselben Adresse ist möglich
```

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Manipulierter oder unbekannter Link | „Link ungültig“, keine Sitzung |
| Erneut senden in Schleife | max. 3 pro Stunde und Adresse (REQ-SEC-005) |
| Mailserver nicht erreichbar | Versand wird wiederholt (REQ-NOTI-005), Gast sieht trotzdem den Hinweis |
| Fremde Person registriert meine Adresse | Konto bleibt unbestätigt und verschwindet nach 7 Tagen; die Adresse ist nie blockiert |
| Link im Klartext gespeichert | unzulässig; gespeichert wird nur ein nicht umkehrbarer Prüfwert |

## INVEST
I: setzt nur REQ-AUTH-001 voraus · N: Gültigkeitsdauer und Löschfrist verhandelbar · V: Grundlage des Vertrauens · E: klein · S: ein Sprint · T: Szenarien automatisierbar (Mail im Mail-Catcher, Zeit vorgestellt).

## Nachweis
- `AT-AUTH-002`: Smoke-Test – Bestätigung mit dem Link aus der **älteren** von zwei Mails meldet an.
- `AT-AUTH-002-2`: Smoke-Test – derselbe Link ein zweites Mal liefert `token_used`, keine Sitzung.
- `AT-AUTH-002-3`: (neu) abgelaufener Link liefert `token_expired` (Zeit über die Datenbank vorgestellt).
- `AT-AUTH-002-4`: (neu) unbestätigtes Konto älter als 7 Tage wird vom Löschlauf entfernt; erneute Registrierung derselben Adresse ist möglich.
- Teilweise umgesetzt: Die Löschung nach 7 Tagen (Q-13) fehlt noch.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 2.0 | 2026-10-23 | Szenario „mehrere Links“ ergänzt (Fehlerkorrektur aus dem MVP-Test) |
| 3.0 | 2026-10-23 | Review v0.2: R-06/R-28 – Löschung unbestätigter Konten nach 7 Tagen (Q-13), Szenario und Nachweis ergänzt; Status `approved`, weil die Löschung noch nicht umgesetzt ist; R-15 moscow_reason |
