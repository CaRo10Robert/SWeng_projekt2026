# ADR-0011: Umsetzungsentscheidungen im MVP (Abweichungen von ADR-0002, 0003, 0007, 0009)

- **Status:** Accepted (nach Architektur-Review v1.0, 2026-10-23)
- **Datum:** 2026-10-23
- **Bezug:** ADR-0002, ADR-0007, ADR-0009, ADR-0010, REQ-LST-003, REQ-SEC-004; Guideline Kap. 05, 06, 14

## Kontext
Mit dem ersten lauffähigen MVP (Docker-Beispiel nach ADR-0010) wurden einige Festlegungen aus den Architekturentscheidungen bei der Umsetzung vereinfacht oder präzisiert. Die Guideline verlangt, dass Abweichungen von SHOULD-Regeln dokumentiert werden. Diese ADR sammelt sie an einer Stelle, damit sie im Review sichtbar sind.

Offene Frage Q-11 (ADR-0010: „ein Container“ wörtlich?) wird für den MVP mit **Option B** beantwortet: ein selbst gebautes Image `campusmarkt` plus `postgres` und `mailpit` in einem Compose-Setup.

## Entscheidungen

| # | Thema | Festlegung bisher | Umsetzung im MVP | Begründung |
|---|---|---|---|---|
| 1 | Datenzugriff | Drizzle ORM + drizzle-kit (ADR-0002) | `pg` mit einem kleinen, parametrisierenden `sql`-Template (`apps/server/src/platform/sql.ts`) und handgeschriebenen SQL-Migrationen (`apps/server/migrations/`) | Viel Postgres-Spezifisches (generierte `tsvector`-Spalte, `pg_trgm`, Arrays, Partial Unique Indexes, `ON CONFLICT`). pg-boss muss dieselbe Verbindung nutzen (transaktionales Enqueue). Drizzle liefert bei Raw-SQL-Abfragen Zeitstempel als unformatierte Strings. Werte werden ausnahmslos als Parameter übergeben (Unit-Test). Drizzle kann später schrittweise eingeführt werden. |
| 2 | API-Vertrag | Design-first `packages/contracts/openapi.yaml` (ADR-0009) | **Schema-first in TypeScript**: TypeBox-Schemas in `packages/contracts` sind die einzige Quelle. Der Server validiert Requests/Responses damit und erzeugt die OpenAPI-3.1-Spezifikation (`/api/docs`, `/api/docs/json`). Die SPA nutzt dieselben Typen. | Ein Vertrag, keine Doppelpflege von YAML und Typen, trotzdem sprachneutrale OpenAPI für spätere Apps. Contract-Tests mit `oasdiff` gegen die erzeugte Spezifikation bleiben möglich. |
| 3 | E-Mail-Templates | MJML → HTML + Text | Templates als TypeScript-Funktionen (HTML + Text) im Modul `notifications` | Weniger Abhängigkeiten. MJML kann ergänzt werden, ohne die Schnittstelle zu ändern. |
| 4 | CSRF-Schutz | „CSRF-Schutz für zustandsändernde Requests“ (REQ-SEC-004) | `SameSite=Lax`-Cookie **plus** Pflicht-Header `x-campusmarkt-csrf: 1` und Origin-Prüfung bei allen POST/PUT/PATCH/DELETE auf `/api/*`. WebSocket: Session-Cookie plus Origin-Prüfung. | Custom Header lassen sich cross-origin nicht ohne CORS-Preflight setzen. CORS ist nicht freigegeben (OWASP CSRF Cheat Sheet, „Custom Request Headers“). |
| 5 | HEIC-Bilder | Annahme von HEIC (REQ-LST-003) | HEIC wird beim Upload mit klarer Meldung abgelehnt (415 `heic_unsupported`) | Die vorkompilierte libvips in sharp dekodiert kein HEIC (HEVC-Lizenz). Eine eigene libvips-Build-Kette widerspräche dem schlanken Image. Offener Punkt, siehe Umsetzungsstand. |
| 6 | Paket `packages/ui` | eigenes Komponentenpaket, shadcn/ui | Zugängliche Basiskomponenten direkt in `apps/web/src/components` (Tailwind, natives `<dialog>`) | Nur eine Web-App. Auslagerung in ein Paket, sobald eine zweite Oberfläche entsteht. |
| 7 | Merkliste | Modul `search` | Tabelle `search.favorite` im eigenen Schema ohne Fremdschlüssel auf `listings` | Modulregel 2 (kein Zugriff auf fremde Tabellen). Verwaiste Einträge werden beim Lesen gefiltert. |
| 8 | Suche | `SearchPort` → Postgres FTS (ADR-0008) | Port in `platform/ports`, Adapter `pg-search.ts` liest die Projektion `listings.listing.search_doc`; Fallback auf Titel-`ILIKE` mit `degraded: true` | Austausch gegen Meilisearch nur über einen neuen Adapter plus Indexierungs-Events. |
| 9 | Bezahlung | `PaymentPort` (ADR-0006) | Nur die Schnittstelle (`modules/payments/payment-port.ts`). Deal-Konzept, `amount_cents` + `currency` und die Domain Events `DealAgreed/Completed/Cancelled` (Queue `deal-events`) sind umgesetzt. | Kein toter Code, aber alle Vorleistungen für EPIC-09 sind vorhanden. |

## Konsequenzen
- (+) Das MVP startet mit `docker compose up --build` vollständig offline (Smoke-Test `scripts/smoke-test.mjs`).
- (+) Modulgrenzen bleiben technisch geprüft (`pnpm lint:deps`, dependency-cruiser).
- (−) Kein ORM-Typabgleich zwischen SQL-Schema und Code. Gegenmaßnahme: Integrationstests gegen echtes Postgres (Testcontainers) sind der nächste Schritt.
- (−) HEIC-Fotos (iPhone-Standard) müssen vorerst als JPEG exportiert werden.
- ADR-0002, ADR-0007 und ADR-0009 bleiben gültig; diese ADR präzisiert bzw. ersetzt die genannten Teile. Die betroffenen ADRs tragen einen Hinweis darauf. Künftig gilt: eine Entscheidung je ADR.
