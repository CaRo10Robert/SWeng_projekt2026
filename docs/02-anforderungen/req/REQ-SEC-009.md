---
id: REQ-SEC-009
title: Threat Model für Registrierung, Chat und Upload
type: security
class: constraint
status: in-review
owner: team-plattform
risk: high
reviewers: [product-owner, security-lead]
release: R1
moscow: M
kano: n/a
epic: EPIC-00
source: Guideline Kap. 07 (STRIDE)
version: 1.1
created: 2026-10-20
last_updated: 2026-10-23
verification: [MAN-SEC-009]
---

# REQ-SEC-009 Threat Model für Registrierung, Chat und Upload

## Anforderung
Für die Abläufe Registrierung, Chat (inkl. Kontaktfreigabe, REQ-CHAT-010) und Bild-Upload muss ein Threat Model nach STRIDE vorliegen. Jede identifizierte Bedrohung ist einer Maßnahme (Anforderung, Test oder bewusst akzeptiertes Risiko) zugeordnet.

## Begründung
Diese drei Abläufe überschreiten Vertrauensgrenzen (fremde Eingaben, private Daten, Dateien).

## Akzeptanzkriterien
- Je Ablauf ein Datenflussdiagramm mit Vertrauensgrenzen.
- Je STRIDE-Kategorie mindestens geprüft; jede Bedrohung hat Maßnahme oder begründete Risikoakzeptanz.
- Dokument liegt im Repository und ist im Review abgenommen.

## Nachweis
- `MAN-SEC-009`: Threat-Model-Dokument mit Review-Vermerk.
- Stand: **nicht umgesetzt** (Umsetzungsstand ⬜). Abweichung: Das Threat Model sollte vor der Implementierung entstehen; der MVP wurde ohne erstellt.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei, Kontaktfreigabe einbezogen |
