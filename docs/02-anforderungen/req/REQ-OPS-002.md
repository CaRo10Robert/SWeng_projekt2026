---
id: REQ-OPS-002
title: Beobachtbarkeit ohne personenbezogene Daten
type: operational
class: quality
status: verified
owner: team-plattform
risk: medium
reviewers: [qa-lead]
release: R1
moscow: M
moscow_reason: [2, 3]
kano: n/a
epic: EPIC-00
source: Guideline Kap. 11, REQ-PRIV-002
version: 2.5
created: 2026-10-20
last_updated: 2026-10-26
verification: [AT-OPS-002, MAN-OPS-002]
---

# REQ-OPS-002 Beobachtbarkeit ohne personenbezogene Daten
## Anforderung
Das System muss strukturierte Protokolle mit Korrelations-ID und Metriken bereitstellen; Protokolle dürfen keine personenbezogenen Daten enthalten. Verteiltes Tracing muss per Konfiguration zuschaltbar sein. Alarmierung ist im Docker-Beispiel N/A (EPIC-12).

## Begründung
Fehleranalyse ohne Datenschutzrisiko (REQ-PRIV-002, Guideline Kap. 11).

## Qualitätsmerkmal, Metrik, Messverfahren
| Feld | Festlegung |
|---|---|
| Qualitätsmerkmal (ISO 25010) | Maintainability → Analysability; Security → Confidentiality |
| Metrik | (1) Anteil der Anfragen mit Korrelations-ID im Protokoll und Antwortheader; (2) Fundstellen von E-Mail-Adressen, Passwörtern, Tokens oder Cookies in den Protokollen |
| Akzeptanzkriterium | (1) **100 %**; (2) **0** Fundstellen nach einem vollständigen Smoke-Test; (3) Metriken zu Antwortzeiten, verarbeiteten Hintergrundaufgaben und offenen Echtzeitverbindungen sind abrufbar |
| Messverfahren | Smoke-Test, danach Durchsuchen der Container-Protokolle nach Adressmustern und Testpasswort; Abruf des Metrikendpunkts (`/metrics`, Prometheus-Format) mit Prüfung auf Request-Latenzen, Job-Durchsatz und WebSocket-Verbindungen |
| Messkontext | Docker-Beispiel, Protokollstufe `info` |
| Verhalten bei Verfehlung | Release-Blocker bei personenbezogenen Daten im Protokoll |

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Personenbezogene Daten in Anfrage-Headern oder Pfaden | Request-ID nur als UUID übernommen, unbekannte Pfade als `unmatched`, keine Query und keine IP im Log |
| Tokens in URLs | Query wird nicht protokolliert; Widerspruchs-Token im Fragment |
| Sicherheitsereignisse | nur mit Pseudonym (HMAC, ADR-0014), nie mit Adresse oder Passwort |
| Log-Flut durch Angriff | Rate-Limits begrenzen Anfragen; Logs gehen an stdout. Eine Größenbegrenzung des Docker-Logtreibers (`max-size`/`max-file`) ist im Beispiel **nicht** konfiguriert (offener Punkt) |
| Metrik-Labels mit hoher Kardinalität | Labels nur Routenmuster und Statusklasse, keine IDs |

## Nachweis
- `AT-OPS-002`: Smoke-Test `/metrics` (bestehend) plus Unit-Test des Request-Logs (`apps/server/src/platform/http/server.test.ts`): Eintrag enthält Methode, Route ohne Query, Status, Dauer und Request-ID, aber keine IP-Adresse, keinen Port und keine Query-Werte wie `token=`.
- `MAN-OPS-002`: Review der Protokollfelder – Protokoll [MAN-OPS-002](../../05-umsetzung/nachweise/MAN-OPS-002.md): Normalbetrieb ohne Personenbezug, Korrelations-ID in allen Einträgen; die Lücken P-1 (Request-ID aus dem Client) und P-2 (Rohpfad unbekannter Routen) sind behoben (Request-ID nur als UUID, unbekannte Pfade als `unmatched`). Sicherheitsereignisse (`auth.login`, `auth.login_failed`, `auth.login_throttled`, `access_denied`) tragen nur Pseudonyme.
- Umsetzungsstand 🟡: verteiltes Tracing (z. B. OpenTelemetry) noch nicht zuschaltbar; Backlog.


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 2.0 | 2026-10-23 | Merkmal/Metrik/Akzeptanzkriterium/Messverfahren getrennt (Fallstudie FS-M3) |
| 2.1 | 2026-10-23 | Review v0.2: R-22 (Technik in Messverfahren), R-15 |
| 2.2 | 2026-10-25 | Review v1.3 (RV-R-01, RV-C-07): Request-Log ohne IP und Query umgesetzt (6e6fe40), Nachweis um den Unit-Test ergänzt |
| 2.3 | 2026-10-26 | Nachweis MAN-OPS-002 mit Protokoll verlinkt; P-1/P-2 behoben, Sicherheitsereignisse im Log |
| 2.4 | 2026-10-26 | Verifiziert im finalen Lauf gegen das Docker-Beispiel (AT-OPS-002, MAN-OPS-002 bestanden bzw. ausgeführt); Status → verified |
| 2.5 | 2026-10-26 | Guideline-Review: GL-05 Fehler- und Missbrauchsfälle ergänzt |
