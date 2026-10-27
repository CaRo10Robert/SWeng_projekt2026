---
id: REQ-SEC-002
title: Passwörter mit Argon2id speichern
type: security
class: constraint
status: implemented
owner: team-plattform
risk: high
reviewers: [product-owner, security-lead]
review_due: 2027-04-23
release: R1
moscow: M
moscow_reason: [2]
kano: n/a
epic: EPIC-01
source: OWASP Password Storage Cheat Sheet, ADR-0003
version: 1.2
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-SEC-002]
---

# REQ-SEC-002 Passwörter mit Argon2id speichern

## Anforderung
Passwörter müssen ausschließlich als Hash mit **Argon2id** und mindestens den OWASP-Parametern (m = 19 MiB, t = 2, p = 1) gespeichert werden. Klartextpasswörter dürfen weder gespeichert noch protokolliert werden.

Die Technik ist hier selbst die Kontrolle (Sicherheits-Constraint, ADR-0003).

## Begründung
Bei einem Datenleck dürfen Passwörter nicht praktikabel zurückgerechnet werden können; viele Mitglieder verwenden Passwörter mehrfach.

## Akzeptanzkriterien
- Gespeicherte Hashes beginnen mit `$argon2id$` und enthalten `m=19456,t=2,p=1` oder stärkere Werte.
- Logs enthalten keine Passwortfelder (Schwärzung, siehe REQ-OPS-002).

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Empfohlene Parameter werden erhöht (Überprüfung zum `review_due`) | bestehende Hashes mit schwächeren Parametern werden bei der nächsten erfolgreichen Anmeldung mit den neuen Parametern neu berechnet |
| Sehr lange Passwörter als Rechenlast-Angriff | Länge auf 256 Zeichen begrenzt (REQ-SEC-003) |
| Passwort gelangt in Logs oder Fehlermeldungen | Passwortfelder werden geschwärzt (REQ-OPS-002) |
| Datenbank wird entwendet | Hashes sind ohne aufwändiges Durchprobieren nicht umkehrbar; Leak-Liste verhindert triviale Passwörter |

## Nachweis
- `AT-SEC-002`: neu zu schreiben – Test prüft Algorithmus und Parameter eines frisch erzeugten Hashes.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei, prüfbare Akzeptanzkriterien ergänzt |
| 1.2 | 2026-10-23 | Review v0.2: R-04 Fehler- und Missbrauchsfälle (Parameter-Upgrade bestehender Hashes); R-16 review_due; R-15 moscow_reason |
