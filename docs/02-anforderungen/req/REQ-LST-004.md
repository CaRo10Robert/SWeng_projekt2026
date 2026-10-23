---
id: REQ-LST-004
title: Übergabeort aus Campus-Standorten
type: business-rule
class: domain
status: implemented
owner: team-marktplatz
risk: low
release: R1
moscow: M
moscow_reason: [1]
kano: basis
epic: EPIC-02
source: BG-1, Wettbewerbsanalyse
use_cases: [UC-10, UC-13]
version: 1.2
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-LST-004]
---

# REQ-LST-004 Übergabeort aus Campus-Standorten

## Anforderung
Jede Anzeige muss **mindestens einen und höchstens fünf** Übergabeorte aus der Liste der Campus-Standorte ihrer Institution haben. Die Liste ist Konfiguration und ohne neues Deployment änderbar. Startwerte: Ludwigshafen Hauptcampus, Ludwigshafen Ostasieninstitut, Weincampus Neustadt.

## Begründung
Übergaben auf dem Campus sind sicher und kostenlos; Versand ist nicht Teil des MVP. Freitext-Adressen würden Wohnorte preisgeben.

**Must-Begründung:** Kriterium 1 (Release-Ziel nicht ohne sie erreichbar).

## Akzeptanzkriterien
| Übergabeorte | Ergebnis |
|---|---|
| keiner | ❌ 422 |
| 1 bekannter Standort | ✅ |
| 2 Angaben, derselbe Standort doppelt | ✅, Duplikat entfernt |
| unbekannte Standort-ID | ❌ 422 |
| 6 Standorte | ❌ 422 |

## Nachweis
- `AT-LST-004`: API-Test – Anlage ohne bzw. mit unbekanntem Übergabeort wird abgelehnt (neu).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei, Entscheidungstabelle, Obergrenze 5 (wie umgesetzt) |
| 1.2 | 2026-10-23 | Review v0.2: Must-Begründung (moscow_reason) |
