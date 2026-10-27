---
id: GUIDE-LST-USABILITY
type: evidence
requirement: REQ-LST-001
status: ready
owner: product-owner
date: 2026-10-25
---

# Leitfaden: Usability-Test „Anzeige in unter 2 Minuten“ (MAN-LST-001)

## Ziel

[REQ-LST-001](../../02-anforderungen/req/REQ-LST-001.md) verlangt, dass ein Mitglied ein Angebot oder Gesuch in **unter 2 Minuten** erstellt. Gemessen wird der **Median** der Erstellzeit über 5 Studierende. Zusätzlich wird die wahrgenommene Gebrauchstauglichkeit mit dem SUS-Fragebogen erhoben, und die Stolperstellen werden gesammelt.

## Gegenstand

Docker-Beispiel mit Seed-Daten, Laptop mit 1280 px und Chromium/Edge, je Testperson ein vorbereitetes, angemeldetes Testkonto (z. B. `test1@studmail.hwg-lu.de` bis `test5@…`). Bereitgelegt wird ein Testbild (Taschenrechner, JPEG) im Ordner „Bilder“.

## Teilnehmende

- 5 Studierende der Hochschule, nicht aus dem Projektteam, mindestens 2 Studiengänge, mindestens eine Person ohne Erfahrung mit Kleinanzeigen-Portalen.
- Rekrutierung über Aushang oder Lehrveranstaltung; Aufwandsentschädigung [Dummy: Mensa-Gutschein 10 €].
- Vor dem Test unterschreiben alle die Einwilligung (siehe unten).

## Rollen

| Rolle | Aufgabe |
|---|---|
| Moderation | begrüßt, erklärt, stellt die Aufgaben, greift nicht ein (Thinking Aloud) |
| Protokoll | stoppt die Zeit, notiert Beobachtungen und Zitate |

## Ablauf je Person (≈ 25 min)

1. Begrüßung, Einwilligung, Hinweis „Wir testen das System, nicht Sie“ (3 min).
2. Kurzinterview: Studiengang, Erfahrung mit Kleinanzeigen (2 min).
3. Aufgaben mit Zeitmessung (10 min).
4. SUS-Fragebogen (3 min).
5. Nachgespräch: Was war schwierig? Was fehlt? (5 min).

## Aufgaben

| Nr. | Aufgabe (wörtlich vorlesen) | Erfolgskriterium | Zeitmessung |
|---|---|---|---|
| U1 (Hauptaufgabe) | „Sie möchten Ihren alten Taschenrechner Casio FX-991 für 12 € verkaufen. Übergabe am Hauptcampus Ludwigshafen. Erstellen Sie eine Anzeige mit dem Foto aus dem Ordner ‚Bilder‘.“ | Anzeige im Status „aktiv“ mit Titel, Beschreibung, Kategorie, Festpreis 12 €, Übergabeort, Bild | Start: Klick/Enter auf „Anzeige erstellen“ · Stopp: Erfolgsmeldung sichtbar |
| U2 | „Sie suchen einen Fahrradhelm und würden bis zu 15 € zahlen. Erstellen Sie ein Gesuch.“ | Gesuch aktiv, Preistyp VB 15 € | wie U1 |
| U3 | „Pausieren Sie die Anzeige aus Aufgabe 1.“ | Status „pausiert“ | nur Erfolg/Misserfolg |

Hilfe gibt die Moderation nur, wenn die Person nach 3 Minuten nicht weiterkommt. Die Aufgabe gilt dann als **nicht bestanden**, die Zeit wird nicht gewertet.

## Messung und Auswertung

- **Hauptkennzahl:** Median der Zeiten für U1 über die 5 Personen. **Bestanden, wenn der Median unter 120 s liegt** und mindestens 4 von 5 Personen U1 ohne Hilfe lösen.
- Ergänzend: Median für U2, Erfolgsquote für U3.
- **SUS** (System Usability Scale, 10 Aussagen, Skala 1–5):
  - Die Punkte je Aussage berechnen sich so: ungerade Aussagen „Wert − 1“, gerade Aussagen „5 − Wert“.
  - Die Summe × 2,5 ergibt 0 bis 100.
  - Zielwert: Mittelwert ≥ 68 (Durchschnitt); unter 50 gilt als kritisch.
- **Stolperstellen:** Jede Beobachtung bekommt den Schweregrad 1 (kosmetisch) bis 4 (verhindert Abschluss) und geht als Befund ins Backlog.

### SUS-Fragebogen (deutsche Fassung)

1 = stimme überhaupt nicht zu, 5 = stimme voll zu.

1. Ich denke, dass ich CampusMarkt gern häufig nutzen würde.
2. Ich fand CampusMarkt unnötig komplex.
3. Ich fand CampusMarkt einfach zu benutzen.
4. Ich glaube, ich würde die Hilfe einer technisch versierten Person benötigen, um CampusMarkt zu benutzen.
5. Ich fand, die verschiedenen Funktionen sind gut integriert.
6. Ich denke, CampusMarkt enthält zu viele Inkonsistenzen.
7. Ich kann mir vorstellen, dass die meisten Menschen den Umgang mit CampusMarkt sehr schnell lernen.
8. Ich fand CampusMarkt sehr umständlich zu nutzen.
9. Ich fühlte mich bei der Benutzung von CampusMarkt sehr sicher.
10. Ich musste eine Menge lernen, bevor ich mit CampusMarkt arbeiten konnte.

## Einwilligung der Testpersonen (Dummy-Formular, Übungsaufgabe)

> **Einwilligung zur Teilnahme am Usability-Test „CampusMarkt“** (fiktives Muster)
>
> Verantwortlich: Hochschule für Wirtschaft und Gesellschaft Ludwigshafen, Projektteam CampusMarkt, Musterstraße 1, 67059 Ludwigshafen am Rhein (fiktiv), usability@hwg-lu.example.
>
> Zweck: Verbesserung der Bedienbarkeit von CampusMarkt im Rahmen einer Lehrveranstaltung.
>
> Erhoben werden: Bearbeitungszeiten, Beobachtungsnotizen, Antworten im Fragebogen, Studiengang. **Keine** Bild-, Ton- oder Bildschirmaufzeichnung. Ergebnisse werden nur zusammengefasst und ohne Namen veröffentlicht (Kürzel P1–P5).
>
> Speicherdauer: Notizen und Fragebögen bis zum Ende des Semesters [Dummy: 31.03.2027], danach Löschung; zusammengefasste Ergebnisse ohne Personenbezug unbegrenzt.
>
> Die Teilnahme ist freiwillig. Sie können sie jederzeit ohne Nachteile abbrechen und Ihre Einwilligung mit Wirkung für die Zukunft widerrufen (Art. 7 Abs. 3 DSGVO). Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO.
>
> ☐ Ich willige in die Teilnahme und die beschriebene Verarbeitung ein.
>
> Ort, Datum: ____________ Unterschrift: ____________ Kürzel: P__

## Ablage

Das Protokoll wird nach der [Protokollvorlage](protokollvorlage-usability.md) als `MAN-LST-001-<Datum>.md` abgelegt. Die unterschriebenen Einwilligungen bleiben getrennt beim Projektteam und kommen nicht ins Repository. Ein [fiktives Beispielprotokoll](MAN-LST-001-fiktiv.md) zeigt das Format; es ist kein Nachweis.
