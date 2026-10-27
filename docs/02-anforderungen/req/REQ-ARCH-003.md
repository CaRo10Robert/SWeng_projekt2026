---
id: REQ-ARCH-003
title: Whitelist als Daten statt Code
type: architecture
class: constraint
status: implemented
owner: team-plattform
risk: medium
release: R1
moscow: M
moscow_reason: [4]
kano: n/a
epic: EPIC-10
source: BG-5, EPIC-10
depends_on: [REQ-AUTH-001]
version: 1.2
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-ARCH-003]
---

# REQ-ARCH-003 Whitelist als Daten statt Code
## Anforderung
Die zugelassenen E-Mail-Domains müssen als Daten gepflegt werden; eine neue Domain darf keine neue Softwareversion erfordern.

## Begründung
Vorbereitung weiterer Hochschulen (EPIC-10, QS-6).

## Konformitätsprüfung
| Prüfung | Kriterium |
|---|---|
| Test | Eine zur Laufzeit ergänzte Domain wird ohne Neustart bei der Registrierung akzeptiert |
| Code-Review | keine Domain-Literale in der Fachlogik außer im Seed |

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Domain mit Platzhalter oder Tippfehler wird eingetragen | abgelehnt; BR-01 verlangt exakte Domains (REQ-AUTH-001, REQ-MOD-008) |
| Unbefugte Änderung der Whitelist | nur Administratoren; jede Änderung im Audit-Log |
| Domain-Literal im Fachcode | im Code-Review abzulehnen (Ausnahme Seed) |
| Domain wird deaktiviert | neue Registrierungen abgelehnt, bestehende Konten bleiben aktiv |

## Nachweis
- `AT-ARCH-003`: Integrationstest – Domain in der Datenbank ergänzen, Registrierung mit dieser Domain gelingt (neu zu schreiben).


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei mit Front Matter, Kano und Nachweis-IDs |
| 1.2 | 2026-10-23 | Review v0.2: R-04, R-15, R-17 (class constraint) |
