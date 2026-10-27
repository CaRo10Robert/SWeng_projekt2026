---
id: REQ-PRIV-007
title: Prüfung der Datenschutz-Folgenabschätzung
type: privacy
class: constraint
status: verified
owner: team-produkt
risk: medium
release: R1
moscow: S
kano: n/a
epic: EPIC-13
source: DSGVO Art. 35
version: 1.7
created: 2026-10-20
last_updated: 2026-10-26
verification: [CTRL-DOC-DSFA, MAN-PRIV-007]
---

# REQ-PRIV-007 Prüfung der Datenschutz-Folgenabschätzung

## Anforderung
Es muss geprüft und dokumentiert werden, ob eine Datenschutz-Folgenabschätzung erforderlich ist (private Kommunikation, Moderation, Kontaktfreigabe, Steuerauswertung); falls ja, ist sie vor dem Start eines Echtbetriebs durchzuführen. Die Prüfung (Schwellwertanalyse anhand der Kriterien der Datenschutzkonferenz und der Muss-Liste der Aufsichtsbehörde) erfolgt als Übung in R1 (Q-23).

## Begründung
DSGVO Art. 35; private Kommunikation und Moderation können ein hohes Risiko für Betroffene begründen.

## Akzeptanzkriterien
- Prüfprotokoll `docs/06-recht/dsfa-schwellwertanalyse.md` mit Ergebnis (erforderlich / nicht erforderlich) und Begründung je Kriterium liegt vor.
- Ergibt die Analyse „erforderlich“, liegt eine DSFA nach Art. 35 Abs. 7 DSGVO vor (`docs/06-recht/dsfa.md`): Beschreibung, Notwendigkeit und Verhältnismäßigkeit, Risikobewertung je Szenario (mindestens Kontoübernahme, Offenlegung von Chats, Profilbildung, Missbrauch der Moderation, Datenleck aus Sicherungen, fehlerhafte Löschung oder Wiederherstellung, Rückrechnung von Pseudonymen), Abhilfemaßnahmen, Restrisiko, Stellungnahme der/des DSB, Entscheidung, Überprüfungstermin.
- Übungsaufgabe (Q-28): Stellungnahme und Entscheidung sind fiktiv; die DSFA wird nie im Echtbetrieb genutzt.

## Fehler- und Missbrauchsfälle
N/A – Prüfpflicht; keine Systemfunktion.

## Nachweis
- `CTRL-DOC-DSFA`: Kontrolle `docs/06-recht/dsfa-schwellwertanalyse.md` – alle Kriterien bewertet, Ergebnis begründet – Protokoll [CTRL-DOC-DSFA](../../05-umsetzung/nachweise/CTRL-DOC-DSFA.md).
- `MAN-PRIV-007`: Übungs-DSFA `docs/06-recht/dsfa.md` mit fiktiver Stellungnahme der DSB und fiktiver Entscheidung liegt vor; alle Pflichtinhalte nach Art. 35 Abs. 7 und die sieben Mindestszenarien sind bewertet (Q-28).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei, Planungshorizont EPIC-12 |
| 1.2 | 2026-10-23 | Review v0.2: R-04 Abschnitt (N/A mit Begründung); Status `approved` (Won't in R1) |
| 1.3 | 2026-10-24 | Abgleich Recht und Betrieb: Schwellwertanalyse als Übung in R1 vorgezogen (Q-23, EPIC-13); Durchführung einer DSFA bleibt Voraussetzung des Echtbetriebs |
| 1.4 | 2026-10-25 | Review v1.3 (RV-R-11, RV-R-16): Status nach Umsetzung; Schwellwertanalyse neu bewertet (Kriterien 4 und 7 → DSFA erforderlich, Bestätigung durch DSB offen) |
| 1.5 | 2026-10-25 | Übungs-DSFA nach Art. 35 Abs. 7 mit fiktiver DSB-Stellungnahme (`docs/06-recht/dsfa.md`); MAN-PRIV-007 auf die Übungs-DSFA umgestellt (Q-28) |
| 1.6 | 2026-10-26 | Verifiziert im finalen Lauf gegen das Docker-Beispiel (CTRL-DOC-DSFA, MAN-PRIV-007 bestanden bzw. ausgeführt); Status → verified |
| 1.7 | 2026-10-26 | Guideline-Review: GL-07 Kontrollprotokoll verlinkt |
