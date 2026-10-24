---
id: REQ-NOTI-001
title: Transaktionale E-Mails
type: user-story
class: functional
status: implemented
owner: team-kommunikation
risk: high
reviewers: [product-owner, security-lead]
release: R1
moscow: M
moscow_reason: [1, 2]
kano: basis
epic: EPIC-05
source: BG-1, DSA Art. 17, DSGVO Art. 17
use_cases: [UC-23]
depends_on: [REQ-AUTH-002, REQ-AUTH-004, REQ-AUTH-006, REQ-NOTI-002, REQ-LST-008, REQ-MOD-003, REQ-ACC-002, REQ-NOTI-005]
version: 2.1
created: 2026-10-20
last_updated: 2026-10-24
verification: [AT-NOTI-001, AT-NOTI-001-2]
---

# REQ-NOTI-001 Transaktionale E-Mails

## Anforderung
Als Mitglied möchte ich zu sicherheits- und vorgangsrelevanten Ereignissen eine E-Mail an meine Hochschuladresse erhalten, damit ich auch ohne geöffnete Plattform handeln kann.

Jede Mail trägt eine Fußzeile mit Absender, Impressum und Datenschutz (REQ-UX-006); die Moderationsmitteilung enthält die Pflichtangaben nach REQ-LEGAL-006; Header für die Zustellbarkeit regelt REQ-OPS-010.

Das System **muss** folgende E-Mails versenden:

| E-Mail | Auslöser | Abbestellbar |
|---|---|---|
| Verifikation | Registrierung, erneutes Anfordern | nein |
| Passwort zurücksetzen | Anforderung | nein |
| „Konto existiert bereits“ | Registrierung mit bestehender Adresse (REQ-AUTH-004) | nein |
| Neue Nachricht | ungelesene Nachricht (REQ-NOTI-002) | ja |
| Ablauf-Erinnerung | 7 Tage vor Ablauf (REQ-LST-008) | ja |
| Moderationsentscheidung | Entscheidung zu Meldung (REQ-MOD-003) | nein |
| Löschung angekündigt / abgeschlossen | Kontolöschung (REQ-ACC-002) | nein |

Alle E-Mails sind auf Deutsch, enthalten einen Link zur Plattform und keine Chatinhalte. Die Re-Verifikationsmail gehört zu REQ-AUTH-007 (R2, Entscheidung Q-14); die Kontaktfreigabe (REQ-CHAT-010) hat keine eigene Mailart.

## Begründung
Ohne Verifikationsmail ist keine Registrierung möglich (BG-1). Moderations- und Löschmitteilungen sind rechtlich gefordert.

**Must-Begründung:** Kriterium 1 (Release-Ziel nicht ohne sie erreichbar); Kriterium 2 (Sicherheits-, Datenschutz- oder Rechtsrisiko bei Fehlen).

## Akzeptanzkriterien
```gherkin
Szenario: Verifikationsmail
  Wenn ich mich mit "lea@studmail.hwg-lu.de" registriere
  Dann erhalte ich innerhalb von 10 Sekunden eine E-Mail mit einem Bestätigungslink

Szenario: Moderationsentscheidung
  Angenommen meine Anzeige wurde nach einer Meldung entfernt
  Dann erhalte ich eine E-Mail mit Entscheidung und Begründung
```

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Mailserver nicht erreichbar | Zustellung wird nachgeholt (REQ-NOTI-005) |
| Empfänger gesperrt | keine Vorgangs-Mails mehr |
| Mehrfache Anforderung (Reset, Verifikation) | Rate-Limit (REQ-SEC-005) |

## INVEST
I: Versandzuverlässigkeit separat (REQ-NOTI-005) · N: Texte verhandelbar · V: Voraussetzung für Registrierung · E/S: je Mailart klein · T: Mail-Catcher im Test.

## Nachweis
- `AT-NOTI-001`: Smoke-Test – Verifikationsmail erscheint in Mailpit.
- `AT-NOTI-001-2`: Integrationstest – je Mailart Auslöser ausführen und Eingang im Mail-Catcher prüfen (neu).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei, Tabelle der Mailarten mit Abbestellbarkeit |
| 2.0 | 2026-10-23 | Review v0.2: R-15/R-21 Re-Verifikationsmail nach REQ-AUTH-007 (R2) verschoben, damit vollständig umgesetzt; `depends_on` gefüllt; Must-Begründung |
| 2.1 | 2026-10-24 | Abgleich Recht und Betrieb: Fußzeile mit Absender, Impressum und Datenschutz in jeder Mail (REQ-UX-006); Moderationsmitteilung mit Pflichtangaben nach REQ-LEGAL-006; Zustellbarkeit REQ-OPS-010 |
