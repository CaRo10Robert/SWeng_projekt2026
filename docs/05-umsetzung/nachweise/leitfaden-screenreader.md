---
id: GUIDE-A11Y-SCREENREADER
type: evidence
requirement: REQ-A11Y-001, REQ-A11Y-002
status: ready
owner: qa-lead
date: 2026-10-25
---

# Leitfaden: manuelle Prüfung mit Screenreader und Tastatur (MAN-A11Y-001, MAN-A11Y-002)

## Ziel

Die automatisierten Tests (AT-A11Y-001, AT-A11Y-002, axe-core) finden nur einen Teil der Barrieren. Die manuelle Prüfung belegt drei Dinge:
1. Die neun Kernabläufe aus [REQ-A11Y-002](../../02-anforderungen/req/REQ-A11Y-002.md) sind mit Screenreader und ausschließlich Tastatur nutzbar, auch die Dateiauswahl im Systemdialog.
2. Es gibt keine Tastaturfallen, und der Fokus ist immer sichtbar.
3. Die anwendbaren Kriterien der WCAG 2.2 AA sind nach WCAG-EM geprüft ([REQ-A11Y-001](../../02-anforderungen/req/REQ-A11Y-001.md)).

## Gegenstand

Docker-Beispiel mit Seed-Daten (`docker compose up`), Demo-Konten aus der README, frisch registriertes Testkonto für Ablauf 1.

## Ausstattung

| Rolle | Ausstattung |
|---|---|
| Hauptprüfung | Windows 11, **NVDA** (aktuelle Version), **Firefox** aktuell; zweiter Durchlauf der Kernabläufe 4, 5 und 7 mit **Edge** |
| Optional | macOS mit **VoiceOver** und Safari, nur Kernabläufe 1, 4 und 7 |
| Mobil (Stichprobe) | Android mit TalkBack, 360 px, Kernabläufe 4 und 7 |
| Hilfsmittel | Maus abgezogen oder deaktiviert; Bildschirmlupe 200 % für Kriterium 1.4.4; Browser-Zoom 400 % bzw. 320 px für 1.4.10 |

NVDA-Grundbefehle: `Tab`/`Umschalt+Tab` springen zwischen Elementen, `H` zur nächsten Überschrift, `D` zur nächsten Landmark, `F` zum nächsten Formularfeld, `NVDA+F7` öffnet die Elementliste, `Insert+Leertaste` schaltet zwischen Fokus- und Lesemodus.

## Prüfende

Mindestens zwei Personen, eine davon mit Screenreader-Erfahrung. Die Prüfung dauert etwa 3 Stunden.

## Testfälle je Kernablauf

Für jeden Schritt wird notiert: Ist der Ablauf erreichbar, sagt der Screenreader Rolle, Name und Zustand an, ist der Fokus sichtbar, stimmt die Fokusreihenfolge, werden Fehlermeldungen angesagt?

| Nr. | Kernablauf | Start | Prüfschritte | WCAG-Kriterien |
|---|---|---|---|---|
| 1 | Registrieren | `/register` | Felder per `F`; Pflichtfelder angesagt; Links zu Nutzungsbedingungen/Datenschutz öffnen ohne Datenverlust; Absenden mit Fehlern → Fokus auf erstem Fehler, Meldung angesagt; Bestätigungsmail in Mailpit, Link öffnen | 1.3.1, 2.1.1, 2.4.3, 2.4.7, 3.3.1, 3.3.2, 4.1.2, 4.1.3 |
| 2 | Anmelden und Abmelden | `/login` | Fehlermeldung bei falschem Passwort angesagt; nach Anmeldung Fokus auf Hauptinhalt (Skip-Link); Abmelden über das Menü | 2.4.1, 2.4.3, 3.3.1, 4.1.3 |
| 3 | Passwort zurücksetzen | `/forgot-password` | neutrale Bestätigung angesagt (aria-live); Reset-Link; neues Passwort mit Regeln angesagt | 3.3.1, 3.3.3, 4.1.3 |
| 4 | Suchen und Filtern | `/` | Suchfeld mit Label; Filter (Kategorie, Preis, Ort) erreichbar; Trefferzahl wird nach Filterwechsel angesagt; Ergebniskarten als Liste mit Überschriften navigierbar | 1.3.1, 2.4.6, 4.1.3 |
| 5 | Anzeige erstellen inkl. Bild | `/listings/new` | Art, Titel, Beschreibung, Kategorie, Preistyp, Ort; **Schaltfläche „Bilder hinzufügen“ per Tastatur → Systemdialog:** Datei mit Tastatur wählen (`Alt+N` Dateiname, Pfeiltasten, `Enter`) → Rückkehr in den Browser, Fokus wieder auf der Schaltfläche oder der Bildliste; Vorschau und Entfernen per Tastatur; Absenden | 2.1.1, 2.1.2, 2.4.3, 2.4.7, 3.3.1, 4.1.2 |
| 6 | Eigene Anzeige verwalten | `/me/listings` | Bearbeiten, Pausieren, Reservieren, Löschen; Bestätigungsdialoge: Fokus im Dialog, `Esc` schließt, Fokus zurück auf Auslöser | 2.1.2, 2.4.3, 3.2.2, 4.1.2 |
| 7 | Nachricht senden | Anzeige öffnen → Nachricht | Eingabefeld beschriftet; neue Nachrichten werden über aria-live angesagt, ohne den Fokus zu verlieren; Sicherheitshinweis bei Links/IBAN angesagt | 1.3.1, 4.1.3, 2.2.1 (keine Zeitlimits) |
| 8 | Inhalt melden | Anzeige → „Melden“ | Dialog: Grund (Radiogruppe mit Pfeiltasten), Details; Absenden → Bestätigung angesagt; `Esc` → Fokus zurück | 2.1.1, 2.1.2, 2.4.3, 4.1.2 |
| 9 | Kontaktdaten freigeben | Konversation | „Kontaktdaten teilen“ mit Bestätigungsdialog; Status („angefragt“, „ausgetauscht“) wird angesagt; Adresse als Link lesbar; Widerruf | 4.1.2, 4.1.3, 3.3.4 |

