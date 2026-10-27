---
id: LEGAL-DSFA
type: privacy
status: approved
owner: product-owner
version: 1.2
created: 2026-10-24
last_updated: 2026-10-26
---

# Schwellwertanalyse zur Datenschutz-Folgenabschätzung (Art. 35 DSGVO)

> **Muster im Rahmen einer Übungsaufgabe – fiktive Angaben, nicht rechtsverbindlich (Q-28).** Anforderung: REQ-PRIV-007.

Ziel: prüfen, ob für CampusMarkt eine vollständige Datenschutz-Folgenabschätzung (DSFA) nötig ist. Grundlage sind Art. 35 Abs. 1 und 3 DSGVO, die Kriterien der Leitlinien der Artikel-29-Gruppe (WP 248) und die DSFA-Muss-Liste der deutschen Aufsichtsbehörden (Übungsannahme Q-28: Fassung 2026 der Liste der LfDI RLP).

## Prüfung nach Art. 35 Abs. 3

| Fall | Zutreffend? | Begründung |
|---|---|---|
| a) systematische, umfassende Bewertung persönlicher Aspekte mit Rechtswirkung (Profiling) | nein | kein Profiling, keine Scores, keine Empfehlungsalgorithmen |
| b) umfangreiche Verarbeitung besonderer Kategorien (Art. 9, 10) | nein | nicht erhoben; nur zufällig in Freitexten möglich |
| c) systematische umfangreiche Überwachung öffentlich zugänglicher Bereiche | nein | – |

## Kriterien nach WP 248

| Kriterium | Zutreffend? | Begründung |
|---|---|---|
| 1. Bewerten oder Einstufen | nein | keine Bewertungsfunktion im MVP (REQ-MOD-006 ist „Could“) |
| 2. automatisierte Entscheidung mit Rechtswirkung | nein | Wortfilter setzt nur „in Prüfung“; ein Mensch entscheidet |
| 3. systematische Überwachung | nein | kein Tracking; Request-Logs ohne IP-Adresse und ohne Query-Werte; Rate-Limit-Zähler nur mit HMAC-Pseudonymen (Schlüssel täglich neu); keine Auswertung von Nutzungsverhalten |
| 4. vertrauliche oder höchstpersönliche Daten | **ja** (neu bewertet, Review v1.3 RV-R-16) | Chatnachrichten sind private Kommunikation zwischen Mitgliedern; die Moderation liest bei Meldungen Ausschnitte und im Widerspruch Originaltexte entfernter Nachrichten, bei Straftatverdacht wird eine Kopie gesichert |
| 5. Verarbeitung in großem Umfang | nein | eine Hochschule, ca. 5.000 potenzielle Nutzer (Übungswert) |
| 6. Abgleichen oder Zusammenführen von Datensätzen | nein | einzige Verknüpfung: Domain → Nutzertyp |
| 7. Daten schutzbedürftiger Betroffener | teilweise | Studierende stehen in einem Abhängigkeitsverhältnis zur Hochschule; daher keine Verwendung der Daten für andere Hochschulzwecke |
| 8. innovative Technologien | nein | Standardtechnik |
| 9. Verarbeitung hindert an Rechtsausübung oder Vertrag | nein | Sperren nur nach menschlicher Entscheidung mit Widerspruch |

## Ergebnis

Zwei Kriterien sind erfüllt bzw. teilweise erfüllt (Nr. 4 und Nr. 7). Nach WP 248 ist ab zwei Kriterien **in der Regel eine DSFA erforderlich**. Ergebnis dieser Analyse: **Eine DSFA ist vor einem Echtbetrieb durchzuführen**, Die Verarbeitung steht nicht auf der Muss-Liste der LfDI RLP (Übungsannahme Q-28).

Konsequenz: Die DSFA nach Art. 35 Abs. 7 ist als Hausaufgabe mit fiktiven Werten durchgeführt: [Übungs-DSFA](dsfa.md). Sie wird nie im Echtbetrieb genutzt (Q-28).

Schon umgesetzte Abhilfemaßnahmen für die Kriterien 4 und 7:
- Zweckbindung: keine Weitergabe an andere Stellen der Hochschule (z. B. Prüfungsamt).
- Moderation sieht nur Gemeldetes (± 5 Nachrichten); Originaltexte entfernter Nachrichten nur im Widerspruch, jeder Zugriff im Audit-Log.
- Beweissicherung nur als pseudonymisierte Kopie, höchstens 6 Monate.
- Begründung und Widerspruch bei jeder Maßnahme (REQ-LEGAL-006/007).

## Neu bewerten, wenn …

- die Bezahlfunktion (EPIC-09) kommt (Finanzdaten),
- Bewertungen von Mitgliedern eingeführt werden (Kriterium 1),
- weitere Hochschulen angebunden werden (Kriterium 5),
- SSO mit zusätzlichen Attributen (z. B. Matrikelnummer) genutzt wird.

Entscheidung (fiktiv): DSFA durchführen – 2026-10-25, Prof. Dr. Erika Mustermann (fiktiv), Präsidentin; Stellungnahme der DSB Paula Prüfer (fiktiv) in der [Übungs-DSFA](dsfa.md).
