---
id: REQ-PRIV-001
title: Versionierte Einwilligungen
type: privacy
class: constraint
status: implemented
owner: team-produkt
risk: medium
release: R1
moscow: M
kano: n/a
epic: EPIC-07
source: DSGVO Art. 7
use_cases: [UC-01]
version: 1.1
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-PRIV-001]
---

# REQ-PRIV-001 Versionierte Einwilligungen

## Anforderung
Das System muss die Zustimmung zu Nutzungsbedingungen und Datenschutzhinweis mit **Version** und **Zeitstempel** speichern. Optionale Einwilligungen (z. B. E-Mails zu Suchaufträgen, REQ-SRCH-005) werden getrennt erfasst und sind einzeln widerrufbar. Eine Registrierung mit veralteter Version der Bedingungen wird abgelehnt.

## Begründung
Nachweispflicht der Einwilligung (DSGVO Art. 7 Abs. 1); Kopplungsverbot für optionale Einwilligungen.

## Akzeptanzkriterien
| Situation | Erwartung |
|---|---|
| Registrierung mit aktueller Version | Zustimmung mit Version und Zeitstempel gespeichert |
| Registrierung mit veralteter Version | abgelehnt: „Bitte bestätige die aktuellen Nutzungsbedingungen“ |
| Datenexport (REQ-ACC-003) | enthält alle gespeicherten Einwilligungen |

## Nachweis
- `AT-PRIV-001`: neu zu schreiben – Registrierung mit veralteter Version liefert 422 `terms_outdated`; Export enthält die Einwilligung mit Version und Zeitstempel.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei, Akzeptanzkriterien |
