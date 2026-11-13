---
id: REQ-NOTI-008
title: Benachrichtigungen in der App mit gelesen und ungelesen
type: user-story
class: functional
status: approved
owner: team-kommunikation
risk: medium
release: R2
moscow: S
kano: leistung
epic: EPIC-05
source: Auftraggeber (2026-11-13, Q-31)
use_cases: [UC-23]
depends_on: [REQ-NOTI-001, REQ-LEGAL-006, REQ-PRIV-003]
version: 1.0
created: 2026-11-13
last_updated: 2026-11-13
review_due: 2027-04-23
verification: [AT-NOTI-008, AT-NOTI-008-2]
---

# REQ-NOTI-008 Benachrichtigungen in der App mit gelesen und ungelesen

## Anforderung
Als Mitglied möchte ich alle Benachrichtigungen an einer Stelle in der App sehen und erkennen, welche **ungelesen** sind, damit ich auf Kaufangebote, Antworten und Hinweise zu meinen Anzeigen reagiere, ohne mein Postfach zu durchsuchen.

## Begründung
Wunsch des Auftraggebers (Q-31). Kaufangebote (REQ-CHAT-009) brauchen einen sichtbaren Eingang; bisher gibt es Zähler nur für Chatnachrichten und Moderationsmitteilungen (REQ-LEGAL-006), und alles andere kommt nur per E-Mail (REQ-NOTI-001).

## Akzeptanzkriterien
```gherkin
Szenario: Ungelesene Benachrichtigung erkennen
  Angenommen Ben hat ein neues Kaufangebot von Lea erhalten
  Dann zeigt der Seitenkopf bei "Benachrichtigungen" den Zähler 1
  Und Screenreader lesen "Benachrichtigungen, 1 ungelesen"
  Und auf der Seite "Benachrichtigungen" steht der Eintrag oben, fett und mit der Kennzeichnung "Neu"

Szenario: Als gelesen markieren
  Wenn Ben den Eintrag öffnet
  Dann führt er zur Konversation mit dem Kaufangebot
  Und der Eintrag ist gelesen und der Zähler sinkt auf 0

Szenario: Alle als gelesen markieren
  Angenommen Ben hat 3 ungelesene Benachrichtigungen
  Wenn er "Alle als gelesen markieren" wählt
  Dann sind alle gelesen und der Zähler verschwindet

Szenario: Als ungelesen markieren
  Wenn Ben einen gelesenen Eintrag "Als ungelesen markieren" wählt
  Dann ist er wieder ungelesen und zählt mit
```

**Arten von Benachrichtigungen**

| Art | Auslöser | Ziel beim Öffnen |
|---|---|---|
| Neues Kaufangebot, Gegenangebot | REQ-CHAT-009 | Konversation |
| Angebot angenommen, abgelehnt, nicht mehr verfügbar | REQ-CHAT-009 | Konversation |
| Anzeige läuft bald ab, Reservierung abgelaufen | REQ-LST-008 | Anzeige |
| Moderationsentscheidung, Ergebnis eines Widerspruchs | REQ-LEGAL-006/007 | „Meine Mitteilungen“ |
| Bewertung möglich (ab REQ-MOD-006) | REQ-MOD-006 | Konversation bzw. Bewertung |

Neue Chatnachrichten bleiben beim eigenen Zähler „Nachrichten“ (REQ-CHAT-003) und erzeugen keine zusätzliche Benachrichtigung.

| Regel | Festlegung |
|---|---|
| Reihenfolge | neueste zuerst, paginiert (ADR-0009) |
| Zähler | Anzahl ungelesener Benachrichtigungen; aktualisiert sich ohne Neuladen innerhalb von 5 s (Echtzeit-Kanal, ADR-0004), sonst beim nächsten Seitenwechsel; ab 100 als „99+“ |
| Gelesen | durch Öffnen des Eintrags, „Alle als gelesen markieren“ oder „Als ungelesen markieren“ (umkehrbar) |
| Darstellung | ungelesen fett mit Text „Neu“ (nicht nur über Farbe, WCAG 1.4.1) |
| Inhalt | Art, Anzeigentitel, ggf. Betrag, Zeitpunkt; **keine Chatinhalte** (wie REQ-NOTI-002) |
| Aufbewahrung | 90 Tage, dann automatisch gelöscht (REQ-PRIV-003); bei Kontolöschung sofort |
| E-Mail | unverändert nach REQ-NOTI-001/003; die Benachrichtigung in der App ersetzt keine Pflichtmitteilung |

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Zugriff auf fremde Benachrichtigungen oder deren Markierung | nicht gefunden (404, REQ-SEC-006) |
| Ziel existiert nicht mehr (Anzeige gelöscht, Konversation gesperrt) | Eintrag bleibt lesbar; Öffnen zeigt die passende Fehlerseite (REQ-UX-009) |
| Absender inzwischen blockiert | bestehende Einträge bleiben, neue entstehen nicht (REQ-MOD-005) |
| Viele Ereignisse in kurzer Zeit | jede Benachrichtigung einzeln; Liste paginiert, Zähler gedeckelt („99+“) |
| Echtzeit-Kanal getrennt | Zähler beim nächsten Laden korrekt (REQ-CHAT-003 Degradation) |

## INVEST
I: eigene Ansicht, Ereignisse aus vorhandenen Abläufen · N: Arten erweiterbar · V: ein Eingang für alles Wichtige · E: mittel · S: ein Sprint · T: automatisierbar.

## Nachweis
- `AT-NOTI-008`: Integrationstest – Ereignisse erzeugen Benachrichtigungen für den richtigen Empfänger (keine für Chatnachrichten), ungelesen-Zähler, einzeln gelesen und ungelesen, alle gelesen, nur eigene (fremde 404), neueste zuerst paginiert, Löschung nach 90 Tagen und bei Kontolöschung, keine Chatinhalte.
- `AT-NOTI-008-2`: E2E-Test – Zähler im Seitenkopf mit Screenreader-Text, Eintrag „Neu“, Öffnen führt zum Ziel und senkt den Zähler, „Alle als gelesen markieren“, per Tastatur; axe-core ohne `serious`/`critical`.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-11-13 | Erstfassung auf Wunsch des Auftraggebers (Q-31); Freigabe Product Owner |
