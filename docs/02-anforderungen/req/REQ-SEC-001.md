---
id: REQ-SEC-001
title: OWASP ASVS Level 2
type: security
class: quality
status: implemented
owner: team-plattform
risk: high
reviewers: [product-owner, security-lead, qa-lead]
review_due: 2027-04-23
release: R1
moscow: M
moscow_reason: [2]
kano: basis
epic: EPIC-00
source: OWASP ASVS 4.0.3 (Ausnahme EX-01 gegenüber 5.0)
version: 1.4
created: 2026-10-20
last_updated: 2026-10-26
verification: [MAN-SEC-001]
---

# REQ-SEC-001 OWASP ASVS Level 2

## Anforderung
Das System muss die Anforderungen des OWASP Application Security Verification Standard auf **Level 2** (geprüft nach Fassung **4.0.3**; die Abweichung von der aktuellen Hauptversion 5.0 ist als Ausnahme [EX-01](../../03-architektur/ausnahmen.md#ex-01-asvs-fassung-403-statt-50) mit Ablaufdatum erfasst) erfüllen, beschränkt auf die für das Docker-Beispiel **anwendbaren** Kapitel: Authentisierung, Sitzungsverwaltung, Autorisierung, Eingabevalidierung und Kodierung, Dateiverarbeitung, sichere Konfiguration, Datenschutz und Protokollierung. Nicht anwendbare Kontrollen (z. B. TLS-Konfiguration und Betrieb im Echtbetrieb, EPIC-12) werden in der Checkliste als N/A mit Begründung geführt.

## Begründung
Die Plattform verarbeitet personenbezogene Daten und private Kommunikation; Level 2 ist der empfohlene Standard für Anwendungen mit solchen Daten.

## Qualitätsmerkmal, Metrik, Messverfahren
| Feld | Festlegung |
|---|---|
| Qualitätsmerkmal (ISO 25010) | Security |
| Metrik | Anteil der anwendbaren ASVS-L2-Kontrollen mit Status „erfüllt“ |
| Akzeptanzkriterium | 100 % der anwendbaren Kontrollen erfüllt oder mit begründeter, befristeter Ausnahme (Ablaufdatum, Genehmigung security-lead); 0 offene Befunde „hoch“ aus dem Pentest-Light |
| Messverfahren | Checkliste je ASVS-Kapitel mit Nachweis (Test, Code-Stelle oder Konfiguration); Pentest-Light mit OWASP ZAP gegen das Docker-Beispiel |
| Messkontext | vor jeder Abgabe/Release; Ergebnis im Repository unter `docs/04-review/` |

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Neue Kontrolle durch Änderung am Code verletzt | CI-Scans (Semgrep, Trivy, gitleaks, pnpm audit) und Regressionstests aus dem Pentest (u. a. AT-SEC-004/-005/-006) brechen den Build |
| Befristete Ausnahme läuft ab | `scripts/trace.mjs` meldet einen Fehler; CI wird rot, bis die Abweichung behoben oder die Ausnahme mit neuer Begründung verlängert ist |
| Neue ASVS-Hauptversion | Review alle 6 Monate (`review_due`, Standards-Register); Abgleich als Mapping-Tabelle (EX-01) |
| Neuer Befund „hoch“ im Pentest | Release-Blocker bis zur Behebung |
| Checkliste veraltet nach größeren Änderungen (z. B. SSO, Bezahlfunktion) | erneute Prüfung der betroffenen Kapitel vor dem Release |

## Nachweis
- `MAN-SEC-001`: ASVS-L2-Checkliste mit Nachweis je Kontrolle und ZAP-Bericht – [MAN-SEC-001](../../05-umsetzung/nachweise/MAN-SEC-001.md), ZAP-Zusammenfassungen in `zap/` (Baseline 0 FAIL / 63 PASS, angemeldeter API-Scan 0 FAIL / 114 PASS).
- Ergebnis (Übung): 190 anwendbare Kontrollen – 159 erfüllt (84 %), 25 teilweise mit befristeter Ausnahme [EX-03](../../03-architektur/ausnahmen.md#ex-03-befristete-asvs-ausnahmen-im-docker-beispiel) (13 %), 6 nicht erfüllt mit befristeter Ausnahme [EX-04](../../03-architektur/ausnahmen.md#ex-04-nicht-erfüllte-asvs-kontrollen-mit-backlog-eintrag) und Backlog-Einträgen B-59, B-61, B-62 (3 %). Pentest: 0 offene Befunde „hoch“.
- Bewertung: Jede anwendbare Kontrolle ist erfüllt oder durch eine genehmigte, befristete Ausnahme im Ausnahmeregister abgedeckt. Das Akzeptanzkriterium ist damit **erfüllt**; die Ausnahmen laufen spätestens am 2027-04-30 ab und werden von `scripts/trace.mjs` überwacht.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei, Metrik und Messverfahren ergänzt |
| 1.2 | 2026-10-23 | Review v0.2: R-15 Umfang auf anwendbare Kapitel begrenzt, Ausnahmen mit Ablaufdatum; R-16 qa-lead, review_due; Status `approved` |
| 1.3 | 2026-10-26 | ASVS 4.0.3 als geprüfte Fassung festgelegt; Checkliste MAN-SEC-001 mit Quote 84 %; offene Kontrollen als B-59…B-63; Status → implemented |
| 1.4 | 2026-10-26 | Guideline-Review: GL-02 Fassung 4.0.3 über Ausnahme EX-01; Kriterium mit EX-03/EX-04 erfüllt; GL-05 Fehler- und Missbrauchsfälle |
