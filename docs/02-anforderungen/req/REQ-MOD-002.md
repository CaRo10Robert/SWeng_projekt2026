---
id: REQ-MOD-002
title: Moderations-Queue bearbeiten
type: user-story
class: functional
status: verified
owner: team-vertrauen
risk: high
reviewers: [product-owner, security-lead]
release: R1
moscow: M
moscow_reason: [2]
kano: basis
epic: EPIC-06
source: DSA Art. 16/17, BG-4
use_cases: [UC-32, UC-33, UC-34]
depends_on: [REQ-MOD-001, REQ-SEC-006]
version: 1.5
created: 2026-10-20
last_updated: 2026-10-25
verification: [AT-MOD-002, AT-MOD-002-2, AT-MOD-002-3]
---

# REQ-MOD-002 Moderations-Queue bearbeiten
## Anforderung
Als Moderator möchte ich offene Meldungen mit ihrem Kontext in einer Queue sehen und je Fall eine der Entscheidungen *keine Maßnahme*, *Inhalt entfernen*, *verwarnen* oder *sperren* mit Begründung treffen, damit Verstöße nachvollziehbar behandelt werden.

Ein gemeldeter Fall ist **spätestens 10 Sekunden** nach der Meldung in der Queue sichtbar. Die Sperre ist in R1 immer **dauerhaft**; befristete Sperren laufen nicht im System (Entscheidungslog Q-15). Widersprüche (DSA Art. 20) werden im System eingelegt und von einem anderen Moderator entschieden (REQ-LEGAL-007, Q-22); Inhalt der Begründung an Betroffene nach REQ-LEGAL-006; Kennzeichnung eines Straftatverdachts nach REQ-LEGAL-008.

## Begründung
Ohne Bearbeitung laufen Meldungen ins Leere; DSA Art. 16/17 verlangt eine begründete Entscheidung.

## Akzeptanzkriterien
```gherkin
Szenario: Inhalt entfernen
  Angenommen in der Queue liegt ein Fall zur Anzeige "Altklausuren mit Klausurlösungen"
  Wenn ich als Moderator "Inhalt entfernen" mit der Begründung "Prüfungslösungen sind verboten" wähle
  Dann ist die Anzeige für Mitglieder nicht mehr sichtbar
  Und der Fall wechselt nach "Entschieden"

Szenario: Wortfilter-Fall freigeben
  Angenommen eine Anzeige wurde vom Wortfilter angehalten
  Wenn ich "keine Maßnahme" wähle
  Dann wird die Anzeige veröffentlicht

Szenario: Sperren
  Wenn ich "sperren" wähle
  Dann kann sich das betroffene Mitglied nicht mehr anmelden
  Und seine Anzeigen sind nicht mehr sichtbar
  Und die Adresse kann nicht erneut registriert werden (REQ-AUTH-008)

Szenario: Fall erscheint in der Queue
  Angenommen ein Mitglied meldet eine Nachricht
  Wenn ich als Moderator die Queue öffne
  Dann ist der Fall spätestens 10 Sekunden nach der Meldung mit gemeldetem Kontext sichtbar
```

| Entscheidung | Anzeige | Nachricht | Profil |
|---|---|---|---|
| keine Maßnahme | wird (wieder) sichtbar | bleibt | bleibt |
| entfernen | entfernt | Text durch Hinweis ersetzt | wie verwarnen |
| verwarnen | bleibt, Mitteilung an Betroffene | bleibt, Mitteilung | Mitteilung |
| sperren | entfernt, Konto gesperrt | Text ersetzt, Konto gesperrt | Konto gesperrt |

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Mitglied ohne Moderatorrolle ruft die Queue auf | 403 |
| Fall wurde parallel bereits entschieden | 409, keine zweite Entscheidung |
| Moderator ist selbst betroffen | Entscheidung abgelehnt |
| Begründung fehlt oder kürzer als 20 Zeichen (nach Entfernen von Leerzeichen am Rand), Regel fehlt, bei „rechtswidriger Inhalt“ Rechtsgrundlage fehlt | 422 (`reason_too_short`, `rule_required`, `legal_ground_required`; REQ-LEGAL-006) |
| Widerspruch gegen eine Entscheidung | im System als Fall „Widerspruch“, ein anderer Moderator entscheidet (REQ-LEGAL-007, Q-22) |

## INVEST
I: setzt REQ-MOD-001 voraus · N: Darstellung verhandelbar · V: Rechtspflicht · E: mittel · S: ein Sprint · T: Entscheidungstabelle automatisierbar.

## Nachweis
- `AT-MOD-002`: Smoke-Test – Moderator sieht Seed-Meldung und Wortfilter-Fall und entscheidet „entfernen“ (bestehend: „Moderations-Queue …“, „Moderationsentscheidung“).
- `AT-MOD-002-2`: Smoke-Test – Mitglied erhält 403 auf die Queue (bestehend: „Mitglied hat keinen Zugriff auf Moderation“).
- `AT-MOD-002-3`: Smoke-Test – eine über die API erstellte Meldung ist innerhalb von 10 s in der Queue (neu).


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei mit Front Matter, Kano und Nachweis-IDs |
| 1.2 | 2026-10-23 | Review v0.2: R-08 (nur dauerhafte Sperre, Widerspruch per E-Mail, „zeitnah“ → ≤ 10 s), R-15, R-16 |
| 1.3 | 2026-10-24 | Verifiziert im finalen Lauf gegen das Docker-Beispiel (AT-MOD-002, AT-MOD-002-2, AT-MOD-002-3 bestanden bzw. ausgeführt); Status → verified |
| 1.4 | 2026-10-24 | Abgleich Recht und Betrieb: Widerspruch läuft jetzt im System (Q-22, REQ-LEGAL-007), Begründung an Betroffene nach REQ-LEGAL-006, Kennzeichnung Straftatverdacht (REQ-LEGAL-008); geprüftes Verhalten der Queue unverändert, Status bleibt |
| 1.5 | 2026-10-25 | Review v1.3 (RV-R-10): Mindestlänge der Begründung 20 Zeichen wie REQ-LEGAL-006 und Code; Regel und Rechtsgrundlage als Pflichtangaben |
