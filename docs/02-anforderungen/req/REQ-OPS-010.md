---
id: REQ-OPS-010
title: Zustellbarkeit der E-Mails
type: operational
class: constraint
status: implemented
owner: team-plattform
risk: low
release: R1
moscow: C
kano: n/a
epic: EPIC-13
source: RFC 7208, RFC 6376, RFC 7489, RFC 8058
depends_on: [REQ-NOTI-001, REQ-NOTI-003]
version: 1.1
created: 2026-10-24
last_updated: 2026-10-25
verification: [AT-OPS-010, CTRL-DOC-MAIL]
---

# REQ-OPS-010 Zustellbarkeit der E-Mails
## Anforderung
E-Mails des Systems müssen so versendet werden, dass sie im Echtbetrieb authentifizierbar sind (SPF, DKIM, DMARC) und Benachrichtigungen sich mit einem Klick abbestellen lassen.

## Begründung
Ohne Authentifizierung landen Bestätigungs- und Sicherheitsmails im Spam; große Postfachanbieter verlangen One-Click-Abmeldung für Benachrichtigungen.

## Akzeptanzkriterien
- `docs/07-betrieb/mail-zustellbarkeit.md` enthält Beispiel-DNS-Einträge für SPF, DKIM und DMARC mit `.example`-Domain und `[Platzhalter]`-Werten sowie den Ablauf für Bounces.
- Benachrichtigungs-Mails tragen `List-Unsubscribe` (HTTPS-Link) und `List-Unsubscribe-Post: List-Unsubscribe=One-Click`; sicherheitsrelevante Mails nicht.

## Fehler- und Missbrauchsfälle
N/A – Risiko niedrig; die Abmeldelinks sind bereits signiert (REQ-NOTI-003).

## Nachweis
- `AT-OPS-010`: Smoke-Test – Benachrichtigungs-Mail in Mailpit trägt beide Header; Bestätigungsmail nicht.
- `CTRL-DOC-MAIL`: Kontrolle `docs/07-betrieb/mail-zustellbarkeit.md` – SPF-, DKIM-, DMARC-Beispiele und Bounce-Ablauf vorhanden.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-24 | Erstfassung aus dem Abgleich Recht, Auftritt und Betrieb ([06-abgleich-recht-betrieb.md](../06-abgleich-recht-betrieb.md)); als Übung mit Platzhaltern freigegeben (Q-23) |
| 1.1 | 2026-10-25 | Review v1.3 (RV-R-11, RV-C-13): Status nach Umsetzung; List-Unsubscribe ist erst mit HTTPS-PUBLIC_URL RFC-8058-konform |
