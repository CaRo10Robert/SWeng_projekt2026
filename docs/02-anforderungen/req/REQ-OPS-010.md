---
id: REQ-OPS-010
title: Zustellbarkeit der E-Mails
type: operational
class: constraint
status: verified
owner: team-plattform
risk: low
release: R1
moscow: C
kano: n/a
epic: EPIC-13
source: RFC 7208, RFC 6376, RFC 7489, RFC 8058
depends_on: [REQ-NOTI-001, REQ-NOTI-003]
version: 1.5
created: 2026-10-24
last_updated: 2026-10-26
review_due: 2027-10-26
verification: [AT-OPS-010, CTRL-DOC-MAIL]
---

# REQ-OPS-010 Zustellbarkeit der E-Mails
## Anforderung
E-Mails des Systems müssen so versendet werden, dass sie im Echtbetrieb authentifizierbar sind (SPF, DKIM, DMARC) und Benachrichtigungen sich mit einem Klick abbestellen lassen.

## Begründung
Ohne Authentifizierung landen Bestätigungs- und Sicherheitsmails im Spam; große Postfachanbieter verlangen One-Click-Abmeldung für Benachrichtigungen.

## Akzeptanzkriterien
- `docs/07-betrieb/mail-zustellbarkeit.md` enthält Beispiel-DNS-Einträge für SPF, DKIM und DMARC mit `.example`-Domain und fiktiven Werten sowie den Ablauf für Bounces.
- Benachrichtigungs-Mails tragen `List-Unsubscribe` (HTTPS-Link) und `List-Unsubscribe-Post: List-Unsubscribe=One-Click`; sicherheitsrelevante Mails nicht.

## Fehler- und Missbrauchsfälle
N/A – Risiko niedrig; die Abmeldelinks sind bereits signiert (REQ-NOTI-003).

## Nachweis
- `AT-OPS-010`: Smoke-Test – Benachrichtigungs-Mail in Mailpit trägt beide Header; Bestätigungsmail nicht.
- `CTRL-DOC-MAIL`: Kontrolle `docs/07-betrieb/mail-zustellbarkeit.md` – SPF-, DKIM-, DMARC-Beispiele und Bounce-Ablauf vorhanden – Protokoll [CTRL-DOC-MAIL](../../05-umsetzung/nachweise/CTRL-DOC-MAIL.md).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-24 | Erstfassung aus dem Abgleich Recht, Auftritt und Betrieb ([06-abgleich-recht-betrieb.md](../06-abgleich-recht-betrieb.md)); als Übung mit Platzhaltern freigegeben (Q-23) |
| 1.1 | 2026-10-25 | Review v1.3 (RV-R-11, RV-C-13): Status nach Umsetzung; List-Unsubscribe ist erst mit HTTPS-PUBLIC_URL RFC-8058-konform |
| 1.2 | 2026-10-25 | Verifiziert im finalen Lauf gegen das Docker-Beispiel (AT-OPS-010, CTRL-DOC-MAIL bestanden bzw. ausgeführt); Status → verified |
| 1.3 | 2026-10-25 | Q-28: Platzhalter durch fiktive Übungswerte und offene Prüfpunkte durch Übungsannahmen ersetzt |
| 1.4 | 2026-10-26 | Guideline-Review: GL-06 review_due (E-Mail-RFCs, jährlich) |
| 1.5 | 2026-10-26 | Guideline-Review: GL-07 Kontrollprotokoll verlinkt |
