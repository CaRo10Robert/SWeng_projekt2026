---
id: REQ-MOD-006
title: Bewertungen als Käufer und Verkäufer
type: user-story
class: functional
status: approved
owner: team-vertrauen
risk: medium
release: R2
moscow: S
kano: leistung
epic: EPIC-06
source: Wettbewerbsanalyse, Reverse Engineering Kleinanzeigen §5, Auftraggeber (2026-11-13, Q-30)
use_cases: [UC-22, UC-18]
depends_on: [REQ-CHAT-011, REQ-ACC-005]
version: 2.1
created: 2026-10-20
last_updated: 2026-11-13
verification: [AT-MOD-006, AT-MOD-006-2, AT-MOD-006-3]
---

# REQ-MOD-006 Bewertungen als Käufer und Verkäufer

## Anforderung
Als Mitglied möchte ich nach einer abgeschlossenen Übergabe mein Gegenüber einmal **in seiner Rolle als Verkäufer bzw. Käufer** bewerten (positiv, neutral oder negativ, mit kurzem Text), damit andere Mitglieder vor einer Absprache einschätzen können, wie zuverlässig jemand verkauft und kauft.

Grundlage ist ein **abgeschlossener Deal** (REQ-CHAT-011). Die Bewertungen erscheinen im Profil des bewerteten Mitglieds (REQ-ACC-005), getrennt nach „als Verkäufer“ und „als Käufer“.

## Begründung
Bewertungen sind bei allen direkten Wettbewerbern Standard (Wettbewerbsanalyse, Merkmal „Bewertungen / Reputation“) und gehören zum Vertrauensversprechen (BG-1). Die Trennung nach Rolle entspricht Kleinanzeigen: Wer zuverlässig verkauft, ist nicht automatisch ein zuverlässiger Käufer (No-Shows, Analyse §6 Punkt 2). Die Bindung an einen abgeschlossenen Deal verhindert Bewertungen ohne echte Übergabe (Analyse §7: „nur nach bestätigter Übergabe“).

Version 2.0 setzt den Wunsch des Auftraggebers vom 2026-11-13 um (Q-30): drei Stufen statt Daumen, Rollen, Release R2 als Should.

## Akzeptanzkriterien
```gherkin
Szenario: Käuferin bewertet den Verkäufer
  Angenommen Ben hat seine Anzeige "Lehrbuch Statistik" als an Lea abgegeben markiert
  Wenn Lea Ben mit "positiv" und dem Text "Pünktlich und wie beschrieben" bewertet
  Und Ben Lea bewertet
  Dann zeigt Bens Profil unter "als Verkäufer" eine positive Bewertung mehr
  Und die Bewertung nennt Lea, den Anzeigentitel und den Monat der Übergabe

Szenario: Bewertungen bleiben verdeckt, bis beide bewertet haben
  Angenommen Lea hat Ben bewertet und Ben hat Lea noch nicht bewertet
  Wenn ein anderes Mitglied Bens Profil öffnet
  Dann ist Leas Bewertung noch nicht sichtbar
  Und Ben sieht nur, dass eine Bewertung vorliegt, nicht deren Inhalt

Szenario: Veröffentlichung nach Ablauf der Frist
  Angenommen nur Lea hat innerhalb von 14 Tagen nach der Abgabe bewertet
  Wenn die Frist abläuft
  Dann wird Leas Bewertung sichtbar
  Und Ben kann Lea für diesen Deal nicht mehr bewerten

Szenario: Keine Bewertung ohne abgeschlossenen Deal
  Angenommen Lea und Ben haben nur eine Konversation, aber keinen abgeschlossenen Deal
  Dann wird "Bewerten" nicht angeboten
  Und eine direkte Anfrage an die Schnittstelle wird abgelehnt

Szenario: Nur einmal je Deal und Person
  Angenommen Lea hat Ben für diesen Deal bewertet
  Wenn sie eine zweite Bewertung für denselben Deal abgibt
  Dann wird das abgelehnt
```

**Regeln (Entscheidungstabelle)**

