---
id: REQ-PRIV-002
title: Datenminimierung und Schutz der Kontaktdaten
type: privacy
class: constraint
status: in-review
owner: team-produkt
risk: high
reviewers: [product-owner, security-lead]
release: R1
moscow: M
kano: basis
epic: EPIC-07
source: DSGVO Art. 5 Abs. 1 c, FS-C1
use_cases: [UC-04, UC-25]
version: 2.0
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-PRIV-002, AT-PRIV-002-2]
---

# REQ-PRIV-002 Datenminimierung und Schutz der Kontaktdaten

## Anforderung
1. Die E-Mail-Adresse eines Mitglieds ist **nie öffentlich** sichtbar – weder in Anzeigen, Profilen, Suchergebnissen noch Chats. **Einzige Ausnahme** ist die beidseitige Freigabe innerhalb einer Konversation nach REQ-CHAT-010; dann sieht ausschließlich das Gegenüber dieser Konversation die Adresse.
2. Ein Klarname ist nicht erforderlich; Mitglieder treten mit einem frei gewählten Anzeigenamen auf.
3. IP-Adressen werden nur in nicht umkehrbarer Form (gehasht) und nur zum Missbrauchsschutz verarbeitet und spätestens nach **7 Tagen** gelöscht.
4. Es werden keine Kontaktdaten über die Hochschuladresse hinaus erhoben.

## Begründung
Datenminimierung (DSGVO Art. 5) und Constraint FS-C1 der Fallstudie: Kontaktdaten werden erst nach beidseitiger Zustimmung sichtbar.

## Akzeptanzkriterien
| Prüfung | Erwartung |
|---|---|
| Antworten zu Anzeigen, Profilen, Konversationen, Suche, Moderationsfällen (für Mitglieder) | enthalten kein E-Mail-Feld eines anderen Mitglieds |
| Konversation nach beidseitiger Freigabe | Adresse nur für das Gegenüber dieser Konversation |
| Gespeicherte Missbrauchsschutz-Daten älter als 7 Tage | gelöscht |
| Logs | keine E-Mail-Adressen, keine IP-Adressen im Klartext |

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Gegenüber blockiert oder gesperrt | freigegebene Adresse wird ausgeblendet (REQ-CHAT-010) |
| Moderator sieht Fall | nur Anzeigename, keine Adresse; Admins sehen Adressen nur in der Nutzerverwaltung |

## Nachweis
- `AT-PRIV-002`: Smoke-Test, neu zu erweitern – öffentliche Antworten (Anzeige, Konversation, Suche) enthalten keine fremde E-Mail-Adresse.
- `AT-PRIV-002-2`: neu zu schreiben – Daten zum Missbrauchsschutz älter als 7 Tage werden vom täglichen Löschjob entfernt.
- Teilweise umgesetzt: Nichtöffentlichkeit und IP-Hashing sind umgesetzt; die Ausnahme der beidseitigen Freigabe (REQ-CHAT-010) fehlt noch.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 2.0 | 2026-10-23 | Ausnahme beidseitige Kontaktfreigabe (FS-C1, REQ-CHAT-010); Prüftabelle ergänzt |
