---
id: REQ-PRIV-003
title: Löschkonzept mit Fristen je Datenkategorie
type: privacy
class: constraint
status: in-review
owner: team-produkt
risk: high
reviewers: [product-owner, security-lead]
release: R1
moscow: M
kano: n/a
epic: EPIC-07
source: DSGVO Art. 5 Abs. 1 e, Art. 17
use_cases: [UC-05, UC-17]
version: 1.1
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-PRIV-003, AT-PRIV-003-2]
---

# REQ-PRIV-003 Löschkonzept mit Fristen je Datenkategorie

## Anforderung
Das System muss personenbezogene Daten nach festen Fristen automatisch löschen:

| Datenkategorie | Frist |
|---|---|
| Konto (E-Mail, Passwort-Hash, Profil) | 14 Tage nach Löschantrag (REQ-ACC-002) |
| Anzeigen und Bilder | sofort bei Löschung durch das Mitglied; 30 Tage nach „abgegeben“; 90 Tage nach Ablauf |
| Chatnachrichten | 12 Monate nach der letzten Nachricht der Konversation oder bei Kontolöschung (Q-7) |
| Meldungen und Moderationsentscheidungen | 12 Monate nach Abschluss |
| Audit-Log | 24 Monate |
| Missbrauchsschutz (IP-Hashes) | 7 Tage (REQ-PRIV-002) |
| Datensicherungen | spätestens nach 30 Tagen überschrieben (N/A im Docker-Beispiel → EPIC-12) |

## Begründung
Speicherbegrenzung (DSGVO Art. 5) und Recht auf Löschung (Art. 17); Privacy by Design auch ohne Echtbetrieb (BG-4).

## Akzeptanzkriterien
- Ein täglicher Lauf entfernt alle Datensätze, deren Frist abgelaufen ist; das Ergebnis wird ohne personenbezogene Daten protokolliert.
- Nach Ablauf der Frist sind die Daten in keiner Tabelle und keinem Dateispeicher mehr auffindbar.
- Im Demo-Modus lässt sich der Lauf sofort auslösen (REQ-DEMO-002).

## Nachweis
- `AT-PRIV-003`: neu zu schreiben – Szenario-Test mit vorgestellter Zeit für Anzeigen (abgegeben 30 Tage, abgelaufen 90 Tage) und Konten (14 Tage).
- `AT-PRIV-003-2`: neu zu schreiben – Szenario-Test für Chats, Meldungen und Audit-Log.
- Teilweise umgesetzt: Fristen für Konten, Anzeigen und IP-Hashes umgesetzt; Chats, Meldungen und Audit-Log fehlen.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog (Fristen in Architektur §8.4) |
| 1.1 | 2026-10-23 | Eigene Datei, Fristentabelle in die Anforderung übernommen |
