---
id: REQ-AVAIL-003
title: Datensicherung und getestete Wiederherstellung im Docker-Beispiel
type: operational
class: quality
status: approved
owner: team-plattform
risk: high
reviewers: [product-owner, qa-lead]
release: R1
moscow: M
moscow_reason: [3]
kano: n/a
epic: EPIC-13
source: DSGVO Art. 32 Abs. 1 lit. c, Guideline Kap. 11, Q-23
use_cases: [UC-45]
version: 1.0
created: 2026-10-24
last_updated: 2026-10-24
verification: [AT-AVAIL-003, CTRL-DOC-BACKUP]
---

# REQ-AVAIL-003 Datensicherung und getestete Wiederherstellung im Docker-Beispiel
## Anforderung
Der Betrieb muss Datenbank und hochgeladene Bilder mit einem Befehl sichern und in ein leeres System wiederherstellen können; die Wiederherstellung muss regelmäßig automatisiert getestet werden.

## Begründung
REQ-AVAIL-002 legt die Ziele für den Echtbetrieb fest (Won't in R1). Ein ungetestetes Backup ist kein Backup; die Fähigkeit zur Wiederherstellung ist Teil der TOMs (Art. 32 Abs. 1 lit. c).

## Qualitätsmerkmal, Metrik, Messverfahren
| Feld | Festlegung |
|---|---|
| Qualitätsmerkmal (ISO 25010) | Reliability → Recoverability |
| Metrik | (1) Vollständigkeit: Anzahl Konten, Anzeigen, Nachrichten, Bilddateien vor und nach der Wiederherstellung; (2) Dauer der Wiederherstellung; (3) Häufigkeit des Wiederherstellungstests |
| Akzeptanzkriterium | (1) **identisch**, Anwendung danach „bereit“ und Anmeldung mit vorhandenem Konto möglich; (2) **≤ 10 min** im Docker-Beispiel; (3) **bei jedem CI-Lauf** auf `main` |
| Messverfahren | CI-Job: Beispiel starten, Testdaten anlegen, sichern, `down -v`, wiederherstellen, Zählungen und Anmeldung prüfen |
| Messkontext | Docker-Beispiel, `scripts/backup.mjs` und `scripts/restore.mjs` |
| Verhalten bei Verfehlung | Release-Blocker |

## Akzeptanzkriterien
- Sicherung enthält: Datenbank-Dump (konsistent, im laufenden Betrieb) und Archiv der Uploads, mit Zeitstempel und Prüfsumme.
- Wiederherstellung verweigert ein Ziel mit vorhandenen Daten, außer mit ausdrücklicher Option.
- Aufbewahrung und Verschlüsselung der Sicherungen im Echtbetrieb sind in `docs/07-betrieb/backup-restore.md` beschrieben (Platzhalter für Speicherort).

## Nachweis
- `AT-AVAIL-003`: Restore-Test in CI – Sicherung, Löschen des Stacks, Wiederherstellung; Zählungen identisch, Anmeldung möglich.
- `CTRL-DOC-BACKUP`: Kontrolle `docs/07-betrieb/backup-restore.md` – Ablauf, Aufbewahrung, Verschlüsselung, Zuständigkeiten.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-24 | Erstfassung aus dem Abgleich Recht, Auftritt und Betrieb ([06-abgleich-recht-betrieb.md](../06-abgleich-recht-betrieb.md)); als Übung mit Platzhaltern freigegeben (Q-23) |
