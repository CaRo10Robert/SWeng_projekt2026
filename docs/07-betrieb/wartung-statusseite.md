---
id: OPS-MAINTENANCE
type: operational
status: in-review
owner: architecture-lead
version: 1.1
created: 2026-10-24
last_updated: 2026-10-25
---

# Wartung, Ankündigungen und Statusseite

> **Muster im Rahmen einer Übungsaufgabe.** Anforderungen: REQ-OPS-006 (Wartungsmodus und Ankündigungen), REQ-OPS-007 (Statusseite).

## Geplante Wartung

| Schritt | Zeitpunkt | Wie |
|---|---|---|
| Ankündigen | mindestens 3 Tage vorher | Ankündigungsbanner in der Admin-Oberfläche setzen: Text, Zeitraum |
| Wartung beginnen | Startzeit | **weich:** in der Admin-Oberfläche einschalten (ohne Neustart, `platform.setting`); **hart:** `MAINTENANCE_MODE=true` (optional `MAINTENANCE_UNTIL`) setzen und `app` neu starten. Erreichbar bleiben Health, Metriken, Status, Rechtsseiten, Anmeldung und alle Anfragen von Administratoren |
| Während der Wartung | – | alle Seiten und API-Aufrufe liefern **503** mit `Retry-After` und einer Wartungsseite; `/health/*` und `/status` bleiben erreichbar |
| Wartung beenden | nach Prüfung | weich: in der Admin-Oberfläche ausschalten; hart: `MAINTENANCE_MODE=false` und Neustart; danach Smoke-Test, Banner entfernen |

Wartungsfenster [Platzhalter: z. B. dienstags 6–8 Uhr, außerhalb von Prüfungszeiten und Semesterstart].

## Ankündigungsbanner

- Gesetzt von Administratorinnen und Administratoren, mit Zeitraum (von, bis) und Text.
- Erscheint auf allen Seiten oben, auch für Gäste, als Region mit Rolle `status` (Barrierefreiheit).
- Wird nach Ablauf automatisch ausgeblendet.
- Änderung steht im Audit-Log.

## Statusseite `/status`

- öffentlich, ohne Anmeldung, auch im Wartungsmodus erreichbar,
- zeigt den Gesamtzustand (`operational` = in Betrieb, `degraded` = eingeschränkt, `maintenance` = Wartung) und den Zustand je Bereich nach dem Vertrag `SystemStatus` (`packages/contracts/src/ops.ts`): **Anwendung** (`app`), **Datenbank** (`database`), **E-Mail-Versand** (`email`), **Echtzeit/Chat** (`realtime`),
- die Prüfungen laufen höchstens einmal gleichzeitig (gemeinsam genutzt) und mit kurzem Zwischenspeicher; die Route ist auf 50 Anfragen je 10 s begrenzt,
- zeigt die aktuelle Ankündigung,
- verrät **keine internen Details** (keine Versionen, Hostnamen, Fehlermeldungen).

Im Echtbetrieb sollte die Statusseite zusätzlich **außerhalb** der Plattform gespiegelt werden (z. B. statische Seite beim RZ), damit sie auch bei einem Totalausfall erreichbar ist [Platzhalter].
