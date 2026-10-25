---
id: LEGAL-REGISTER
type: register
status: in-review
owner: product-owner
version: 1.1
created: 2026-10-24
last_updated: 2026-10-25
---

# Rechtskataster

> **Muster im Rahmen einer Übungsaufgabe – keine rechtsverbindlichen Angaben; vom Justiziariat und der/dem Datenschutzbeauftragten der Hochschule zu prüfen.**

Das Kataster ordnet jeder einschlägigen Norm die Pflicht, die Umsetzung in CampusMarkt und den Stand zu. Betreiber im Muster ist die Hochschule als öffentliche Stelle in Rheinland-Pfalz (Q-23).

Stand: **umgesetzt** = im Code oder Docker-Beispiel vorhanden; **dokumentiert** = Prozess oder Text liegt als Muster vor; **Echtbetrieb** = erst mit echtem Betrieb erfüllbar.

## Information und Transparenz

| Norm | Pflicht | Umsetzung / Artefakt | Anforderung | Stand |
|---|---|---|---|---|
| § 5 DDG, Auffangnorm § 18 Abs. 1 MStV | Impressum leicht erkennbar, unmittelbar erreichbar, ständig verfügbar | Seite „Impressum“, Link in Fußzeile jeder Seite und jeder E-Mail | REQ-LEGAL-001, REQ-UX-006 | umgesetzt (B-43); Anwendbarkeit § 5 DDG offen |
| Art. 13 DSGVO | Informationspflichten bei Erhebung | Datenschutzerklärung, Link bei der Registrierung, Hinweis bei neuer Fassung | REQ-LEGAL-002 | umgesetzt (B-43, Review v1.3) |
| Art. 12 DSGVO | präzise, verständlich, leicht zugänglich | einfache Sprache, Tabellen, Link überall | REQ-LEGAL-002, REQ-UX-006 | dokumentiert |
| § 25 TDDDG | Einwilligung für nicht notwendige Speicherung auf Endgeräten | nur notwendige Speicherung, kein Banner; Prüfung neuer Speicherung | REQ-LEGAL-010, Q-24 | umgesetzt (B-49) |
| Art. 14 DSA | verständliche AGB inkl. Moderationsregeln und algorithmischer Hilfsmittel | Nutzungsbedingungen, Community-Regeln (Wortfilter, vorläufiges Ausblenden offengelegt) | REQ-LEGAL-003, REQ-MOD-004 | umgesetzt |
| LGGBehM RLP und Landesverordnung [Platzhalter], RL (EU) 2016/2102, Durchführungsbeschluss (EU) 2018/1523 | barrierefreie Gestaltung, Erklärung zur Barrierefreiheit, Feedback-Mechanismus | WCAG-Tests, Erklärung, Feedback-Kontakt | REQ-A11Y-001/002, REQ-LEGAL-004 | teilweise umgesetzt (manuelle Prüfung offen) |

## Datenschutz

| Norm | Pflicht | Umsetzung / Artefakt | Anforderung | Stand |
|---|---|---|---|---|
| Art. 5, 25 DSGVO | Datenminimierung, Privacy by Design | Kontaktfreigabe, keine Tracker, Pseudonymisierung | REQ-PRIV-002, REQ-PRIV-006 | umgesetzt |
| Art. 6 DSGVO | Rechtsgrundlage je Verarbeitung | VVT | REQ-LEGAL-011 | dokumentiert |
| Art. 5 Abs. 2, Art. 7 DSGVO | Nachweis der Zustimmung zu den Nutzungsbedingungen (keine Einwilligung) bzw. der echten Einwilligung (Kontaktfreigabe) | versionierte Zustimmung, Kenntnisnahme der Datenschutzerklärung | REQ-PRIV-001, REQ-CHAT-010 | umgesetzt |
| Art. 15–21 DSGVO | Betroffenenrechte | Export, Profil ändern, Konto löschen; Rest per E-Mail an DSB | REQ-ACC-001…003 | umgesetzt |
| Art. 17 DSGVO, Art. 5 Abs. 1 lit. e | Löschung, Speicherbegrenzung | Löschkonzept, täglicher Lauf, Löschjournal für Wiederherstellungen | REQ-PRIV-003, REQ-AVAIL-003 | teilweise umgesetzt |
| Art. 28 DSGVO | Auftragsverarbeitungsverträge | [Übersicht](auftragsverarbeitung.md) | REQ-LEGAL-012 | Echtbetrieb |
| Art. 30 DSGVO | Verzeichnis der Verarbeitungstätigkeiten | [VVT](vvt.md) | REQ-LEGAL-011 | dokumentiert |
| Art. 32 DSGVO | Sicherheit der Verarbeitung | [TOMs](toms.md) | REQ-LEGAL-011, REQ-SEC-* | dokumentiert, überwiegend umgesetzt |
| Art. 33, 34 DSGVO | Meldung von Datenpannen binnen 72 h | [Prozess](datenpannen-prozess.md) | REQ-LEGAL-013 | dokumentiert |
| Art. 35 DSGVO | DSFA bei hohem Risiko | [Schwellwertanalyse](dsfa-schwellwertanalyse.md): DSFA vor Echtbetrieb erforderlich (Kriterien 4 und 7) | REQ-PRIV-007 | dokumentiert, DSFA offen |
| Art. 37–39 DSGVO | Benennung DSB, Kontaktdaten veröffentlichen | Datenschutzerklärung | REQ-LEGAL-002 | dokumentiert (Platzhalter) |
| Kap. V DSGVO | keine ungesicherte Drittlandübermittlung | keine Drittanbieter, Hosting EU | REQ-PRIV-005, REQ-PRIV-006 | umgesetzt im Beispiel |
| [Platzhalter: LDSG RLP] | landesrechtliche Ergänzungen für öffentliche Stellen | im VVT als Rechtsgrundlage | REQ-LEGAL-011 | zu prüfen |

