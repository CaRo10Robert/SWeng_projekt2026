---
id: REQ-ACC-002
title: Konto löschen mit Karenzzeit
type: user-story
class: functional
status: approved
owner: team-produkt
risk: high
reviewers: [product-owner, security-lead]
release: R1
moscow: M
moscow_reason: [2]
kano: basis
epic: EPIC-07
source: DSGVO Art. 17, BG-4
use_cases: [UC-05]
depends_on: [REQ-PRIV-003]
version: 3.0
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-ACC-002, AT-ACC-002-2]
---

# REQ-ACC-002 Konto löschen mit Karenzzeit
## Anforderung
Als Mitglied möchte ich mein Konto löschen können und dabei 14 Tage Zeit haben, die Löschung durch erneute Anmeldung abzubrechen, damit mein Recht auf Löschung umgesetzt wird, ohne dass ein Fehlklick endgültig ist.

## Begründung
Recht auf Löschung (DSGVO Art. 17); Privacy by Design (BG-4).

## Akzeptanzkriterien
```gherkin
Szenario: Löschung beantragen
  Angenommen ich bin als Mia angemeldet
  Wenn ich "Konto löschen" mit meinem Passwort bestätige
  Dann werde ich abgemeldet
  Und meine Anzeigen sind nicht mehr sichtbar
  Und ich erhalte eine E-Mail mit dem Löschdatum

Szenario: Abbruch in der Karenzzeit
  Angenommen ich habe die Löschung vor 3 Tagen beantragt
  Wenn ich mich anmelde
  Dann ist die Löschung abgebrochen und ich sehe einen Hinweis

Szenario: Endgültige Löschung
  Angenommen die Löschung wurde vor mehr als 14 Tagen beantragt
  Wenn der tägliche Löschlauf ausgeführt wird
  Dann sind Profil, Anzeigen, Bilder, Merkliste und Blockierungen gelöscht
  Und meine eigenen Nachrichtentexte sind gelöscht
  Und die Konversationen bleiben für mein Gegenüber erhalten, mit dessen eigenen Nachrichten und mir als "Ehemaliges Mitglied"
  Und ich erhalte eine Löschbestätigung
```

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Falsches Passwort | abgelehnt, keine Löschung |
| Offene Sperre oder laufendes Moderationsverfahren | Beweisdaten werden getrennt bis zum Ende der Aufbewahrungsfrist gehalten (REQ-PRIV-003) |
| Löschlauf bricht ab | wird beim nächsten Lauf fortgesetzt; Löschung ist wiederholbar |

## INVEST
I: unabhängig · N: Karenzdauer verhandelbar · V: Rechtspflicht · E: mittel · S: ein Sprint · T: mit Zeitsteuerung automatisierbar (REQ-DEMO-002).

## Nachweis
- `AT-ACC-002`: Smoke-Test – Löschung beantragen, Anmeldung bricht ab.
- `AT-ACC-002-2`: Integrationstest – Löschlauf nach Ablauf der Karenz entfernt alle personenbezogenen Daten und anonymisiert fremde Konversationen.
- `AT-ACC-002-2` ist neu; ebenso die Anpassung der Umsetzung: Sie löscht bisher ganze Konversationen inklusive der Nachrichten des Gegenübers. Soll ist das Löschen nur der eigenen Nachrichtentexte (UC-05, REQ-PRIV-003). Die Korrektur steht im Backlog; bis dahin bleibt der Status `approved`.


## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 2.0 | 2026-10-23 | Sollverhalten für fremde Konversationen präzisiert (Anonymisierung statt Löschung, UC-05) |
| 3.0 | 2026-10-23 | Review v0.2: R-13 (nur eigene Nachrichtentexte löschen, Gegenüber behält Konversation), R-15, R-16 |
