---
id: REQ-AVAIL-003
title: Datensicherung und getestete Wiederherstellung im Docker-Beispiel
type: operational
class: quality
status: verified
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
version: 1.6
created: 2026-10-24
last_updated: 2026-10-26
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
| Metrik | (1) Vollständigkeit: Anzahl Konten, Anzeigen, Nachrichten, Bilddateien vor und nach der Wiederherstellung; (2) Dauer der Wiederherstellung (RTO); (3) Häufigkeit des Wiederherstellungstests; (4) maximaler Datenverlust (RPO) |
| Akzeptanzkriterium | (1) **identisch**, Anwendung danach „bereit“ und Anmeldung mit vorhandenem Konto möglich; (2) **≤ 15 min** im Docker-Beispiel (QS-15; lokal gemessen etwa 24 s vom Löschen bis „bereit“); (3) **bei jedem CI-Lauf** auf `main`; (4) **RPO ≤ 24 h**: tägliche Sicherung, Alarm `BackupMissing` nach 26 h ohne erfolgreiche Sicherung |
| Messverfahren | CI-Job: Beispiel starten, Testdaten anlegen, sichern, `down -v`, wiederherstellen, Zählungen und Anmeldung prüfen |
| Messkontext | Docker-Beispiel, `scripts/backup.mjs` und `scripts/restore.mjs` |
| Verhalten bei Verfehlung | Release-Blocker |
| Fehlerbudget | kein Datenverlust über das RPO hinaus; fehlgeschlagene Wiederherstellung lässt den alten Stand unverändert |
| Last- und Datenprofil | Seed plus Testdaten des CI-Laufs (Konto, Anzeige mit Bild, Nachricht) |
| Timeout, Retry, Idempotenz | Warten auf „bereit“ mit Zeitlimit; Wiederherstellung und Löschjournal sind wiederholbar |
| Wiederherstellung | RTO ≤ 15 min, RPO ≤ 24 h (Docker-Beispiel); Auslöser: Datenverlust, Entscheidung durch den Betrieb nach `backup-restore.md` |
| Verantwortung und Eskalation | Service-Owner team-plattform; Eskalation über den Incident-Prozess (`docs/07-betrieb/incident-prozess.md`), Rufbereitschaft im Echtbetrieb (fiktiv) |

## Akzeptanzkriterien
- Sicherung enthält: Datenbank-Dump (konsistent, im laufenden Betrieb) und Archiv der Uploads, mit Zeitstempel und Prüfsumme.
- Wiederherstellung überschreibt vorhandene Daten nur nach ausdrücklicher Bestätigung (Rückfrage oder Option `--yes`); ohne Bestätigung bricht sie ab.
- Wiederherstellung prüft vorher die Prüfsummen und verweigert eine Sicherung, deren Migrationsstand neuer ist als der Code (`apps/server/migrations`).
- Aufbewahrung im Beispiel: alle Sicherungen der letzten 7 Tage, danach je Woche die neueste, höchstens 28 Tage – auch die neueste Sicherung wird nach 28 Tagen gelöscht, mit Warnung (Löschkonzept REQ-PRIV-003); der Alarm `BackupMissing` meldet fehlende Sicherungen.
- Sicherungen entstehen zuerst als `<Zeitstempel>.partial` und werden erst nach Abschluss mit `manifest.json` umbenannt; Rotation und Wiederherstellung berücksichtigen nur vollständige Sicherungen.
- Die Wiederherstellung spielt die Datenbank zuerst in eine temporäre Datenbank und die Bilder in ein temporäres Verzeichnis ein und tauscht erst danach; scheitert ein Schritt, bleibt der alte Stand erhalten. Das Projekt im Manifest muss zum Zielprojekt passen.
- Löschungen nach dem Sicherungszeitpunkt gehen nicht verloren: Ein Löschjournal außerhalb der Datenbank (Volume `journal`, Kopie neben den Sicherungen) wird nach der Wiederherstellung erneut abgespielt (`replay-deletions`, Art. 17 DSGVO).
- Aufbewahrung und Verschlüsselung der Sicherungen im Echtbetrieb sind in `docs/07-betrieb/backup-restore.md` beschrieben (Platzhalter für Speicherort).

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Datenträger voll während der Sicherung | Sicherung bleibt als `<Zeitstempel>.partial` liegen, zählt nicht als gültig, Rotation löscht nichts; Skript endet mit Fehler |
| Prüfsumme stimmt nicht, Datei fehlt im Manifest | Wiederherstellung bricht vor jeder Änderung ab |
| Sicherung eines anderen Compose-Projekts | Abbruch, außer mit ausdrücklicher Option `--other-project` |
| Sicherung neuer als der Migrationsstand des Codes | Abbruch mit Hinweis, zuerst den passenden Code einzuspielen |
| Wiederherstellung scheitert nach dem Einspielen | temporäre Datenbank und `.restore-new` werden verworfen, alter Stand bleibt, App startet wieder |
| Löschungen nach dem Sicherungszeitpunkt | Löschjournal (`replay-deletions`) wendet sie nach der Wiederherstellung erneut an; Fristlöschungen holt der nächste Löschlauf nach |
| Versehentlicher Aufruf | Bestätigung per Rückfrage bzw. `--yes`; ohne Bestätigung keine Änderung |
| Zwei Sicherungen gleichzeitig | nicht technisch abgesichert; jede schreibt in ein eigenes `.partial`-Verzeichnis; Betrieb startet die Sicherung zeitgesteuert genau einmal (offener Punkt: Sperrdatei) |

