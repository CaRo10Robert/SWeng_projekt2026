---
id: REQ-UX-011
title: Erste Schritte für neue Mitglieder
type: user-story
class: functional
status: approved
owner: team-produkt
risk: low
release: R2
moscow: S
kano: begeisterung
epic: EPIC-07
source: Auftraggeber (2026-11-13, Q-31)
use_cases: [UC-04, UC-10, UC-08]
depends_on: [REQ-ACC-001, REQ-UX-005, REQ-LEGAL-010]
version: 1.0
created: 2026-11-13
last_updated: 2026-11-13
verification: [AT-UX-011, AT-UX-011-2]
---

# REQ-UX-011 Erste Schritte für neue Mitglieder

## Anforderung
Als neues Mitglied möchte ich nach der ersten Anmeldung kurz sehen, was ich als Nächstes tun kann, damit ich schnell eine vollständige Präsenz habe und die ersten Anzeigen sicher abwickle.

## Begründung
Wunsch des Auftraggebers (Q-31). Nach Registrierung und Bestätigung landen neue Mitglieder bisher ohne Orientierung auf der Startseite. Ein ergänztes Profil (Studiengang, Übergabeorte) stärkt das Vertrauen im Profil (REQ-ACC-005), die Sicherheitstipps senken das Risiko bei Übergaben (REQ-UX-005).

## Akzeptanzkriterien
```gherkin
Szenario: Erste Schritte nach der ersten Anmeldung
  Angenommen Mia hat ihr Konto eben bestätigt
  Wenn sie die Startseite öffnet
  Dann sieht sie oben den Bereich "Erste Schritte" mit drei Schritten
  Und jeder Schritt hat einen Link zum Ziel und zeigt, ob er erledigt ist

Szenario: Schritte erledigen
  Wenn Mia Studiengang oder einen Übergabeort im Profil speichert
  Dann ist "Profil ergänzen" erledigt
  Wenn sie ihre erste Anzeige veröffentlicht
  Dann ist "Erste Anzeige erstellen" erledigt
  Wenn sie die Sicherheitstipps öffnet
  Dann ist "Sicherheitstipps lesen" erledigt
  Und sind alle drei erledigt, verschwindet der Bereich mit dem Hinweis "Alles erledigt"

Szenario: Überspringen und wieder aufrufen
  Wenn Mia "Ausblenden" wählt
  Dann erscheint der Bereich auf keinem ihrer Geräte mehr
  Und über "Hilfe" → "Erste Schritte anzeigen" kann sie ihn wieder einblenden
```

| Schritt | Ziel | Erledigt, wenn |
|---|---|---|
| Profil ergänzen | „Mein Profil“ | Studiengang oder mindestens ein bevorzugter Übergabeort gespeichert |
| Erste Anzeige erstellen | „Anzeige erstellen“ | mindestens eine eigene Anzeige (gleich welcher Status außer Entwurf) |
| Sicherheitstipps lesen | Hilfe, Abschnitt Sicherheitstipps | Abschnitt einmal geöffnet |

| Regel | Festlegung |
|---|---|
| Speicherort | Zustand (ausgeblendet, Tipps gelesen) im Konto auf dem Server, **nicht** im Browser-Speicher (REQ-LEGAL-010: keine nicht notwendige Speicherung) |
| Wer sieht es | Mitglieder, solange nicht ausgeblendet und nicht alle Schritte erledigt; Bestandskonten bei Einführung: nur, wenn noch ein Schritt offen ist |
| Barrierefreiheit | Bereich als Region mit Überschrift, Schritte als Liste, Zustand als Text („erledigt“), per Tastatur bedienbar |

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Speichern des Zustands schlägt fehl | Hinweis, der Bereich bleibt sichtbar; kein Datenverlust an anderer Stelle |
| Anzeige wird später gelöscht | Schritt bleibt erledigt (einmal erreicht) |
| Mitglied mit Rolle Moderation oder Administration | sieht die Schritte wie alle Mitglieder; Ausblenden genügt |

## INVEST
I: nutzt vorhandene Seiten · N: Anzahl und Texte der Schritte verhandelbar · V: schneller Einstieg · E: klein · S: wenige Tage · T: automatisierbar.

## Nachweis
- `AT-UX-011`: E2E-Test – neues Mitglied sieht nach der Bestätigung „Erste Schritte“, erledigt die drei Schritte per Tastatur, der Bereich verschwindet; Ausblenden wirkt auch in einer zweiten Sitzung; Wiederaufruf über die Hilfe; axe-core ohne `serious`/`critical`; keine neuen Einträge im Browser-Speicher.
- `AT-UX-011-2`: Integrationstest – Zustand der Schritte wird aus Profil, Anzeigen und gespeichertem Zustand abgeleitet; Ausblenden und Wiedereinblenden; nur das eigene Konto.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-11-13 | Erstfassung auf Wunsch des Auftraggebers (Q-31); Freigabe Product Owner |
