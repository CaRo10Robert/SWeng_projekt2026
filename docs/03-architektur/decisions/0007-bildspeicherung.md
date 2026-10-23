# ADR-0007: Bilder auf einem Docker-Volume hinter einem StoragePort

- **Status:** Proposed
- **Datum:** 2026-10-20 (überarbeitet für ADR-0010)
- **Bezug:** REQ-LST-003, REQ-SEC-007

## Kontext
Bis zu 8 Bilder pro Anzeige (≤ 10 MB). Bilder dürfen keine EXIF- oder GPS-Daten enthalten (Privatsphäre: Wohnort) und gehören nicht in die Datenbank. Inhalte sind nur für Mitglieder sichtbar. Im Docker-Beispiel gibt es keinen Object Storage (ADR-0010).

## Optionen
- **A: Dateisystem (Docker-Volume `uploads`) hinter `StoragePort`** → gewählt für das Beispiel
- B: S3-kompatibel (MinIO-Container) → zusätzlicher Container ohne Mehrwert im Beispiel. Bleibt der **Adapter für den Produktivbetrieb**
- C: Bilder als BLOB in Postgres → DB-Bloat, Backups groß

## Entscheidung
Option A.
1. Upload per `multipart/form-data` an die API (Limit 10 MB, max. 8 Dateien) → Ablage unter `uploads/quarantine/`.
2. Job `process-image`: Magic-Bytes prüfen, mit sharp nach WebP neu kodieren (das entfernt EXIF), 2 Thumbnail-Größen erzeugen → `uploads/public/<listingId>/…`.
3. Auslieferung über die API (`GET /media/{id}`) **nur mit gültiger Session**. `Cache-Control: private` und `X-Content-Type-Options: nosniff` sind gesetzt.
4. `StoragePort` (`put`, `get`, `delete`, `move`). Der Austausch gegen einen S3-Adapter (Presigned URLs) erfordert keine Änderung im Modul `listings`.

## Konsequenzen
- Bilder sind erst nach wenigen Sekunden sichtbar (Status `processing`). Die UI zeigt einen Platzhalter.
- Ein Aufräumjob löscht Quarantäne-Dateien, die älter als 24 h sind.
- Volume-Backup ist im Beispiel nicht vorgesehen (N/A).
