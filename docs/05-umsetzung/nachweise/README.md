# Protokolle manueller Nachweise und Kontrollen

Protokolle der manuellen Nachweise (`MAN-…`) und Kontrollen (`CTRL-…`) aus dem [Nachweiskatalog](../../02-anforderungen/nachweise.md). Es sind Übungen im Rahmen der Fallstudie. Personen, Szenarien und einzelne Messwerte sind fiktiv, wo das Protokoll es so kennzeichnet (Q-28). Stand: 2026-10-26.

## Betrieb und Verfügbarkeit

| Nachweis | Anforderung | Ergebnis | Protokoll |
|---|---|---|---|
| MAN-OPS-008 | REQ-OPS-008 Überwachung und Alarmierung | bestanden: Alarm-Mail nach 196 s (Ziel ≤ 5 min), Entwarnung nach 295 s | [MAN-OPS-008.md](MAN-OPS-008.md) |
| MAN-OPS-011 | REQ-OPS-011 Betriebshandbuch, Störungsprozess | durchgeführt: Störung nach 3 min 32 s behoben; Code-Befund B-1 (Absturz bei DB-Ausfall) behoben und durch AT-OPS-001-3 abgesichert; Handbuch-Befunde H-1 bis H-4 eingearbeitet | [MAN-OPS-011.md](MAN-OPS-011.md) |
| MAN-AVAIL-002 | REQ-AVAIL-002 Wiederherstellungsziele | RTO 26 s (bestanden); RPO der Echtbetriebs-Anforderung mit täglicher Sicherung nicht erreichbar | [MAN-AVAIL-002.md](MAN-AVAIL-002.md) |
| MAN-OPS-003 | REQ-OPS-003 Schnellstart | bestanden (simuliert): 1 min 16 s bis zur Anmeldung | [MAN-OPS-003.md](MAN-OPS-003.md) |
| MAN-PORT-001 | REQ-PORT-001 Entwicklungsumgebung | bestanden (simuliert): 3 min 25 s; Befunde P-1 bis P-4 behoben | [MAN-PORT-001.md](MAN-PORT-001.md) |
| MAN-NOTI-004 | REQ-NOTI-004 Zustellbarkeit | als Übung bestanden: Header echt geprüft, mail-tester-Werte fiktiv; Befunde N-1 (Absenderdomain) und N-2 (`Reply-To`) behoben | [MAN-NOTI-004.md](MAN-NOTI-004.md) |
| CTRL-DLQ | REQ-NOTI-005 Zustellung ohne Verlust | bestanden: nach 302 s steht die gescheiterte Mail in der Dead-Letter-Ansicht, App bleibt erreichbar; wöchentlich in `ops-weekly.yml` | [CTRL-DLQ.md](CTRL-DLQ.md) |

## Dokument-Kontrollen (Guideline-Review GL-07)

Jede Kontrolle prüft ein Dokument gegen die Prüfpunkte im Nachweiskatalog. Nach bestandener Kontrolle steht das Dokument auf `approved`. Prüfer sind fiktive Rollen (Q-28).

| Nachweis | Anforderung | Ergebnis | Protokoll |
|---|---|---|---|
| CTRL-DOC-LEGAL-TEXTE | REQ-LEGAL-001…005 Rechtstexte | bestanden (2026-10-26) | [CTRL-DOC-LEGAL-TEXTE.md](CTRL-DOC-LEGAL-TEXTE.md) |
| CTRL-DOC-VVT | REQ-LEGAL-011 VVT | bestanden (2026-10-26) | [CTRL-DOC-VVT.md](CTRL-DOC-VVT.md) |
| CTRL-DOC-TOM | REQ-LEGAL-011 TOMs | bestanden (2026-10-26) | [CTRL-DOC-TOM.md](CTRL-DOC-TOM.md) |
| CTRL-DOC-AVV | REQ-LEGAL-012 Auftragsverarbeitung | bestanden (2026-10-26) | [CTRL-DOC-AVV.md](CTRL-DOC-AVV.md) |
| CTRL-DOC-DATENPANNE | REQ-LEGAL-013 Datenpannen-Prozess | bestanden (2026-10-26) | [CTRL-DOC-DATENPANNE.md](CTRL-DOC-DATENPANNE.md) |
| CTRL-DOC-DSA | REQ-LEGAL-008 DSA-Prozesse | bestanden (2026-10-26) | [CTRL-DOC-DSA.md](CTRL-DOC-DSA.md) |
| CTRL-DOC-DAC7 | REQ-LEGAL-009 DAC7 | bestanden (2026-10-26) | [CTRL-DOC-DAC7.md](CTRL-DOC-DAC7.md) |
| CTRL-DOC-DSFA | REQ-PRIV-007 DSFA | bestanden (2026-10-26) | [CTRL-DOC-DSFA.md](CTRL-DOC-DSFA.md) |
| CTRL-DOC-BACKUP | REQ-AVAIL-003 Sicherung | bestanden (2026-10-26) | [CTRL-DOC-BACKUP.md](CTRL-DOC-BACKUP.md) |
| CTRL-DOC-MAIL | REQ-OPS-010 Mail-Zustellbarkeit | bestanden (2026-10-26) | [CTRL-DOC-MAIL.md](CTRL-DOC-MAIL.md) |
| CTRL-DOC-BETRIEB | REQ-OPS-011, REQ-SEC-012 Betrieb | bestanden (2026-10-26) | [CTRL-DOC-BETRIEB.md](CTRL-DOC-BETRIEB.md) |
| CTRL-DOC-PENTEST | REQ-SEC-013 Pentest-Plan | bestanden (2026-10-26) | [CTRL-DOC-PENTEST.md](CTRL-DOC-PENTEST.md) |

