---
id: REQ-AUTH-009
title: Anmeldeverfahren austauschbar (Hochschulkennung)
type: architecture
class: constraint
status: approved
owner: team-identity
risk: high
reviewers: [product-owner, architecture-lead, security-lead]
release: R1
moscow: M
moscow_reason: [4]
kano: n/a
epic: EPIC-01
source: FS-C3
use_cases: [UC-02]
depends_on: [REQ-AUTH-001, REQ-AUTH-005, REQ-AUTH-008]
version: 2.1
created: 2026-10-23
last_updated: 2026-10-23
verification: [CTRL-DEPCRUISE, AT-AUTH-009, AT-ARCH-005]
---

# REQ-AUTH-009 Anmeldeverfahren austauschbar (Hochschulkennung)

## Anforderung
Das Anmeldeverfahren muss austauschbar sein: Eine Anmeldung mit der Hochschulkennung beim Identity Provider der Hochschule (Single Sign-on) muss ergänzt werden können, **ohne** Fachlogik außerhalb der Identitätsverwaltung zu ändern. Die Ausgestaltung legt [ADR-0013](../../03-architektur/decisions/0013-anmeldung-identity-provider-port.md) fest.

**Dokumentierte Abweichung von Fallstudie FS-C3:** Im Docker-Beispiel ist die verifizierte Hochschuladresse mit Passwort das (einzige aktive) Anmeldeverfahren (Entscheidung Q-12, Option C), weil das Beispiel offline ohne externe Konten laufen muss (ADR-0010). Die Anmeldung „über die Hochschulkennung“ ist damit **vorbereitet, aber nicht angebunden**. Die Abweichung ist mit Dozent/in abzustimmen.

## Begründung
FS-C3 verlangt die Anmeldung über die Hochschulkennung. Echtes SSO braucht das Rechenzentrum der Hochschule; die Austauschbarkeit sorgt dafür, dass der Anschluss später keine Umbaukosten verursacht (BG-5).

## Akzeptanzkriterien
| # | Kriterium | Prüfung |
|---|---|---|
| 1 | Kein Modul außer der Identitätsverwaltung kennt ein konkretes Anmeldeverfahren; andere Module erhalten nach der Anmeldung nur Mitglieds-ID, Rolle und Institution | Fitness Function (`CTRL-DEPCRUISE`) |
| 2 | Der Anmelde-Anwendungsfall funktioniert mit einem simulierten zweiten Verfahren (liefert eine verifizierte Adresse), ohne dass Code außerhalb der Identitätsverwaltung geändert wird | automatisierter Test (`AT-AUTH-009`) |
| 3 | Mit dem aktiven Standardverfahren besteht der Smoke-Test unverändert | `AT-ARCH-005` |

Regeln für ein zusätzliches Verfahren (gelten ab dessen Anbindung, im Test mit dem simulierten Verfahren geprüft):

| Situation | Ergebnis |
|---|---|
| Verfahren liefert Adresse, deren **kanonische Form** zu einem bestehenden Konto gehört | Anmeldung in **dieses** Konto (Kontoverknüpfung); kein zweites Konto |
| Verfahren liefert Adresse ohne bestehendes Konto, Domain auf der Whitelist | Konto wird angelegt und gilt als bestätigt (das Verfahren hat die Zugehörigkeit geprüft) |
| Nutzertyp | immer aus dem Whitelist-Eintrag der Domain (REQ-AUTH-003, BR-01); vom Verfahren gelieferte Attribute (z. B. „student“/„staff“) werden nur protokolliert (Entscheidung Q-20) |
| Verfahren liefert **keine** Adresse oder eine Adresse **außerhalb der Whitelist** | Anmeldung abgelehnt mit „Anmeldung nicht möglich“ |
| Adresse ist gesperrt (REQ-AUTH-008) oder Konto gesperrt | Anmeldung abgelehnt wie beim Passwortverfahren |

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Identity Provider nicht erreichbar (später) | Hinweis „Anmeldung derzeit nicht möglich“; keine Ausweichanmeldung ohne Verifikation |
| Gefälschte Antwort eines Verfahrens | nur signierte bzw. serverseitig geprüfte Antworten werden akzeptiert (Festlegung im ADR) |
| Kontoübernahme durch Verknüpfung | Verknüpfung nur über die verifizierte kanonische Adresse, nie über Anzeigenamen |

## Nachweis
- `CTRL-DEPCRUISE`: Modulgrenzen-Prüfung – kein Fachmodul hängt von Interna der Identitätsverwaltung oder einem Anmeldeadapter ab.
- `AT-AUTH-009`: (neu) Test des Anmelde-Anwendungsfalls mit einem simulierten zweiten Verfahren: Kontoverknüpfung, Neuanlage, Ablehnung fremder bzw. fehlender Adresse.
- `AT-ARCH-005`: Smoke-Test gegen das frisch gestartete Docker-Beispiel besteht unverändert.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-23 | Erstfassung aus Fallstudie FS-C3 (Abgleich A-3) |
| 2.0 | 2026-10-23 | Review v0.2: R-01 – Must (Kriterium 4), ADR-0013, beobachtbare Akzeptanzkriterien, Regeln für Kontoverknüpfung/Nutzertyp/fehlende Adresse, Abweichung von FS-C3 ausdrücklich; R-16 architecture-lead als Reviewer |
| 2.1 | 2026-10-23 | Architektur-Review A-10: Nutzertyp immer aus der Domain (Q-20); Port zweistufig (ADR-0013) |
