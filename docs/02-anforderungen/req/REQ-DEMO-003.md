---
id: REQ-DEMO-003
title: Beispielfotos für die Demo-Anzeigen
type: operational
class: constraint
status: verified
owner: team-plattform
risk: low
release: R1
moscow: S
kano: begeisterung
epic: EPIC-00
source: BG-6, Vorführung des Prototyps am 2026-11-13
depends_on: [REQ-DEMO-001]
version: 1.0
created: 2026-11-12
last_updated: 2026-11-12
verification: [AT-DEMO-003, AT-DEMO-003-2]
---

# REQ-DEMO-003 Beispielfotos für die Demo-Anzeigen
## Anforderung
Das System soll die Demo-Anzeigen (REQ-DEMO-001) mit realistisch wirkenden Beispielfotos statt einfarbiger Platzhalterbilder anlegen. Jede Demo-Anzeige mit Bildern erhält genau so viele Fotos, wie die Demo-Daten vorsehen. Die Fotos zeigen den angebotenen oder gesuchten Gegenstand, sind KI-generiert und enthalten keine Personen, keine lesbare Schrift und keine Marken. Fehlt ein Foto, verwendet der Seed das bisherige Platzhalterbild, damit das Docker-Beispiel weiterhin offline startet (ADR-0010).

## Begründung
Eine Vorführung mit einfarbigen Platzhaltern zeigt nicht, wie die Plattform im Alltag aussieht (BG-6, Risiko R-1). Echte Fotos von Personen oder Marken kommen aus Datenschutz- und Urheberrechtsgründen nicht in Frage.

## Akzeptanzkriterien
```gherkin
Szenario: Frischer Start mit Fotos
  Angenommen die Datenbank ist leer und die Demo-Option ist aktiv
  Wenn das System startet
  Dann zeigt jede Demo-Anzeige mit Bildern ein Foto des Gegenstands statt eines Platzhalters

Szenario: Foto fehlt
  Angenommen ein Beispielfoto fehlt im Ordner assets/demo-images
  Wenn das System die Demo-Daten anlegt
  Dann erhält diese Anzeige das Platzhalterbild und der Start läuft ohne Fehler weiter
```

## Technik
- Ablage: `apps/server/assets/demo-images/lNN-M.jpg` (NN = Position in `DEMO_LISTINGS`, M = Bildnummer ab 1), JPEG 1200 × 900, höchstens 350 KB. Der Ordner liegt im Paketstamm und gelangt mit `pnpm deploy` ins Laufzeit-Image.
- Laden: `apps/server/src/seed/demo-images.ts`; der Upload läuft wie bei Mitgliedern über das Listings-Modul (Neukodierung, Metadaten entfernt).
- Herkunft: Die Bildbeschreibungen schrieb ein lokales Sprachmodell aus Titel und Beschreibung der Anzeige; die Bilder erzeugte ein Bildmodell (Codex, Funktion image_generation). Beides steht in `assets/demo-images/README.md` und `prompts.json`.

## Nachweis
- `AT-DEMO-003`: Unit-Test (`demo-images.test.ts`) – für jede Demo-Anzeige mit Bildern liegen die Fotos vor, JPEG 1200 × 900, höchstens 350 KB.
- `AT-DEMO-003-2`: Unit-Test (`demo-images.test.ts`) – fehlt ein Foto oder der Ordner, liefert der Seed das Platzhalterbild.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-11-12 | Erstfassung für die Vorführung des Prototyps; umgesetzt und verifiziert (AT-DEMO-003, AT-DEMO-003-2) |
