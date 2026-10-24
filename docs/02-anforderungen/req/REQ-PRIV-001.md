---
id: REQ-PRIV-001
title: Versionierte Einwilligungen
type: privacy
class: constraint
status: approved
owner: team-produkt
risk: medium
release: R1
moscow: M
moscow_reason: [2]
kano: n/a
epic: EPIC-07
source: DSGVO Art. 7
use_cases: [UC-01, UC-02]
version: 2.1
created: 2026-10-20
last_updated: 2026-10-24
verification: [AT-PRIV-001, AT-PRIV-001-2]
---

# REQ-PRIV-001 Versionierte Einwilligungen

## Anforderung
1. Das System muss die Zustimmung zu Nutzungsbedingungen und Datenschutzhinweis mit **Version** und **Zeitstempel** speichern.
2. Eine Registrierung mit veralteter Version der Bedingungen wird abgelehnt.
3. Erscheint eine neue Version, müssen **bestehende** Mitglieder bei der nächsten Anmeldung zustimmen, bevor sie die Plattform weiter nutzen (Ablauf und Texte: REQ-LEGAL-003, Datenschutzerklärung: REQ-LEGAL-002).
4. Optionale Einwilligungen werden getrennt erfasst und sind einzeln widerrufbar – **ab REQ-SRCH-005** (Suchauftrags-Mails, Could). In R1 gibt es keine optionale Einwilligung.

## Begründung
Nachweispflicht der Einwilligung (DSGVO Art. 7 Abs. 1); Kopplungsverbot für optionale Einwilligungen.

## Akzeptanzkriterien
| Situation | Erwartung |
|---|---|
| Registrierung mit aktueller Version | Zustimmung mit Version und Zeitstempel gespeichert |
| Registrierung mit veralteter Version | abgelehnt: „Bitte bestätige die aktuellen Nutzungsbedingungen“ |
| Anmeldung eines Mitglieds, dessen letzte Zustimmung älter als die aktuelle Version ist | Hinweis mit den geänderten Bedingungen; Nutzung erst nach Zustimmung; neue Zustimmung wird zusätzlich gespeichert |
| Datenexport (REQ-ACC-003) | enthält alle gespeicherten Einwilligungen mit Version und Zeitstempel |

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Client sendet erfundene Version | nur die aktuell gültige Version wird akzeptiert |
| Mitglied lehnt neue Version ab | keine weitere Nutzung; Hinweis auf Kontolöschung (REQ-ACC-002) |
| Nachträgliches Ändern gespeicherter Einwilligungen | nicht vorgesehen; Einwilligungen werden nur ergänzt, nie überschrieben |

## Nachweis
- `AT-PRIV-001`: (neu) Registrierung mit veralteter Version liefert 422 `terms_outdated`; Export enthält die Einwilligung mit Version und Zeitstempel.
- `AT-PRIV-001-2`: (neu) nach Wechsel der aktuellen Version verlangt die Anmeldung eines bestehenden Mitglieds die erneute Zustimmung.
- Teilweise umgesetzt: Punkte 1 und 2 sind umgesetzt; Punkt 3 (erneute Zustimmung bestehender Mitglieder) fehlt.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei, Akzeptanzkriterien |
| 2.0 | 2026-10-23 | Review v0.2: R-14 Status `approved` statt `implemented`; optionale Einwilligungen „ab REQ-SRCH-005“; neue Version → Zustimmung bei nächster Anmeldung; R-04 Fehler- und Missbrauchsfälle |
| 2.1 | 2026-10-24 | Abgleich Recht und Betrieb: Texte der Nutzungsbedingungen und der Datenschutzerklärung, Ablauf der erneuten Zustimmung und Fehlercode `terms_required` in REQ-LEGAL-003 bzw. REQ-LEGAL-002 |
