---
id: REQ-LEGAL-013
title: Prozess für Datenschutzverletzungen
type: operational
class: constraint
status: implemented
owner: team-plattform
risk: high
reviewers: [product-owner, security-lead]
release: R1
moscow: M
moscow_reason: [2]
kano: n/a
epic: EPIC-13
source: DSGVO Art. 33, Art. 34, Q-23
version: 1.1
created: 2026-10-24
last_updated: 2026-10-25
verification: [CTRL-DOC-DATENPANNE, MAN-LEGAL-013]
---

# REQ-LEGAL-013 Prozess für Datenschutzverletzungen
## Anforderung
Es muss ein dokumentierter Prozess bestehen, mit dem eine Verletzung des Schutzes personenbezogener Daten erkannt, bewertet, binnen 72 Stunden an die Aufsichtsbehörde gemeldet, bei hohem Risiko den Betroffenen mitgeteilt und in jedem Fall dokumentiert wird.

## Begründung
Art. 33 (Meldung binnen 72 h, Dokumentation jeder Verletzung) und Art. 34 (Benachrichtigung bei hohem Risiko). Ohne eingeübten Ablauf ist die Frist praktisch nicht zu halten.

## Akzeptanzkriterien
- `docs/06-recht/datenpannen-prozess.md` beschreibt: Rollen (`[Platzhalter: DSB]`, Betrieb, Hochschulleitung), Meldewege intern, Ablauf mit Zeitstempeln (Kenntnis → Bewertung ≤ 24 h → Meldung ≤ 72 h), Risikobewertung (Matrix Eintrittswahrscheinlichkeit × Schwere), Vorlage für Meldung und Benachrichtigung, Dokumentationsvorlage, Verknüpfung mit dem Störungsprozess (REQ-OPS-011).
- Eine Übung (Tabletop) mit einem Szenario, z. B. „Datensicherung unverschlüsselt in falschem Speicher“, ist protokolliert.

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Kenntnis am Wochenende | Frist läuft trotzdem; Bereitschaft im Betriebshandbuch |
| Meldung nicht vollständig binnen 72 h möglich | schrittweise Meldung nach Art. 33 Abs. 4, Begründung der Verzögerung |
| Unklar, ob personenbezogene Daten betroffen | wird als Verletzung behandelt, bis das Gegenteil feststeht |

## Nachweis
- `CTRL-DOC-DATENPANNE`: Kontrolle `docs/06-recht/datenpannen-prozess.md` – Rollen, Fristen, Bewertung, Vorlagen vorhanden.
- `MAN-LEGAL-013`: Protokoll einer Tabletop-Übung.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-24 | Erstfassung aus dem Abgleich Recht, Auftritt und Betrieb ([06-abgleich-recht-betrieb.md](../06-abgleich-recht-betrieb.md)); als Übung mit Platzhaltern freigegeben (Q-23) |
| 1.1 | 2026-10-25 | Review v1.3 (RV-R-11, RV-R-12): Status nach Umsetzung; Datenpannen-Prozess um Risikomatrix, Dokumentationsvorlage, Rollen, Erreichbarkeit und Art. 33 Abs. 2 ergänzt |
