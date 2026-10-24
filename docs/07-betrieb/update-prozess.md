---
id: OPS-UPDATES
type: process
status: in-review
owner: architecture-lead
version: 1.1
created: 2026-10-24
last_updated: 2026-10-24
---

# Update-, Release- und Rollback-Prozess

> **Muster im Rahmen einer Übungsaufgabe.** Anforderungen: REQ-OPS-012 (Abhängigkeits-Updates), REQ-OPS-004 (versioniertes Image), REQ-SEC-008 (Sicherheitsprüfungen).

## Abhängigkeiten aktualisieren (Renovate)

Die Konfiguration `renovate.json` im Repo legt fest:

| Art | Rhythmus | Zusammenfassung | Automatisch mergen? |
|---|---|---|---|
| Sicherheitsupdates (Advisories) | sofort, ohne Mindestalter | einzeln, Label `sicherheit` | nein, aber Priorität „hoch“ |
| Patch- und Minor-Updates | wöchentlich, montags vor 6 Uhr (Europe/Berlin), erst ab 14 Tagen nach Veröffentlichung | gruppiert: „Entwicklungswerkzeuge“, „Frontend“, „Fastify“, „Tests“ | nein |
| Major-Updates | wöchentlich im selben Fenster | einzeln, mit Changelog | nein |
| Container-Images (`Dockerfile`, `compose.yaml`) | wöchentlich | Minor, Patch und Digest gruppiert („Container-Images“), Hauptversionen einzeln; **PostgreSQL-Hauptversion nie automatisch** (Daten-Upgrade nötig) | nein |
| GitHub Actions | wöchentlich | auf Digest gepinnt, gruppiert | nein |

Versionen werden exakt gepinnt (`rangeStrategy: pin`), nach jedem Update läuft `pnpm dedupe`; höchstens 5 offene Update-Pull-Requests gleichzeitig. Die Konfiguration wird in CI mit `renovate-config-validator --strict` geprüft (Job `ops-config`, CTRL-RENOVATE).

Jeder Update-Pull-Request durchläuft die volle CI (Typprüfung, Unit-, E2E- und Smoke-Tests). Ein Mensch prüft und mergt.

**Zeitziele (Beispiel):** kritische Sicherheitslücken in erreichbarem Code binnen 48 h, hohe binnen 7 Tagen, sonst mit dem nächsten wöchentlichen Update.

## Versionierung und Release

- **SemVer** für die Anwendung (`MAJOR.MINOR.PATCH`); der Image-Tag entspricht der Version, zusätzlich der Commit-Hash.
- Ein Release entsteht aus `main` mit Tag `vX.Y.Z`; CI baut das Image aus sauberem Checkout, taggt es mit der Version aus `package.json` (`campusmarkt:<version>`) und legt es als `docker save`-Archiv `campusmarkt-<version>.tar.gz` für 7 Tage als Artefakt ab (Job `compose`, CTRL-CI-IMAGE). Eine Container-Registry ist optional (Q-19).
- Änderungen an Nutzungsbedingungen oder Datenschutzerklärung → `TERMS_VERSION` anheben ([Pflegeprozess](../06-recht/README.md#pflegeprozess-für-rechtstexte)).
- Datenbankmigrationen sind **additiv** und laufen beim Start automatisch (REQ-OPS-005); zerstörende Änderungen erst ein Release später (Expand-and-Contract).

## Ausrollen

1. Ankündigung, falls Wartung nötig ([Wartung](wartung-statusseite.md)).
2. Sicherung erstellen (`node scripts/backup.mjs`).
3. Neues Image starten; warten bis „healthy“.
4. Smoke-Test gegen die Umgebung.
5. Überwachung 30 min beobachten.

## Rollback

| Lage | Vorgehen |
|---|---|
| Fehler ohne Datenbankänderung | vorheriges Image-Tag starten |
| Migration additiv | vorheriges Image starten; die neue Spalte/Tabelle stört die alte Version nicht |
| Daten beschädigt | Wartungsmodus ankündigen, letzte Sicherung einspielen (`node scripts/restore.mjs backups/<Zeitstempel>`, stoppt die App während des Einspielens, [Restore](backup-restore.md)), Incident-Prozess |
