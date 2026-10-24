---
id: LEGAL-DSFA
type: privacy
status: in-review
owner: product-owner
version: 1.0
created: 2026-10-24
last_updated: 2026-10-24
---

# Schwellwertanalyse zur Datenschutz-Folgenabschätzung (Art. 35 DSGVO)

> **Muster im Rahmen einer Übungsaufgabe – keine rechtsverbindlichen Angaben; vom Datenschutzbeauftragten der Hochschule zu prüfen.** Anforderung: REQ-PRIV-007.

Ziel: prüfen, ob für CampusMarkt eine vollständige Datenschutz-Folgenabschätzung (DSFA) nötig ist. Grundlage sind Art. 35 Abs. 1 und 3 DSGVO, die Kriterien der Leitlinien der Artikel-29-Gruppe (WP 248) und die DSFA-Muss-Liste der deutschen Aufsichtsbehörden [Platzhalter: aktuelle Fassung der Liste der LfDI RLP prüfen].

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
| 3. systematische Überwachung | nein | kein Tracking; Logs ohne Personenbezug |
| 4. vertrauliche oder höchstpersönliche Daten | eher nein | Chatnachrichten sind vertraulich, aber ohne besonderen Schutzbedarf; Moderation nur bei Meldung |
| 5. Verarbeitung in großem Umfang | nein | eine Hochschule, [Platzhalter: ca. 5.000] potenzielle Nutzer |
| 6. Abgleichen oder Zusammenführen von Datensätzen | nein | einzige Verknüpfung: Domain → Nutzertyp |
| 7. Daten schutzbedürftiger Betroffener | teilweise | Studierende stehen in einem Abhängigkeitsverhältnis zur Hochschule; daher keine Verwendung der Daten für andere Hochschulzwecke |
| 8. innovative Technologien | nein | Standardtechnik |
| 9. Verarbeitung hindert an Rechtsausübung oder Vertrag | nein | Sperren nur nach menschlicher Entscheidung mit Widerspruch |

## Ergebnis

Höchstens ein Kriterium (Nr. 7) ist teilweise erfüllt. Nach WP 248 ist eine DSFA in der Regel erst ab zwei Kriterien nötig; die Verarbeitung steht nicht auf der Muss-Liste. **Eine vollständige DSFA ist nach dieser Analyse nicht erforderlich.**

Ausgleichende Maßnahmen für Kriterium 7:
- Zweckbindung: keine Weitergabe an andere Stellen der Hochschule (z. B. Prüfungsamt).
- Moderation sieht nur Gemeldetes.
- Begründung und Widerspruch bei jeder Maßnahme (REQ-LEGAL-006/007).

## Neu bewerten, wenn …

- die Bezahlfunktion (EPIC-09) kommt (Finanzdaten),
- Bewertungen von Mitgliedern eingeführt werden (Kriterium 1),
- weitere Hochschulen angebunden werden (Kriterium 5),
- SSO mit zusätzlichen Attributen (z. B. Matrikelnummer) genutzt wird.

Entscheidung: [Platzhalter: Datum, Unterschrift Verantwortlicher; Stellungnahme DSB]
