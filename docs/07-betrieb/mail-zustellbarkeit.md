---
id: OPS-MAIL
type: operational
status: in-review
owner: architecture-lead
version: 1.0
created: 2026-10-24
last_updated: 2026-10-24
---

# Zustellbarkeit der E-Mails (SPF, DKIM, DMARC)

> **Muster im Rahmen einer Übungsaufgabe.** Anforderung: REQ-OPS-010. Im Docker-Beispiel fängt Mailpit alle Mails ab; die folgenden Einträge sind **Beispiele** für die Domain `campusmarkt.example` und gelten erst im Echtbetrieb.

## Warum?

Bestätigungslinks, Passwort-Resets und Moderationsbegründungen sind Pflichtmails. Landen sie im Spam, können sich Mitglieder nicht registrieren und erfahren nichts von Entscheidungen (DSA Art. 17). Hochschul-Postfächer filtern streng.

## Beispiel-DNS-Einträge

```text
; Absenderdomain: campusmarkt.example (Beispiel)

; SPF – nur das SMTP-Relay darf für die Domain senden
campusmarkt.example.            IN TXT "v=spf1 include:_spf.relay.example -all"

; DKIM – öffentlicher Schlüssel des Relays (Selektor cm2026)
cm2026._domainkey.campusmarkt.example. IN TXT "v=DKIM1; k=rsa; p=[Platzhalter: öffentlicher Schlüssel]"

; DMARC – zunächst beobachten, dann verschärfen
_dmarc.campusmarkt.example.     IN TXT "v=DMARC1; p=none; rua=mailto:[Platzhalter: dmarc-reports@campusmarkt.example]; adkim=s; aspf=s"
```

| Schritt | Einstellung | Dauer |
|---|---|---|
| 1 | DMARC `p=none`, Berichte auswerten | 2–4 Wochen |
| 2 | `p=quarantine; pct=25` → `pct=100` | 2 Wochen |
| 3 | `p=reject` | dauerhaft |

## Weitere Regeln

- **Absender:** `MAIL_FROM` mit eigener Domain, z. B. `CampusMarkt <no-reply@campusmarkt.example>`; `Reply-To` auf die Kontaktstelle.
- **Inhalte:** reine Transaktionsmails, keine Werbung (UWG § 7 nicht berührt); Text- und HTML-Teil; Fußzeile mit Impressum-Link (REQ-UX-006) und Abmeldelink für abbestellbare Kategorien (REQ-NOTI-003, `List-Unsubscribe`).
- **Bounces:** harte Bounces (Adresse existiert nicht mehr) markieren das Konto; nach [Platzhalter: 3] harten Bounces keine weiteren Mails und Hinweis beim nächsten Login. Im Beispiel nicht umgesetzt (Mailpit kennt keine Bounces).
- **Prüfen:** Testmails an Hochschul-Postfächer und Werkzeuge wie `mail-tester` [Platzhalter: internes Prüfverfahren]; DMARC-Berichte wöchentlich ansehen.
