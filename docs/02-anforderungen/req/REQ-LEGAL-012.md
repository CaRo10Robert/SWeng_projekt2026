---
id: REQ-LEGAL-012
title: Auftragsverarbeitung dokumentiert
type: privacy
class: constraint
status: verified
owner: team-produkt
risk: low
release: R1
moscow: M
moscow_reason: [2]
kano: n/a
epic: EPIC-13
source: DSGVO Art. 28, Q-23
depends_on: [REQ-PRIV-005]
version: 1.5
created: 2026-10-24
last_updated: 2026-10-26
verification: [CTRL-DOC-AVV]
---

# REQ-LEGAL-012 Auftragsverarbeitung dokumentiert
## Anforderung
Für jeden Dienstleister, der im Echtbetrieb personenbezogene Daten im Auftrag verarbeitet, muss ein Eintrag mit Vertragsstatus, Ort der Verarbeitung und Prüfpunkten nach Art. 28 Abs. 3 DSGVO dokumentiert sein.

## Begründung
Ohne Vertrag zur Auftragsverarbeitung (AVV) ist die Weitergabe an Hosting-, E-Mail- oder Backup-Dienstleister unzulässig. Im Docker-Beispiel gibt es keinen Auftragsverarbeiter; die Übersicht bereitet den Echtbetrieb vor.

## Akzeptanzkriterien
- `docs/06-recht/auftragsverarbeitung.md` listet die vorgesehenen Kategorien (Hosting bzw. Rechenzentrum, SMTP-Relay, Speicher für Datensicherungen) mit fiktiven Dienstleistern (z. B. MusterMail GmbH), Ort (EU, REQ-PRIV-005), Vertragsstatus und der Checkliste nach Art. 28 Abs. 3 lit. a–h.
- Im Docker-Beispiel ist festgehalten: kein Auftragsverarbeiter, alle Dienste lokal (ADR-0010).

## Fehler- und Missbrauchsfälle
N/A – Dokumentationspflicht; Risiko niedrig.

## Nachweis
- `CTRL-DOC-AVV`: Kontrolle `docs/06-recht/auftragsverarbeitung.md` – Kategorien, Ort, Vertragsstatus und Checkliste vorhanden – Protokoll [CTRL-DOC-AVV](../../05-umsetzung/nachweise/CTRL-DOC-AVV.md).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-24 | Erstfassung aus dem Abgleich Recht, Auftritt und Betrieb ([06-abgleich-recht-betrieb.md](../06-abgleich-recht-betrieb.md)); als Übung mit Platzhaltern freigegeben (Q-23) |
| 1.1 | 2026-10-25 | Review v1.3 (RV-R-11): Status nach Umsetzung (Dokument vorhanden) |
| 1.2 | 2026-10-25 | Verifiziert im finalen Lauf gegen das Docker-Beispiel (CTRL-DOC-AVV bestanden bzw. ausgeführt); Status → verified |
| 1.3 | 2026-10-25 | Q-28: Platzhalter durch fiktive Übungswerte und offene Prüfpunkte durch Übungsannahmen ersetzt |
| 1.4 | 2026-10-26 | Guideline-Review: GL-15 Must wegen Rechtspflicht (DSGVO Art. 28), moscow_reason [2] |
| 1.5 | 2026-10-26 | Guideline-Review: GL-07 Kontrollprotokoll verlinkt |
