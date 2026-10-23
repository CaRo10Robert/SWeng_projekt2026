---
id: REQ-OPS-002
title: Beobachtbarkeit ohne personenbezogene Daten
type: operational
class: quality
status: in-review
owner: team-plattform
risk: medium
release: R1
moscow: M
kano: n/a
epic: EPIC-00
source: Guideline Kap. 11, REQ-PRIV-002
version: 2.0
created: 2026-10-20
last_updated: 2026-10-23
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
| Akzeptanzkriterium | (1) **100 %**; (2) **0** Fundstellen nach einem vollständigen Smoke-Test; Metrikendpunkt liefert Request-Latenzen, Job-Durchsatz und WebSocket-Verbindungen |
| Messverfahren | Smoke-Test, danach Durchsuchen der Container-Protokolle nach Adressmustern und Testpasswort |
| Messkontext | Docker-Beispiel, Protokollstufe `info` |
| Verhalten bei Verfehlung | Release-Blocker bei personenbezogenen Daten im Protokoll |

## Nachweis
- `AT-OPS-002`: Smoke-Test `/metrics` (bestehend) plus Protokollsuche nach personenbezogenen Daten (neu zu schreiben).
- `MAN-OPS-002`: Review der Protokollfelder.
- Umsetzungsstand 🟡: OpenTelemetry noch nicht zuschaltbar.


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 2.0 | 2026-10-23 | Merkmal/Metrik/Akzeptanzkriterium/Messverfahren getrennt (Fallstudie FS-M3) |
