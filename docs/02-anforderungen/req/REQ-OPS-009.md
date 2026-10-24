---
id: REQ-OPS-009
title: Verschlüsselte Verbindung mit HSTS über Reverse Proxy
type: security
class: constraint
status: approved
owner: team-plattform
risk: medium
release: R1
moscow: S
kano: n/a
epic: EPIC-13
source: BSI TR-02102-2, OWASP ASVS V9, Q-27
depends_on: [REQ-SEC-004]
review_due: 2027-10-24
version: 1.0
created: 2026-10-24
last_updated: 2026-10-24
verification: [AT-OPS-009]
---

# REQ-OPS-009 Verschlüsselte Verbindung mit HSTS über Reverse Proxy
## Anforderung
Im Betrieb muss das System ausschließlich über HTTPS mit TLS 1.2 oder höher erreichbar sein; HTTP wird dauerhaft auf HTTPS umgeleitet, und Antworten tragen `Strict-Transport-Security`. Im Docker-Beispiel steht dafür ein optionales Profil `proxy` mit lokal ausgestelltem Zertifikat bereit (Q-27).

## Begründung
Sitzungscookies sind `Secure` (REQ-SEC-004) und werden ohne TLS nicht übertragen; HSTS verhindert Downgrade-Angriffe.

## Akzeptanzkriterien
| Anfrage | Erwartung |
|---|---|
| `http://…/` | 301/308 auf `https://…/` |
| `https://…/` | 200, Header `Strict-Transport-Security: max-age=31536000` |
| TLS 1.0/1.1 | Verbindung abgelehnt |
| Anwendung hinter dem Proxy | erkennt Client-IP und Protokoll über `TRUST_PROXY` (B-41) |

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Zertifikat abgelaufen | Alarm (REQ-OPS-008), automatische Erneuerung im Echtbetrieb |
| Direktzugriff auf den App-Port vorbei am Proxy | im Profil `proxy` ist der App-Port nicht veröffentlicht |

## Nachweis
- `AT-OPS-009`: Smoke-Test gegen das Profil `proxy` – Umleitung von HTTP, HSTS-Header, Anmeldung über HTTPS funktioniert.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-24 | Erstfassung aus dem Abgleich Recht, Auftritt und Betrieb ([06-abgleich-recht-betrieb.md](../06-abgleich-recht-betrieb.md)); als Übung mit Platzhaltern freigegeben (Q-23) |
