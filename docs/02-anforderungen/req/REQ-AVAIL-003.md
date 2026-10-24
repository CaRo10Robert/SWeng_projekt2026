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
version: 1.1
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
| Akzeptanzkriterium | (1) **identisch**, Anwendung danach „bereit“ und Anmeldung mit vorhandenem Konto möglich; (2) **≤ 15 min** im Docker-Beispiel (QS-15; lokal gemessen etwa 24 s vom Löschen bis „bereit“); (3) **bei jedem CI-Lauf** auf `main` |
| Messverfahren | CI-Job: Beispiel starten, Testdaten anlegen, sichern, `down -v`, wiederherstellen, Zählungen und Anmeldung prüfen |
| Messkontext | Docker-Beispiel, `scripts/backup.mjs` und `scripts/restore.mjs` |
| Verhalten bei Verfehlung | Release-Blocker |

## Akzeptanzkriterien
- Sicherung enthält: Datenbank-Dump (konsistent, im laufenden Betrieb) und Archiv der Uploads, mit Zeitstempel und Prüfsumme.
- Wiederherstellung überschreibt vorhandene Daten nur nach ausdrücklicher Bestätigung (Rückfrage oder Option `--yes`); ohne Bestätigung bricht sie ab.
- Wiederherstellung prüft vorher die Prüfsummen und verweigert eine Sicherung, deren Migrationsstand neuer ist als der Code (`apps/server/migrations`).
- Aufbewahrung im Beispiel: alle Sicherungen der letzten 7 Tage, danach je Woche die neueste, höchstens 28 Tage (Löschkonzept REQ-PRIV-003).
- Aufbewahrung und Verschlüsselung der Sicherungen im Echtbetrieb sind in `docs/07-betrieb/backup-restore.md` beschrieben (Platzhalter für Speicherort).

## Nachweis
- `AT-AVAIL-003`: Restore-Test `tests/ops/restore-test.mjs` in CI (Job `compose`) – Sicherung, Löschen des Stacks, Wiederherstellung; Zählungen identisch, Anmeldung möglich, Anzeige mit Bild wieder da, Dauer ≤ 15 min.
- `CTRL-DOC-BACKUP`: Kontrolle `docs/07-betrieb/backup-restore.md` – Ablauf, Aufbewahrung, Verschlüsselung, Zuständigkeiten.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-24 | Erstfassung aus dem Abgleich Recht, Auftritt und Betrieb ([06-abgleich-recht-betrieb.md](../06-abgleich-recht-betrieb.md)); als Übung mit Platzhaltern freigegeben (Q-23) |
| 1.1 | 2026-10-24 | Angleichung an die Umsetzung (B-56): Dauer ≤ 15 min wie QS-15 und ADR-0018 statt 10 min, Bestätigung per Rückfrage oder `--yes`, Prüfsummen- und Migrationsprüfung, Aufbewahrung höchstens 28 Tage, Testskript benannt |
