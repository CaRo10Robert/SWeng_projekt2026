---
id: REQ-LST-012
title: HEIC-Fotos annehmen
type: user-story
class: functional
status: approved
owner: team-marktplatz
risk: medium
release: R2
moscow: C
kano: leistung
epic: EPIC-02
source: BG-2
use_cases: [UC-10]
depends_on: [REQ-LST-003]
version: 1.0
created: 2026-10-23
last_updated: 2026-10-23
verification: [AT-LST-012]
---

# REQ-LST-012 HEIC-Fotos annehmen

## Anforderung
Als Mitglied mit iPhone möchte ich Fotos im Format **HEIC** direkt hochladen, damit ich sie vorher nicht umwandeln muss. Für HEIC-Fotos gelten dieselben Regeln wie für alle Bilder (REQ-LST-003): höchstens 10 MB, keine Metadaten in den ausgelieferten Ansichten, drei Ansichtsgrößen.

## Begründung
HEIC ist das Standardformat von iPhones; das manuelle Umwandeln ist eine Einstiegshürde (BG-2). Abgespalten aus REQ-LST-003 (Review v0.2 R-09/R-21, Entscheidung Q-14), weil die Verarbeitung im Docker-Beispiel derzeit nicht möglich ist (ADR-0011 #5).

## Akzeptanzkriterien
```gherkin
Szenario: HEIC-Foto
  Angenommen ich habe ein HEIC-Foto mit GPS-Daten
  Wenn ich es zu meiner Anzeige hochlade
  Dann erscheint es in allen drei Ansichtsgrößen
  Und keine ausgelieferte Ansicht enthält Metadaten
```

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Defekte oder manipulierte HEIC-Datei | Status „fehlgeschlagen“, Anzeige bleibt ohne dieses Bild |
| Sehr große Pixelzahl | wie REQ-LST-003 begrenzt |

## INVEST
I: setzt REQ-LST-003 voraus · N: Lösungsweg offen (Spike S-02) · V: weniger Hürden für iPhone-Nutzer · E: erst nach Spike schätzbar · S: ein Sprint · T: automatisierbar mit Beispieldatei.

## Nachweis
- `AT-LST-012`: Upload-Test mit HEIC-Beispielfoto inkl. Metadatenprüfung (neu). Noch nicht umgesetzt (⬜).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-23 | Abgespalten aus REQ-LST-003 (Review v0.2 R-09/R-21, Q-14) |
