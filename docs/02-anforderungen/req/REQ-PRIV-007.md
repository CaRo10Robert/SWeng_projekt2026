---
id: REQ-PRIV-007
title: Prüfung der Datenschutz-Folgenabschätzung
type: privacy
class: constraint
status: approved
owner: team-produkt
risk: medium
release: EPIC-12
moscow: W
kano: n/a
epic: EPIC-12
source: DSGVO Art. 35
version: 1.2
created: 2026-10-20
last_updated: 2026-10-23
verification: [MAN-PRIV-007]
---

# REQ-PRIV-007 Prüfung der Datenschutz-Folgenabschätzung

## Anforderung
Vor einem Echtbetrieb muss geprüft und dokumentiert werden, ob eine Datenschutz-Folgenabschätzung erforderlich ist (private Kommunikation, Moderation, Kontaktfreigabe); falls ja, ist sie vor dem Start durchzuführen.

## Begründung
DSGVO Art. 35; private Kommunikation und Moderation können ein hohes Risiko für Betroffene begründen.

## Akzeptanzkriterien
- Prüfprotokoll mit Ergebnis (erforderlich / nicht erforderlich) und Begründung liegt vor.

## Fehler- und Missbrauchsfälle
N/A – Prüfpflicht vor einem Echtbetrieb (EPIC-12); keine Systemfunktion.

## Nachweis
- `MAN-PRIV-007`: Prüfprotokoll zur DSFA-Pflicht.
- **N/A im Docker-Beispiel → EPIC-12** (kein Betrieb, ADR-0010).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei, Planungshorizont EPIC-12 |
| 1.2 | 2026-10-23 | Review v0.2: R-04 Abschnitt (N/A mit Begründung); Status `approved` (Won't in R1) |
