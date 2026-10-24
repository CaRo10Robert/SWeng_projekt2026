---
id: REQ-PRIV-007
title: Prüfung der Datenschutz-Folgenabschätzung
type: privacy
class: constraint
status: approved
owner: team-produkt
risk: medium
release: R1
moscow: S
kano: n/a
epic: EPIC-13
source: DSGVO Art. 35
version: 1.3
created: 2026-10-20
last_updated: 2026-10-24
verification: [CTRL-DOC-DSFA, MAN-PRIV-007]
---

# REQ-PRIV-007 Prüfung der Datenschutz-Folgenabschätzung

## Anforderung
Es muss geprüft und dokumentiert werden, ob eine Datenschutz-Folgenabschätzung erforderlich ist (private Kommunikation, Moderation, Kontaktfreigabe, Steuerauswertung); falls ja, ist sie vor dem Start eines Echtbetriebs durchzuführen. Die Prüfung (Schwellwertanalyse anhand der Kriterien der Datenschutzkonferenz und der Muss-Liste der Aufsichtsbehörde) erfolgt als Übung in R1 (Q-23).

## Begründung
DSGVO Art. 35; private Kommunikation und Moderation können ein hohes Risiko für Betroffene begründen.

## Akzeptanzkriterien
- Prüfprotokoll `docs/06-recht/dsfa-schwellwertanalyse.md` mit Ergebnis (erforderlich / nicht erforderlich), Begründung je Kriterium und Platzhaltern für die Bestätigung durch die/den DSB liegt vor.
- Ergibt die Analyse „erforderlich“, steht die DSFA als Voraussetzung in der Go-live-Checkliste.

## Fehler- und Missbrauchsfälle
N/A – Prüfpflicht; keine Systemfunktion.

## Nachweis
- `CTRL-DOC-DSFA`: Kontrolle `docs/06-recht/dsfa-schwellwertanalyse.md` – alle Kriterien bewertet, Ergebnis begründet.
- `MAN-PRIV-007`: Bestätigung der Schwellwertanalyse durch die/den DSB (erst vor einem Echtbetrieb).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei, Planungshorizont EPIC-12 |
| 1.2 | 2026-10-23 | Review v0.2: R-04 Abschnitt (N/A mit Begründung); Status `approved` (Won't in R1) |
| 1.3 | 2026-10-24 | Abgleich Recht und Betrieb: Schwellwertanalyse als Übung in R1 vorgezogen (Q-23, EPIC-13); Durchführung einer DSFA bleibt Voraussetzung des Echtbetriebs |
