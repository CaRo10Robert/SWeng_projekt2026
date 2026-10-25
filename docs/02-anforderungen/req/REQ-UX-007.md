---
id: REQ-UX-007
title: Englische Oberfläche
type: user-story
class: functional
status: implemented
owner: team-produkt
risk: medium
release: R1
moscow: S
kano: leistung
epic: EPIC-13
source: BG-2, REQ-UX-002, Q-25
depends_on: [REQ-UX-002]
version: 1.1
created: 2026-10-24
last_updated: 2026-10-25
verification: [AT-UX-007, AT-UX-007-2, AT-UX-007-3]
---

# REQ-UX-007 Englische Oberfläche
## Anforderung
Als internationales Mitglied möchte ich die Oberfläche, die E-Mails und die Rechtstexte auf Englisch lesen können, damit ich die Plattform ohne Deutschkenntnisse nutze.

## Begründung
Austauschstudierende und internationale Beschäftigte gehören zur Zielgruppe (REQ-UX-002). Für Rechtstexte gilt die deutsche Fassung; die englische ist eine Lesehilfe (Q-25).

## Akzeptanzkriterien
- Sprachwahl Deutsch/Englisch im Seitenkopf jeder Seite, per Tastatur bedienbar; Voreinstellung aus der Browsersprache; die Wahl bleibt erhalten (Allowlist REQ-LEGAL-010) und wird für Mitglieder im Profil gespeichert.
- `<html lang>` folgt der Sprache; Datums-, Zahlen- und Preisformate folgen der Sprache.
- Alle sichtbaren Texte der Oberfläche liegen in beiden Sprachen vor; fehlende Schlüssel fallen auf Deutsch zurück und werden im Test erkannt.
- E-Mails werden in der im Profil gespeicherten Sprache versendet; die Bestätigungsmail nach der Registrierung in der dabei gewählten Sprache (`locale` im Registrierungsformular).
- Reihenfolge der Sprachwahl: Kontosprache vor der Wahl auf dem Gerät; eine Wahl auf dem Gerät wird nur dann ins Konto übernommen, wenn sie in derselben Sitzung vor der Anmeldung getroffen wurde (geteilte Geräte überschreiben so keine fremde Kontosprache).
- Englische Rechtstexte tragen oben den Hinweis „This translation is provided for convenience. Only the German version is legally binding.“

```gherkin
Szenario: Sprache wechseln
  Angenommen ich bin auf der Suchseite in Deutsch
  Wenn ich "English" wähle
  Dann sind alle Texte der Seite englisch
  Und das Attribut lang des Dokuments ist "en"
```

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Schlüssel fehlt in einer Sprache | Rückfall auf Deutsch; AT-UX-007-2 schlägt fehl |
| Unbekannte Sprache im Profil oder in der Anfrage | Deutsch |
| Fehlermeldungen des Servers | Codes werden in der Oberfläche übersetzt, nicht die Servertexte |

## INVEST
I: setzt auf der Auslagerung der Texte (REQ-UX-002) auf · N: Umfang der Rechtstexte verhandelbar · V: Zugang für internationale Mitglieder · E: groß · S: ein Sprint · T: E2E- und Unit-Test.

## Nachweis
- `AT-UX-007`: E2E-Test – Sprachwechsel auf Englisch ändert Texte und `lang`, Wahl bleibt nach Neuladen erhalten.
- `AT-UX-007-2`: Unit-Test – Schlüsselmengen Deutsch und Englisch sind gleich.
- `AT-UX-007-3`: E2E-Test – englische Rechtstexte zeigen den Hinweis auf die verbindliche deutsche Fassung.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-24 | Erstfassung aus dem Abgleich Recht, Auftritt und Betrieb ([06-abgleich-recht-betrieb.md](../06-abgleich-recht-betrieb.md)); als Übung mit Platzhaltern freigegeben (Q-23) |
| 1.1 | 2026-10-25 | Review v1.3 (RV-A-08, RV-C-08): Bestätigungsmail in gewählter Sprache, Reihenfolge Konto vor Gerät; Status nach Umsetzung |
