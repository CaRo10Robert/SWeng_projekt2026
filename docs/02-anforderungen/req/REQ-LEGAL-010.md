---
id: REQ-LEGAL-010
title: Einwilligung vor nicht notwendiger Speicherung auf Endgeräten
type: privacy
class: constraint
status: approved
owner: team-produkt
risk: medium
release: R1
moscow: M
moscow_reason: [2]
kano: basis
epic: EPIC-13
source: TDDDG § 25, Q-24
depends_on: [REQ-PRIV-006]
version: 1.0
created: 2026-10-24
last_updated: 2026-10-24
verification: [AT-LEGAL-010]
---

# REQ-LEGAL-010 Einwilligung vor nicht notwendiger Speicherung auf Endgeräten
## Anforderung
Das System darf auf dem Endgerät nur Informationen speichern oder auslesen, die für den ausdrücklich gewünschten Dienst unbedingt erforderlich sind. Jede weitere Speicherung erfordert vorher eine informierte, freiwillige Einwilligung, deren Ablehnung so einfach ist wie die Zustimmung. Solange es keine solche Speicherung gibt, zeigt das System **keinen** Cookie-Banner.

## Begründung
TDDDG § 25 Abs. 1 und 2 Nr. 2. Ein Banner ohne Anlass ist überflüssig und wirkt unprofessionell (Q-24); die Regel stellt sicher, dass eine spätere Erweiterung die Einwilligung nicht vergisst.

## Akzeptanzkriterien
Zulässige Speicherungen (Allowlist, abgelegt als `e2e/storage-allowlist.json` und in der Datenschutzerklärung):

| Speicherung | Zweck | Dauer | Einordnung |
|---|---|---|---|
| Cookie `cm_session` | Anmeldung | Sitzung bzw. Ablauf der Sitzung | unbedingt erforderlich |
| Cache des Service Workers (App-Shell) | Laden und Offline-Hinweis der PWA | bis zur nächsten Version | unbedingt erforderlich |
| Sprachwahl (falls REQ-UX-007 umgesetzt) | vom Nutzer ausdrücklich gewählte Sprache | bis zur Änderung | unbedingt erforderlich (ausdrücklich gewünscht) |

| Neue Speicherung | Eintrag in Allowlist und Datenschutzerklärung | Einwilligung nötig | Ergebnis |
|---|---|---|---|
| unbedingt erforderlich | ja | nein | zulässig |
| unbedingt erforderlich | nein | – | Test schlägt fehl |
| nicht erforderlich (z. B. Statistik) | ja | ja, vor dem Setzen | erst nach Einwilligung zulässig |

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Bibliothek setzt unbemerkt Cookies oder Speicher | AT-LEGAL-010 schlägt fehl |
| Drittanbieter-Ressource liest Speicher | ausgeschlossen durch REQ-PRIV-006 und CSP |

## Nachweis
- `AT-LEGAL-010`: E2E-Test – nach Gast- und Mitgliederabläufen enthalten Cookies, localStorage, sessionStorage, IndexedDB und Cache Storage nur Einträge der Allowlist; kein Cookie-Banner sichtbar.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-24 | Erstfassung aus dem Abgleich Recht, Auftritt und Betrieb ([06-abgleich-recht-betrieb.md](../06-abgleich-recht-betrieb.md)); als Übung mit Platzhaltern freigegeben (Q-23) |
