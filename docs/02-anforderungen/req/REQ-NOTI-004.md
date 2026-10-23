---
id: REQ-NOTI-004
title: Authentifizierter E-Mail-Versand (SPF, DKIM, DMARC)
type: operational
class: quality
status: approved
owner: team-kommunikation
risk: high
reviewers: [product-owner, architecture-lead, qa-lead]
release: R1
moscow: W
kano: basis
epic: EPIC-12
source: Zustellbarkeit an Hochschul-Postfächer
use_cases: [UC-23]
version: 1.2
created: 2026-10-20
last_updated: 2026-10-23
verification: [MAN-NOTI-004]
---

# REQ-NOTI-004 Authentifizierter E-Mail-Versand (SPF, DKIM, DMARC)

## Anforderung
Im Echtbetrieb **müssen** E-Mails über eine Absenderdomain versendet werden, die gültige SPF-, DKIM- und DMARC-Einträge (Richtlinie mindestens `quarantine`) hat, damit sie Hochschul-Postfächer zuverlässig erreichen.

**N/A im Docker-Beispiel → EPIC-12.** Im Beispiel verlassen keine E-Mails den Rechner (Mailpit, ADR-0010).

## Begründung
Ohne Absenderauthentifizierung landen Verifikationsmails im Spam; ohne Verifikation keine Registrierung.

## Qualitätsmerkmal, Metrik, Messverfahren
| Feld | Festlegung |
|---|---|
| Qualitätsmerkmal (ISO 25010) | Compatibility → Interoperability; Security → Authenticity |
| Metrik | Bewertung durch mail-tester.com sowie Zustellung an ein Testpostfach `@studmail.hwg-lu.de` |
| Akzeptanzkriterium | mail-tester **≥ 9/10**, Zustellung in den Posteingang (nicht Spam) |
| Messverfahren | Versand je einer Verifikations- und einer Benachrichtigungsmail aus der Produktionskonfiguration |
| Messkontext | Echtbetrieb vor Go-Live, danach bei jeder Änderung der Mailkonfiguration |

## Nachweis
- `MAN-NOTI-004`: Protokoll des mail-tester-Laufs und der Testzustellung (erst im Echtbetrieb).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog, N/A für das Beispiel |
| 1.1 | 2026-10-23 | Eigene Datei, Messverfahren; MoSCoW für R1 auf W (EPIC-12) |
| 1.2 | 2026-10-23 | Review v0.2: Reviewer nach Fachgebiet (R-16); Status in-review → approved nach Review |