**Zusätzlich (REQ-A11Y-001, alle übrigen Seiten, Kurzprüfung):**
- Rechtsseiten mit Inhaltsverzeichnis, Hilfe und Startseite;
- 404 und Fehlerseite;
- Mitteilungen und Widerspruch;
- Moderation, Widersprüche, Administration;
- Sprachschalter: `lang` wechselt, und NVDA spricht mit der passenden Stimme (Kriterium 3.1.2).

## WCAG-EM-Kurzcheckliste (seitenübergreifend)

| Kriterium | Prüfung |
|---|---|
| 1.1.1 Nicht-Text-Inhalt | Bilder der Anzeigen mit Alternativtext; dekorative Symbole `aria-hidden` |
| 1.3.1 Info und Beziehungen | Überschriftenhierarchie (`NVDA+F7` → Überschriften), Landmarks, Tabellen mit Kopfzellen |
| 1.4.3 / 1.4.11 Kontrast | Text ≥ 4,5:1, UI-Komponenten und Fokusrahmen ≥ 3:1 (Colour Contrast Analyser) |
| 1.4.4 / 1.4.10 Zoom und Reflow | 200 % ohne Verlust; 320 px ohne horizontales Scrollen |
| 2.1.2 Keine Tastaturfalle | jeder Dialog und jedes Widget mit `Tab`/`Esc` verlassbar |
| 2.4.7 / 2.4.11 Fokus sichtbar und nicht verdeckt | Fokus nie hinter Header, Banner oder Cookie-/Hinweisbereich |
| 2.5.8 Zielgröße | Schaltflächen ≥ 24 × 24 px |
| 3.3.7 Redundante Eingabe | keine doppelte Eingabe im selben Ablauf |
| 3.3.8 Barrierefreie Authentifizierung | Anmeldung ohne kognitiven Test; Passwortmanager und Einfügen erlaubt |

## Bewertungsskala

| Wert | Bedeutung | Folge |
|---|---|---|
| **B** bestanden | ohne Einschränkung nutzbar | – |
| **E** Einschränkung | nutzbar mit Umweg oder unklarer Ansage | Befund niedrig/mittel, Backlog |
| **N** nicht bestanden | Ablauf nicht abschließbar, Tastaturfalle, Fokus unsichtbar | **Release-Blocker** nach REQ-A11Y-002 |
| **n/a** nicht anwendbar | mit Begründung | – |

Bestanden ist der Nachweis, wenn alle 9 Kernabläufe mit **B** oder **E** abschließen, es 0 Tastaturfallen gibt und alle anwendbaren AA-Kriterien mit **B** oder begründet **n/a** bewertet sind.

## Ablage

Das Protokoll wird nach der [Protokollvorlage](protokollvorlage-screenreader.md) als `MAN-A11Y-001-<Datum>.md` in diesem Ordner abgelegt. Befunde wandern ins Backlog. Die [Erklärung zur Barrierefreiheit](../../../apps/web/src/content/legal/barrierefreiheit.de.md) wird danach aktualisiert (Stand der Vereinbarkeit).

Ein Beispiel, wie ein ausgefülltes Protokoll aussieht, zeigt das [fiktive Beispielprotokoll](MAN-A11Y-001-fiktiv.md). Es ist kein Nachweis.
