---
id: REQ-SEC-007
title: Sicherer Umgang mit hochgeladenen Bildern
type: security
class: constraint
status: approved
owner: team-plattform
risk: medium
release: R1
moscow: M
moscow_reason: [2]
kano: basis
epic: EPIC-02
source: OWASP ASVS 4.0.3 (EX-01)
use_cases: [UC-10]
depends_on: [REQ-LST-003]
version: 3.1
created: 2026-10-20
last_updated: 2026-10-26
review_due: 2027-04-26
verification: [AT-SEC-007, AT-SEC-007-2, AT-SEC-007-3, AT-SEC-007-4]
---

# REQ-SEC-007 Sicherer Umgang mit hochgeladenen Bildern

## Anforderung
Das System muss hochgeladene Dateien
1. anhand ihres **Inhalts** (nicht Dateiendung oder Angabe des Browsers) als zulässiges Bildformat erkennen und alles andere ablehnen,
2. vor der Veröffentlichung **neu erzeugen**, sodass eingebettete Metadaten (z. B. GPS-Position) und eingeschleuster Inhalt entfernt werden,
3. so ablegen, dass sie nie als ausführbarer Inhalt ausgeliefert werden,
4. nur an **angemeldete Mitglieder** ausliefern, mit Hinweis an den Browser, den Inhaltstyp nicht zu raten. Es gibt **keine Ausnahme** für Gäste: Auch die Vorschau nach REQ-LST-009 zeigt kein Bild (Entscheidung Q-1).

Eine separate Malware-Prüfung findet in R1 nicht statt (Entscheidung Q-16); der Schutz beruht auf Formatprüfung und Neuerzeugung (Punkte 1 und 2). Speicherort und Auslieferungsverfahren legt ADR-0007 fest.

## Begründung
Uploads sind ein typischer Angriffsweg; Fotos verraten über GPS-Daten oft den Wohnort.

## Akzeptanzkriterien
| Eingabe / Aktion | Erwartung |
|---|---|
| Datei mit Endung `.png`, Inhalt kein Bild | 415, nichts gespeichert |
| JPEG mit GPS-EXIF | ausgeliefertes Bild enthält keine EXIF-Daten |
| Bildabruf ohne Sitzung (auch als Gast über einen Vorschau-Link) | 401 |
| Antwort beim Bildabruf | `X-Content-Type-Options: nosniff`, privat cachebar |

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Polyglott-Datei (gültiger Bildanfang, angehängtes Skript) | wird neu erzeugt, angehängter Inhalt verschwindet |
| Sehr große Pixelzahl („Dekompressionsbombe“) | Verarbeitung abgelehnt, Bild als fehlgeschlagen markiert |
| Bild-ID einer fremden, entfernten Anzeige erraten | 404 (REQ-SEC-006) |

## Nachweis
- `AT-SEC-007`: Smoke-Test – Upload ohne gültige Bildsignatur liefert 415.
- `AT-SEC-007-2`: Smoke-Test – Bildabruf ohne Sitzung liefert 401.
- `AT-SEC-007-3`: Unit-Test der Formaterkennung am Inhalt (Grundlage: `listings/domain.test.ts`, „Magic Bytes“).
- `AT-SEC-007-4`: (neu) JPEG mit GPS-EXIF hochladen, ausgeliefertes Bild enthält keine EXIF-Daten.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 2.0 | 2026-10-23 | „Signierte URLs“ als Lösung entfernt (Fallstudie FS-M5); Ziel „nur angemeldete Mitglieder“ formuliert |
| 3.0 | 2026-10-23 | Review v0.2: R-29 keine Gast-Ausnahme (Q-1); Malware-Prüfung Won't (Q-16); R-03 `class: constraint`; HEIC-Hinweis entfällt (HEIC jetzt REQ-LST-012, R2) |
| 3.1 | 2026-10-26 | Guideline-Review: GL-02/GL-06 ASVS-Fassung 4.0.3 (EX-01), review_due |
