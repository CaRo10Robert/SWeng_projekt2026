---
id: MAN-A11Y-001-FIKTIV
type: evidence
requirement: REQ-A11Y-001, REQ-A11Y-002
status: example
owner: qa-lead
date: 2026-10-25
---

# FIKTIVES BEISPIEL – kein durchgeführter Test, kein Nachweis

> **Dieses Protokoll ist erfunden.** Es zeigt, wie ein ausgefülltes Protokoll nach der [Vorlage](protokollvorlage-screenreader.md) aussieht. Personen, Zeiten und Befunde sind fiktiv. Es belegt **nicht**, dass MAN-A11Y-001 oder MAN-A11Y-002 erfüllt sind. Ein echter Nachweis entsteht nur durch eine tatsächliche Prüfung nach dem [Leitfaden](leitfaden-screenreader.md).

## Rahmendaten (fiktiv)

| Feld | Wert |
|---|---|
| Datum, Dauer | 2026-11-12, 3 h 10 min |
| Prüfende | Erika Mustermann (QA, 4 Jahre NVDA-Erfahrung), Max Mustermann (Entwicklung) – fiktive Personen |
| Code-Stand | Commit `0000000` (fiktiv) |
| Umgebung | Docker-Beispiel, Seed-Daten, `http://localhost:8080` |
| Betriebssystem, Browser | Windows 11, Firefox 1xx; Edge 1xx für Abläufe 4, 5, 7 |
| Screenreader | NVDA 2026.x |
| Hilfsmittel | Maus abgezogen; Colour Contrast Analyser |

## Kernabläufe

| Nr. | Kernablauf | Bewertung | Tastaturfalle? | Fokus sichtbar? | Ansagen korrekt? | Befund-IDs | Bemerkung |
|---|---|---|---|---|---|---|---|
| 1 | Registrieren | B | nein | ja | ja | – | Fehler „E-Mail-Domain nicht zugelassen“ wird sofort angesagt |
| 2 | Anmelden und Abmelden | B | nein | ja | ja | – | |
| 3 | Passwort zurücksetzen | B | nein | ja | ja | – | |
| 4 | Suchen und Filtern | E | nein | ja | teilweise | A-1 | Trefferzahl wird erst nach zweitem Filterwechsel angesagt |
| 5 | Anzeige erstellen inkl. Bild | E | nein | ja | ja | A-2 | Nach dem Systemdialog landet der Fokus am Seitenanfang statt auf der Bildliste |
| 6 | Eigene Anzeige verwalten | B | nein | ja | ja | – | |
| 7 | Nachricht senden | B | nein | ja | ja | – | neue Nachricht wird angesagt, Fokus bleibt im Eingabefeld |
| 8 | Inhalt melden | B | nein | ja | ja | – | |
| 9 | Kontaktdaten freigeben | B | nein | ja | ja | – | |

## Befunde (fiktiv)

| ID | Schwere | Ablauf | Beschreibung | WCAG | Vorschlag |
|---|---|---|---|---|---|
| A-1 | niedrig | 4 | Die Live-Region mit der Trefferzahl wird beim ersten Filterwechsel neu eingehängt und deshalb nicht angesagt. | 4.1.3 | Live-Region dauerhaft im DOM halten, nur Text ändern |
| A-2 | mittel | 5 | Nach Rückkehr aus dem Dateidialog verliert die Seite den Fokus. | 2.4.3 | Fokus nach `change` gezielt auf die Bildliste setzen |

## Ergebnis (fiktiv)

- Kernabläufe bestanden: 9 von 9 (2 mit Einschränkung)
- Tastaturfallen: 0
- Anwendbare AA-Kriterien: 48 von 50 bestanden, 2 mit Einschränkung (4.1.3, 2.4.3)
- Fiktives Urteil: MAN-A11Y-002 erfüllt, MAN-A11Y-001 erfüllt mit Folgeaufgaben

**Nochmals: fiktives Beispiel, kein Nachweis.**
