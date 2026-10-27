# ADR-0009: REST + OpenAPI 3.1 (Design-first), AsyncAPI für den Chat

- **Status:** Accepted (nach Architektur-Review v1.0, 2026-10-23)
- **Teilweise präzisiert durch:** [ADR-0011](0011-mvp-umsetzung.md) Nr. 2 (Vertrag schema-first als TypeBox-Schemas in `packages/contracts`, OpenAPI daraus erzeugt; WebSocket-Ereignisse als TypeScript-Typen statt AsyncAPI-Dokument)
- **Datum:** 2026-10-20
- **Bezug:** Guideline Kap. 06

## Kontext
Die API wird von der Web-App genutzt und später ggf. von nativen Apps (EPIC-11). Laut Guideline ist der Vertrag versioniert und durch Contract-Tests abgesichert.

## Optionen
- **A: REST + OpenAPI 3.1, Design-first** → gewählt
- B: GraphQL → flexibel, aber Caching, Rate-Limiting und Autorisierung pro Feld sind aufwendiger. Kein Bedarf an flexiblen Abfragen
- C: tRPC → sehr ergonomisch bei reinem TypeScript, aber kein sprachneutraler Vertrag für spätere Apps

## Entscheidung
Option A. Der Pfad ist `/api/v1`. Die Spezifikation liegt in `packages/contracts/openapi.yaml`. Fastify validiert Requests und Responses gegen die Schemas. Der TS-Client wird generiert. Fehler folgen RFC 9457 (Problem Details). Cursor-Pagination. Für mutierende, wiederholbare Endpunkte gibt es einen `Idempotency-Key`-Header. Der WebSocket-Kanal wird in AsyncAPI 3.0 beschrieben.

## Konsequenzen
- Ein CI-Check stellt sicher, dass Spezifikation und Implementierung übereinstimmen (Contract-Tests, Breaking-Change-Erkennung z. B. mit `oasdiff`).
