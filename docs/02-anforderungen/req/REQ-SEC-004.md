---
id: REQ-SEC-004
title: Sichere Sitzungen und Schutz vor fremdgesteuerten Anfragen
type: security
class: constraint
status: verified
owner: team-plattform
risk: high
reviewers: [product-owner, security-lead]
release: R1
moscow: M
moscow_reason: [2]
kano: basis
epic: EPIC-01
source: OWASP ASVS 4.0.3 (EX-01)
version: 3.2
created: 2026-10-20
last_updated: 2026-10-26
review_due: 2027-04-26
verification: [AT-SEC-004, AT-SEC-004-2, AT-SEC-004-3]
---

# REQ-SEC-004 Sichere Sitzungen und Schutz vor fremdgesteuerten Anfragen

## Anforderung
Sitzungen müssen
1. für Skripte im Browser **unlesbar** sein, **nur über sichere Verbindungen** übertragen werden (konfigurierbare Ausnahme für die lokale Vorführung auf `http://localhost`) und **nicht bei seitenübergreifenden Anfragen** fremder Websites mitgesendet werden,
2. serverseitig widerrufbar sein (Abmelden, Passwort-Reset, Sperre, Rollenwechsel, Löschantrag),
3. vor fremdgesteuerten Anfragen (Cross-Site Request Forgery) geschützt sein: zustandsändernde Anfragen, die von fremden Websites ausgelöst werden, werden abgelehnt.

Wie das technisch erreicht wird (Cookie-Attribute, Schutzverfahren), steht in ADR-0003 und ADR-0011.

## Begründung
Gestohlene oder fremdgesteuerte Sitzungen erlauben Zugriff auf private Chats und Anzeigen.

## Akzeptanzkriterien
| Prüfung (von außen beobachtbar) | Erwartung |
|---|---|
| Skript im Browser liest nach dem Login alle für die Seite lesbaren Cookies | die Sitzungskennung ist nicht darunter |
| Antwort beim Login | die Sitzungskennung ist nur für sichere Verbindungen und nur für Anfragen derselben Website freigegeben (Ausnahme laut Konfiguration dokumentiert) |
| Zustandsändernde Anfrage, wie sie eine fremde Website auslösen kann (ohne Schutzmerkmal oder mit fremdem Ursprung) | abgelehnt (403) |
| Anfrage mit der alten Sitzung nach Abmelden, Passwort-Reset oder Sperre | wie nicht angemeldet (401) |
| Sitzungskennung | nicht vorhersagbar (≥ 256 Bit Zufall); serverseitig nur als nicht umkehrbarer Prüfwert gespeichert |

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Safari auf `http://localhost` verweigert Sitzungen für nur sichere Verbindungen | Ausnahme per Konfiguration, dokumentiert im README |
| WebSocket-Verbindung von fremdem Ursprung | Verbindung abgelehnt |
| Gestohlene Sitzungskennung | Widerruf durch Abmelden, Passwort-Reset oder Sperre wirkt sofort |

## Nachweis
- `AT-SEC-004`: Smoke-Test – zustandsändernde Anfrage ohne Schutzmerkmal liefert 403 `csrf`.
- `AT-SEC-004-2`: (neu) Freigabe der Sitzungskennung nach dem Login prüfen: für Skripte unlesbar, nur sichere Verbindungen, nur gleiche Website.
- `AT-SEC-004-3`: (neu) Sitzung ist nach Abmelden und nach Passwort-Reset ungültig.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 2.0 | 2026-10-23 | Lösungsneutral formuliert (Technik in ADR), Widerrufsfälle und Prüftabelle ergänzt |
| 3.0 | 2026-10-23 | Review v0.2: R-03 `class: constraint`; R-22 Akzeptanzkriterien ohne Cookie-Attribute, von außen beobachtbar; R-15 moscow_reason |
| 3.1 | 2026-10-24 | Verifiziert im finalen Lauf gegen das Docker-Beispiel (AT-SEC-004, AT-SEC-004-2, AT-SEC-004-3 bestanden bzw. ausgeführt); Status → verified |
| 3.2 | 2026-10-26 | Guideline-Review: GL-02/GL-06 ASVS-Fassung 4.0.3 (EX-01), review_due |