## Nachweis
- `AT-AVAIL-003`: Restore-Test `tests/ops/restore-test.mjs` in CI (Job `compose`) – Teil 1: Sicherung, Löschen des Stacks, Wiederherstellung; Zählungen identisch, Anmeldung möglich, Anzeige mit Bild wieder da, Dauer ≤ 15 min. Teil 2: eine nach der Sicherung gelöschte Anzeige bleibt nach der Wiederherstellung gelöscht (Löschjournal). Dazu Unit-Test des Löschjournals (`deletion-journal.test.ts`).
- `CTRL-DOC-BACKUP`: Kontrolle `docs/07-betrieb/backup-restore.md` – Ablauf, Aufbewahrung, Verschlüsselung, Zuständigkeiten – Protokoll [CTRL-DOC-BACKUP](../../05-umsetzung/nachweise/CTRL-DOC-BACKUP.md).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-24 | Erstfassung aus dem Abgleich Recht, Auftritt und Betrieb ([06-abgleich-recht-betrieb.md](../06-abgleich-recht-betrieb.md)); als Übung mit Platzhaltern freigegeben (Q-23) |
| 1.1 | 2026-10-24 | Angleichung an die Umsetzung (B-56): Dauer ≤ 15 min wie QS-15 und ADR-0018 statt 10 min, Bestätigung per Rückfrage oder `--yes`, Prüfsummen- und Migrationsprüfung, Aufbewahrung höchstens 28 Tage, Testskript benannt |
| 1.2 | 2026-10-25 | Review v1.3 (RV-A-01, RV-A-02, RV-A-13, RV-A-14, RV-R-13): Löschjournal, Restore über temporäre DB mit Rückfall, .partial-Sicherungen, strenge 28 Tage; Nachweis um Teil 2 erweitert; Status nach Umsetzung |
| 1.3 | 2026-10-25 | Verifiziert im finalen Lauf gegen das Docker-Beispiel (AT-AVAIL-003, CTRL-DOC-BACKUP bestanden bzw. ausgeführt); Status → verified |
| 1.4 | 2026-10-26 | Guideline-Review: GL-05 Fehler- und Missbrauchsfälle ergänzt |
| 1.5 | 2026-10-26 | Guideline-Review: GL-04 RTO ≤ 15 min und RPO ≤ 24 h ausdrücklich; GL-10 Felder aus der NFR-/SLO-Vorlage ergänzt (Fehlerbudget, Lastprofil, Timeout/Retry, Wiederherstellung, Eskalation) |
| 1.6 | 2026-10-26 | Guideline-Review: GL-07 Kontrollprotokoll verlinkt |
