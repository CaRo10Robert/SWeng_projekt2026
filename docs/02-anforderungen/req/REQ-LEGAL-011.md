---
id: REQ-LEGAL-011
title: Verzeichnis der Verarbeitungstätigkeiten und TOMs
type: privacy
class: constraint
status: verified
owner: team-produkt
risk: medium
release: R1
moscow: M
moscow_reason: [2]
kano: n/a
epic: EPIC-13
source: DSGVO Art. 5 Abs. 2, Art. 30, Art. 32, Q-23
version: 1.3
created: 2026-10-24
last_updated: 2026-10-25
verification: [CTRL-DOC-VVT, CTRL-DOC-TOM]
---

# REQ-LEGAL-011 Verzeichnis der Verarbeitungstätigkeiten und TOMs
## Anforderung
Für jede Verarbeitung personenbezogener Daten im System muss ein Eintrag im Verzeichnis der Verarbeitungstätigkeiten (VVT) vorliegen, und die technischen und organisatorischen Maßnahmen (TOMs) müssen mit Verweis auf die umsetzenden Anforderungen dokumentiert sein.

## Begründung
Rechenschaftspflicht (Art. 5 Abs. 2), Verzeichnis (Art. 30) und Sicherheit der Verarbeitung (Art. 32). Grundlage für die Datenschutzerklärung (REQ-LEGAL-002) und die DSFA-Schwellwertanalyse (REQ-PRIV-007).

## Akzeptanzkriterien
- `docs/06-recht/vvt.md` enthält je Verarbeitung: Zweck, Rechtsgrundlage, Kategorien betroffener Personen und Daten, Empfänger, Drittlandübermittlung, Löschfristen (aus REQ-PRIV-003), Verweis auf die TOMs. Mindestens: Konto und Anmeldung, Anzeigen und Bilder, Chat, Kontaktfreigabe, Meldungen und Moderation, Widersprüche, E-Mail-Benachrichtigungen, Rate-Limits und Sicherheit, Protokolle und Metriken, Datensicherung, DAC7-Auswertung.
- `docs/06-recht/toms.md` gliedert die Maßnahmen nach Art. 32 (Vertraulichkeit, Integrität, Verfügbarkeit, Belastbarkeit, Wiederherstellbarkeit, regelmäßige Überprüfung) und verweist je Maßnahme auf Anforderung und Nachweis.
- Betreiberangaben sind fiktive Übungswerte (Q-28).
- Definition of Done: Eine neue Verarbeitung ergänzt VVT, TOMs und Datenschutzerklärung im selben Pull Request.

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Verarbeitung im Code ohne VVT-Eintrag | Review-Befund, Pull Request wird nicht gemergt |
| TOM verweist auf eine nicht umgesetzte Anforderung | als „geplant“ mit Backlog-Eintrag gekennzeichnet |

## Nachweis
- `CTRL-DOC-VVT`: Kontrolle `docs/06-recht/vvt.md` – alle genannten Verarbeitungen mit allen Pflichtfeldern, Abgleich mit der Datenschutzerklärung.
- `CTRL-DOC-TOM`: Kontrolle `docs/06-recht/toms.md` – Gliederung nach Art. 32, jede Maßnahme mit Anforderung und Nachweis.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-24 | Erstfassung aus dem Abgleich Recht, Auftritt und Betrieb ([06-abgleich-recht-betrieb.md](../06-abgleich-recht-betrieb.md)); als Übung mit Platzhaltern freigegeben (Q-23) |
| 1.1 | 2026-10-25 | Review v1.3 (RV-R-11, RV-R-01, RV-R-02, RV-R-06): Status nach Umsetzung; VVT und TOMs an Ist-Stand (Logs ohne IP, Pseudonymisierung, Löschjournal, Deals) angeglichen |
| 1.2 | 2026-10-25 | Verifiziert im finalen Lauf gegen das Docker-Beispiel (CTRL-DOC-VVT, CTRL-DOC-TOM bestanden bzw. ausgeführt); Status → verified |
| 1.3 | 2026-10-25 | Q-28: Platzhalter durch fiktive Übungswerte und offene Prüfpunkte durch Übungsannahmen ersetzt |
