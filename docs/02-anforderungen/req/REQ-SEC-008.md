---
id: REQ-SEC-008
title: Sicherheitsprüfungen in der CI-Pipeline
type: security
class: constraint
status: verified
owner: team-plattform
risk: medium
release: R1
moscow: M
moscow_reason: [2, 4]
kano: n/a
epic: EPIC-00
source: Guideline Kap. 07, NIST SSDF
version: 1.5
created: 2026-10-20
last_updated: 2026-10-26
review_due: 2027-10-26
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
- `CTRL-CI-SCAN`: Pipeline-Lauf mit den vier Prüfungen und SBOM-Artefakt – CI-Job `security-scans`: SAST mit Semgrep (Regelsätze JavaScript, TypeScript, OWASP Top Ten, SARIF-Bericht), SCA mit `pnpm audit --audit-level high`, Secret-Scan mit gitleaks über die gesamte Historie, Image-Scan mit Trivy (HIGH/CRITICAL brechen den Lauf ab), SBOM im CycloneDX-Format als Artefakt `security-reports`.
- Befunde der Ersteinrichtung (2026-10-26) und Behandlung: 2 kritische und 9 hohe Abhängigkeitsbefunde durch Updates behoben (sharp 0.35.5, @fastify/static 10.1.5, @fastify/swagger-ui 6.1.1, nodemailer 10.0.16, vitest 4.1.11); 11 hohe Image-Befunde durch Entfernen von npm, npx, corepack und yarn aus dem Runtime-Image behoben.
- Begründete Ausnahmen mit Ablaufdatum: `.gitleaks.toml` (drei feste Testwerte, bis 2027-04), `.trivyignore` mit `--ignore-unfixed` für Debian-Pakete ohne verfügbaren Fix (bis 2027-01), gezielte `nosemgrep`-Kommentare mit Begründung in `notifications/index.ts`.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei, Fehlschlagkriterien ergänzt |
| 1.2 | 2026-10-23 | Review v0.2: R-04 Fehler- und Missbrauchsfälle; R-15 moscow_reason (Kriterium 4: Guideline); Status `approved` |
| 1.3 | 2026-10-26 | Security-Scans in CI eingerichtet (B-06), Befunde und Ausnahmen dokumentiert; Status → implemented |
| 1.4 | 2026-10-26 | Verifiziert im finalen Lauf gegen das Docker-Beispiel (CTRL-CI-SCAN bestanden bzw. ausgeführt); Status → verified |
| 1.5 | 2026-10-26 | Guideline-Review: GL-06 review_due (NIST SSDF, jährlich) |
