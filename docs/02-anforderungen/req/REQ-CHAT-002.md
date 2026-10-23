---
id: REQ-CHAT-002
title: Genau eine Konversation pro Anzeige und Interessent
type: data
class: functional
status: implemented
owner: team-kommunikation
risk: medium
release: R1
moscow: M
moscow_reason: [1]
kano: basis
epic: EPIC-04
source: Use-Case-Modell UC-20
use_cases: [UC-20]
version: 1.2
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-CHAT-002]
---

# REQ-CHAT-002 Genau eine Konversation pro Anzeige und Interessent

## Anforderung
Es **muss** genau eine Konversation pro Paar (Anzeige, Interessent) existieren. Der Anbieter ist durch die Anzeige festgelegt; Anbieter und Interessent sind verschiedene Personen.

## Begründung
Ein einheitlicher Verlauf pro Interessent verhindert verstreute Absprachen und ist Grundlage für den Deal (REQ-CHAT-011).

**Must-Begründung:** Kriterium 1 (Release-Ziel nicht ohne sie erreichbar).

## Akzeptanzkriterien
| Situation | Ergebnis |
|---|---|
| Interessent startet die erste Konversation zur Anzeige | neue Konversation |
| Derselbe Interessent startet erneut (auch gleichzeitig aus zwei Fenstern) | dieselbe Konversation, keine zweite |
| Anderer Interessent zur selben Anzeige | eigene, getrennte Konversation |
| Anbieter = Interessent | abgelehnt |

Die Eindeutigkeit gilt unabhängig vom genutzten Zugang (Oberfläche, Schnittstelle, mehrere Fenster), also auch bei gleichzeitigen Anfragen.

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Wettlauf zweier gleichzeitiger Starts | beide erhalten dieselbe Konversation |

## Nachweis
- `AT-CHAT-002`: API-Test – zweimaliger (auch paralleler) Start liefert dieselbe Konversations-ID (neu; Grundlage: Smoke-Test „Konversation starten“).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei, Entscheidungstabelle |
| 1.2 | 2026-10-23 | Review v0.2: R-22 lösungsneutral („Datenebene“ entfernt), Deal-Verweis auf REQ-CHAT-011, Must-Begründung |
