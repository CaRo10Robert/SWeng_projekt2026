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
version: 2.3
created: 2026-10-20
last_updated: 2026-10-26
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
| Missbrauchsschutz (Zähler mit pseudonymisierten IP- und Adresswerten) | höchstens 7 Tage (REQ-PRIV-002); im Beispiel nach 1 Tag gelöscht |
| Schlüssel für die Pseudonymisierung (`platform.ip_pepper`, ADR-0014) | täglich neu; der Vorgänger wird 1 Stunde nach der Rotation gelöscht |
| Datenexporte | werden nicht gespeichert (direkter Download, REQ-ACC-003) |
| Datensicherungen (Datenbank und Bilder, REQ-AVAIL-003) | höchstens 28 Tage, auch die neueste Sicherung (ADR-0018) |
| Löschjournal (nur Art, ID und Zeitpunkt einer Löschung, keine Inhalte; ADR-0019) | 35 Tage (länger als die älteste Sicherung) |
| Abgeschlossene Deals (Preis, Gegenpartei, Zeitpunkt; REQ-CHAT-011, Grundlage für DAC7) | mit der Konversation bzw. dem Konto; DAC7-pflichtige Angaben im Echtbetrieb vor der Löschung sichern (offener Punkt, `docs/06-recht/dac7-konzept.md`) |
| Mitteilungen im Konto (Begründungen, Ergebnisse von Widersprüchen, vorläufiges Ausblenden; REQ-LEGAL-006) | mit dem Konto; Soll: 12 Monate nach Erstellung |
| Widersprüche (REQ-LEGAL-007) | mit dem Moderationsfall (12 Monate nach Abschluss) |
| Einmal-Links für den Widerspruch (nur Hash) | bis zum Ende der Widerspruchsfrist (6 Monate), mit dem Konto; Soll: nach Ablauf physisch löschen |
| Originaltexte von der Moderation entfernter Nachrichten | 6 Monate nach Entfernung; nicht, solange ein Widerspruch offen oder eine Beweissicherung aktiv ist |
| Beweissicherung (pseudonymisierte Kopie mit Kontext, REQ-LEGAL-008) | bis zur Freigabe durch die Administration, höchstens 6 Monate |
| Ankündigungen und Wartungsstatus (`platform.setting`) | bis zum Entfernen bzw. Ende des Zeitraums; der Eintrag im Audit-Log folgt dessen Frist |
| Sprache und Kenntnisnahme der Datenschutzerklärung (Profil) | mit dem Konto |

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
| Wiederherstellung aus einer Datensicherung | alle Löschungen seit dem Sicherungszeitpunkt werden aus dem Löschjournal erneut ausgeführt (`replay-deletions`, ADR-0018); Sperren und Entsperren stehen nicht im Journal |
| Offene Moderationsmaßnahme bei Kontolöschung | das Konto wird gelöscht; nur die Beweissicherung bleibt als pseudonymisierte Kopie bis zum Fristende erhalten (REQ-LEGAL-008) |

## Nachweis
- `AT-PRIV-003`: (neu) Szenario-Test mit vorgestellter Zeit für Anzeigen (abgegeben 30 Tage, abgelaufen 90 Tage, pausiert 90 Tage, reserviert 30 Tage) und Konten (unbestätigt 7 Tage, Löschantrag 14 Tage).
- `AT-PRIV-003-2`: Ops-Test `tests/ops/retention-test.mjs` – Datensätze werden per psql zurückdatiert, danach löst die Administration den Löschlauf aus (`POST /admin/demo/run-due-jobs`); geprüft werden Chats (12 Monate nach der letzten Nachricht), Meldungen und Entscheidungen (12 Monate nach Abschluss), Audit-Log (24 Monate), benutzte bzw. abgelaufene Links (7 Tage) und von der Moderation entfernte Anzeigen (12 Monate); jüngere Einträge bleiben. Läuft in CI im Job `compose`.
- `AT-PRIV-003-3`: derselbe Ops-Test – Kontolöschung entfernt nur die eigenen Nachrichtentexte (Systemcode `message_deleted`), die Konversation bleibt für das Gegenüber mit „Ehemaliges Mitglied“.
- Umgesetzt (2026-10-26): alle Fristen dieser Tabelle in `privacy/domain.ts` (`retentionCutoffs`, Unit-Tests) und im täglichen Löschlauf `privacy.purgeExpired`, der nur Anzahlen protokolliert; Beweissicherung und offene Widersprüche halten die betroffenen Datensätze zurück. Zustimmungsnachweise bleiben 3 Jahre **ohne Profilbezug**: `identity.consent.user_id` wird bei der Kontolöschung auf NULL gesetzt, `subject_ref` (HMAC der kanonischen Adresse mit festem Geheimnis) erlaubt im Streitfall die Zuordnung, wenn die Person ihre Adresse nennt (Migration 0005). Fristlöschungen nach Datum stehen bewusst nicht im Löschjournal: nach einem Restore löscht der nächste Lauf dieselben Daten erneut (ADR-0018).
- **Offen:** reservierte Anzeigen gehen nach 30 Tagen noch nicht zurück auf „aktiv“ (braucht eine Hinweis-Mail an den Anbieter); deshalb ist `AT-PRIV-003` noch nicht markiert.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog (Fristen in Architektur §8.4) |
| 1.1 | 2026-10-23 | Eigene Datei, Fristentabelle in die Anforderung übernommen |
| 2.0 | 2026-10-23 | Review v0.2: R-28 Fristentabelle vollständig (unbestätigte Konten, pausiert/reserviert, entfernt, Uploads, Einwilligungen, Zustimmungen, Links, Exporte); R-13 Kontolöschung nur eigene Nachrichtentexte; R-04 Fehler- und Missbrauchsfälle; Q-7, Q-13 |
| 2.1 | 2026-10-25 | Review v1.3 (RV-R-05, RV-R-13, RV-A-01): Datensicherungen 28 Tage, neue Kategorien (Pseudonymisierungsschlüssel, Löschjournal, Deals, Mitteilungen, Widersprüche, Einmal-Links, Originaltexte, Beweissicherung, Ankündigungen, Sprache/Kenntnisnahme); Wiederherstellung über Löschjournal; Stand ergänzt |
| 2.2 | 2026-10-26 | Löschläufe umgesetzt, Nachweise AT-PRIV-003-2/-3 als Ops-Test, Zustimmungsnachweise pseudonymisiert; offen: reservierte Anzeigen |
| 2.3 | 2026-10-26 | Guideline-Review: GL-09 Löschjournal auf ADR-0019 verwiesen |
