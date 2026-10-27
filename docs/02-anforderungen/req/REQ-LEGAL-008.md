---
id: REQ-LEGAL-008
title: Verdacht auf Straftaten kennzeichnen und eskalieren
type: business-rule
class: functional
status: verified
owner: team-vertrauen
risk: high
reviewers: [product-owner, security-lead]
release: R1
moscow: M
moscow_reason: [2]
kano: n/a
epic: EPIC-13
source: DSA Art. 18, Q-4
use_cases: [UC-32]
depends_on: [REQ-MOD-002, REQ-MOD-003]
version: 1.5
created: 2026-10-24
last_updated: 2026-10-26
verification: [AT-LEGAL-008, CTRL-DOC-DSA]
---

# REQ-LEGAL-008 Verdacht auf Straftaten kennzeichnen und eskalieren
## Anforderung
Das System muss Moderatoren erlauben, eine Entscheidung als „Verdacht auf Straftat“ zu kennzeichnen. Eine Kennzeichnung muss begründet, protokolliert und an die Administration eskaliert werden; die betroffenen Inhalte müssen für die Prüfung gesichert bleiben.

## Begründung
DSA Art. 18 verpflichtet zur unverzüglichen Information der Strafverfolgungsbehörden bei Verdacht auf Straftaten, die eine Gefahr für Leben oder Sicherheit darstellen. Die Meldung selbst ist ein organisatorischer Prozess außerhalb des Systems (Q-4); das System liefert Kennzeichnung, Eskalation und Beweissicherung.

**Warum Should, obwohl Art. 18 eine Pflicht ist:** Die Pflicht trifft den Betreiber und wird durch den organisatorischen Prozess in `docs/06-recht/dsa-prozesse.md` erfüllt (Meldung per Telefon oder E-Mail an die Polizei). Die Systemunterstützung erleichtert und protokolliert die Meldung, ist aber nicht Voraussetzung, um die Pflicht zu erfüllen.

## Akzeptanzkriterien
| Einschätzung des Moderators | Kennzeichnung | System | Prozess (`docs/06-recht/dsa-prozesse.md`) |
|---|---|---|---|
| kein Verdacht | – | normale Entscheidung | – |
| Verdacht auf Straftat ohne Gefahr für Leben oder Sicherheit | „Verdacht auf Straftat“ | Audit-Log, E-Mail an Administratoren, Inhalt gesichert | Prüfung durch das Justiziariat der Hochschule (fiktive Rolle) |
| Verdacht mit Gefahr für Leben oder Sicherheit | „Verdacht auf Straftat – Gefahr“ | wie oben, Kennzeichnung „dringend“ | unverzügliche Information der Polizei (Übungsannahme: Polizeipräsidium Rheinpfalz) |

Beweissicherung: Von gekennzeichneten Inhalten wird eine **pseudonymisierte Kopie** angelegt (Anzeige: Titel, Beschreibung, Preis, Zeitpunkt; Nachricht: die gemeldete Nachricht mit ± 5 Nachrichten Kontext, Absender nur als Rolle; Profil: Anzeigename). Die Kopie bleibt bis zur Freigabe durch einen Administrator erhalten, höchstens 6 Monate. Löschfristen und Kontolöschungen der Originale werden **nicht** zurückgestellt (Datenminimierung, Art. 5 Abs. 1 lit. c und e DSGVO). Bilder werden im Beispiel nicht mitkopiert (offener Punkt). Die Admin-Übersicht zeigt je Sicherung die Zahl der gesicherten Elemente (`preservedItems`).

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Kennzeichnung ohne Begründung | 422 |
| Mitglied ohne Moderationsrolle setzt die Kennzeichnung | 403 |
| Betroffene/r fordert Auskunft über die Kennzeichnung | Auskunft nach Prüfung durch den DSB; die Kennzeichnung erscheint nicht in der Mitteilung an Betroffene |
| Automatische Löschfrist oder Kontolöschung trifft gesicherten Inhalt | Original wird fristgerecht gelöscht; die Kopie bleibt bis Freigabe bzw. Fristende |

## Nachweis
- `AT-LEGAL-008`: Smoke-Test – Entscheidung mit Kennzeichnung „Verdacht auf Straftat“ erzeugt Audit-Log-Eintrag und E-Mail an Administratoren; ohne Begründung 422; Mitteilung an Betroffene enthält die Kennzeichnung nicht.
- `CTRL-DOC-DSA`: Kontrolle `docs/06-recht/dsa-prozesse.md` – Melde- und Abhilfeverfahren, Begründung, Widerspruch, Art. 18 und Kontaktstellen beschrieben, Zuständigkeiten als fiktive Rollen (Q-28) – Protokoll [CTRL-DOC-DSA](../../05-umsetzung/nachweise/CTRL-DOC-DSA.md).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-24 | Erstfassung aus dem Abgleich Recht, Auftritt und Betrieb ([06-abgleich-recht-betrieb.md](../06-abgleich-recht-betrieb.md)); als Übung mit Platzhaltern freigegeben (Q-23) |
| 1.1 | 2026-10-25 | Review v1.3 (RV-R-15, RV-R-20, RV-C-05): Beweissicherung als pseudonymisierte Kopie mit Kontext, keine Zurückstellung von Löschungen, preservedItems; Begründung der Einstufung Should; Status nach Umsetzung |
| 1.2 | 2026-10-25 | Verifiziert im finalen Lauf gegen das Docker-Beispiel (AT-LEGAL-008, CTRL-DOC-DSA bestanden bzw. ausgeführt); Status → verified |
| 1.3 | 2026-10-25 | Q-28: Platzhalter durch fiktive Übungswerte und offene Prüfpunkte durch Übungsannahmen ersetzt |
| 1.4 | 2026-10-26 | Guideline-Review: GL-15 Must wegen Rechtspflicht (DSA Art. 18), moscow_reason [2] |
| 1.5 | 2026-10-26 | Guideline-Review: GL-07 Kontrollprotokoll verlinkt |
