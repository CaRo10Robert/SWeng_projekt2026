---
id: REQ-SEC-006
title: Autorisierung pro Ressource, standardmäßig verweigern
type: security
class: constraint
status: implemented
owner: team-plattform
risk: high
reviewers: [product-owner, security-lead]
release: R1
moscow: M
moscow_reason: [2]
kano: basis
epic: EPIC-00
source: OWASP Top 10 A01 (Broken Access Control), QS-2
version: 1.2
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-SEC-006, AT-SEC-006-2]
---

# REQ-SEC-006 Autorisierung pro Ressource, standardmäßig verweigern

## Anforderung
Das System muss jede Anfrage serverseitig gegen die konkrete Ressource prüfen (Besitz der Anzeige, Teilnahme an der Konversation, Rolle) und standardmäßig verweigern. Fremde, nicht sichtbare Ressourcen werden wie nicht vorhanden behandelt (404), damit ihre Existenz nicht preisgegeben wird.

## Begründung
Direkte Objektreferenzen (IDOR) sind die häufigste Ursache für Datenabflüsse; Chats sind vertraulich.

## Akzeptanzkriterien
| Akteur | Aktion | Erwartung |
|---|---|---|
| Gast | jede Mitgliederfunktion | 401 |
| Mitglied | fremde Konversation lesen | 404 |
| Mitglied | fremde Anzeige ändern, löschen, Status setzen | 404 |
| Interessent | Deal einer Konversation steuern | 403 |
| Mitglied | Moderations- oder Admin-Funktion | 403 |
| Moderator | Admin-Funktion | 403 |
| Moderator | eigenen Fall entscheiden | abgelehnt |
| Admin | eigene Rolle ändern | abgelehnt |

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Durchprobieren fremder IDs | nicht vorhersagbare IDs; fremde Ressourcen liefern 404 ohne Unterschied zu nicht existierenden |
| Rollenentzug während einer laufenden Sitzung | Sitzungen des Mitglieds werden beendet; neue Rechte gelten ab der nächsten Anmeldung |
| Moderator ist selbst betroffen | darf den eigenen Fall nicht entscheiden |
| Neue Funktion ohne Berechtigungsprüfung | standardmäßig verweigert; Review-Checkliste der DoD |

## Nachweis
- `AT-SEC-006`: Smoke-Test – fremde Konversation 404, Mitglied auf Moderation 403, Interessent auf Deal 403.
- `AT-SEC-006-2`: neu zu schreiben – vollständige Autorisierungsmatrix (alle Zeilen) als Integrationstest.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei, Autorisierungsmatrix |
| 1.2 | 2026-10-23 | Review v0.2: R-03 `class: constraint` (Kontrollmatrix); R-04 Fehler- und Missbrauchsfälle; R-15 moscow_reason |
