---
id: REQ-LEGAL-009
title: Auswertung meldepflichtiger Anbieter (DAC7)
type: user-story
class: functional
status: approved
owner: team-plattform
risk: medium
release: R1
moscow: S
kano: n/a
epic: EPIC-13
source: PStTG (DAC7), Q-26
use_cases: [UC-43]
depends_on: [REQ-CHAT-011]
version: 1.0
created: 2026-10-24
last_updated: 2026-10-24
verification: [AT-LEGAL-009, AT-LEGAL-009-2, CTRL-DOC-DAC7]
---

# REQ-LEGAL-009 Auswertung meldepflichtiger Anbieter (DAC7)
## Anforderung
Als Administrator möchte ich je Kalenderjahr die Anbieter ermitteln, die die Meldeschwellen des Plattformen-Steuertransparenzgesetzes erreichen, und das Ergebnis als CSV exportieren, damit die meldende Stelle die Meldung an das Bundeszentralamt für Steuern vorbereiten kann.

## Begründung
Plattformbetreiber müssen Anbieter melden, die nicht unter die Bagatellgrenze fallen (PStTG). Im Beispiel erfolgt kein Versand (Q-26); die Auswertung zeigt, dass die nötigen Daten aus dem Deal-Kern (REQ-CHAT-011) ableitbar sind.

## Akzeptanzkriterien
Zählweise: abgeschlossene Deals (`completed`) mit Gegenleistung in Euro, je Anbieter und Kalenderjahr (Zeitpunkt des Abschlusses); „zu verschenken“ zählt nicht; „Tausch“ zählt im Beispiel nicht (offener Punkt im DAC7-Konzept).

| Abgeschlossene Verkäufe | Summe der Gegenleistungen | Meldepflichtig? |
|---|---|---|
| 29 | 1.999,99 € | nein (Bagatellgrenze) |
| 30 | beliebig | ja |
| 1 | 2.000,00 € | ja |
| 0 | 0 € | nein |

Ausgabe je meldepflichtigem Anbieter: Konto-ID, Anzeigename, Hochschuladresse, Anzahl und Summe je Quartal und Jahr. Hinweis in der Ausgabe: Die für die Meldung nötigen Angaben (vollständiger Name, Anschrift, Geburtsdatum, Steuer-ID) erhebt das Beispiel nicht.

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Aufruf ohne Administratorrolle | 403 |
| Jahr ungültig oder in der Zukunft | 422 |
| Jeder Abruf | Audit-Log-Eintrag mit Jahr und Format (enthält personenbezogene Daten) |
| Export wird zwischengespeichert | nein, Antwort mit `Cache-Control: no-store` |

## INVEST
I: nur lesend auf vorhandenen Deals · N: Zählregeln für Tausch verhandelbar · V: Steuerpflicht des Betreibers · E: klein · S: ein Sprint · T: Schwellen als Unit-Test, Zugriff als API-Test.

## Nachweis
- `AT-LEGAL-009`: Unit-Test – Schwellenfunktion mit den Grenzfällen der Tabelle.
- `AT-LEGAL-009-2`: Smoke-Test – Auswertung als JSON und CSV nur für Administratoren, Mitglied 403, Abruf im Audit-Log.
- `CTRL-DOC-DAC7`: Kontrolle `docs/06-recht/dac7-konzept.md` – Zählregeln, Schwellen, fehlende Stammdaten und Meldeweg beschrieben.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-24 | Erstfassung aus dem Abgleich Recht, Auftritt und Betrieb ([06-abgleich-recht-betrieb.md](../06-abgleich-recht-betrieb.md)); als Übung mit Platzhaltern freigegeben (Q-23) |
