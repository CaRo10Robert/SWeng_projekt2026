---
id: REQ-AUTH-004
title: Keine Offenlegung bestehender Konten
type: security
class: quality
status: implemented
owner: team-identity
risk: high
reviewers: [product-owner, security-lead]
release: R1
moscow: M
kano: basis
epic: EPIC-01
source: OWASP ASVS V2 (Account Enumeration)
use_cases: [UC-01, UC-02, UC-03]
version: 1.1
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-AUTH-004, AT-AUTH-004-2]
---

# REQ-AUTH-004 Keine Offenlegung bestehender Konten

## Anforderung
Das System darf bei Registrierung, Anmeldung und Passwort-Reset nicht offenlegen, ob eine E-Mail-Adresse bereits registriert ist – weder über den Antwortinhalt noch über die Antwortzeit.

## Begründung
Kontenaufzählung ermöglicht gezieltes Phishing gegen Hochschulangehörige und das Ausspähen, wer die Plattform nutzt.

## Akzeptanzkriterien
| Vorgang | Konto existiert | Konto existiert nicht | Unterschied sichtbar? |
|---|---|---|---|
| Registrierung | gleiche neutrale Meldung; Hinweis-Mail „Du hast bereits ein Konto“ an die Adresse | gleiche neutrale Meldung; Bestätigungsmail | nein |
| Passwort-Reset anfordern | neutrale Meldung, Reset-Mail | neutrale Meldung, keine Mail | nein |
| Anmeldung mit falschem Passwort | „E-Mail-Adresse oder Passwort ist falsch“ | gleiche Meldung | nein |

Zeitverhalten: Der Median der Antwortzeit unterscheidet sich zwischen „Konto existiert“ und „Konto existiert nicht“ um höchstens 50 ms (je 20 Anfragen, lokal gegen das Docker-Beispiel).

Ausnahme: Erst nach **korrektem** Passwort darf die Anmeldung „bitte E-Mail bestätigen“ bzw. „Konto gesperrt“ melden.

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Automatisiertes Durchprobieren von Adressen | Rate-Limits (REQ-SEC-005) |
| Gesperrte Adresse registriert sich erneut | neutrale Meldung, keine Mail (REQ-AUTH-008) |

## Nachweis
- `AT-AUTH-004`: Smoke-Test – zweite Registrierung derselben Adresse liefert identische Antwort.
- `AT-AUTH-004-2`: neu zu schreiben – Antwortinhalt und Median der Antwortzeit von Login und Reset für existierende/nicht existierende Adressen vergleichen.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei, Messgröße für das Zeitverhalten ergänzt |
