---
id: MAN-NOTI-004
type: evidence
requirement: REQ-NOTI-004
status: done
owner: ops-lead
date: 2026-10-26
---

# MAN-NOTI-004 Zustellbarkeit der E-Mails (SPF, DKIM, DMARC)

> **Teilweise fiktiv:** Für einen echten Zustelltest mit mail-tester braucht man Internet, eine echte Domain und einen echten Relay. Das gibt es in der Übung nicht (Q-28). Der mail-tester-Wert unten ist ein **fiktiver Übungswert**. Echt geprüft wurden dagegen die Header und Fußzeilen der lokal versandten Mails und die Syntax der Beispiel-DNS-Einträge.

## Ziel

REQ-NOTI-004: mail-tester mindestens 9/10, Zustellung in den Posteingang. Messverfahren: je eine Verifikations- und eine Benachrichtigungsmail aus der Produktionskonfiguration.

## Umgebung

Stack `cmh1`, Mailpit 8032, Absender aus `compose.yaml` (`MAIL_FROM`). Beispiel-DNS aus [mail-zustellbarkeit.md](../../07-betrieb/mail-zustellbarkeit.md).

## Ablauf

| Zeit (UTC) | Schritt | Ergebnis |
|---|---|---|
| 07:37:55 | Passwort-Reset für Lea angefordert (transaktionale Mail) | 202, Mail in Mailpit |
| – | Benachrichtigungsmail „Deine Anzeige … läuft bald ab“ aus dem Job-Lauf (25.10., 22:07) | vorhanden |
| – | Alarm-Mail von Alertmanager (Vergleich) | vorhanden |
| 07:38 | Header und Fußzeilen über die Mailpit-API ausgewertet | siehe Messwerte |
| 07:38 | DNS-Einträge syntaktisch geprüft (Skript) | siehe Messwerte |

## Messwerte (echt)

| Prüfpunkt | Passwort-Reset (transaktional) | Benachrichtigung (abbestellbar) |
|---|---|---|
| `From` | `CampusMarkt HWG LU <no-reply@campusmarkt.local>` | gleich |
| `Message-Id` | vorhanden, Domain `campusmarkt.local` | vorhanden |
| `Date`, `Mime-Version` | vorhanden | vorhanden |
| `Content-Type` | `multipart/alternative` (Text + HTML) | `multipart/alternative` |
| `List-Unsubscribe` | fehlt (richtig: Pflichtmail) | `<http://localhost:8089/api/v1/notifications/unsubscribe?token=…>` |
| `List-Unsubscribe-Post` | fehlt (richtig) | `List-Unsubscribe=One-Click` |
| `Reply-To` | fehlt | fehlt |
| Fußzeile (Text) | Impressum, Datenschutz, Kontakt, Hinweis „fiktive Übungsangaben“ | Impressum, Datenschutz, Kontakt, Abbestell-Link, Übungshinweis |
| Fußzeile (HTML) mit Links `/impressum`, `/datenschutz`, `/kontakt` | ja | ja |

| DNS-Eintrag (Beispiel `campusmarkt.example`) | Syntax |
|---|---|
| SPF `v=spf1 include:_spf.relay.example -all` | gültig, harte Ablehnung |
| DKIM `cm2026._domainkey`, `v=DKIM1; k=rsa; p=…` | gültig (Schlüssel als Übungswert gekürzt) |
| DMARC `v=DMARC1; p=none; rua=mailto:…; adkim=s; aspf=s` | gültig; `p=none` = nur Beobachtung |

## Messwerte (fiktiv, Übungswerte)

| Prüfpunkt | Wert |
|---|---|
| mail-tester, Verifikationsmail | 9,5/10 *(fiktiv)* |
| mail-tester, Benachrichtigungsmail | 9,2/10 *(fiktiv)* |
| Zustellung Gmail / Outlook / Hochschul-Postfach | Posteingang *(fiktiv)* |

## Ergebnis gegen das Akzeptanzkriterium

| Kriterium | Ergebnis |
|---|---|
| mail-tester ≥ 9/10 | nur fiktiv belegt (Übung) |
| Header und Inhalt für gute Zustellbarkeit | **teilweise**: Struktur, Fußzeile und One-Click-Abmeldung sind korrekt; Absenderdomain und `Reply-To` passen nicht (N-1, N-2) |
| DNS-Einträge | syntaktisch korrekt |

**Gesamt:** Als Übung bestanden, mit zwei Befunden. Ein echter Nachweis ist nur im Echtbetrieb möglich (EPIC-12).

## Abweichungen und Befunde

| Nr. | Befund | Wirkung | Vorschlag |
|---|---|---|---|
| N-1 | Der Absender ist `no-reply@campusmarkt.local` (`compose.yaml`, `config.ts`). Die DNS-Beispiele gelten für `campusmarkt.example`. | Bei echtem Versand wären SPF/DKIM nicht auf die Absenderdomain ausgerichtet und würden mit `adkim=s`/`aspf=s` scheitern. | Beispiel-Absender auf `no-reply@campusmarkt.example` umstellen bzw. in der Go-live-Checkliste aufnehmen |
| N-2 | Kein `Reply-To`, obwohl `mail-zustellbarkeit.md` ihn auf die Kontaktstelle setzt. | Antworten gehen an `no-reply`. | `MAIL_REPLY_TO` einführen (Standard: Kontaktstelle) |
| N-3 | `List-Unsubscribe` nutzt `http://`; RFC 8058 verlangt HTTPS (bekannt aus RV-C-13). | Nur im Profil `proxy` mit HTTPS-`PUBLIC_URL` konform. | bereits dokumentiert; in der Go-live-Checkliste prüfen |

## Folgeaufgaben

- N-1 und N-2 im Code bzw. in der Konfiguration beheben.
- Echter mail-tester-Lauf vor einem Echtbetrieb (EPIC-12).
