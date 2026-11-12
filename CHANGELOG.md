# Changelog

Alle wesentlichen Änderungen an CampusMarkt HWG LU. Das Format folgt [Keep a Changelog 1.1.0](https://keepachangelog.com/de/1.1.0/), die Versionierung [Semantic Versioning 2.0.0](https://semver.org/lang/de/). Die Einträge entstehen aus den Commits nach [Conventional Commits 1.0.0](https://www.conventionalcommits.org/de/v1.0.0/) (`feat`, `fix`, `docs`, `test`, `chore`); Anforderungen und Backlog-Einträge stehen im Commit-Footer (`Refs:`).

Solange die Version unter 1.0.0 liegt, kann jede Minor-Version inkompatible Änderungen enthalten (SemVer §4). Im Docker-Beispiel betrifft das vor allem Datenbank-Migrationen und die Versionen der Rechtstexte.

## [Unreleased] – 0.4.0 (geplant, Stand 2026-11-12)

### Added
- Dunkles Farbschema (REQ-UX-008, ADR-0021): folgt der Systemeinstellung, im Seitenkopf wählbar (Wie im System, Hell, Dunkel), Wahl nur auf Wunsch im Browser gespeichert (`cm_theme`), kein Aufblitzen beim Laden; Kontrastmatrix beider Schemata als Test.
- Fehlerseiten für alle Fehlerarten (REQ-UX-009): 403 statt stiller Weiterleitung, 401, 429 mit Wartezeit aus `Retry-After`, eigene 404 für Anzeigen und Unterhaltungen, Offline-Hinweis und Offline-Seite, Rückfallebene außerhalb des Routers; einheitlicher Aufbau mit Fehlercode, Titel und Wegen zurück.
- Website-Hygiene (REQ-UX-010): Favicon (ICO, SVG), Apple Touch Icon, Manifest mit PNG- und Maskable-Icons, `theme-color` je Schema, `noindex` im Dokument, `<noscript>`-Hinweis, eigener Seitentitel je Seite; Skript `apps/web/scripts/generate-icons.mjs`.
- Nachweise in `docs/05-umsetzung/nachweise/`:
  - Übungen: Alarm, Störung, Restore, Datenpanne als Tabletop, Mail-Zustellbarkeit, simuliertes Onboarding.
  - Reviews: Architektur, Datenbankschema, Log-Felder, Übersetzungen.
  - Sicherheit: Threat Model, ASVS-L2-Checkliste mit ZAP, Übungs-Pentest.
  - Kontrollprotokolle für alle Dokument-Kontrollen (`CTRL-DOC-*`).
- Leitfäden und Protokollvorlagen für Screenreader- und Usability-Tests; die Beispiele sind fiktiv und kein Nachweis.
- Kontrollen in CI:
  - Coverage-Schwellen und wöchentliche Mutationstests.
  - Sicherheitsscans (Semgrep, pnpm audit, gitleaks, Trivy) mit SBOM.
  - Multi-Arch-Build für amd64 und arm64.
  - Ops-Tests für Löschfristen und Datenbankausfall; Dead-Letter-Test wöchentlich.
- Notfall-Funktion „alle Sitzungen beenden“ mit optionalem Passwortwechsel; Upload-Quote; Sicherheitsereignisse im Log.
- Löschläufe nach dem Löschkonzept (REQ-PRIV-003); Zustimmungsnachweise werden pseudonymisiert aufbewahrt.
- Übungsannahmen statt offener Fachfragen (Q-28); Übungs-DSFA.
- Guideline-Konformität:
  - [Ausnahmeregister](docs/03-architektur/ausnahmen.md) für MUST-Abweichungen.
  - ADR-0019 (Wiederherstellung und Löschjournal) und ADR-0020 (Datenzugriff).
  - Runbook je Alarm; Prozess für Meldungen zu Sicherheitslücken; dieser Changelog.
- Testpyramide ([Teststrategie](docs/05-umsetzung/teststrategie.md)):
  - 59 Integrationstests gegen echte PostgreSQL (Testcontainers), unter anderem vollständige Autorisierungsmatrix, Löschfristen mit vorgestellter Zeit, Rate-Limits und Benachrichtigungen.
  - 20 Komponententests der Web-App (React Testing Library, jsdom).
  - E2E-Test: Bei getrennter Echtzeitverbindung erscheinen neue Nachrichten per Polling.
  - k6-Lasttests für Suche, Chat, Anzeige anlegen und Registrierung sowie die ZAP-Baseline, beide wöchentlich (`ops-weekly.yml`).
  - JS-Budget der Web-App in CI (`scripts/check-bundle.mjs`, `CTRL-BUNDLE`).
- Reservierte Anzeigen fallen nach 30 Tagen ohne Abgabe auf „aktiv“ zurück: Ein offener Deal wird aufgehoben, der Anbieter erhält eine Mail und im Chat erscheint eine Systemnachricht (REQ-LST-008).
- Keyset-Paginierung für Audit-Log und Beweissicherungen; `RateLimit-*`-Header auf begrenzten Antworten (Guideline Kap. 06).
- Lieferkette: Build-Provenance- und SBOM-Attestation für das Image-Archiv in CI (SLSA Level 2); Images in `compose.yaml`, Dockerfile und Workflows per Digest, Actions per Commit-SHA gepinnt (Renovate hält die Pins aktuell).
- Start bricht ab, wenn die Datenbank neuer ist als der Code (unbekannte Migrationen).
- Log-Rotation für alle Dienste im Docker-Beispiel (3 × 10 MB je Container).
- `RATE_LIMIT_FACTOR` hebt die Rate-Limits nur für Lasttests an (wirkt nur mit `DEMO_MODE=true`).

### Changed
- Volle Navigation im Seitenkopf erst ab 1280 px, darunter Menü; unter 640 px zeigt der Kopf nur das Logo (Name für Screenreader) und für Gäste nur „Anmelden“.
- Datenschutzerklärung Fassung 2026-11-12 (neuer Eintrag `cm_theme` unter „Cookies und lokale Speicherung“).
- Coverage-Schwellen der Fachmodule von 13 % auf 86 % Zeilen, 70 % Zweige und 86 % Funktionen angehoben (gemessen 88,65 %); Geschäftsregeln je 95 % inklusive Zweige.
- 24 weitere Anforderungen sind `verified` (R1-Must 84 % statt 60 %), darunter REQ-MAINT-001 (Coverage), REQ-PRIV-003 (Löschfristen) und REQ-PERF-001 bis -004 (Lasttests); Einzelheiten im [Testbericht 2026-11-07](docs/05-umsetzung/testbericht-2026-11-07.md).
- Architektur v1.6: Lieferkette, Paginierung (neu 8.12) und Löschläufe auf dem umgesetzten Stand.
- `scripts/trace.mjs` prüft zusätzlich:
  - Fehler- und Missbrauchsfälle ab Risiko mittel;
  - `review_due` bei zeitkritischen Standards (überschritten ist ein Fehler);
  - das Ausnahmeregister (abgelaufene Ausnahmen sind ein Fehler).
- Nichtfunktionale Anforderungen um die Felder der Guideline-Vorlage ergänzt: Fehlerbudget, Lastprofil, Timeout/Retry, Wiederherstellung, Eskalation.
- REQ-LEGAL-008 und REQ-LEGAL-012 sind Must, weil sie Rechtspflichten umsetzen.
- Demo-Konten werden beim Start im Demo-Modus auf die aktuellen Rechtstexte gehoben.
- Abhängigkeiten aktualisiert (sharp, @fastify/static, @fastify/swagger-ui, nodemailer, vitest); das Runtime-Image enthält kein npm und kein yarn mehr.

### Fixed
- Rahmen von Eingabefeldern im hellen Schema mit zu wenig Kontrast (2,6:1, WCAG SC 1.4.11) – jetzt 4,8:1.
- Seitenkopf für Gäste lief bei 360 px Breite horizontal über (REQ-UX-001).
- Seitenaufrufe fehlender `.html`-Dateien liefern die 404-Seite statt JSON; `/api` ohne Schrägstrich liefert JSON statt der SPA.
- Die App stürzt bei einem Datenbankausfall nicht mehr ab.
- Request-IDs vom Client werden nur noch als UUID übernommen.
- Unbekannte Pfade erscheinen im Log nicht mehr im Klartext.
- Pentest-Befunde behoben: `Origin: null`, Bilder von Anzeigen in Prüfung, CSP ohne `unsafe-inline`.
- Secret-Scan in CI: festes Testpasswort aus dem neuen Integrationstest begründet in die Allowlist aufgenommen (Fehlalarm von gitleaks).
- Doku auf den umgesetzten Stand gebracht: Löschläufe (Architektur 8.4), Startabbruch bei unbekannten Migrationen (REQ-OPS-005), Log-Rotation (REQ-OPS-002).

### Security
- 2 kritische und 9 hohe Schwachstellen in Abhängigkeiten sowie 11 hohe im Image behoben (Scans in CI).
- Basis-Image `node:22-bookworm-slim` auf einen neuen Digest angehoben: behebt CVE-2026-109518 in `apt` (2 × hoch laut Trivy).

## [0.3.0] – 2026-10-25

### Added
- EPIC-13 „Recht, Auftritt und Betrieb“ als Übung:
  - Rechtsseiten in Deutsch und Englisch, Startseite für Gäste, Hilfe.
  - DSA-Begründung und Widerspruch nach dem Vier-Augen-Prinzip, Kennzeichnung bei Straftatverdacht.
  - DAC7-Auswertung, Wartungsmodus, Statusseite.
  - Englische Oberfläche mit react-intl.
  - Sicherung und Wiederherstellung mit Restore-Test, optionale Profile für Proxy (TLS, HSTS) und Monitoring, Renovate.
- Review v1.3 mit 63 Befunden und ihrer Behebung.

### Security
- IP- und Adress-Pseudonyme per HMAC mit täglich rotiertem Schlüssel (ADR-0014).
- Logs ohne IP-Adressen und Tokens; Abmelde-Geheimnis zufällig erzeugt; vollständiges Vier-Augen-Prinzip.

## [0.2.0] – 2026-10-24

### Added
- Anforderungen der Fallstudie MWI131 extrahiert und abgeglichen; Anforderungskatalog mit einer Datei je Anforderung; Requirements-Review v0.2.
- Architektur auf das C4-Modell umgestellt; Architektur-Review v1.0.
- Sprint-1-Umfang:
  - Kontaktfreigabe nach beidseitiger Zustimmung, IdentityProviderPort, Registrierungsgrenzen.
  - Tastatur-E2E mit axe-core, CI.

### Fixed
- Befunde aus dem Code-Review v1.1, unter anderem N+1-Abfragen, Sperrfrist nach Widerruf und atomares Login-Limit.

## [0.1.0] – 2026-10-23

### Added
- MVP als Docker-Beispiel (app, db, mailpit), Analyse, Anforderungen v0.2, erste Architektur.

[Unreleased]: https://github.com/CaRo10Robert/SWeng_projekt2026/compare/042911b...HEAD
[0.3.0]: https://github.com/CaRo10Robert/SWeng_projekt2026/compare/df4d748...37ac306
[0.2.0]: https://github.com/CaRo10Robert/SWeng_projekt2026/compare/a8538c4...df4d748
[0.1.0]: https://github.com/CaRo10Robert/SWeng_projekt2026/commit/a8538c4
