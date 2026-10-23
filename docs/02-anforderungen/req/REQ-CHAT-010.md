---
id: REQ-CHAT-010
title: Kontaktdaten erst nach beidseitiger Zustimmung freigeben
type: user-story
class: constraint
status: approved
owner: team-kommunikation
risk: high
reviewers: [product-owner, security-lead]
release: R1
moscow: M
moscow_reason: [2, 4]
kano: basis
epic: EPIC-04
source: FS-C1
use_cases: [UC-25]
depends_on: [REQ-CHAT-001, REQ-PRIV-002]
version: 2.0
created: 2026-10-23
last_updated: 2026-10-23
verification: [AT-CHAT-010, AT-CHAT-010-2, AT-CHAT-010-3]
---

# REQ-CHAT-010 Kontaktdaten erst nach beidseitiger Zustimmung freigeben

## Anforderung
Als Teilnehmer einer Konversation möchte ich meine Kontaktdaten nur dann mit meinem Gegenüber teilen, wenn wir **beide** zugestimmt haben, damit ich die Übergabe auch außerhalb der Plattform absprechen kann, ohne meine Daten einseitig preiszugeben.

| Regel | Festlegung |
|---|---|
| Kontaktdaten | die Hochschul-E-Mail-Adresse, und zwar **so, wie sie bei der Registrierung eingegeben wurde** (inkl. eines `+`-Zusatzes, Entscheidung Q-2). Weitere Kontaktdaten werden nicht erhoben (Datenminimierung, REQ-PRIV-002). |
| Sichtbarkeit | Die Adresse wird nur den beiden Teilnehmern **als Angabe zur Konversation** angezeigt, **nie als Nachrichtentext** im Verlauf. Moderatoren sehen sie auch im gemeldeten Nachrichtenkontext nicht (REQ-PRIV-004). |
| Zustimmung | gilt je Konversation, ist jederzeit widerrufbar; Zeitpunkt von Zustimmung und Widerruf wird gespeichert |
| Ablehnen | das Gegenüber kann eine Anfrage ausdrücklich ablehnen |
| Benachrichtigung | das Gegenüber sieht die Anfrage in der Konversation und in Echtzeit; es gibt keine eigene E-Mail-Art |
| Datenschutzrechte | Zustimmungen erscheinen im Datenexport (REQ-ACC-003) und werden mit der Konversation gelöscht (REQ-PRIV-003) |
| Grenze | Einmal angezeigte Adressen können durch einen Widerruf nicht „zurückgeholt“ werden; die Oberfläche weist vor der Zustimmung darauf hin |

## Begründung
Constraint FS-C1 der Fallstudie. Viele Übergaben werden kurzfristig abgestimmt; eine freiwillige, gegenseitige Freigabe ersetzt das ungeschützte Posten von Telefonnummern im Chat (siehe Sicherheitshinweis REQ-CHAT-006).

**Must-Begründung:** Kriterium 2 (Datenschutzrisiko bei einseitiger Preisgabe) und 4 (verbindliche Vorgabe der Fallstudie).