## Plattformpflichten (Digital Services Act)

| Norm | Pflicht | Umsetzung / Artefakt | Anforderung | Stand |
|---|---|---|---|---|
| Art. 11, 12 DSA | Kontaktstellen für Behörden und Nutzer | Seite „Kontakt“ mit eigener Behördenadresse | REQ-LEGAL-005 | umgesetzt |
| Art. 16 DSA | Melde- und Abhilfeverfahren | Melden, Queue, Bestätigung | REQ-MOD-001/002 | umgesetzt |
| Art. 16 Abs. 5 DSA | Mitteilung an Meldende mit Rechtsbehelfen | Mitteilung und E-Mail | REQ-MOD-003, REQ-LEGAL-006 | umgesetzt |
| Art. 17 DSA | Begründung von Beschränkungen (lit. d Rechtsgrundlage, lit. e vertragliche Grundlage) | Mitteilung mit Pflichtangaben, `legalGround` | REQ-LEGAL-006 | umgesetzt (B-46) |
| Art. 18 DSA | Meldung von Straftaten | Kennzeichen, Eskalation | REQ-LEGAL-008 | umgesetzt (B-47) |
| Art. 20 DSA | internes Beschwerdemanagement (≥ 6 Monate) | Widerspruch, Vier-Augen | REQ-LEGAL-007, Q-22 | umgesetzt (B-46) |
| Art. 15, 24 DSA, DVO (EU) 2024/2835 | Transparenzbericht mit Pflichtvorlagen | jährlich aus Audit-Log | [DSA-Prozesse](dsa-prozesse.md) | Echtbetrieb, Vorlagen prüfen |
| Art. 3 lit. i, Art. 19 DSA | Anwendbarkeit (Entgeltlichkeit, KMU-Ausnahme) | offener Prüfpunkt | [DSA-Prozesse](dsa-prozesse.md) | offen (Justiziariat) |

## Steuern

| Norm | Pflicht | Umsetzung / Artefakt | Anforderung | Stand |
|---|---|---|---|---|
| PStTG (DAC7) | Meldung von Verkäufern ab 30 Verkäufen oder 2.000 € je Jahr bis 31.01. | Auswertung, CSV; Meldung im Echtbetrieb | REQ-LEGAL-009, Q-26 | umgesetzt (B-48); Anwendbarkeit § 3 PStTG und Tausch offen (Steuerabteilung) |

## Sicherheit und Betrieb

| Norm / Standard | Pflicht | Umsetzung / Artefakt | Anforderung | Stand |
|---|---|---|---|---|
| Art. 32 DSGVO, [Platzhalter: IT-Sicherheitsrichtlinie der Hochschule] | angemessene Sicherheit, regelmäßige Überprüfung | ASVS L2, Pentest vor Go-live | REQ-SEC-001, REQ-SEC-013 | geplant |
| RFC 9116 (Empfehlung) | Kontakt für Sicherheitslücken | `/.well-known/security.txt` | REQ-SEC-012 | umgesetzt (B-52) |
| Art. 32 Abs. 1 lit. c DSGVO | Wiederherstellbarkeit | Backup und Restore-Test | REQ-AVAIL-003 | umgesetzt (B-56) |

## Urheber- und Persönlichkeitsrecht

| Norm | Pflicht | Umsetzung | Anforderung | Stand |
|---|---|---|---|---|
| UrhG, KUG | Rechte an Bildern, Abbildung von Personen | Nutzungsbedingungen Abschnitt 5 und 6; Melden möglich | REQ-LEGAL-003 | dokumentiert |

## Später: Bezahlfunktion (EPIC-09)

Kommt eine Online-Zahlung dazu, gelten zusätzlich:
- **ZAG** (Zahlungsdiensteaufsichtsgesetz) und **PSD2**: Wer Zahlungen für Dritte entgegennimmt und weiterleitet, braucht in der Regel eine Erlaubnis der BaFin.
- **GwG** (Geldwäschegesetz): Identifizierung (KYC) und Sorgfaltspflichten.
- **DAC7**: zusätzlich Finanzkonto und Gebühren melden.

Diese Pflichten entfallen weitgehend für die Hochschule, wenn ein **lizenzierter Zahlungsdienstleister** die Zahlung abwickelt. Dessen Anbindung erfolgt hinter dem **PaymentPort** (ADR-0006), sodass kein Geld über Konten der Hochschule fließt.
