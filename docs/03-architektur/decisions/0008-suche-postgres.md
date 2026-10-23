# ADR-0008: Suche mit PostgreSQL-Volltext statt separater Suchmaschine

- **Status:** Proposed
- **Datum:** 2026-10-20
- **Bezug:** REQ-SRCH-001…003, REQ-PERF-001

## Kontext
Erwartet werden < 20.000 aktive Anzeigen. Gebraucht werden deutsche Stammformen, Tippfehlertoleranz und Filter.

## Optionen
| Option | Bewertung |
|---|---|
| **A: Postgres `tsvector` (Konfiguration `german`) + GIN-Index + `pg_trgm` für unscharfe Suche** | Keine Zusatzinfrastruktur, transaktional konsistent, reicht für die erwartete Größe |
| B: Meilisearch / Typesense | Sehr gute UX (Typo-Toleranz, Facetten), aber zusätzlicher Dienst und Synchronisation |
| C: Elasticsearch / OpenSearch | Overkill, hoher Ressourcenbedarf |

## Entscheidung
**Option A.** Die Suche ist hinter einem `SearchPort` gekapselt, damit ein späterer Wechsel zu B möglich bleibt.

## Konsequenzen
- Neue Anzeigen sind sofort durchsuchbar (Generated Column). REQ-SRCH-003 ist damit trivial erfüllt.
- Wechsel zu B, wenn p95 > 500 ms bei realer Last oder die UX-Anforderungen (Facetten-Zähler, Synonyme) wachsen.
