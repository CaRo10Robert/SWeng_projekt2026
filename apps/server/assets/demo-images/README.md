# Beispielfotos der Demo-Anzeigen (REQ-DEMO-003)

Die Fotos in diesem Ordner zeigen die Gegenstände der Demo-Anzeigen aus `src/seed/demo-data.ts`. Der Seed lädt sie beim ersten Start mit `SEED_DEMO=true` (`src/seed/demo-images.ts`). Fehlt eine Datei, nimmt er das schlichte Platzhalterbild.

| Angabe | Wert |
|---|---|
| Dateiname | `lNN-M.jpg`: NN = Position der Anzeige in `DEMO_LISTINGS` (ab 00), M = Bildnummer ab 1 |
| Format | JPEG, 1200 × 900 (4:3), Qualität 82, ohne Metadaten |
| Herkunft | KI-generiert, keine echten Fotos. Die Bildbeschreibungen (`prompts.json`) entstanden aus Titel und Beschreibung der Anzeige: 14 schrieb ein lokales Sprachmodell (Qwen 3.8 27B in LM Studio), 11 schrieb Claude, nachdem das lokale Modell dafür leere Antworten lieferte; `l03-1` stammt aus einem Probelauf mit eigener Beschreibung. Claude prüfte alle. Die Bilder erzeugte das Bildmodell von OpenAI über Codex (Funktion `image_generation`), danach auf 4:3 zugeschnitten und verkleinert. |
| Inhalt | Nur der Gegenstand in einer Alltagsumgebung: keine Personen, keine lesbare Schrift, keine Marken oder Logos |
| Erstellt | 2026-11-12 für die Vorführung des Prototyps |

Neue Demo-Anzeige mit Bild: Bildbeschreibung in `prompts.json` ergänzen, Bild erzeugen, als `lNN-M.jpg` mit 1200 × 900 ablegen. `AT-DEMO-003` prüft, dass zu jeder Demo-Anzeige mit Bildern alle Fotos vorhanden sind.
