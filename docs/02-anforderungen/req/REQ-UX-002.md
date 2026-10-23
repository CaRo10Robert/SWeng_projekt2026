---
id: REQ-UX-002
title: Deutsche Oberfläche, übersetzbar vorbereitet
type: quality
class: quality
status: in-review
owner: team-produkt
risk: low
release: R1
moscow: M
kano: basis
epic: EPIC-00
source: BG-2
version: 2.0
created: 2026-10-20
last_updated: 2026-10-23
verification: [MAN-UX-002]
---

# REQ-UX-002 Deutsche Oberfläche, übersetzbar vorbereitet
## Anforderung
Die Oberfläche muss vollständig auf Deutsch vorliegen; alle Texte müssen ohne Änderung der Programmlogik in weitere Sprachen übersetzt werden können (Englisch für internationale Studierende im nächsten Release).

## Begründung
Zielgruppe ist deutschsprachig; das Ostasieninstitut und Austauschstudierende brauchen perspektivisch Englisch.

## Qualitätsmerkmal, Metrik, Messverfahren
| Feld | Festlegung |
|---|---|
| Qualitätsmerkmal (ISO 25010) | Maintainability → Modifiability; Flexibility → Adaptability |
| Metrik | Anzahl der für Nutzer sichtbaren Texte, die nicht aus einer Sprachressource stammen |
| Akzeptanzkriterium | **0** fest im Code verdrahtete Texte in Komponenten; Datums- und Zahlenformate über die Locale |
| Messverfahren | Code-Review mit Suche nach Textliteralen in JSX; Stichprobe mit Pseudo-Locale |
| Messkontext | Web-Oberfläche und E-Mail-Vorlagen |
| Verhalten bei Verfehlung | Technische Schuld im Backlog, kein Release-Blocker für R1 |

## Nachweis
- `MAN-UX-002`: Code-Review-Protokoll zur Auslagerung der Texte.
- Umsetzungsstand 🟡: Oberfläche ist deutsch; Texte sind noch nicht in Sprachressourcen ausgelagert.


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 2.0 | 2026-10-23 | Metrik und Messverfahren ergänzt (Fallstudie FS-M3) |
