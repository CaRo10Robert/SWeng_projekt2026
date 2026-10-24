---
id: REQ-LEGAL-008
title: Verdacht auf Straftaten kennzeichnen und eskalieren
type: business-rule
class: functional
status: approved
owner: team-vertrauen
risk: high
reviewers: [product-owner, security-lead]
release: R1
moscow: S
kano: n/a
epic: EPIC-13
source: DSA Art. 18, Q-4
use_cases: [UC-32]
depends_on: [REQ-MOD-002, REQ-MOD-003]
version: 1.0
created: 2026-10-24
last_updated: 2026-10-24
verification: [AT-LEGAL-008, CTRL-DOC-DSA]
---

# REQ-LEGAL-008 Verdacht auf Straftaten kennzeichnen und eskalieren
## Anforderung
Das System muss Moderatoren erlauben, eine Entscheidung als „Verdacht auf Straftat“ zu kennzeichnen. Eine Kennzeichnung muss begründet, protokolliert und an die Administration eskaliert werden; die betroffenen Inhalte müssen für die Prüfung gesichert bleiben.

## Begründung
DSA Art. 18 verpflichtet zur unverzüglichen Information der Strafverfolgungsbehörden bei Verdacht auf Straftaten, die eine Gefahr für Leben oder Sicherheit darstellen. Die Meldung selbst ist ein organisatorischer Prozess außerhalb des Systems (Q-4); das System liefert Kennzeichnung, Eskalation und Beweissicherung.

## Akzeptanzkriterien
| Einschätzung des Moderators | Kennzeichnung | System | Prozess (`docs/06-recht/dsa-prozesse.md`) |
|---|---|---|---|
| kein Verdacht | – | normale Entscheidung | – |
| Verdacht auf Straftat ohne Gefahr für Leben oder Sicherheit | „Verdacht auf Straftat“ | Audit-Log, E-Mail an Administratoren, Inhalt gesichert | Prüfung durch `[Platzhalter: Justiziariat der Hochschule]` |
| Verdacht mit Gefahr für Leben oder Sicherheit | „Verdacht auf Straftat – Gefahr“ | wie oben, Kennzeichnung „dringend“ | unverzügliche Information der Polizei `[Platzhalter: zuständige Polizeidienststelle]` |

Beweissicherung: Gekennzeichnete Inhalte (Anzeige mit Bildern, Nachrichtenkontext ± 5) werden von automatischen Löschfristen ausgenommen, bis ein Administrator die Sicherung freigibt, höchstens 6 Monate.

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Kennzeichnung ohne Begründung | 422 |
| Mitglied ohne Moderationsrolle setzt die Kennzeichnung | 403 |
| Betroffene/r fordert Auskunft über die Kennzeichnung | Auskunft nach Prüfung durch den DSB; die Kennzeichnung erscheint nicht in der Mitteilung an Betroffene |
| Automatische Löschfrist trifft gesicherten Inhalt | Inhalt bleibt erhalten, Löschung nach Freigabe |

## Nachweis
- `AT-LEGAL-008`: Smoke-Test – Entscheidung mit Kennzeichnung „Verdacht auf Straftat“ erzeugt Audit-Log-Eintrag und E-Mail an Administratoren; ohne Begründung 422; Mitteilung an Betroffene enthält die Kennzeichnung nicht.
- `CTRL-DOC-DSA`: Kontrolle `docs/06-recht/dsa-prozesse.md` – Melde- und Abhilfeverfahren, Begründung, Widerspruch, Art. 18 und Kontaktstellen beschrieben, Zuständigkeiten als Platzhalter markiert.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-24 | Erstfassung aus dem Abgleich Recht, Auftritt und Betrieb ([06-abgleich-recht-betrieb.md](../06-abgleich-recht-betrieb.md)); als Übung mit Platzhaltern freigegeben (Q-23) |
