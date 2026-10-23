---
id: REQ-LST-003
title: Bilder hochladen, Metadaten entfernen, Vorschaubilder
type: privacy
class: functional
status: in-review
owner: team-marktplatz
risk: medium
release: R1
moscow: M
kano: leistung
epic: EPIC-02
source: BG-1, DSGVO Art. 25
use_cases: [UC-10]
depends_on: [REQ-SEC-007]
version: 2.0
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-LST-003, AT-LST-003-2, AT-LST-003-3]
---

# REQ-LST-003 Bilder hochladen, Metadaten entfernen, Vorschaubilder

## Anforderung
Das System muss pro Anzeige **bis zu 8 Bilder** in den Formaten JPEG, PNG, WebP und HEIC mit je **höchstens 10 MB** annehmen. Vor der Veröffentlichung müssen alle eingebetteten Metadaten (EXIF, insbesondere GPS-Position und Gerätedaten) entfernt sein. Für jedes Bild stellt das System eine kleine, eine mittlere und eine große Ansicht bereit. Bis zur Fertigstellung zeigt die Oberfläche einen Platzhalter.

## Begründung
Bilder sind entscheidend für den Verkaufserfolg. GPS-Daten in Handyfotos verraten den Wohnort (Privacy by Design). HEIC ist das Standardformat von iPhones.

## Akzeptanzkriterien
```gherkin
Szenario: Foto mit Standortdaten
  Angenommen ich lade ein JPEG mit GPS-Koordinaten im EXIF hoch
  Wenn das Bild für die Anzeige verarbeitet ist
  Dann enthält keine ausgelieferte Bildgröße EXIF- oder GPS-Daten

Szenario: Zu viele oder zu große Dateien
  Wenn ich 9 Bilder oder ein Bild über 10 MB hochlade
  Dann wird der Upload mit einer verständlichen Meldung abgelehnt

Szenario: Keine Bilddatei
  Wenn ich eine Datei hochlade, deren Inhalt kein Bild ist (unabhängig von Endung und angegebenem Typ)
  Dann wird sie mit 415 abgelehnt
```

| Ansicht | Längste Kante |
|---|---|
| klein | ≤ 400 px |
| mittel | ≤ 900 px |
| groß | ≤ 1.600 px |

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Falsche Endung oder manipulierter MIME-Typ | Prüfung am Inhalt, Ablehnung |
| Bild nicht verarbeitbar (defekt, extrem große Pixelzahl) | Status „fehlgeschlagen“, die Anzeige bleibt ohne dieses Bild bestehen |
| Hochgeladene, nie verwendete Bilder | werden nach 24 h gelöscht |

## Nachweis
- `AT-LST-003`: Smoke-Test – Upload, Verarbeitung, Auslieferung als Bild in allen Ansichten.
- `AT-LST-003-2`: Unit- und Smoke-Test – Formaterkennung am Inhalt, Ablehnung mit 415.
- `AT-LST-003-3`: Test mit GPS-EXIF-Foto, ausgelieferte Bilder ohne Metadaten (neu zu schreiben).

**Abweichung:** HEIC wird im MVP mit einer Meldung abgelehnt (ADR-0011 #5). Deshalb Status `in-review`. Technische Umsetzung (Neukodierung) siehe ADR-0007.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 2.0 | 2026-10-23 | Lösungsneutral formuliert, Ansichtsgrößen festgelegt, Akzeptanzkriterien |
