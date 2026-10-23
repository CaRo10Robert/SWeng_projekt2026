---
id: REQ-AUTH-009
title: Anmeldeverfahren austauschbar (Hochschulkennung)
type: architecture
class: constraint
status: draft
owner: team-identity
risk: high
reviewers: [product-owner, security-lead]
release: R1
moscow: S
kano: n/a
epic: EPIC-01
source: FS-C3, Q-12
use_cases: [UC-02]
depends_on: [REQ-AUTH-005]
version: 1.0
created: 2026-10-23
last_updated: 2026-10-23
verification: [CTRL-DEPCRUISE, AT-AUTH-009]
---

# REQ-AUTH-009 Anmeldeverfahren austauschbar (Hochschulkennung)

## Anforderung
Das Anmeldeverfahren muss austauschbar sein, sodass eine Anmeldung mit der Hochschulkennung beim Identity Provider der Hochschule (Single Sign-on) ergänzt werden kann, **ohne** Fachlogik außerhalb der Identitätsverwaltung zu ändern. Bis zur Entscheidung Q-12 gilt die verifizierte Hochschuladresse mit Passwort als Anmeldeverfahren (Option C im [Fallstudien-Abgleich](../00-fallstudie-abgleich.md#q-12-was-heißt-anmeldung-über-die-hochschulkennung)).

## Begründung
Fallstudie FS-C3 verlangt die Anmeldung über die Hochschulkennung. Das Docker-Beispiel muss offline ohne externe Konten laufen (ADR-0010), deshalb wird SSO als Erweiterungspunkt vorbereitet, nicht sofort angebunden. Die technische Ausgestaltung (Schnittstelle, Protokoll) wird per ADR festgelegt.

## Akzeptanzkriterien
- Alle Module außer der Identitätsverwaltung erhalten nach der Anmeldung nur eine Mitglieds-ID, Rolle und Institution – keine Information darüber, wie die Anmeldung erfolgte.
- Ein zweites Anmeldeverfahren lässt sich ergänzen, indem nur die Identitätsverwaltung und die Konfiguration geändert werden.
- Auch nach SSO-Anmeldung gelten die Domain-Whitelist (REQ-AUTH-001) und die Sperrliste (REQ-AUTH-008).

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Identity Provider nicht erreichbar (später) | Hinweis „Anmeldung derzeit nicht möglich“, keine Ausweichanmeldung ohne Verifikation |
| Identity Provider liefert Adresse außerhalb der Whitelist | Anmeldung abgelehnt |

## Nachweis
- `CTRL-DEPCRUISE`: Modulgrenzen-Prüfung – kein Fachmodul hängt von Interna der Identitätsverwaltung ab.
- `AT-AUTH-009`: neu zu schreiben – Test des Anmeldeports mit einem simulierten zweiten Verfahren.
- Stand: Entwurf, abhängig von Q-12.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-23 | Erstfassung aus Fallstudie FS-C3 (Abgleich A-3) |
