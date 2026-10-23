---
id: REQ-SEC-008
title: Sicherheitsprüfungen in der CI-Pipeline
type: security
class: constraint
status: approved
owner: team-plattform
risk: medium
release: R1
moscow: M
moscow_reason: [2, 4]
kano: n/a
epic: EPIC-00
source: Guideline Kap. 07, NIST SSDF
version: 1.2
created: 2026-10-20
last_updated: 2026-10-23
verification: [CTRL-CI-SCAN]
---

# REQ-SEC-008 Sicherheitsprüfungen in der CI-Pipeline

## Anforderung
Jede Änderung muss vor der Zusammenführung automatisch geprüft werden auf: Schwachstellen im eigenen Code (SAST), verwundbare Abhängigkeiten (SCA), eingecheckte Geheimnisse, Schwachstellen im Container-Image. Pro Release wird eine Software-Stückliste (SBOM) erzeugt.

## Begründung
Lieferkettenrisiken und versehentlich eingecheckte Geheimnisse sind ohne Automatisierung nicht beherrschbar.

## Akzeptanzkriterien
- Befunde der Schwere „kritisch“ oder „hoch“ lassen die Pipeline fehlschlagen.
- Ein gefundenes Geheimnis lässt die Pipeline fehlschlagen.
- Jeder Release-Build enthält eine SBOM im CycloneDX-Format als Artefakt.

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Fehlalarm eines Scanners | Ausnahme mit Begründung, Ablaufdatum und Genehmigung security-lead im Repository; ohne Ausnahme bleibt die Pipeline rot |
| Scanner oder Datenbank der Schwachstellen nicht erreichbar | Pipeline schlägt fehl statt stillschweigend zu bestehen |
| Geheimnis wurde bereits eingecheckt | Geheimnis gilt als kompromittiert und wird gewechselt; Entfernen aus der Historie allein genügt nicht |

## Nachweis
- `CTRL-CI-SCAN`: Pipeline-Lauf mit den vier Prüfungen und SBOM-Artefakt.
- Stand: **nicht umgesetzt** (Umsetzungsstand ⬜).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei, Fehlschlagkriterien ergänzt |
| 1.2 | 2026-10-23 | Review v0.2: R-04 Fehler- und Missbrauchsfälle; R-15 moscow_reason (Kriterium 4: Guideline); Status `approved` |
