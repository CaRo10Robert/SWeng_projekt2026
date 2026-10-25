---
id: REQ-SEC-012
title: Meldeweg für Sicherheitslücken
type: security
class: constraint
status: verified
owner: team-plattform
risk: low
release: R1
moscow: S
kano: n/a
epic: EPIC-13
source: RFC 9116, BSI CVD
review_due: 2027-10-24
version: 1.2
created: 2026-10-24
last_updated: 2026-10-25
verification: [AT-SEC-012, CTRL-DOC-BETRIEB]
---

# REQ-SEC-012 Meldeweg für Sicherheitslücken
## Anforderung
Das System muss unter `/.well-known/security.txt` einen maschinenlesbaren Kontakt für die Meldung von Sicherheitslücken nach RFC 9116 bereitstellen; der Umgang mit Meldungen muss im Betriebshandbuch beschrieben sein.

## Begründung
Koordinierte Offenlegung (Coordinated Vulnerability Disclosure) braucht einen auffindbaren Kontakt; ohne ihn gehen Hinweise verloren oder werden öffentlich.

## Akzeptanzkriterien
- Felder: `Contact: mailto:[Platzhalter: security@hwg-lu.example]`, `Expires` höchstens 12 Monate in der Zukunft, `Preferred-Languages: de, en`, `Policy` (Link auf die Kontaktseite, Abschnitt Sicherheitslücken) und `Canonical` – beide nur, wenn `PUBLIC_URL` mit `https://` beginnt (RFC 9116 verlangt HTTPS für Web-URIs); im lokalen Standardstart über HTTP entfallen sie.
- Prozess: Eingangsbestätigung binnen 3 Werktagen, Bewertung, Behebung, Rückmeldung an die meldende Person (`docs/07-betrieb/betriebshandbuch.md`).

## Fehler- und Missbrauchsfälle
N/A – Risiko niedrig; `Expires` wird über `review_due` überwacht.

## Nachweis
- `AT-SEC-012`: Smoke-Test – `/.well-known/security.txt` liefert 200, `text/plain`, alle Pflichtfelder, `Expires` in der Zukunft.
- `CTRL-DOC-BETRIEB`: Kontrolle `docs/07-betrieb/` – Betriebshandbuch, Störungsprozess und Prozess für Sicherheitsmeldungen vorhanden.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-24 | Erstfassung aus dem Abgleich Recht, Auftritt und Betrieb ([06-abgleich-recht-betrieb.md](../06-abgleich-recht-betrieb.md)); als Übung mit Platzhaltern freigegeben (Q-23) |
| 1.1 | 2026-10-25 | Review v1.3 (RV-A-17): Policy und Canonical nur bei HTTPS; Status nach Umsetzung |
| 1.2 | 2026-10-25 | Verifiziert im finalen Lauf gegen das Docker-Beispiel (AT-SEC-012, CTRL-DOC-BETRIEB bestanden bzw. ausgeführt); Status → verified |