## Recht und Datenschutz

| Nachweis | Anforderung | Ergebnis | Protokoll |
|---|---|---|---|
| MAN-LEGAL-013 | REQ-LEGAL-013 Datenpannen-Prozess | bestanden: Tabletop mit fiktivem Szenario, Meldung nach 28 h 50 min (Frist 72 h); Befunde T-1 bis T-6 im Prozess eingearbeitet | [MAN-LEGAL-013.md](MAN-LEGAL-013.md) |
| MAN-PRIV-007 | REQ-PRIV-007 Datenschutz-Folgenabschätzung | Übungs-DSFA mit fiktiver Stellungnahme der DSB | [dsfa.md](../../06-recht/dsfa.md) |

## Architektur, Code und Sicherheit

| Nachweis | Anforderung | Ergebnis | Protokoll |
|---|---|---|---|
| MAN-ARCH-001 | REQ-ARCH-001 Bezahlung später ohne Umbau (QS-5) | erfüllt: `PaymentPort`, Ereignisse im selben Commit, Regel `no-payment-sdk-in-modules` | [MAN-ARCH-001.md](MAN-ARCH-001.md) |
| MAN-ARCH-004 | REQ-ARCH-004 Mandantenfähiges Datenmodell | erfüllt; Index- und Löschbefunde S-1 bis S-8 mit Migration 0005 behoben, S-9 vor EPIC-10 | [MAN-ARCH-004.md](MAN-ARCH-004.md) |
| MAN-OPS-002 | REQ-OPS-002 Beobachtbarkeit ohne Personenbezug | erfüllt nach Korrektur von P-1 (Request-ID nur UUID) und P-2 (`unmatched`); Tracing weiter offen | [MAN-OPS-002.md](MAN-OPS-002.md) |
| MAN-UX-002 | REQ-UX-002 Übersetzbare Oberfläche | erfüllt: 613 Schlüssel de/en, Systemnachrichten als Code | [MAN-UX-002.md](MAN-UX-002.md) |
| MAN-SEC-009 | REQ-SEC-009 Threat Model | 39 Bedrohungen, 32 umgesetzt und getestet, 7 begründet akzeptiert, 0 offen | [threat-model.md](../../03-architektur/threat-model.md) |
| MAN-SEC-001 | REQ-SEC-001 OWASP ASVS Level 2 | 84 % der 190 anwendbaren Kontrollen erfüllt, 6 nicht erfüllt (Backlog B-59 bis B-63); ZAP ohne Befund | [MAN-SEC-001.md](MAN-SEC-001.md), [zap/](zap/) |
| MAN-SEC-013 | REQ-SEC-013 Penetrationstest | Übungs-Pentest: 47 von 49 Prüfungen bestanden, 2 akzeptierte Demo-Befunde, kein kritischer oder hoher Befund | [MAN-SEC-013.md](MAN-SEC-013.md), [pentest-results.json](pentest-results.json) |

## Vorbereitet, aber noch kein Nachweis

Diese Nachweise brauchen echte Testpersonen. Leitfäden und Vorlagen liegen bereit. Die fiktiven Beispielprotokolle zeigen nur, wie ein ausgefülltes Protokoll aussieht; sie sind **kein Nachweis** und zählen nicht für den Status `verified`.

| Nachweis | Anforderung | Unterlagen |
|---|---|---|
| MAN-A11Y-001, MAN-A11Y-002 | REQ-A11Y-001, REQ-A11Y-002 | [Leitfaden Screenreader](leitfaden-screenreader.md), [Protokollvorlage](protokollvorlage-screenreader.md), [fiktives Beispiel – kein Nachweis](MAN-A11Y-001-fiktiv.md) |
| MAN-LST-001 | REQ-LST-001 | [Leitfaden Usability-Test](leitfaden-usability.md), [Protokollvorlage](protokollvorlage-usability.md), [fiktives Beispiel – kein Nachweis](MAN-LST-001-fiktiv.md) |
