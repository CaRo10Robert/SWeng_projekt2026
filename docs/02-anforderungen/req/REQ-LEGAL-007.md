---
id: REQ-LEGAL-007
title: Widerspruch gegen Moderationsentscheidungen
type: user-story
class: functional
status: approved
owner: team-vertrauen
risk: high
reviewers: [product-owner, security-lead]
release: R1
moscow: M
moscow_reason: [2]
kano: basis
epic: EPIC-13
source: DSA Art. 20, Q-22
use_cases: [UC-35, UC-36]
depends_on: [REQ-LEGAL-006]
version: 1.0
created: 2026-10-24
last_updated: 2026-10-24
verification: [AT-LEGAL-007, AT-LEGAL-007-2, AT-LEGAL-007-3, AT-LEGAL-007-4]
---

# REQ-LEGAL-007 Widerspruch gegen Moderationsentscheidungen
## Anforderung
Als betroffenes oder meldendes Mitglied möchte ich einer Moderationsentscheidung innerhalb von sechs Monaten nach ihrer Mitteilung kostenlos im System widersprechen, damit ein anderer Moderator sie überprüft und eine unberechtigte Maßnahme rückgängig gemacht wird.

## Begründung
DSA Art. 20 verlangt ein internes, elektronisches und kostenloses Beschwerdemanagement, das mindestens sechs Monate nach Mitteilung der Entscheidung zugänglich ist und nicht ausschließlich automatisiert entscheidet. Ersetzt den Widerspruch per E-Mail aus Q-15 (Q-22).

## Akzeptanzkriterien
| Wer | Wogegen | Wie |
|---|---|---|
| Betroffene/r | Entfernen eines Inhalts, Sperre des Kontos | aus der Mitteilung im Konto; bei Sperre über einen einmaligen Link aus der E-Mail ohne Anmeldung, gültig 6 Monate ab Mitteilung |
| Meldende/r | Ablehnung der Meldung (Entscheidung „keine Maßnahme“) | aus der Mitteilung im Konto |

| Ergebnis des Widerspruchs | Wirkung |
|---|---|
| stattgegeben | Inhalt wiederhergestellt bzw. Konto entsperrt (bei Meldenden: Fall wird neu entschieden); begründete Mitteilung an beide Seiten |
| zurückgewiesen | begründete Mitteilung; Hinweis auf außergerichtliche Streitbeilegung und Rechtsweg |

```gherkin
Szenario: Widerspruch einlegen
  Angenommen Saras Anzeige wurde vor 3 Tagen entfernt
  Wenn Sara unter "Meine Mitteilungen" "Widerspruch einlegen" wählt und eine Begründung angibt
  Dann erscheint ein Fall vom Typ "Widerspruch" in der Moderations-Queue
  Und Sara sieht die Eingangsbestätigung

Szenario: Vier-Augen-Prinzip
  Angenommen Moderator Max hat die ursprüngliche Entscheidung getroffen
  Wenn Max den Widerspruch entscheiden will
  Dann wird das abgelehnt ("Ein anderer Moderator muss entscheiden")

Szenario: Stattgeben
  Wenn ein anderer Moderator dem Widerspruch mit Begründung stattgibt
  Dann ist Saras Anzeige wieder sichtbar
  Und Sara und der Meldende erhalten eine begründete Mitteilung
  Und das Audit-Log enthält Widerspruch und Entscheidung
```

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Frist von 6 Monaten nach Mitteilung abgelaufen | 409 `appeal_expired`, Hinweis auf den Rechtsweg |
| Zweiter Widerspruch derselben Person gegen dieselbe Entscheidung | 409 `appeal_exists` |
| Fremde Entscheidung (nicht betroffen, nicht meldend) | 404, keine Existenzpreisgabe |
| Link aus der E-Mail abgelaufen, schon benutzt oder manipuliert | 410 bzw. 404, kein Widerspruch |
| Missbräuchlich häufige Widersprüche | Rate-Limit je Konto (10 je Tag); offensichtlich unbegründete Widersprüche dürfen nach DSA Art. 23 nach Warnung befristet nicht mehr bearbeitet werden (Prozess, nicht automatisiert) |
| Nur ein Moderator im System | Administrator entscheidet (Administrator spezialisiert Moderator) |

## INVEST
I: braucht REQ-LEGAL-006 (Mitteilung als Einstieg) · N: Fristen und Darstellung verhandelbar · V: Rechtspflicht, Schutz vor Fehlentscheidungen · E: mittel · S: ein Sprint · T: alle Szenarien als API-Test automatisierbar.

## Nachweis
- `AT-LEGAL-007`: Smoke-Test – Widerspruch aus der Mitteilung erzeugt einen Fall „Widerspruch“; zweiter Widerspruch 409.
- `AT-LEGAL-007-2`: Smoke-Test – der ursprüngliche Entscheider kann den Widerspruch nicht entscheiden (403).
- `AT-LEGAL-007-3`: Smoke-Test – Stattgeben stellt die Anzeige wieder her bzw. entsperrt das Konto; beide Seiten erhalten eine Mitteilung; Audit-Log-Einträge vorhanden.
- `AT-LEGAL-007-4`: Smoke-Test – gesperrtes Konto widerspricht über den Link aus der E-Mail ohne Anmeldung; zweite Nutzung des Links schlägt fehl.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-24 | Erstfassung aus dem Abgleich Recht, Auftritt und Betrieb ([06-abgleich-recht-betrieb.md](../06-abgleich-recht-betrieb.md)); als Übung mit Platzhaltern freigegeben (Q-23) |
