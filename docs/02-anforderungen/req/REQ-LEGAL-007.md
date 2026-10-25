---
id: REQ-LEGAL-007
title: Widerspruch gegen Moderationsentscheidungen
type: user-story
class: functional
status: verified
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
version: 1.2
created: 2026-10-24
last_updated: 2026-10-25
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
| stattgegeben | Inhalt mit seinem vorherigen Status wiederhergestellt bzw. Konto entsperrt, sofern keine andere Sperre besteht (bei Meldenden: Fall wird neu entschieden); begründete Mitteilung an beide Seiten |
| zurückgewiesen | begründete Mitteilung an beide Seiten (Widersprechende und Gegenseite); Hinweis auf außergerichtliche Streitbeilegung und Rechtsweg |

Vier-Augen-Prinzip: Über einen Widerspruch entscheidet eine Person aus der Moderation, die weder die ursprüngliche Entscheidung getroffen hat noch selbst Widersprechende, Betroffene oder Meldende des Falls ist. Wer einen Fall gemeldet hat, entscheidet ihn auch nicht als Moderator (422).

Begründung des Widerspruchs: 20 bis 2.000 Zeichen, gezählt ohne Leerzeichen am Rand. Prüfende sehen bei entfernten Nachrichten den Originaltext; jeder Zugriff wird im Audit-Log protokolliert.

Bearbeitungsziel (DSA Art. 20 Abs. 4 „zeitnah“): Entscheidung binnen `[Platzhalter: z. B. 14 Tage]` nach Eingang; Messung über die Zeit zwischen Eingang und Entscheidung im Audit-Log.

```gherkin
Szenario: Widerspruch einlegen
  Angenommen Saras Anzeige wurde vor 3 Tagen entfernt
  Wenn Sara unter "Meine Mitteilungen" "Widerspruch einlegen" wählt und eine Begründung angibt
  Dann erscheint ein Fall vom Typ "Widerspruch" in der Moderations-Queue
  Und Sara sieht die Eingangsbestätigung

Szenario: Vier-Augen-Prinzip
  Angenommen Moderator Max hat die ursprüngliche Entscheidung getroffen
  Wenn Max den Widerspruch entscheiden will
  Dann wird das abgelehnt (403 `four_eyes`, "Eine andere, unbeteiligte Person aus der Moderation muss entscheiden")
  Und dasselbe gilt, wenn Max den Widerspruch selbst eingelegt hat oder Betroffener bzw. Meldender des Falls ist

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
| Nur ein Moderator im System | Administrator entscheidet (Administrator spezialisiert Moderator), sofern er selbst unbeteiligt ist |
| Inhalt nach Ablauf der Aufbewahrung nicht mehr vorhanden | 409 `restore_impossible`, keine falsche Erfolgsmeldung; Originaltexte werden bei offenem Widerspruch nicht gelöscht |
| Begründung nur aus Leerzeichen | 422 |

## INVEST
I: braucht REQ-LEGAL-006 (Mitteilung als Einstieg) · N: Fristen und Darstellung verhandelbar · V: Rechtspflicht, Schutz vor Fehlentscheidungen · E: mittel · S: ein Sprint · T: alle Szenarien als API-Test automatisierbar.

## Nachweis
- `AT-LEGAL-007`: Smoke-Test – Widerspruch aus der Mitteilung erzeugt einen Fall „Widerspruch“; zweiter Widerspruch 409.
- `AT-LEGAL-007-2`: Smoke-Test und Unit-Test – weder der ursprüngliche Entscheider noch Widersprechende, Betroffene oder Meldende können den Widerspruch entscheiden (403 `four_eyes`); Meldende entscheiden ihren Fall nicht (422).
- `AT-LEGAL-007-3`: Smoke-Test – Stattgeben stellt die Anzeige wieder her bzw. entsperrt das Konto (Anmeldung danach wieder möglich); beide Seiten erhalten eine Mitteilung; Audit-Log-Einträge vorhanden.
- `AT-LEGAL-007-4`: Smoke-Test – gesperrtes Konto widerspricht über den Link aus der E-Mail ohne Anmeldung; das Token steht nur im Fragment (`#token=`) und wird per POST übermittelt; unbekanntes Token 404, zweite Nutzung 410. Ein abgelaufenes Token (410 `token_expired`) ist nur per Unit-Test der Frist geprüft.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-24 | Erstfassung aus dem Abgleich Recht, Auftritt und Betrieb ([06-abgleich-recht-betrieb.md](../06-abgleich-recht-betrieb.md)); als Übung mit Platzhaltern freigegeben (Q-23) |
| 1.1 | 2026-10-25 | Review v1.3 (RV-C-01, RV-C-03, RV-C-04, RV-C-09, RV-C-11, RV-R-09, RV-R-19): Vier-Augen vollständig, Ergebnis an beide Seiten, Begründung 20 Zeichen nach Trimmen, restore_impossible, Bearbeitungsziel mit Platzhalter, Token im Fragment; Status nach Umsetzung |
| 1.2 | 2026-10-25 | Verifiziert im finalen Lauf gegen das Docker-Beispiel (AT-LEGAL-007, AT-LEGAL-007-2, AT-LEGAL-007-3, AT-LEGAL-007-4 bestanden bzw. ausgeführt); Status → verified |
