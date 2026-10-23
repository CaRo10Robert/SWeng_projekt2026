---
id: REQ-SEC-007
title: Sicherer Umgang mit hochgeladenen Bildern
type: security
class: quality
status: in-review
owner: team-plattform
risk: medium
release: R1
moscow: M
kano: basis
epic: EPIC-02
source: OWASP File Upload Cheat Sheet, ADR-0007
use_cases: [UC-10]
depends_on: [REQ-LST-003]
version: 2.0
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-SEC-007, AT-SEC-007-2, AT-SEC-007-3, AT-SEC-007-4]
---

# REQ-SEC-007 Sicherer Umgang mit hochgeladenen Bildern

## Anforderung
Das System muss hochgeladene Dateien
1. anhand ihres **Inhalts** (nicht Dateiendung oder Angabe des Browsers) als zulässiges Bildformat erkennen und alles andere ablehnen,
2. vor der Veröffentlichung **neu erzeugen**, sodass eingebettete Metadaten (z. B. GPS-Position) und eingeschleuster Inhalt entfernt werden,
3. so ablegen, dass sie nie als ausführbarer Inhalt ausgeliefert werden,
4. nur an **angemeldete Mitglieder** ausliefern, mit Hinweis an den Browser, den Inhaltstyp nicht zu raten.

Speicherort und Auslieferungsverfahren legt ADR-0007 fest.

## Begründung
Uploads sind ein typischer Angriffsweg; Fotos verraten über GPS-Daten oft den Wohnort.

## Akzeptanzkriterien
| Eingabe / Aktion | Erwartung |
|---|---|
| Datei mit Endung `.png`, Inhalt kein Bild | 415, nichts gespeichert |
| JPEG mit GPS-EXIF | ausgeliefertes Bild enthält keine EXIF-Daten |
| Bildabruf ohne Sitzung | 401 |
| Antwort beim Bildabruf | `X-Content-Type-Options: nosniff`, privat cachebar |

## Nachweis
- `AT-SEC-007`: Smoke-Test – Upload ohne gültige Bildsignatur liefert 415.
- `AT-SEC-007-2`: Smoke-Test – Bildabruf ohne Sitzung liefert 401.
- `AT-SEC-007-3`: Unit-Test der Formaterkennung am Inhalt (Grundlage: `listings/domain.test.ts`, „Magic Bytes“).
- `AT-SEC-007-4`: neu zu schreiben – JPEG mit GPS-EXIF hochladen, ausgeliefertes Bild enthält keine EXIF-Daten.
- Teilweise umgesetzt: HEIC wird abgelehnt (siehe REQ-LST-003, ADR-0011).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 2.0 | 2026-10-23 | „Signierte URLs“ als Lösung entfernt (Fallstudie FS-M5); Ziel „nur angemeldete Mitglieder“ formuliert |