| Regel | Festlegung |
|---|---|
| Wer bewertet wen | Nur die beiden Beteiligten eines Deals im Status *abgeschlossen*, jeweils das Gegenüber |
| Rolle | Wer die Anzeige eingestellt hat, wird **als Verkäufer** bewertet, wenn es ein Angebot ist, und **als Käufer**, wenn es ein Gesuch ist; das Gegenüber erhält jeweils die andere Rolle. Verschenken und Tausch zählen wie ein Verkauf (Abgebende = Verkäufer) |
| Skala | positiv · neutral · negativ |
| Text | optional bei positiv und neutral, **Pflicht bei negativ** (10–280 Zeichen); Inhaltsprüfung wie bei Anzeigen (Wortfilter) |
| Frist | 14 Tage nach dem Abschluss des Deals |
| Sichtbarkeit | erst wenn beide bewertet haben oder die Frist abgelaufen ist (Schutz vor Racheabwertung) |
| Ändern | nicht möglich; die eigene Bewertung kann bis zur Veröffentlichung gelöscht und neu abgegeben werden, danach nur gelöscht werden |
| Mehrere Deals derselben zwei Mitglieder | in der Übersicht zählt je Rolle nur die **neueste** Bewertung (Schutz vor Hochschieben unter Bekannten); alle bleiben in der Liste sichtbar |
| Übersicht im Profil | je Rolle die Anzahl positiv / neutral / negativ der letzten 24 Monate; Liste der Bewertungen, neueste zuerst |
| Anzeigentitel | wird bei der Bewertung als Kopie gespeichert, weil abgegebene Anzeigen nach 30 Tagen gelöscht werden (UC-12) |
| Erinnerung | Mitteilung im Konto und E-Mail nach dem Abschluss, abbestellbar über die Kategorie „Erinnerungen“ (REQ-NOTI-003) |

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Bewertung ohne abgeschlossenen Deal, für fremden Deal oder für sich selbst | 404 bzw. 403, nicht angeboten (REQ-SEC-006) |
| Doppelte Abgabe (Doppelklick, Wiederholung) | idempotent je (Deal, bewertende Person); zweite Abgabe 409 |
| Abgabe nach Fristende | 409 `rating_window_closed` |
| Beleidigender oder unwahrer Bewertungstext | meldbar wie eine Nachricht (REQ-MOD-001); Moderation kann die Bewertung entfernen, sie zählt dann nicht mehr; Begründung und Widerspruch nach DSA (REQ-LEGAL-006/007) |
| Racheabwertung | verdeckt bis beide bewertet haben oder Frist abgelaufen ist |
| Hochschieben unter Bekannten (Schein-Deals) | je Paar und Rolle zählt nur die neueste Bewertung; jedes Konto ist an eine Hochschulidentität gebunden (BG-1) |
| Blockierung nach dem Deal | Bewerten bleibt möglich, damit niemand sich einer Bewertung durch Blockieren entzieht |
| Gesperrtes oder gelöschtes Konto des Bewertenden | Bewertung bleibt in der Übersicht, Text entfällt, Autor „Ehemaliges Mitglied“ (vorläufig, Q-30; Löschregel in REQ-PRIV-003 nachzuziehen, B-71) |
| Gelöschtes Konto des Bewerteten | alle erhaltenen Bewertungen werden mitgelöscht (REQ-ACC-002) |
| Deal wird storniert | keine Bewertung möglich |

## INVEST
I: hängt am vorhandenen Deal-Kern und an der Profilansicht (REQ-ACC-005) · N: Skala, Fristen und Zeitraum der Übersicht verhandelbar · V: Vertrauen vor der Absprache · E: mittel · S: ein Sprint · T: automatisierbar.

## Nachweis
- `AT-MOD-006`: Integrationstest – beide Seiten bewerten nach abgeschlossenem Deal; Rolle richtig zugeordnet (Angebot und Gesuch); Übersicht im Profil zählt richtig.
- `AT-MOD-006-2`: Integrationstest – verdeckt bis zur zweiten Bewertung bzw. bis Fristende; nach der Frist keine Abgabe mehr.
- `AT-MOD-006-3`: API-Test – Abuse Cases: ohne Deal, fremder Deal, doppelt, negativ ohne Text, nur neueste Bewertung je Paar und Rolle zählt.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei mit Front Matter, Kano und Nachweis-IDs |
| 1.2 | 2026-10-23 | Review v0.2: Status nach Review |
| 2.0 | 2026-11-13 | Change Request des Auftraggebers (Q-30): Titel, Rollen Käufer/Verkäufer, Skala positiv/neutral/negativ, Text Pflicht bei negativ, Frist 14 Tage, Regeln gegen Hochschieben, Übersicht im Profil. Abhängigkeit von REQ-CHAT-009 auf den Deal-Kern REQ-CHAT-011 korrigiert, neu REQ-ACC-005. MoSCoW C → S, Release R1 → R2, Kano begeisterung → leistung. Status zurück auf in-review |
| 2.1 | 2026-11-13 | Requirements-Review und Freigabe durch den Product Owner (Definition of Ready: Nachweise und Akzeptanzkriterien vorhanden); Status → approved, Umsetzung als B-70; Datenschutz und Moderation der Bewertungen (B-71) mit DSB und security-lead geklärt |
