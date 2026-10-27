---
id: CTRL-DOC-BACKUP
type: evidence
requirement: REQ-AVAIL-003
status: done
owner: architecture-lead
date: 2026-10-26
---

# CTRL-DOC-BACKUP: Kontrolle docs/07-betrieb/backup-restore.md

> Übungsaufgabe: Prüfer und Freigabe sind fiktive Rollen (Q-28).

## Ziel

Kontrolle laut Nachweiskatalog für REQ-AVAIL-003: Das Dokument ist vorhanden, vollständig, mit fiktiven Übungswerten statt Platzhaltern und stimmt mit Code und anderen Dokumenten überein.

## Gegenstand

`docs/07-betrieb/backup-restore.md` im Stand von Branch `feature/fallstudie-req-c4` am 2026-10-26.

## Prüfpunkte

| Prüfpunkt | Ergebnis | Fundstelle bzw. Beleg |
|---|---|---|
| Ablauf von Sicherung und Wiederherstellung mit Befehlen | erfüllt | Abschnitte „Was wird gesichert?“, „Befehle“; Restore über temporäre DB mit Rückfall |
| Aufbewahrung mit Frist | erfüllt | „Aufbewahrung“: 7 täglich + 4 wöchentlich, höchstens 28 Tage, gleich mit VVT V-10 und Datenschutzerklärung |
| Verschlüsselung | erfüllt | „Echtbetrieb“: Verschlüsselung der Sicherungen vorgeschrieben; im Beispiel unverschlüsselt, als Befund T-1 im Datenpannen-Prozess geführt |
| Zuständigkeiten | erfüllt nach Korrektur | Abschnitt „Zuständigkeiten“ bei dieser Kontrolle ergänzt (fehlte) |
| Löschungen nach dem Sicherungszeitpunkt | erfüllt | „Löschjournal“ mit `replay-deletions` |
| Restore-Übungen dokumentiert | erfüllt | Tabelle „Restore-Übung“ mit MAN-AVAIL-002 |

## Ergebnis

Bestanden. 1 Punkt(e) wurden bei der Kontrolle korrigiert und danach erneut geprüft.

## Freigabe

| Rolle | Name | Datum | Ergebnis |
|---|---|---|---|
| Prüfer | architecture-lead (fiktive Rolle) | 2026-10-26 | bestanden; Dokument auf `approved` gesetzt |
