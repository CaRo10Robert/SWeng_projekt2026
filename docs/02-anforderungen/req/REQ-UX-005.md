---
id: REQ-UX-005
title: Hilfe, FAQ und Sicherheitstipps
type: user-story
class: functional
status: implemented
owner: team-produkt
risk: low
release: R1
moscow: S
kano: leistung
epic: EPIC-13
source: BG-1, BG-2
use_cases: [UC-08]
depends_on: [REQ-CHAT-006]
version: 1.1
created: 2026-10-24
last_updated: 2026-10-25
verification: [AT-UX-005]
---

# REQ-UX-005 Hilfe, FAQ und Sicherheitstipps
## Anforderung
Als Gast oder Mitglied möchte ich eine Hilfeseite mit häufigen Fragen und Sicherheitstipps lesen, damit ich die Plattform richtig nutze und Betrugsmaschen erkenne.

## Begründung
Vertrauen (BG-1) und Selbsthilfe (BG-2). Der Sicherheitshinweis im Chat (REQ-CHAT-006) braucht ein Ziel mit ausführlichen Tipps.

## Akzeptanzkriterien
- Themen: Registrierung und Anmeldung, Anzeige erstellen, Kontaktfreigabe, **sichere Übergabe** (öffentliche Orte auf dem Campus, Ware vor Bezahlung prüfen), **Betrugsmaschen** (Vorkasse, Links zu fremden Seiten, Phishing, gefälschte Zahlungsbestätigungen), Melden und Widerspruch, Datenschutz (Export, Löschung), Barrieren melden.
- Erreichbar ohne Anmeldung; Inhaltsverzeichnis mit Sprungmarken; Inhalt aus `apps/web/src/content/help/faq.de.md`.
- Der Sicherheitshinweis im Chat verlinkt auf den Abschnitt „Betrugsmaschen“.

## INVEST
I: unabhängig · N: Themen verhandelbar · V: Sicherheit und Selbsthilfe · E: klein · S: ein Tag · T: E2E-Test.

## Nachweis
- `AT-UX-005`: E2E-Test – Hilfeseite ohne Anmeldung erreichbar, alle Themen als Überschrift vorhanden, Link aus dem Chat-Sicherheitshinweis führt zum Abschnitt „Betrugsmaschen“.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-24 | Erstfassung aus dem Abgleich Recht, Auftritt und Betrieb ([06-abgleich-recht-betrieb.md](../06-abgleich-recht-betrieb.md)); als Übung mit Platzhaltern freigegeben (Q-23) |
| 1.1 | 2026-10-25 | Review v1.3 (RV-R-11): Status nach Umsetzung |
