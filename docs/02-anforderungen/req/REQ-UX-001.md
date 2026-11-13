---
id: REQ-UX-001
title: Mobile Nutzung und Installierbarkeit
type: quality
class: quality
status: verified
owner: team-produkt
risk: medium
reviewers: [qa-lead]
release: R1
moscow: M
moscow_reason: [1]
kano: basis
epic: EPIC-00
source: BG-2
version: 2.4
created: 2026-10-20
last_updated: 2026-11-13
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
| Metrik | (1) horizontaler Überlauf der Seite je Route; (2) Erfüllung der Installierbarkeitskriterien des Browsers |
| Akzeptanzkriterium | (1) **kein** horizontaler Überlauf auf allen Routen bei 360 px; alle Kernabläufe bei 360 px abschließbar; (2) Installierbarkeit erfüllt |
| Messverfahren | E2E-Test im Mobil-Viewport 360 × 780: Vergleich der Dokumentbreite mit der Fensterbreite (`scrollWidth > innerWidth`) je Route; Prüfung der Installierbarkeitskriterien (Web-App-Manifest, registrierter Service Worker, Icon) |
| Messkontext | Docker-Beispiel, Chromium/Edge mit Mobil-Emulation |
| Verhalten bei Verfehlung | Fehler gilt als Release-Blocker für die betroffene Route |

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Sehr schmale Bildschirme, Zoom 200 % | kein horizontaler Überlauf (AT-UX-001); Tabellen in scrollbaren Bereichen mit Tastaturzugang |
| Offline oder schwaches Netz | App-Shell aus dem Service-Worker-Cache; Daten brauchen Netz, Offline-Hinweis statt leerer Seite |
| Veralteter Service Worker nach einem Release | `registerType: autoUpdate`: neue Version wird beim nächsten Laden aktiv |
| Browser ohne Installationsunterstützung | normale Nutzung im Browser, keine Funktion hängt an der Installation |
| Große Bilder über Mobilfunk | Server erzeugt verkleinerte WebP-Varianten; Upload begrenzt (REQ-LST-003) |

## Nachweis
- `AT-UX-001`: E2E-Test – kein horizontales Scrollen bei 360 px auf allen Routen (Grundlage: bisheriger Browser-Durchlauf, als Test im Repo neu zu schreiben).
- `AT-UX-001-2`: E2E-Test (`mobile-privacy.spec.ts`) – Manifest verlinkt (Name, Start-URL, `standalone`, Icons 192 und 512 px abrufbar), Service Worker registriert und aktiv mit Scope `/`, App-Shell lädt offline.


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 2.0 | 2026-10-23 | Metrik und Messverfahren ergänzt (Fallstudie FS-M3) |
| 2.1 | 2026-10-23 | Review v0.2: R-22 (Technik in Messverfahren), R-15, R-16 |
| 2.2 | 2026-10-26 | Guideline-Review: GL-05 Fehler- und Missbrauchsfälle ergänzt |
| 2.3 | 2026-11-12 | AT-UX-001 prüft zusätzlich Gastseiten und die Seite „Kein Zugriff“: Der Seitenkopf für Gäste lief bei 360 px über (432 px); behoben mit REQ-UX-010 (nur Logo und „Anmelden“ unter 640 px) |
| 2.4 | 2026-11-13 | Nachweis AT-UX-001-2 umgesetzt (inklusive Offline-Fall der App-Shell); Status → verified |
