---
id: REQ-SEC-005
title: Begrenzung von Anfragen (Rate-Limits)
type: security
class: quality
status: implemented
owner: team-plattform
risk: high
reviewers: [product-owner, security-lead]
release: R1
moscow: M
kano: n/a
epic: EPIC-00
source: OWASP ASVS V2.2, Missbrauchsschutz
use_cases: [UC-01, UC-02, UC-03, UC-20, UC-21]
version: 2.0
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-SEC-005, AT-SEC-005-2]
---

# REQ-SEC-005 Begrenzung von Anfragen (Rate-Limits)

## Anforderung
Das System muss missbrauchsanfällige Vorgänge begrenzen. Die Grenzen gelten auch über mehrere Instanzen hinweg.

| Vorgang | Grenze | Bezug |
|---|---|---|
| Anmeldung | 5 Fehlversuche / 15 min pro Konto und IP | Brute Force |
| Registrierung | 5 / Stunde pro IP | Massenregistrierung |
| Bestätigungsmail erneut senden | 3 / Stunde pro Adresse | Mail-Bombing |
| Passwort-Reset | 3 / Stunde pro Adresse | Mail-Bombing |
| Neue Konversationen, Nachrichten | siehe REQ-CHAT-007 | Spam |

## Begründung
Ohne Begrenzung sind Passwort-Raten, Spam und das Fluten von Hochschulpostfächern trivial.

## Akzeptanzkriterien
- Bei Überschreitung antwortet das System mit 429 und dem Hinweis „Zu viele Anfragen“ samt Wartezeit (`Retry-After`).
- Die Antwort verrät nicht, ob das Konto existiert (REQ-AUTH-004).
- Nach erfolgreicher Anmeldung wird der Fehlversuchszähler zurückgesetzt.
- IP-Adressen werden nur gehasht verarbeitet (REQ-PRIV-002).

## Nachweis
- `AT-SEC-005`: neu zu schreiben – 5 falsche Passwörter, die 6. Anmeldung liefert 429 mit `Retry-After`.
- `AT-SEC-005-2`: neu zu schreiben – 6. Registrierung derselben IP innerhalb einer Stunde liefert 429.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 2.0 | 2026-10-23 | Speichertechnik entfernt (ADR-0010/0011), Grenze für „erneut senden“ und Akzeptanzkriterien ergänzt |
