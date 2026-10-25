---
id: REQ-LEGAL-012
title: Auftragsverarbeitung dokumentiert
type: privacy
class: constraint
status: implemented
owner: team-produkt
risk: low
release: R1
moscow: S
kano: n/a
epic: EPIC-13
source: DSGVO Art. 28, Q-23
depends_on: [REQ-PRIV-005]
version: 1.1
created: 2026-10-24
last_updated: 2026-10-25
verification: [CTRL-DOC-AVV]
---

# REQ-LEGAL-012 Auftragsverarbeitung dokumentiert
## Anforderung
Für jeden Dienstleister, der im Echtbetrieb personenbezogene Daten im Auftrag verarbeitet, muss ein Eintrag mit Vertragsstatus, Ort der Verarbeitung und Prüfpunkten nach Art. 28 Abs. 3 DSGVO dokumentiert sein.

## Begründung
Ohne Vertrag zur Auftragsverarbeitung (AVV) ist die Weitergabe an Hosting-, E-Mail- oder Backup-Dienstleister unzulässig. Im Docker-Beispiel gibt es keinen Auftragsverarbeiter; die Übersicht bereitet den Echtbetrieb vor.

## Akzeptanzkriterien
- `docs/06-recht/auftragsverarbeitung.md` listet die vorgesehenen Kategorien (Hosting bzw. Rechenzentrum, SMTP-Relay, Speicher für Datensicherungen) mit `[Platzhalter: Dienstleister]`, Ort (EU, REQ-PRIV-005), Vertragsstatus und der Checkliste nach Art. 28 Abs. 3 lit. a–h.
- Im Docker-Beispiel ist festgehalten: kein Auftragsverarbeiter, alle Dienste lokal (ADR-0010).

## Fehler- und Missbrauchsfälle
N/A – Dokumentationspflicht; Risiko niedrig.

## Nachweis
- `CTRL-DOC-AVV`: Kontrolle `docs/06-recht/auftragsverarbeitung.md` – Kategorien, Ort, Vertragsstatus und Checkliste vorhanden.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-24 | Erstfassung aus dem Abgleich Recht, Auftritt und Betrieb ([06-abgleich-recht-betrieb.md](../06-abgleich-recht-betrieb.md)); als Übung mit Platzhaltern freigegeben (Q-23) |
| 1.1 | 2026-10-25 | Review v1.3 (RV-R-11): Status nach Umsetzung (Dokument vorhanden) |
