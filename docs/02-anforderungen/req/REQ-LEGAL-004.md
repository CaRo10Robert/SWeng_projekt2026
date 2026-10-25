---
id: REQ-LEGAL-004
title: Erklärung zur Barrierefreiheit
type: quality
class: quality
status: implemented
owner: team-produkt
risk: medium
reviewers: [qa-lead]
release: R1
moscow: M
moscow_reason: [2]
kano: basis
epic: EPIC-13
source: LGGBehM RLP, Landesverordnung zur Barrierefreiheit [Platzhalter], Richtlinie (EU) 2016/2102, Durchführungsbeschluss (EU) 2018/1523, Q-23
use_cases: [UC-08]
depends_on: [REQ-A11Y-001]
review_due: 2027-10-24
version: 1.1
created: 2026-10-24
last_updated: 2026-10-25
verification: [AT-LEGAL-004, CTRL-DOC-LEGAL-TEXTE]
---

# REQ-LEGAL-004 Erklärung zur Barrierefreiheit
## Anforderung
Das System muss eine Erklärung zur Barrierefreiheit mit Stand der Vereinbarkeit, bekannten Barrieren, Feedback-Möglichkeit und Hinweis auf das Schlichtungsverfahren bereitstellen, die von jeder Seite aus erreichbar ist.

> Übungsaufgabe: Inhalte mit Betreiberbezug stehen als Platzhalter `[Platzhalter: …]` (Q-23). Kein Rechtsrat; im Echtbetrieb prüft die/der Datenschutzbeauftragte bzw. das Justiziariat der Hochschule.

## Begründung
Öffentliche Stellen müssen eine Erklärung zur Barrierefreiheit veröffentlichen und einen Feedback-Mechanismus anbieten (Richtlinie (EU) 2016/2102 mit dem Mustertext aus dem Durchführungsbeschluss (EU) 2018/1523; für eine Hochschule in Rheinland-Pfalz umgesetzt im Landesgesetz zur Gleichstellung behinderter Menschen (LGGBehM) und der zugehörigen Landesverordnung `[Platzhalter: genaue Fundstelle]`; die BITV 2.0 gilt nur für Bundesstellen und dient hier als fachliche Orientierung). Ergänzt die technische Barrierefreiheit (REQ-A11Y-001/002).

## Qualitätsmerkmal, Metrik, Messverfahren
| Feld | Festlegung |
|---|---|
| Qualitätsmerkmal (ISO 25010) | Interaction Capability → Inclusivity; Compliance |
| Metrik | (1) Pflichtabschnitte der Mustererklärung (Durchführungsbeschluss (EU) 2018/1523) vorhanden; (2) Alter des Stands der Erklärung; (3) Reaktionszeit auf Feedback |
| Akzeptanzkriterium | (1) **alle 5** Abschnitte: Stand der Vereinbarkeit, nicht barrierefreie Inhalte mit Begründung, Erstellung (Datum, Methode: Selbstbewertung mit axe-core; die manuelle Prüfung MAN-A11Y-001 steht noch aus und wird in der Erklärung als offen genannt), Feedback und Kontakt, Durchsetzungsverfahren (`[Platzhalter: Schlichtungsstelle]`); (2) **≤ 12 Monate**; (3) Antwort **≤ 1 Monat** (Prozess, `docs/06-recht/dsa-prozesse.md` nennt die Zuständigkeit) |
| Messverfahren | (1) E2E-Test auf Abschnittsüberschriften; (2) Datum im Front Matter, `review_due`; (3) Prozessdokument |
| Messkontext | Web-Oberfläche, Inhalt `apps/web/src/content/legal/barrierefreiheit.de.md` |
| Verhalten bei Verfehlung | Release-Blocker für (1); (2) und (3) Aufgabe im nächsten Sprint |

## Akzeptanzkriterien
```gherkin
Szenario: Barriere melden
  Angenommen ich bin auf einer beliebigen Seite
  Wenn ich im Seitenfuß "Barrierefreiheit" wähle
  Dann sehe ich die Erklärung mit den 5 Abschnitten
  Und eine Kontaktmöglichkeit, um eine Barriere zu melden
```

## Nachweis
- `AT-LEGAL-004`: E2E-Test – Erklärung von jeder Seite per Tastatur erreichbar, 5 Pflichtabschnitte und Kontaktmöglichkeit vorhanden.
- `CTRL-DOC-LEGAL-TEXTE`: Kontrolle der Rechtstexte (siehe REQ-LEGAL-001).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-24 | Erstfassung aus dem Abgleich Recht, Auftritt und Betrieb ([06-abgleich-recht-betrieb.md](../06-abgleich-recht-betrieb.md)); als Übung mit Platzhaltern freigegeben (Q-23) |
| 1.1 | 2026-10-25 | Review v1.3 (RV-R-18): Rechtsquelle LGGBehM RLP und RL (EU) 2016/2102 statt BITV 2.0/LBGG; Methode ehrlich (manuelle Prüfung offen); Status nach Umsetzung |
