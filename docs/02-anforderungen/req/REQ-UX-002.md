---
id: REQ-UX-002
title: Deutsche Oberfläche, übersetzbar vorbereitet
type: quality
class: quality
status: verified
owner: team-produkt
risk: low
reviewers: [qa-lead]
release: R1
moscow: S
kano: basis
epic: EPIC-00
source: BG-2
version: 2.5
created: 2026-10-20
last_updated: 2026-10-26
verification: [MAN-UX-002]
---

# REQ-UX-002 Deutsche Oberfläche, übersetzbar vorbereitet
## Anforderung
Die Oberfläche muss vollständig auf Deutsch vorliegen; alle Texte müssen ohne Änderung der Programmlogik in weitere Sprachen übersetzt werden können (Englisch für internationale Studierende: REQ-UX-007, Q-25).

## Begründung
Zielgruppe ist deutschsprachig; das Ostasieninstitut und Austauschstudierende brauchen perspektivisch Englisch.

**MoSCoW:** Should statt Must (Review v0.2, R-15): Die deutsche Oberfläche ist vorhanden; die Übersetzbarkeit erfüllt keines der Must-Kriterien 1–4 (kein Release-Blocker für R1).

## Qualitätsmerkmal, Metrik, Messverfahren
| Feld | Festlegung |
|---|---|
| Qualitätsmerkmal (ISO 25010) | Maintainability → Modifiability; Flexibility → Adaptability |
| Metrik | Anzahl der für Nutzer sichtbaren Texte, die nicht aus einer Sprachressource stammen |
| Akzeptanzkriterium | (1) **100 %** der sichtbaren Texte auf Deutsch; (2) **0** sichtbare Texte, die nicht aus einer Sprachressource stammen; Datums- und Zahlenformate folgen der eingestellten Sprache |
| Messverfahren | (1) Durchsicht aller Routen; (2) Code-Review mit Suche nach Textliteralen in den Oberflächenkomponenten (JSX) und Stichprobe mit einer Pseudo-Sprache |
| Messkontext | Web-Oberfläche und E-Mail-Vorlagen |
| Verhalten bei Verfehlung | Technische Schuld im Backlog, kein Release-Blocker für R1 |

## Nachweis
- `MAN-UX-002`: Code-Review-Protokoll zur Auslagerung der Texte – [MAN-UX-002](../../05-umsetzung/nachweise/MAN-UX-002.md). Chat-Systemnachrichten werden als Code mit Parametern gespeichert (`system_code`, `system_params`) und im Client übersetzt; Altdaten werden weiter am Text erkannt.
- Umsetzungsstand: Texte sind in Sprachressourcen ausgelagert (`apps/web/src/i18n/de.json`, `en.json`, react-intl, ADR-0016); Englisch nach REQ-UX-007; Prüfung der Kataloge per `scripts/check-i18n.mjs` in CI.


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 2.0 | 2026-10-23 | Metrik und Messverfahren ergänzt (Fallstudie FS-M3) |
| 2.1 | 2026-10-23 | Review v0.2: R-15 (Must → Should), R-22 |
| 2.2 | 2026-10-24 | Abgleich Recht und Betrieb: Englische Oberfläche als eigene Anforderung REQ-UX-007 (Q-25); diese Anforderung bleibt die Voraussetzung (Auslagerung der Texte) |
| 2.3 | 2026-10-25 | Review v1.3 (RV-R-10): Umsetzungsstand nach a359f83 (Texte ausgelagert, Englisch) |
| 2.4 | 2026-10-26 | Nachweis MAN-UX-002 verlinkt; Systemnachrichten als Code; Status → implemented (Texte ausgelagert, MAN-UX-002 durchgeführt) |
| 2.5 | 2026-10-26 | Verifiziert im finalen Lauf gegen das Docker-Beispiel (MAN-UX-002 bestanden bzw. ausgeführt); Status → verified |
