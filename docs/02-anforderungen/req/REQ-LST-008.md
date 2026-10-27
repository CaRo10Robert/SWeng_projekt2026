---
id: REQ-LST-008
title: Ablauf, Erinnerung, Verlängerung und Löschfristen von Anzeigen
type: business-rule
class: functional
status: approved
owner: team-marktplatz
risk: low
release: R1
moscow: S
kano: leistung
epic: EPIC-02
source: BG-2, REQ-PRIV-003
use_cases: [UC-17]
depends_on: [REQ-NOTI-001]
version: 3.0
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-LST-008]
---

# REQ-LST-008 Ablauf, Erinnerung, Verlängerung und Löschfristen von Anzeigen

## Anforderung
Anzeigen sollen nach **60 Tagen** ablaufen. **7 Tage** vorher erhält der Anbieter eine Erinnerung per E-Mail mit Link zur Anzeige, wo er sie mit einer Aktion um 60 Tage verlängern kann. Pausierte Anzeigen laufen **90 Tage** nach dem Pausieren ab; Reservierungen fallen nach **30 Tagen** automatisch auf „aktiv“ zurück. Abgelaufene Anzeigen werden **90 Tage** nach Ablauf gelöscht, abgegebene **30 Tage** nach Abgabe. Übergänge gemäß [Zustandsmodell Anzeige](../02-anforderungen.md#4-zustandsmodell-anzeige-normativ).

## Begründung
Hält den Bestand aktuell (BG-2) und setzt die Löschfristen des Löschkonzepts um (REQ-PRIV-003).

## Akzeptanzkriterien
| Ereignis | Bedingung | Ergebnis |
|---|---|---|
| Erinnerung | aktiv, Ablauf in ≤ 7 Tagen, noch nicht erinnert | genau 1 E-Mail (abbestellbar, REQ-NOTI-003) |
| Ablauf | aktiv, Ablaufdatum erreicht | abgelaufen, nicht mehr in der Suche |
| Ablauf | pausiert seit 90 Tagen | abgelaufen |
| Rückfall | reserviert seit 30 Tagen | aktiv, wieder in der Suche; ein offener Deal wird aufgehoben (REQ-CHAT-011) |
| Verlängern | aktiv oder abgelaufen; ausgelöst über den Link in der Erinnerung und **eine** Aktion auf der Anzeige | aktiv, neues Ablaufdatum heute + 60 Tage, Erinnerung erneut möglich |
| Löschen | abgelaufen seit > 90 Tagen | gelöscht inkl. Bilder |
| Löschen | abgegeben seit > 30 Tagen | gelöscht inkl. Bilder |

Die Prüfung erfolgt mindestens stündlich. Im Demo-Modus kann ein Admin sie sofort auslösen (REQ-DEMO-002).

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| E-Mail-Versand schlägt fehl | Wiederholung gemäß REQ-NOTI-005, Ablauf passiert trotzdem |
| Prüfung läuft doppelt | idempotent, keine zweite Erinnerung |

## Nachweis
- `AT-LST-008`: Szenario-Test mit vorgestellten Zeitstempeln – Erinnerung, Ablauf, Verlängerung, Löschung, Ablauf pausierter und Rückfall reservierter Anzeigen (neu).

Teilweise umgesetzt: Erinnerung, Ablauf aktiver Anzeigen, Verlängerung und Löschfristen sind umgesetzt; Ablauf pausierter und Rückfall reservierter Anzeigen fehlen noch. Deshalb Status `approved`.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 2.0 | 2026-10-23 | Löschfrist abgegebener Anzeigen (30 Tage) aufgenommen; „Verlängern mit einem Klick“ präzisiert als Link zur Anzeige plus eine Aktion |
| 3.0 | 2026-10-23 | Review v0.2: R-05/R-28 pausierte Anzeigen laufen nach 90 Tagen ab, Reservierungen fallen nach 30 Tagen zurück; R-07 Verlängern über Link + eine Aktion (UC-17); Verweis auf §4 |
