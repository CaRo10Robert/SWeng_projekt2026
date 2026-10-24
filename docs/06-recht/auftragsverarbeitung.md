---
id: LEGAL-AVV
type: privacy
status: in-review
owner: product-owner
version: 1.0
created: 2026-10-24
last_updated: 2026-10-24
---

# Auftragsverarbeitung (Art. 28 DSGVO)

> **Muster im Rahmen einer Übungsaufgabe – keine rechtsverbindlichen Angaben; vom Datenschutzbeauftragten der Hochschule zu prüfen.** Anforderung: REQ-LEGAL-012.

Im Docker-Beispiel gibt es **keine Auftragsverarbeiter**: Alles läuft lokal (app, db, mailpit; ADR-0010). Für einen Echtbetrieb sind folgende Kategorien zu erwarten.

## Übersicht

| Kategorie | Dienstleister | Leistung | Datenkategorien | Ort der Verarbeitung | AVV | Unterauftragnehmer | Stand |
|---|---|---|---|---|---|---|---|
| Hosting / Rechenzentrum | [Platzhalter: RZ der Hochschule – dann keine Auftragsverarbeitung, sondern interne Stelle – oder Hoster in der EU] | Server, Datenbank, Speicher, Backups | alle (VVT V-1 … V-12) | [Platzhalter: Deutschland] | [Platzhalter: Datum, Fundstelle] | [Platzhalter] | offen |
| E-Mail-Versand | [Platzhalter: SMTP-Relay des RZ oder Versanddienst in der EU] | Zustellung transaktionaler E-Mails | E-Mail-Adresse, Betreff, Mailtext (ohne Chatinhalte) | [Platzhalter: EU] | [Platzhalter] | [Platzhalter] | offen |
| Speicher für Datensicherungen | [Platzhalter: Objektspeicher in der EU] | verschlüsselte Ablage der Backups | alle (verschlüsselt) | [Platzhalter: EU] | [Platzhalter] | [Platzhalter] | offen |
| Monitoring (optional) | [Platzhalter: selbst betrieben – dann entfällt die Auftragsverarbeitung] | Metriken und Alarme | keine personenbezogenen Daten (Metriken ohne Personenbezug) | intern | nicht nötig | – | im Beispiel selbst betrieben (Profil `monitoring`) |

Die Bezahlfunktion (EPIC-09) bringt später einen Zahlungsdienstleister dazu. Er ist für die Zahlung selbst in der Regel **eigener Verantwortlicher**, nicht Auftragsverarbeiter; das ist dann gesondert zu prüfen.

## Prüfpunkte je Vertrag

- [ ] Gegenstand, Dauer, Art und Zweck, Datenarten und Betroffene beschrieben (Art. 28 Abs. 3)
- [ ] Weisungsgebundenheit, Vertraulichkeit der Beschäftigten
- [ ] TOMs des Dienstleisters liegen vor und sind mindestens gleichwertig zu den [eigenen TOMs](toms.md)
- [ ] Unterauftragnehmer nur mit Genehmigung; Liste liegt vor
- [ ] Unterstützung bei Betroffenenrechten und Datenpannen (Meldung an uns ohne schuldhaftes Zögern, Ziel ≤ 24 h)
- [ ] Löschung oder Rückgabe aller Daten bei Vertragsende
- [ ] Kontroll- und Auditrechte
- [ ] Verarbeitung nur in EU/EWR (REQ-PRIV-005); sonst Garantien nach Kap. V DSGVO
- [ ] Vertrag im VVT verknüpft

## Pflege

Neue Dienstleister werden vor Vertragsschluss mit der/dem DSB abgestimmt und hier sowie im [VVT](vvt.md) eingetragen.