## Akzeptanzkriterien
```gherkin
Szenario: Einseitige Zustimmung gibt nichts preis
  Angenommen Lea und Ben haben eine Konversation zur Anzeige "Statistik-Buch"
  Wenn Lea "Kontaktdaten teilen" bestätigt
  Dann sieht Ben "Lea möchte Kontaktdaten austauschen" mit "Zustimmen" und "Ablehnen"
  Und keiner von beiden sieht die E-Mail-Adresse des anderen

Szenario: Beidseitige Zustimmung
  Angenommen Lea hat der Freigabe zugestimmt
  Wenn Ben ebenfalls zustimmt
  Dann sieht Lea die Hochschul-E-Mail-Adresse von Ben
  Und Ben sieht die Hochschul-E-Mail-Adresse von Lea
  Und im Verlauf erscheint die Systemnachricht "Kontaktdaten wurden ausgetauscht" ohne Adressen

Szenario: Ablehnen
  Angenommen Lea hat der Freigabe zugestimmt
  Wenn Ben ablehnt
  Dann sieht Lea "Ben möchte keine Kontaktdaten austauschen"
  Und keine Adresse wird angezeigt

Szenario: Eigene Zustimmung zurückziehen, bevor das Gegenüber zustimmt
  Angenommen Lea hat zugestimmt und Ben noch nicht
  Wenn Lea ihre Zustimmung zurückzieht
  Dann sieht Ben keine offene Anfrage mehr

Szenario: Widerruf nach dem Austausch
  Angenommen beide haben zugestimmt
  Wenn Ben seine Zustimmung widerruft
  Dann sieht Lea die Adresse von Ben nicht mehr
  Und Ben sieht die Adresse von Lea nicht mehr

Szenario: Gegenüber blockiert, gesperrt oder gelöscht
  Angenommen Ben hat Lea blockiert oder Bens Konto ist gesperrt oder gelöscht
  Wenn Lea die Konversation öffnet
  Dann wird keine Adresse angezeigt
  Und eine neue Zustimmung ist nicht möglich ("Kontakt nicht möglich")

Szenario: Anzeige abgegeben oder gelöscht
  Angenommen Bens Anzeige ist abgegeben oder gelöscht
  Wenn Lea und Ben in der bestehenden Konversation zustimmen
  Dann werden die Adressen ausgetauscht
```

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Nicht-Teilnehmer ruft die Freigabe auf | nicht gefunden, keine Existenzpreisgabe (REQ-SEC-006) |
| Doppelte Zustimmung (Wiederholung) | idempotent, keine zweite Systemnachricht |
| Wiederholte Anfragen nach Ablehnung oder Widerruf (Bedrängen) | erneute Anfrage frühestens **24 h** nach Ablehnung bzw. Widerruf, höchstens **3 Anfragen je Teilnehmer und Konversation**; danach Hinweis „nicht mehr möglich“ |
| Konto des Gegenübers gesperrt oder gelöscht | Adresse wird nicht mehr angezeigt |
| Blockierung nach erfolgter Freigabe | Adresse wird für beide ausgeblendet |
| Massenhaftes Abgreifen von Adressen | nur in bestehenden Konversationen möglich, die das Gegenüber zulässt; Konversationsanlage ist begrenzt (REQ-CHAT-007) |
| Adresse soll im gemeldeten Kontext sichtbar werden | ausgeschlossen, weil die Adresse nie Teil einer Nachricht ist |

## INVEST
I: unabhängig von Deal und Bewertung · N: Umfang der Kontaktdaten und Grenzen für Wiederholungen verhandelbar · V: direkter Nutzen für die Übergabe · E: klein bis mittel · S: in einem Sprint umsetzbar · T: alle Szenarien automatisierbar.

## Nachweis
- `AT-CHAT-010`: Smoke-Test – einseitige Zustimmung gibt nichts preis, beidseitige Zustimmung zeigt die Adresse, Systemnachricht ohne Adresse, Widerruf blendet sie aus (neu).
- `AT-CHAT-010-2`: Smoke-Test – fremder Nutzer erhält „nicht gefunden“ (neu).
- `AT-CHAT-010-3`: Smoke-Test – Ablehnen, Sperrfrist für erneute Anfragen und Höchstzahl je Konversation (neu).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-23 | Erstfassung aus Fallstudie FS-C1 (Abgleich A-1) |
| 2.0 | 2026-10-23 | Review v0.2: R-10 Ablehnen, Zurückziehen, Sperre/Löschung, abgegebene Anzeige, Schutz vor wiederholten Anfragen, gezeigte Adresse (Q-2), nie als Nachrichtentext, Export und Löschung, Benachrichtigung, Grenzen des Widerrufs; INVEST lösungsneutral; Must-Begründung |
