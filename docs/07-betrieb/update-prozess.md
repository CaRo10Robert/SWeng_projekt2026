---
id: OPS-UPDATES
type: process
status: in-review
owner: architecture-lead
version: 1.0
created: 2026-10-24
last_updated: 2026-10-24
---

# Update-, Release- und Rollback-Prozess

> **Muster im Rahmen einer Übungsaufgabe.** Anforderungen: REQ-OPS-012 (Abhängigkeits-Updates), REQ-OPS-004 (versioniertes Image), REQ-SEC-008 (Sicherheitsprüfungen).

## Abhängigkeiten aktualisieren (Renovate)

Die Konfiguration `renovate.json` im Repo legt fest:

| Art | Rhythmus | Zusammenfassung | Automatisch mergen? |
|---|---|---|---|
| Sicherheitsupdates (Advisories) | sofort | einzeln | nein, aber Priorität „hoch“ |
| Patch- und Minor-Updates | wöchentlich [Platzhalter: Montag früh] | gruppiert (z. B. „Fastify“, „React“, „Testwerkzeuge“) | nein |
| Major-Updates | monatlich | einzeln, mit Changelog | nein |
| Docker-Basisimages (`node`, `postgres`, `mailpit`, `caddy`) | wöchentlich, Digest-Pinning | gruppiert | nein |
| GitHub Actions | monatlich | gruppiert | nein |

Jeder Update-Pull-Request durchläuft die volle CI (Typprüfung, Unit-, E2E- und Smoke-Tests). Ein Mensch prüft und mergt.

**Zeitziele (Beispiel):** kritische Sicherheitslücken in erreichbarem Code binnen 48 h, hohe binnen 7 Tagen, sonst mit dem nächsten wöchentlichen Update.

## Versionierung und Release

- **SemVer** für die Anwendung (`MAJOR.MINOR.PATCH`); der Image-Tag entspricht der Version, zusätzlich der Commit-Hash.
- Ein Release entsteht aus `main` mit Tag `vX.Y.Z`; CI baut das Image aus sauberem Checkout (CTRL-CI-IMAGE).
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
| Daten beschädigt | Wartungsmodus, letzte Sicherung einspielen ([Restore](backup-restore.md)), Incident-Prozess |
