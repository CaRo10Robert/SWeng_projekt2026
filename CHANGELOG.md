# Changelog

Alle wesentlichen Änderungen an CampusMarkt HWG LU. Das Format folgt [Keep a Changelog 1.1.0](https://keepachangelog.com/de/1.1.0/), die Versionierung [Semantic Versioning 2.0.0](https://semver.org/lang/de/). Die Einträge entstehen aus den Commits nach [Conventional Commits 1.0.0](https://www.conventionalcommits.org/de/v1.0.0/) (`feat`, `fix`, `docs`, `test`, `chore`); Anforderungen und Backlog-Einträge stehen im Commit-Footer (`Refs:`).

Solange die Version unter 1.0.0 liegt, kann jede Minor-Version inkompatible Änderungen enthalten (SemVer §4). Im Docker-Beispiel betrifft das vor allem Datenbank-Migrationen und die Versionen der Rechtstexte.

## [Unreleased] – 0.4.0 (geplant, Stand 2026-10-26)

### Added
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

### Changed
- `scripts/trace.mjs` prüft zusätzlich:
  - Fehler- und Missbrauchsfälle ab Risiko mittel;
  - `review_due` bei zeitkritischen Standards (überschritten ist ein Fehler);
  - das Ausnahmeregister (abgelaufene Ausnahmen sind ein Fehler).
- Nichtfunktionale Anforderungen um die Felder der Guideline-Vorlage ergänzt: Fehlerbudget, Lastprofil, Timeout/Retry, Wiederherstellung, Eskalation.
- REQ-LEGAL-008 und REQ-LEGAL-012 sind Must, weil sie Rechtspflichten umsetzen.
- Demo-Konten werden beim Start im Demo-Modus auf die aktuellen Rechtstexte gehoben.
- Abhängigkeiten aktualisiert (sharp, @fastify/static, @fastify/swagger-ui, nodemailer, vitest); das Runtime-Image enthält kein npm und kein yarn mehr.

### Fixed
- Die App stürzt bei einem Datenbankausfall nicht mehr ab.
- Request-IDs vom Client werden nur noch als UUID übernommen.
- Unbekannte Pfade erscheinen im Log nicht mehr im Klartext.
- Pentest-Befunde behoben: `Origin: null`, Bilder von Anzeigen in Prüfung, CSP ohne `unsafe-inline`.

### Security
- 2 kritische und 9 hohe Schwachstellen in Abhängigkeiten sowie 11 hohe im Image behoben (Scans in CI).

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
