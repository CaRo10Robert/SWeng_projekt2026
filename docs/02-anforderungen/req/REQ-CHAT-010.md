---
id: REQ-CHAT-010
title: Kontaktdaten erst nach beidseitiger Zustimmung freigeben
type: user-story
class: constraint
status: draft
owner: team-kommunikation
risk: high
reviewers: [product-owner, security-lead]
release: R1
moscow: M
kano: basis
epic: EPIC-04
source: FS-C1
use_cases: [UC-25]
depends_on: [REQ-CHAT-001, REQ-PRIV-002]
version: 1.0
created: 2026-10-23
last_updated: 2026-10-23
verification: [AT-CHAT-010, AT-CHAT-010-2]
---

# REQ-CHAT-010 Kontaktdaten erst nach beidseitiger Zustimmung freigeben

## Anforderung
Als Teilnehmer einer Konversation möchte ich meine Kontaktdaten nur dann mit meinem Gegenüber teilen, wenn wir **beide** zugestimmt haben, damit ich die Übergabe auch außerhalb der Plattform absprechen kann, ohne meine Daten einseitig preiszugeben.

Kontaktdaten im Sinne dieser Anforderung sind die Hochschul-E-Mail-Adresse des Mitglieds. Weitere Kontaktdaten werden nicht erhoben (Datenminimierung, REQ-PRIV-002).

## Begründung
Constraint FS-C1 der Fallstudie. Viele Übergaben werden kurzfristig abgestimmt; eine freiwillige, gegenseitige Freigabe ersetzt das ungeschützte Posten von Telefonnummern im Chat (siehe Sicherheitshinweis REQ-CHAT-006).

## Akzeptanzkriterien
```gherkin
Szenario: Einseitige Zustimmung gibt nichts preis
  Angenommen Lea und Ben haben eine Konversation zur Anzeige "Statistik-Buch"
  Wenn Lea "Kontaktdaten teilen" bestätigt
  Dann sieht Ben "Lea möchte Kontaktdaten austauschen"
  Und keiner von beiden sieht die E-Mail-Adresse des anderen

Szenario: Beidseitige Zustimmung
  Angenommen Lea hat der Freigabe zugestimmt
  Wenn Ben ebenfalls zustimmt
  Dann sieht Lea die Hochschul-E-Mail-Adresse von Ben
  Und Ben sieht die Hochschul-E-Mail-Adresse von Lea
  Und im Verlauf erscheint die Systemnachricht "Kontaktdaten wurden ausgetauscht"

Szenario: Widerruf
  Angenommen beide haben zugestimmt
  Wenn Ben seine Zustimmung widerruft
  Dann sieht Lea die Adresse von Ben nicht mehr
  Und Ben sieht die Adresse von Lea nicht mehr

Szenario: Blockierung
  Angenommen Ben hat Lea blockiert
  Wenn Lea der Freigabe zustimmen will
  Dann wird das abgelehnt mit "Kontakt nicht möglich"
```

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Nicht-Teilnehmer ruft die Freigabe auf | 404, keine Existenzpreisgabe (REQ-SEC-006) |
| Doppelte Zustimmung (Wiederholung) | idempotent, keine zweite Systemnachricht |
| Konto des Gegenübers gesperrt oder gelöscht | Adresse wird nicht mehr angezeigt |
| Blockierung nach erfolgter Freigabe | Adresse wird für beide ausgeblendet |
| Massenhaftes Abgreifen von Adressen | nur in bestehenden Konversationen möglich; Konversationsanlage ist begrenzt (REQ-CHAT-007) |

## INVEST
I: unabhängig von Deal und Bewertung · N: Umfang der Kontaktdaten verhandelbar · V: direkter Nutzen für die Übergabe · E: klein (eine Tabelle, zwei Endpunkte, UI-Schalter) · S: in einem Sprint umsetzbar · T: Szenarien oben sind automatisierbar.

## Nachweis
- `AT-CHAT-010`: Smoke-Test – einseitige Zustimmung gibt nichts preis, beidseitige Zustimmung zeigt die Adresse, Widerruf blendet sie aus.
- `AT-CHAT-010-2`: Smoke-Test – fremder Nutzer erhält 404.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-23 | Erstfassung aus Fallstudie FS-C1 (Abgleich A-1) |
