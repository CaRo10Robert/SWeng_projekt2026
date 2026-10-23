---
id: REQ-SEC-004
title: Sichere Sitzungen und CSRF-Schutz
type: security
class: quality
status: implemented
owner: team-plattform
risk: high
reviewers: [product-owner, security-lead]
release: R1
moscow: M
kano: basis
epic: EPIC-01
source: OWASP ASVS V3, ADR-0003, ADR-0011
use_cases: [UC-02]
version: 2.0
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-SEC-004, AT-SEC-004-2, AT-SEC-004-3]
---

# REQ-SEC-004 Sichere Sitzungen und CSRF-Schutz

## Anforderung
Sitzungen müssen
1. für Skripte im Browser unlesbar, nur über sichere Verbindungen übertragbar (konfigurierbare Ausnahme für `http://localhost`) und nicht bei seitenübergreifenden Anfragen mitgesendet werden,
2. serverseitig widerrufbar sein (Abmelden, Passwort-Reset, Sperre, Rollenwechsel, Löschantrag),
3. vor Cross-Site Request Forgery geschützt sein: zustandsändernde Anfragen von fremden Websites werden abgelehnt.

Die technische Umsetzung (Cookie-Attribute, Schutzverfahren) steht in ADR-0003 und ADR-0011.

## Begründung
Gestohlene oder fremdgesteuerte Sitzungen erlauben Zugriff auf private Chats und Anzeigen.

## Akzeptanzkriterien
| Prüfung | Erwartung |
|---|---|
| Sitzungscookie | Attribute `HttpOnly`, `Secure`, `SameSite=Lax` |
| Zustandsändernde Anfrage ohne Schutzmerkmal oder mit fremdem Origin | 403 `csrf` |
| Anfrage mit Sitzung nach Abmelden / Reset / Sperre | wie nicht angemeldet (401) |
| Sitzungs-Token | nur als Hash gespeichert, ≥ 256 Bit Zufall |

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Safari auf `http://localhost` verweigert `Secure`-Cookies | Ausnahme per Konfiguration, dokumentiert im README |
| WebSocket von fremdem Origin | Verbindung abgelehnt |

## Nachweis
- `AT-SEC-004`: Smoke-Test – zustandsändernde Anfrage ohne Schutzheader liefert 403 `csrf`.
- `AT-SEC-004-2`: neu zu schreiben – Attribute des Sitzungscookies nach dem Login.
- `AT-SEC-004-3`: neu zu schreiben – Sitzung ist nach Abmelden und nach Passwort-Reset ungültig.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 2.0 | 2026-10-23 | Lösungsneutral formuliert (Technik in ADR), Widerrufsfälle und Prüftabelle ergänzt |
