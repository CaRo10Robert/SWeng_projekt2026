---
id: REQ-LEGAL-002
title: Datenschutzerklärung
type: privacy
class: constraint
status: verified
owner: team-produkt
risk: high
reviewers: [product-owner, security-lead]
release: R1
moscow: M
moscow_reason: [2]
kano: basis
epic: EPIC-13
source: DSGVO Art. 12–14, LDSG RLP, TDDDG § 25, Q-23
use_cases: [UC-01, UC-08]
depends_on: [REQ-PRIV-003, REQ-LEGAL-010]
version: 1.3
created: 2026-10-24
last_updated: 2026-10-25
verification: [AT-LEGAL-002, AT-LEGAL-002-2, AT-LEGAL-002-3, CTRL-DOC-LEGAL-TEXTE]
---

# REQ-LEGAL-002 Datenschutzerklärung
## Anforderung
Das System muss eine Datenschutzerklärung bereitstellen, die alle Informationen nach DSGVO Art. 13 für jede Verarbeitung im System präzise, verständlich und leicht zugänglich enthält, einschließlich eines Abschnitts „Cookies und lokale Speicherung“. Sie ist ohne Anmeldung erreichbar und vor der Registrierung verlinkt.

> Übungsaufgabe: Inhalte mit Betreiberbezug stehen als Platzhalter `[Platzhalter: …]` (Q-23). Kein Rechtsrat; im Echtbetrieb prüft die/der Datenschutzbeauftragte bzw. das Justiziariat der Hochschule.

## Begründung
Informationspflicht bei Erhebung (Art. 13), Transparenzgebot (Art. 12). Die Registrierung fragt die Kenntnisnahme schon ab (REQ-PRIV-001); ohne Text läuft diese Abfrage ins Leere.

## Akzeptanzkriterien
Pflichtabschnitte (Entscheidungstabelle: Abschnitt fehlt → Anforderung nicht erfüllt):

| # | Abschnitt | Quelle für den Inhalt |
|---|---|---|
| 1 | Verantwortlicher mit Kontakt | Platzhalter wie Impressum |
| 2 | Datenschutzbeauftragte/r | `[Platzhalter: Name, datenschutz@hwg-lu.example]` |
| 3 | Verarbeitungen je Zweck mit Rechtsgrundlage (Konto, Anzeigen, Chat, Kontaktfreigabe, Moderation und Meldungen, E-Mail-Benachrichtigungen, Sicherheit und Rate-Limits, Protokolle und Metriken, Steuermeldung DAC7) | Verzeichnis der Verarbeitungstätigkeiten (REQ-LEGAL-011) |
| 4 | Empfänger und Auftragsverarbeiter | REQ-LEGAL-012 |
| 5 | Drittlandübermittlung (keine) | REQ-PRIV-005, REQ-PRIV-006 |
| 6 | Speicherdauer je Datenkategorie | Löschkonzept REQ-PRIV-003 |
| 7 | Rechte der Betroffenen (Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit, Widerspruch, Widerruf) mit Weg im System | REQ-ACC-001…003 |
| 8 | Beschwerderecht bei der Aufsichtsbehörde | `[Platzhalter: LfDI Rheinland-Pfalz, Anschrift]` |
| 9 | Pflicht zur Bereitstellung, Folgen der Nichtbereitstellung | Registrierung |
| 10 | Keine automatisierte Entscheidung nach Art. 22; Hinweis auf die automatische Inhaltsprüfung mit menschlicher Entscheidung | REQ-LST-010 |
| 11 | Cookies und lokale Speicherung: jede Speicherung mit Name, Zweck, Dauer und Einordnung „unbedingt erforderlich“ | REQ-LEGAL-010 |
| 12 | Stand und Version, Hinweis auf Änderungen | Front Matter |

```gherkin
Szenario: Vor der Registrierung informiert
  Angenommen ich bin nicht angemeldet und auf "Registrieren"
  Wenn ich den Link "Datenschutzhinweis" öffne
  Dann sehe ich die Datenschutzerklärung mit den Abschnitten 1 bis 12 und ihrer Version

Szenario: Jede Speicherung ist erklärt
  Angenommen ich habe die Kernabläufe als Mitglied durchlaufen
  Wenn alle Cookies, localStorage-, sessionStorage-, IndexedDB- und Cache-Einträge der Seite erfasst werden
  Dann ist jeder Eintrag im Abschnitt "Cookies und lokale Speicherung" aufgeführt
```

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Neue Verarbeitung ohne Eintrag | Definition of Done verletzt; der Pull Request ergänzt VVT und Datenschutzerklärung |
| Neue Speicherung im Browser ohne Eintrag | AT-LEGAL-002-2 schlägt fehl |
| Erklärung ändert sich wesentlich | neue Version (`version` im Front Matter); angemeldete Mitglieder mit älterer Kenntnisnahme sehen einen Hinweis mit Link und können ihn per „Zur Kenntnis genommen“ bestätigen (`POST /me/privacy-ack`, gespeichert als `privacy_ack_version`). Das ist **keine** Einwilligung und sperrt keine Funktionen (RV-R-08) |

## Nachweis
- `AT-LEGAL-002-3`: E2E-Test – bei neuer Fassung der Datenschutzerklärung erscheint für Mitglieder mit älterer Kenntnisnahme ein Hinweis mit Link; „Zur Kenntnis genommen“ per Tastatur speichert die Version im Konto, der Hinweis verschwindet.
- `AT-LEGAL-002`: E2E-Test – Datenschutzerklärung ohne Anmeldung erreichbar, aus dem Registrierungsformular verlinkt, Abschnitte 1–12 und Version vorhanden.
- `AT-LEGAL-002-2`: E2E-Test – jede nach den Kernabläufen vorhandene Speicherung im Browser steht im Abschnitt „Cookies und lokale Speicherung“.
- `CTRL-DOC-LEGAL-TEXTE`: Kontrolle der Rechtstexte (siehe REQ-LEGAL-001).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-24 | Erstfassung aus dem Abgleich Recht, Auftritt und Betrieb ([06-abgleich-recht-betrieb.md](../06-abgleich-recht-betrieb.md)); als Übung mit Platzhaltern freigegeben (Q-23) |
| 1.1 | 2026-10-25 | Review v1.3 (RV-R-08, RV-R-01, RV-R-02, RV-R-04, RV-R-06): Hinweis bei neuer Fassung (Kenntnisnahme statt Zustimmung); Inhalte der Erklärung an Ist-Stand angeglichen (Logs, Pseudonymisierung, Deals, automatisches Ausblenden, Beweissicherung); Status nach Umsetzung |
| 1.2 | 2026-10-25 | Nachweis AT-LEGAL-002-3 vergeben; Rechtstexte Datenschutz, Nutzungsbedingungen und Community-Regeln wegen inhaltlicher Änderung auf Version 2026-10-25 |
| 1.3 | 2026-10-25 | Verifiziert im finalen Lauf gegen das Docker-Beispiel (AT-LEGAL-002, AT-LEGAL-002-2, AT-LEGAL-002-3, CTRL-DOC-LEGAL-TEXTE bestanden bzw. ausgeführt); Status → verified |
