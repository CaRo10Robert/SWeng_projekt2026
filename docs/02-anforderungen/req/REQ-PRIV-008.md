---
id: REQ-PRIV-008
title: Keine Indexierung durch Suchmaschinen
type: privacy
class: constraint
status: approved
owner: team-produkt
risk: low
release: R1
moscow: S
kano: basis
epic: EPIC-13
source: BG-1, DSGVO Art. 25
depends_on: [REQ-PRIV-006]
version: 1.0
created: 2026-10-24
last_updated: 2026-10-24
verification: [AT-PRIV-008]
---

# REQ-PRIV-008 Keine Indexierung durch Suchmaschinen
## Anforderung
Das System muss Suchmaschinen und Crawlern mitteilen, keine Seiten zu indexieren und keinen Links zu folgen.

## Begründung
Inhalte sind ohnehin nur für Mitglieder sichtbar; Rechtsseiten und Startseite sollen nicht ungewollt in Suchmaschinen erscheinen (Datenschutz durch Voreinstellung, Art. 25).

## Akzeptanzkriterien
- `GET /robots.txt` liefert `User-agent: *` und `Disallow: /`.
- Jede HTML-Antwort trägt den Header `X-Robots-Tag: noindex, nofollow`.

## Fehler- und Missbrauchsfälle
N/A – Risiko niedrig; Crawler, die die Angaben ignorieren, sehen nur öffentliche Seiten ohne Mitgliederdaten.

## Nachweis
- `AT-PRIV-008`: Smoke-Test – `robots.txt` mit `Disallow: /`, Header `X-Robots-Tag` auf Start- und Rechtsseiten.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-24 | Erstfassung aus dem Abgleich Recht, Auftritt und Betrieb ([06-abgleich-recht-betrieb.md](../06-abgleich-recht-betrieb.md)); als Übung mit Platzhaltern freigegeben (Q-23) |
