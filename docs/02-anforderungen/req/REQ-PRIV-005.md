---
id: REQ-PRIV-005
title: Hosting und Auftragsverarbeiter in der EU
type: privacy
class: constraint
status: approved
owner: team-produkt
risk: high
reviewers: [product-owner, security-lead]
release: EPIC-12
moscow: W
kano: n/a
epic: EPIC-12
source: DSGVO Art. 28, Art. 44 ff.
version: 1.2
created: 2026-10-20
last_updated: 2026-10-23
verification: [MAN-PRIV-005]
---

# REQ-PRIV-005 Hosting und Auftragsverarbeiter in der EU

## Anforderung
Im Echtbetrieb müssen Hosting und alle Auftragsverarbeiter (Mail-Versand, Speicher) ihre Leistungen in der EU bzw. im EWR erbringen und über einen Vertrag zur Auftragsverarbeitung gebunden sein.

## Begründung
Vermeidung von Drittlandübermittlungen; Nachweispflicht der Verarbeitungskette.

## Akzeptanzkriterien
- Liste aller Auftragsverarbeiter mit Standort und unterzeichnetem AV-Vertrag.

## Fehler- und Missbrauchsfälle
N/A – vertragliche Anforderung für den Echtbetrieb (EPIC-12); im Docker-Beispiel gibt es keine Auftragsverarbeiter.

## Nachweis
- `MAN-PRIV-005`: Verzeichnis der Auftragsverarbeiter mit AV-Verträgen.
- **N/A im Docker-Beispiel → EPIC-12**: Das Beispiel läuft lokal ohne Auftragsverarbeiter (ADR-0010).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei, Planungshorizont EPIC-12 |
| 1.2 | 2026-10-23 | Review v0.2: R-04 Abschnitt (N/A mit Begründung); Status `approved` (Won't in R1) |
