---
id: REQ-PRIV-003
title: Löschkonzept mit Fristen je Datenkategorie
type: privacy
class: constraint
status: approved
owner: team-produkt
risk: high
reviewers: [product-owner, security-lead]
release: R1
moscow: M
moscow_reason: [2]
kano: n/a
epic: EPIC-07
source: DSGVO Art. 5, 17
use_cases: [UC-01, UC-05]
version: 2.0
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-PRIV-003, AT-PRIV-003-2, AT-PRIV-003-3]
---

# REQ-PRIV-003 Löschkonzept mit Fristen je Datenkategorie

## Anforderung
Das System muss personenbezogene Daten nach festen Fristen automatisch löschen. Jede gespeicherte Datenkategorie hat eine Frist:

| Datenkategorie | Frist |
|---|---|
| Unbestätigte Konten (Bestätigungslink nie geöffnet) | 7 Tage nach Registrierung (Q-13, REQ-AUTH-002) |
| Konto (E-Mail, Passwort-Hash, Profil, Merkliste, Blockierungen) | 14 Tage nach Löschantrag (REQ-ACC-002) |
| Eigene Nachrichtentexte bei Kontolöschung | mit dem Konto; die Konversation bleibt für das Gegenüber erhalten, der Absender erscheint als „Ehemaliges Mitglied“ (UC-05) |
| Chatnachrichten (sonst) | 12 Monate nach der letzten Nachricht der Konversation (Q-7) |
| Zustimmungen zur Kontaktfreigabe (REQ-CHAT-010) | mit der Konversation bzw. mit dem Konto |
| Anzeigen und Bilder | sofort bei Löschung durch das Mitglied; 30 Tage nach „abgegeben“; 90 Tage nach Ablauf |
| Pausierte Anzeigen | laufen nach **90 Tagen** Pause ab und folgen dann der Frist für abgelaufene Anzeigen |
| Reservierte Anzeigen | nach **30 Tagen** ohne Abgabe zurück auf „aktiv“ mit Hinweis an den Anbieter (danach normaler Ablauf) |
| Von der Moderation entfernte Anzeigen | 12 Monate nach der Entscheidung (Nachweis gegenüber Betroffenen) |
| Hochgeladene, nie einer Anzeige zugeordnete Bilder | 24 Stunden |
| Meldungen und Moderationsentscheidungen | 12 Monate nach Abschluss; bei Kontolöschung ohne Personenbezug des Meldenden |
| Einwilligungen | bis zur Kontolöschung; danach 3 Jahre ohne Profilbezug als Nachweis (Verjährungsfrist) |
| Bestätigungs- und Reset-Links | 7 Tage nach Ablauf bzw. Nutzung |
| Audit-Log | 24 Monate |
| Missbrauchsschutz (pseudonymisierte IP-Werte) | 7 Tage (REQ-PRIV-002) |
| Datenexporte | werden nicht gespeichert (direkter Download, REQ-ACC-003) |
| Datensicherungen | spätestens nach 30 Tagen überschrieben (N/A im Docker-Beispiel → EPIC-12) |

Die Fristen für pausierte und reservierte Anzeigen ergänzen das [Zustandsmodell](../02-anforderungen.md#4-zustandsmodell-anzeige-normativ).

## Begründung
Speicherbegrenzung (DSGVO Art. 5) und Recht auf Löschung (Art. 17); Privacy by Design auch ohne Echtbetrieb (BG-4). Ohne Höchstdauer würden pausierte und reservierte Anzeigen unbegrenzt gespeichert.

## Akzeptanzkriterien
- Ein täglicher Lauf entfernt alle Datensätze, deren Frist abgelaufen ist; das Ergebnis wird ohne personenbezogene Daten protokolliert (Anzahl je Kategorie).
- Nach Ablauf der Frist sind die Daten in keiner Tabelle und keinem Dateispeicher mehr auffindbar.
- Bei Kontolöschung verschwinden nur die **eigenen** Nachrichtentexte; die Nachrichten des Gegenübers bleiben lesbar.
- Im Demo-Modus lässt sich der Lauf sofort auslösen (REQ-DEMO-002).

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Löschlauf bricht mitten in einem Konto ab | jede Löschung eines Kontos läuft als Einheit; ein Abbruch hinterlässt keinen Teilzustand, der nächste Lauf setzt fort |
| Datei im Speicher lässt sich nicht löschen | Datensatz bleibt markiert, nächster Lauf versucht es erneut; Fehler im Log ohne personenbezogene Daten |
| Mehrere Instanzen starten den Lauf gleichzeitig | Lauf ist idempotent; doppelte Ausführung löscht nichts doppelt oder falsch |
| Wiederherstellung aus einer Datensicherung | N/A im Docker-Beispiel; im Echtbetrieb werden Löschungen nach einer Rücksicherung erneut angewendet (EPIC-12) |
| Offene Moderationsmaßnahme bei Kontolöschung | Beweisdaten bleiben ohne Personenbezug bis zum Fristende erhalten (UC-05 4a) |

## Nachweis
- `AT-PRIV-003`: (neu) Szenario-Test mit vorgestellter Zeit für Anzeigen (abgegeben 30 Tage, abgelaufen 90 Tage, pausiert 90 Tage, reserviert 30 Tage) und Konten (unbestätigt 7 Tage, Löschantrag 14 Tage).
- `AT-PRIV-003-2`: (neu) Szenario-Test für Chats (12 Monate), Meldungen, Audit-Log, Links und entfernte Anzeigen.
- `AT-PRIV-003-3`: (neu) Kontolöschung: eigene Nachrichtentexte entfernt, Konversation des Gegenübers bleibt mit „Ehemaliges Mitglied“.
- Teilweise umgesetzt: Fristen für Konten nach Löschantrag, Anzeigen (abgegeben/abgelaufen), nie zugeordnete Bilder und Missbrauchsschutzdaten umgesetzt; die übrigen Kategorien fehlen; bei Kontolöschung werden bisher ganze Konversationen gelöscht.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog (Fristen in Architektur §8.4) |
| 1.1 | 2026-10-23 | Eigene Datei, Fristentabelle in die Anforderung übernommen |
| 2.0 | 2026-10-23 | Review v0.2: R-28 Fristentabelle vollständig (unbestätigte Konten, pausiert/reserviert, entfernt, Uploads, Einwilligungen, Zustimmungen, Links, Exporte); R-13 Kontolöschung nur eigene Nachrichtentexte; R-04 Fehler- und Missbrauchsfälle; Q-7, Q-13 |
