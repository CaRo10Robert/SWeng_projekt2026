# ADR-0001: Modularer Monolith statt Microservices

- **Status:** Proposed
- **Datum:** 2026-10-20
- **Entscheider:** Projektteam (Review durch Betreuer/in)

## Kontext
Kleines Studierendenteam, ein Semester, unklare Last (≤ 5.000 potenzielle Nutzer). Fachlich gibt es mehrere klar trennbare Bereiche: Identität, Anzeigen, Suche, Chat, Benachrichtigungen, Vertrauen, Datenschutz und später Bezahlung. Laut Guideline (Kap. 02) starten neue Produkte als modularer Monolith.

## Optionen
| Option | Pro | Contra |
|---|---|---|
| **A: Modularer Monolith** (ein Build, zwei Startmodi `api` und `worker`) | Einfacher Betrieb, eine Transaktion über mehrere Tabellen möglich (Outbox), schnelle Iteration, leicht verständlich | Disziplin bei Modulgrenzen nötig |
| B: Microservices (z. B. Chat-Service separat) | Unabhängige Skalierung | Verteilte Fehlerbilder, mehr Infrastruktur, für die Teamgröße unverhältnismäßig |
| C: Unstrukturierter Monolith | Am schnellsten am Anfang | Bezahlung oder Mandanten später nur mit Umbau (verletzt REQ-ARCH-001) |

## Entscheidung
**Option A.** Modulgrenzen werden technisch erzwungen: ein Postgres-Schema pro Modul, öffentliche `index.ts`, `dependency-cruiser` in CI. Kommunikation zwischen Modulen erfolgt über das öffentliche API oder über Domain Events.

## Konsequenzen
- (+) Bezahlung (ADR-0006) lässt sich als weiteres Modul andocken. Ein späteres Extrahieren (z. B. Chat) ist möglich, weil die Grenzen schon existieren.
- (−) Ein Fehler kann den ganzen API-Prozess betreffen. Gegenmaßnahmen: mehrere Instanzen, Worker getrennt (Bulkhead).
- Extraktion eines Moduls erst bei konkretem Grund (Entscheidungsbaum Guideline Kap. 02).
