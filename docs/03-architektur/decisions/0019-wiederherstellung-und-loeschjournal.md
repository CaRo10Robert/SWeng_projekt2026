# ADR-0019: Wiederherstellung über temporäre Datenbank mit Rückfall, Löschjournal außerhalb der Datenbank

- **Status:** Accepted (2026-10-26; ersetzt ADR-0018 Nr. 2 und Nr. 5; bestätigt durch Review v1.3 und Guideline-Review)
- **Datum:** 2026-10-26 (Entscheidung umgesetzt mit Commit 6e6fe40 am 2026-10-25)
- **Bezug:** ADR-0018, REQ-AVAIL-003, REQ-PRIV-003, Review v1.3 (RV-A-01, RV-A-02, RV-R-13), Guideline Kap. 02 („akzeptierte ADRs werden nicht still geändert, sondern ersetzt“)

## Kontext
ADR-0018 legte am 2026-10-24 die Wiederherstellung so fest: App stoppen, `DROP DATABASE … WITH (FORCE)`, `CREATE DATABASE`, `pg_restore`, Uploads ins bestehende Volume entpacken. Löschungen seit dem Sicherungszeitpunkt sollte der Fristen-Löschlauf nachholen.

Das Review v1.3 zeigte zwei Fehler dieser Entscheidung:
1. **Kein Rückfall (RV-A-02):** Scheitert `pg_restore` oder das Entpacken nach dem `DROP`, sind alter und neuer Stand verloren.
2. **Gelöschte Daten kommen zurück (RV-A-01, RV-R-13):** Sofortige Löschungen wie Anzeige gelöscht, Konto endgültig gelöscht oder moderativ entfernt haben keine Frist. Mit einer älteren Sicherung kehren sie zurück, das widerspricht Art. 17 DSGVO.

Die korrigierte Umsetzung stand zunächst als Nachtrag in ADR-0018. Weil sich damit die Entscheidung selbst ändert, steht sie jetzt hier.

## Optionen

**Wiederherstellung**

| Option | Pro | Contra |
|---|---|---|
| A: in place (`DROP`/`CREATE`, ADR-0018 alt) | einfach | kein Rückfall bei Fehlern |
| **B: in eine temporäre Datenbank einspielen, danach per `ALTER DATABASE … RENAME` tauschen; Uploads in `.restore-new` entpacken und tauschen** | alter Stand bleibt bis zum Tausch unverändert; Fehler vor dem Tausch ohne Folgen | doppelter Platzbedarf während des Einspielens |
| C: Point-in-Time-Recovery | kleinster Datenverlust | eigener Dienst und Objektspeicher; Echtbetrieb (REQ-AVAIL-002) |

**Löschungen nach dem Sicherungszeitpunkt**

| Option | Pro | Contra |
|---|---|---|
| A: nur Fristen-Löschlauf (ADR-0018 alt) | kein Zusatzaufwand | sofortige Löschungen kommen zurück |
| B: Löschprotokoll in der Datenbank | transaktional | wird mit der Sicherung selbst zurückgesetzt, also wirkungslos |
| **C: Löschjournal außerhalb der Datenbank (eigenes Volume), nach der Wiederherstellung erneut angewendet** | überlebt die Wiederherstellung; nur Kennungen, keine Inhalte | Grenze bei Verlust aller Volumes; zusätzliche Datei mit Aufbewahrungsfrist |

## Entscheidung
**Wiederherstellung B, Löschungen C.**

1. **Wiederherstellung:** `node scripts/restore.mjs <ordner> [--yes] [--project <compose-projekt>] [--other-project]`:
   1. Manifest mit beiden Pflichtdateien, Prüfsummen und Projekt prüfen. Ein anderes Projekt geht nur mit `--other-project`.
   2. Eine Sicherung, die neuer ist als der Migrationsstand des Repos, wird abgelehnt.
   3. App stoppen.
   4. Sicherung in eine temporäre Datenbank und die Uploads nach `.restore-new` einspielen.
   5. Erst danach Datenbank und Bilder tauschen. Scheitert vorher ein Schritt, bleibt der alte Stand, und die App startet wieder.
2. **Löschjournal:**
   - **Inhalt:** Datei `deletions.ndjson` im Volume `journal` (`JOURNAL_DIR`) mit Art, Kennung und Zeitpunkt, ohne Inhalte.
   - **Schreiben:** nach dem Commit, für Löschungen auf Anforderung (Konto, Anzeige, Bild, Moderation); 35 Tage aufbewahrt, bei jeder Sicherung zusätzlich nach `backups/` kopiert.
   - **Nach der Wiederherstellung:** `replay-deletions --since <Sicherungszeitpunkt>`. Der Befehl ist idempotent.
3. **Fristlöschungen** (REQ-PRIV-003) stehen nicht im Journal, weil der nächste tägliche Löschlauf sie erneut ausführt.
4. **Nachweis:** Der Restore-Test in CI (AT-AVAIL-003) prüft auch, dass eine nach der Sicherung gelöschte Anzeige gelöscht bleibt; die Restore-Übung ist als MAN-AVAIL-002 protokolliert.

## Konsequenzen
- (+) Eine fehlgeschlagene Wiederherstellung verschlechtert den Zustand nicht.
- (+) Löschansprüche bleiben auch nach einer Wiederherstellung erfüllt.
- (−) Während des Einspielens braucht die Datenbank doppelten Platz.
- (−) Gehen alle Volumes verloren, fehlen die Journal-Einträge seit der letzten Sicherung. Sperren und Entsperren stehen nicht im Journal und folgen dem Stand der Sicherung.
- ADR-0018 bleibt für Sicherung, Rotation, Restore-Test und Beispielwerte gültig.
