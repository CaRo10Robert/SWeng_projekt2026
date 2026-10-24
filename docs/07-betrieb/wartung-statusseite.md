---
id: OPS-MAINTENANCE
type: operational
status: in-review
owner: architecture-lead
version: 1.0
created: 2026-10-24
last_updated: 2026-10-24
---

# Wartung, Ankündigungen und Statusseite

> **Muster im Rahmen einer Übungsaufgabe.** Anforderungen: REQ-OPS-006 (Wartungsmodus und Ankündigungen), REQ-OPS-007 (Statusseite).

## Geplante Wartung

| Schritt | Zeitpunkt | Wie |
|---|---|---|
| Ankündigen | mindestens 3 Tage vorher | Ankündigungsbanner in der Admin-Oberfläche setzen: Text, Zeitraum |
| Wartung beginnen | Startzeit | `MAINTENANCE_MODE=true` setzen und `app` neu starten |
| Während der Wartung | – | alle Seiten und API-Aufrufe liefern **503** mit `Retry-After` und einer Wartungsseite; `/health/*` und `/status` bleiben erreichbar |
| Wartung beenden | nach Prüfung | `MAINTENANCE_MODE=false`, Neustart, Smoke-Test, Banner entfernen |

Wartungsfenster [Platzhalter: z. B. dienstags 6–8 Uhr, außerhalb von Prüfungszeiten und Semesterstart].

## Ankündigungsbanner

- Gesetzt von Administratorinnen und Administratoren, mit Zeitraum (von, bis) und Text.
- Erscheint auf allen Seiten oben, auch für Gäste, als Region mit Rolle `status` (Barrierefreiheit).
- Wird nach Ablauf automatisch ausgeblendet.
- Änderung steht im Audit-Log.

## Statusseite `/status`

- öffentlich, ohne Anmeldung, auch im Wartungsmodus erreichbar,
- zeigt den Zustand je Bereich: Web-App, Anmeldung, Chat (Echtzeit), E-Mail-Versand – als „in Betrieb“, „eingeschränkt“, „Wartung“,
- zeigt die aktuelle Ankündigung,
- verrät **keine internen Details** (keine Versionen, Hostnamen, Fehlermeldungen).

Im Echtbetrieb sollte die Statusseite zusätzlich **außerhalb** der Plattform gespiegelt werden (z. B. statische Seite beim RZ), damit sie auch bei einem Totalausfall erreichbar ist [Platzhalter].
