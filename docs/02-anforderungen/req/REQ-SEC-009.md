---
id: REQ-SEC-009
title: Threat Model für Registrierung, Chat und Upload
type: security
class: constraint
status: approved
owner: team-plattform
risk: high
reviewers: [product-owner, security-lead]
release: R1
moscow: M
moscow_reason: [2, 4]
kano: n/a
epic: EPIC-00
source: Guideline Kap. 07 (STRIDE)
version: 1.2
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

## Fehler- und Missbrauchsfälle
N/A – Dokumentationsanforderung. Die Missbrauchsfälle der betrachteten Abläufe sind Gegenstand des Threat Models selbst; ein veraltetes Threat Model wird über die DoD erkannt (neue Vertrauensgrenze ⇒ Aktualisierung).

## Nachweis
- `MAN-SEC-009`: Threat-Model-Dokument mit Review-Vermerk.
- Stand: **nicht umgesetzt** (Umsetzungsstand ⬜). Abweichung: Das Threat Model sollte vor der Implementierung entstehen; der MVP wurde ohne erstellt.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei, Kontaktfreigabe einbezogen |
| 1.2 | 2026-10-23 | Review v0.2: R-04 Abschnitt (N/A mit Begründung); R-15 moscow_reason; Status `approved` |
