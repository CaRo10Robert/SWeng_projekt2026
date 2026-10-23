---
id: REQ-UX-001
title: Mobile Nutzung und Installierbarkeit
type: quality
class: quality
status: implemented
owner: team-produkt
risk: medium
release: R1
moscow: M
kano: basis
epic: EPIC-00
source: BG-2
version: 2.0
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-UX-001, AT-UX-001-2]
---

# REQ-UX-001 Mobile Nutzung und Installierbarkeit
## Anforderung
Die Oberfläche muss auf Smartphones ab 360 px Breite ohne Funktionsverlust nutzbar und als App auf dem Startbildschirm installierbar sein.

## Begründung
Studierende nutzen den Marktplatz überwiegend unterwegs auf dem Campus (BG-2).

## Qualitätsmerkmal, Metrik, Messverfahren
| Feld | Festlegung |
|---|---|
| Qualitätsmerkmal (ISO 25010) | Flexibility → Adaptability; Interaction Capability → Operability |
| Metrik | (1) horizontaler Überlauf der Seite (`scrollWidth > innerWidth`) je Route; (2) Erfüllung der Installierbarkeitskriterien (Manifest, Service Worker, Icon) |
| Akzeptanzkriterium | (1) **kein** horizontaler Überlauf auf allen Routen bei 360 px; alle Kernabläufe bei 360 px abschließbar; (2) Installierbarkeit erfüllt |
| Messverfahren | E2E-Test im Mobil-Viewport 360 × 780; Prüfung des Manifests und Service-Worker-Registrierung |
| Messkontext | Docker-Beispiel, Chromium/Edge mit Mobil-Emulation |
| Verhalten bei Verfehlung | Fehler gilt als Release-Blocker für die betroffene Route |

## Nachweis
- `AT-UX-001`: E2E-Test – kein horizontales Scrollen bei 360 px auf allen Routen (Grundlage: bisheriger Browser-Durchlauf, als Test im Repo neu zu schreiben).
- `AT-UX-001-2`: E2E-Test – Manifest und Service Worker sind vorhanden und registriert.


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 2.0 | 2026-10-23 | Metrik und Messverfahren ergänzt (Fallstudie FS-M3) |
