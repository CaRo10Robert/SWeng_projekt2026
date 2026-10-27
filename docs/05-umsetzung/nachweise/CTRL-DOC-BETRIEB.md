---
id: CTRL-DOC-BETRIEB
type: evidence
requirement: REQ-OPS-011, REQ-SEC-012
status: done
owner: architecture-lead
date: 2026-10-26
---

# CTRL-DOC-BETRIEB: Kontrolle docs/07-betrieb/betriebshandbuch.md, incident-prozess.md

> Übungsaufgabe: Prüfer und Freigabe sind fiktive Rollen (Q-28).

## Ziel

Kontrolle laut Nachweiskatalog für REQ-OPS-011, REQ-SEC-012: Das Dokument ist vorhanden, vollständig, mit fiktiven Übungswerten statt Platzhaltern und stimmt mit Code und anderen Dokumenten überein.

## Gegenstand

`docs/07-betrieb/betriebshandbuch.md, incident-prozess.md` im Stand von Branch `feature/fallstudie-req-c4` am 2026-10-26.

## Prüfpunkte

| Prüfpunkt | Ergebnis | Fundstelle bzw. Beleg |
|---|---|---|
| Betriebshandbuch mit Start, Konfiguration, Rollen, Aufgaben | erfüllt | Abschnitte 1–5 |
| Runbook je Alarm (Guideline Kap. 11) | erfüllt nach Korrektur | Abschnitte 6.1 und 6.3 bis 6.9 mit Diagnose, Maßnahme, Entwarnung; vorher nur 6.1 |
| Störungsprozess mit Schweregraden und Postmortem | erfüllt | SEV-1 bis SEV-4, Rollen, Kommunikation, Vorlage |
| Prozess für Sicherheitsmeldungen | erfüllt nach Korrektur | Abschnitt „Meldungen zu Sicherheitslücken“ im Incident-Prozess ergänzt (fehlte, nur Konfiguration von `security.txt` war beschrieben) |

## Ergebnis

Bestanden. 2 Punkt(e) wurden bei der Kontrolle korrigiert und danach erneut geprüft.

## Freigabe

| Rolle | Name | Datum | Ergebnis |
|---|---|---|---|
| Prüfer | architecture-lead (fiktive Rolle) | 2026-10-26 | bestanden; Dokument auf `approved` gesetzt |
