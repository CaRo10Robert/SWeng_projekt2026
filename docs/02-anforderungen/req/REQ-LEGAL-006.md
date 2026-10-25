---
id: REQ-LEGAL-006
title: Begründung an Betroffene bei Moderationsentscheidungen
type: user-story
class: functional
status: implemented
owner: team-vertrauen
risk: high
reviewers: [product-owner, security-lead]
release: R1
moscow: M
moscow_reason: [2]
kano: basis
epic: EPIC-13
source: DSA Art. 16 Abs. 5, Art. 17, Q-22
use_cases: [UC-32, UC-33, UC-34]
depends_on: [REQ-MOD-002, REQ-MOD-003]
version: 1.1
created: 2026-10-24
last_updated: 2026-10-25
verification: [AT-LEGAL-006, AT-LEGAL-006-2]
---

# REQ-LEGAL-006 Begründung an Betroffene bei Moderationsentscheidungen
## Anforderung
Als Mitglied, dessen Anzeige, Nachricht oder Profil entfernt oder dessen Konto gesperrt wurde, möchte ich eine klare und konkrete Begründung mit Hinweis auf meinen Widerspruch erhalten, damit ich die Entscheidung nachvollziehen und mich wehren kann. Als meldendes Mitglied möchte ich das Ergebnis meiner Meldung erfahren.

## Begründung
DSA Art. 17 verlangt eine Begründung an Betroffene, Art. 16 Abs. 5 die Mitteilung an Meldende. Heute geht bereits eine E-Mail mit Entscheidung und Begründung an die Beteiligten (REQ-MOD-003). Es fehlen die Pflichtangaben nach Art. 17 Abs. 3 (verletzte Regel, Hinweis auf automatisierte Erkennung, Rechtsbehelfe im System) und eine Mitteilung im Konto, die ohne E-Mail nachlesbar ist und als Einstieg für den Widerspruch dient (REQ-LEGAL-007).

## Akzeptanzkriterien
Pflichtangaben der Begründung (DSA Art. 17 Abs. 3):

| # | Angabe | Beispiel |
|---|---|---|
| 1 | Maßnahme und Umfang | „Deine Anzeige ‚Klausurlösungen‘ wurde entfernt“ / „Dein Konto wurde dauerhaft gesperrt“ |
| 2 | Tatsachen und Umstände | Freitext des Moderators (mindestens 20 Zeichen) |
| 3 | Automatisierte Erkennung beteiligt? | „Hinweis der automatischen Inhaltsprüfung“ bzw. „Meldung eines Mitglieds“ |
| 4a | Vertragliche Grundlage (lit. e) | Abschnitt der Nutzungsbedingungen bzw. Community-Regeln (Auswahlliste, Pflicht außer bei „keine Maßnahme“) |
| 4b | Rechtsgrundlage bei rechtswidrigen Inhalten (lit. d) | bei Regel „rechtswidriger Inhalt“ Pflichtfeld `legalGround`: verletzte Norm und Erläuterung, warum der Inhalt rechtswidrig ist (mindestens 20 Zeichen), z. B. „§ 241 StGB (Bedrohung): …“ |
| 5 | Rechtsbehelfe | Widerspruch im System (REQ-LEGAL-007) mit Frist und Link; Hinweis auf außergerichtliche Streitbeilegung (`[Platzhalter: Stelle nach DSA Art. 21]`) und den Rechtsweg |

```gherkin
Szenario: Betroffene erhält die Begründung
  Angenommen Saras Anzeige wurde gemeldet
  Wenn ein Moderator sie mit Regel "Verbotene Artikel" und einer Begründung entfernt
  Dann erhält Sara eine E-Mail und eine Mitteilung unter "Meine Mitteilungen" mit den Angaben 1 bis 5
  Und die Mitteilung nennt nicht, wer gemeldet hat

Szenario: Meldender erhält das Ergebnis
  Angenommen Ben hat die Anzeige gemeldet
  Wenn der Moderator entscheidet
  Dann erhält Ben eine Mitteilung und eine E-Mail mit dem Ergebnis ("entfernt" bzw. "keine Maßnahme"), der Begründung und den Rechtsbehelfen (Widerspruch, außergerichtliche Streitbeilegung, Rechtsweg; DSA Art. 16 Abs. 5)
```

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Entscheidung ohne Regel oder mit Begründung < 20 Zeichen (nach Entfernen von Leerzeichen am Rand) | 422 `rule_required` bzw. `reason_too_short`, keine Entscheidung |
| Regel „rechtswidriger Inhalt“ ohne Rechtsgrundlage | 422 `legal_ground_required` |
| Gesperrtes Mitglied kann sich nicht anmelden | Begründung vollständig in der E-Mail, Widerspruch über einmaligen Link (REQ-LEGAL-007) |
| E-Mail-Versand fällt aus | Mitteilung im Konto bleibt; Versand wird wiederholt (REQ-NOTI-005) |
| Identität des Meldenden | wird Betroffenen nie mitgeteilt |
| Konto bereits gelöscht | keine Mitteilung, Entscheidung nur im Audit-Log |

## INVEST
I: setzt auf der bestehenden Moderation auf · N: Darstellung der Mitteilungen verhandelbar · V: Rechtspflicht und Fairness · E: mittel · S: ein Sprint mit REQ-LEGAL-007 · T: Szenarien als API-Test automatisierbar.

## Nachweis
- `AT-LEGAL-006`: Smoke-Test – Entfernen einer gemeldeten Anzeige erzeugt für die Betroffene eine Mitteilung und eine E-Mail mit den Angaben 1–5, ohne Identität des Meldenden; bei „rechtswidriger Inhalt“ ohne Rechtsgrundlage 422 `legal_ground_required`, sonst erscheint die Rechtsgrundlage in Mitteilung und E-Mail.
- `AT-LEGAL-006-2`: Smoke-Test und Unit-Test – der Meldende erhält das Ergebnis mit Begründung und Rechtsbehelfen; Entscheidung ohne Regel, mit zu kurzer Begründung oder ohne Rechtsgrundlage ergibt 422.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-24 | Erstfassung aus dem Abgleich Recht, Auftritt und Betrieb ([06-abgleich-recht-betrieb.md](../06-abgleich-recht-betrieb.md)); als Übung mit Platzhaltern freigegeben (Q-23) |
| 1.1 | 2026-10-25 | Review v1.3 (RV-R-03, RV-R-09): Pflichtangaben nach Art. 17 Abs. 3 lit. d und e getrennt, `legalGround` bei rechtswidrigen Inhalten; Meldende erhalten Begründung und Rechtsbehelfe; Status nach Umsetzung |
