---
id: REQ-PRIV-002
title: Datenminimierung und Schutz der Kontaktdaten
type: privacy
class: constraint
status: approved
owner: team-produkt
risk: high
reviewers: [product-owner, security-lead]
release: R1
moscow: M
moscow_reason: [2, 4]
kano: basis
epic: EPIC-07
source: FS-C1
depends_on: [REQ-CHAT-010]
version: 3.1
created: 2026-10-20
last_updated: 2026-10-25
verification: [AT-PRIV-002, AT-PRIV-002-2]
---

# REQ-PRIV-002 Datenminimierung und Schutz der Kontaktdaten

## Anforderung
1. Die E-Mail-Adresse eines Mitglieds ist **nie öffentlich** sichtbar – weder in Anzeigen, Profilen, Suchergebnissen noch Chats. **Einzige Ausnahme** ist die beidseitige Freigabe innerhalb einer Konversation nach REQ-CHAT-010. Dann gilt:
   - Sichtbar ist ausschließlich für das **Gegenüber dieser Konversation** die Adresse, an die das Mitglied seine Mails erhält (die bei der Registrierung **eingegebene** Adresse, Entscheidung Q-2).
   - Die Adresse wird als Eigenschaft der Konversation angezeigt und **nie als Nachrichtentext** in den Verlauf geschrieben. Moderatoren sehen sie daher auch im gemeldeten Nachrichtenkontext (REQ-PRIV-004) nicht.
2. Ein Klarname ist nicht erforderlich; Mitglieder treten mit einem frei gewählten Anzeigenamen auf.
3. IP-Adressen werden nur **pseudonymisiert** und nur zum Missbrauchsschutz verarbeitet: Eine Rückführung auf die IP ist ohne einen geheimen Schlüssel nicht möglich, der spätestens alle **7 Tage** gewechselt wird. Die pseudonymisierten Werte werden spätestens nach **7 Tagen** gelöscht.
4. Es werden keine Kontaktdaten über die Hochschuladresse hinaus erhoben.

## Begründung
Datenminimierung (DSGVO Art. 5) und Constraint FS-C1 der Fallstudie: Kontaktdaten werden erst nach beidseitiger Zustimmung sichtbar. Ein einfacher Hash einer IPv4-Adresse ließe sich durch Durchprobieren aller 2³² Werte zurückrechnen; erst ein geheimer, wechselnder Schlüssel macht die Speicherung zu einer wirksamen Pseudonymisierung.

## Akzeptanzkriterien
| Prüfung | Erwartung |
|---|---|
| Antworten zu Anzeigen, Profilen, Konversationen, Suche, Moderationsfällen (für Mitglieder und Moderatoren) | enthalten kein E-Mail-Feld eines anderen Mitglieds |
| Konversation nach beidseitiger Freigabe | eingegebene Adresse des Gegenübers nur für den anderen Teilnehmer dieser Konversation |
| Gemeldeter Nachrichtenkontext einer Konversation mit Freigabe | enthält keine Adresse |
| Gespeicherte Missbrauchsschutz-Daten älter als 7 Tage | gelöscht |
| Logs | keine E-Mail-Adressen, keine IP-Adressen im Klartext |

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Gegenüber blockiert oder gesperrt | freigegebene Adresse wird ausgeblendet (REQ-CHAT-010) |
| Moderator sieht Fall | nur Anzeigename, keine Adresse; Admins sehen Adressen nur in der Nutzerverwaltung |
| Rückrechnung der IP aus gespeicherten Werten | ohne den geheimen Schlüssel nicht möglich; alte Schlüssel werden verworfen |
| Mitglied schreibt seine Adresse selbst in den Chat | zulässig (eigene Entscheidung); Sicherheitshinweis nach REQ-CHAT-006 |

## Nachweis
- `AT-PRIV-002`: Smoke-Test, (neu) erweitert – Antworten zu Anzeige, Konversation, Suche und Moderationsfall enthalten keine fremde E-Mail-Adresse; nach beidseitiger Freigabe nur das Gegenüber.
- `AT-PRIV-002-2`: (neu) Daten zum Missbrauchsschutz älter als 7 Tage werden vom täglichen Löschjob entfernt.
- Umgesetzt: Nichtöffentlichkeit, beidseitige Freigabe (REQ-CHAT-010) und Pseudonymisierung nach ADR-0014 – HMAC-SHA256 mit zufälligem, täglich rotiertem Schlüssel (`platform.ip_pepper`, `platform/pseudonym.ts`); auch E-Mail-Adressen in Rate-Limit-Schlüsseln (`login-fail`, `register-addr`) sind pseudonymisiert. Request-Logs enthalten keine IP-Adresse (REQ-OPS-002).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 2.0 | 2026-10-23 | Ausnahme beidseitige Kontaktfreigabe (FS-C1, REQ-CHAT-010); Prüftabelle ergänzt |
| 3.0 | 2026-10-23 | Review v0.2: R-10/R-27 eingegebene Adresse, nie als Nachrichtentext, Moderator sieht sie nicht (Q-2); R-26 Pseudonymisierung mit wechselndem Schlüssel statt „nicht umkehrbar gehasht“, Abuse Case Rückrechnung; R-15 moscow_reason |
| 3.1 | 2026-10-25 | Review v1.3 (RV-R-02): Stand der Pseudonymisierung nach ADR-0014 umgesetzt (6e6fe40), Adressen in Rate-Limit-Schlüsseln, Logs ohne IP |
