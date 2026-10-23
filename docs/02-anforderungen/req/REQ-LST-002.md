---
id: REQ-LST-002
title: Preistypen und Preisgrenzen
type: data
class: domain
status: implemented
owner: team-marktplatz
risk: low
release: R1
moscow: M
moscow_reason: [1]
kano: basis
epic: EPIC-02
source: Reverse Engineering Kleinanzeigen
use_cases: [UC-10]
version: 1.2
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-LST-002, AT-LST-002-2]
---

# REQ-LST-002 Preistypen und Preisgrenzen

## Anforderung
Das System muss die Preistypen **Festpreis**, **Verhandlungsbasis (VB)**, **zu verschenken** und **Tausch** unterstützen. Bei Festpreis und VB ist ein Preis Pflicht mit 0 < Preis ≤ 10.000 € und höchstens 2 Nachkommastellen. Bei „zu verschenken“ und „Tausch“ wird kein Preis gespeichert. Geldbeträge werden als ganzzahlige Cent-Beträge mit Währung (ISO 4217, MVP: EUR) geführt.

## Begründung
Tauschen und Verschenken sind am Campus typisch (Nachhaltigkeit). Ganzzahlige Beträge mit Währung sind Vorleistung für die spätere Bezahlung (ADR-0006).

**Must-Begründung:** Kriterium 1 (Release-Ziel nicht ohne sie erreichbar).

## Akzeptanzkriterien
| Preistyp | Preis | Ergebnis |
|---|---|---|
| Festpreis | 0,01 € | ✅ |
| Festpreis | 10.000,00 € | ✅ |
| Festpreis | 0,00 € | ❌ 422 |
| Festpreis | 10.000,01 € | ❌ 422 |
| VB | ohne Preis | ❌ 422 |
| VB | 12,505 € (keine ganzen Cent) | ❌ 422 |
| zu verschenken | 5,00 € | ✅, Preis wird verworfen |
| Tausch | ohne Preis | ✅ |

Darstellung: Festpreis „12,50 €“, VB „12,50 € VB“, „Zu verschenken“, „Tausch“.

## Nachweis
- `AT-LST-002`: Unit-Test der Preisregel (Entscheidungstabelle oben).
- `AT-LST-002-2`: Smoke-Test – Preis über 10.000 € wird mit 422 abgelehnt.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei, Entscheidungstabelle |
| 1.2 | 2026-10-23 | Review v0.2: Must-Begründung (moscow_reason) |
