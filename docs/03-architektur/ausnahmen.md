---
id: EXCEPTIONS
type: exception-register
status: approved
owner: architecture-lead
version: 1.0
created: 2026-10-26
last_updated: 2026-10-26
review_due: 2027-01-31
---

# Ausnahmeregister (Guideline-Abweichungen)

Die DEV-Guideline verlangt für jede Abweichung von einer MUST- bzw. SHALL-Regel einen Ausnahmedatensatz (Guideline README, Abschnitt „Guideline exceptions“). Ohne Datensatz gilt eine Abweichung als stiller Regelbruch.

**Abgrenzung:**
- Abweichungen von SHOULD-Regeln und vom Standard-Stack (Kap. 14) stehen in ADRs.
- Hier stehen nur Abweichungen von MUST-Regeln und von normativen Einträgen im Standards-Register.

**Durchsetzung:**
- `scripts/trace.mjs` prüft dieses Register in CI.
- Fehlt ein Pflichtfeld, ist das ein Fehler. Ein überschrittenes Ablaufdatum ist ebenfalls ein Fehler.
- Läuft eine Ausnahme in weniger als 30 Tagen ab, gibt es eine Warnung.
- Eine Ausnahme wird verlängert, indem ein neuer Eintrag mit Begründung angelegt wird, nicht durch Ändern des Datums.

**Genehmigung:** Die Genehmigenden sind die fiktiven Rollen der Übung (Q-28).

| ID | Kurzbeschreibung | Ablauf |
|---|---|---|
| [EX-01](#ex-01-asvs-fassung-403-statt-50) | ASVS-Fassung 4.0.3 statt 5.0 | 2027-04-30 |
| [EX-02](#ex-02-kein-verteiltes-tracing-mit-opentelemetry) | Kein verteiltes Tracing mit OpenTelemetry | 2027-03-31 |
| [EX-03](#ex-03-befristete-asvs-ausnahmen-im-docker-beispiel) | Befristete ASVS-Ausnahmen im Docker-Beispiel | 2027-03-31 |
| [EX-04](#ex-04-nicht-erfüllte-asvs-kontrollen-mit-backlog-eintrag) | Nicht erfüllte ASVS-Kontrollen mit Backlog-Eintrag | 2027-02-28 |
| [EX-05](#ex-05-slsa-level-3-und-signierte-images-in-einer-registry) | SLSA Level 3 und signierte Images in einer Registry | 2027-04-30 |

### EX-01 ASVS-Fassung 4.0.3 statt 5.0

| Feld | Inhalt |
|---|---|
| Regel | Guideline Kap. 07, Tabelle „Established frameworks“ (ASVS 5.0), und Standards-Register „OWASP ASVS, aktuelle Hauptversion bei Einführung prüfen“ (normativ) |
| Betroffen | CampusMarkt: REQ-SEC-001, ASVS-Checkliste [MAN-SEC-001](../05-umsetzung/nachweise/MAN-SEC-001.md), Pentest-Plan, Threat Model |
| Grund | Die Checkliste nutzt die stabile Nummerierung von 4.0.3, die auch ZAP-Regeln und Pentest-Vorlagen verwenden. Eine Umstellung auf die neue Kapitelstruktur von 5.0 (V1 bis V17) bringt im Studienprojekt keinen zusätzlichen Prüfinhalt. |
| Risiko | niedrig: Die Prüfinhalte der anwendbaren Kapitel decken sich weitgehend. Neue Kontrollen in 5.0 (z. B. zu OAuth/OIDC und Selbstbeschreibung von Sicherheitsentscheidungen) könnten übersehen werden. |
| Kompensation | Threat Model mit STRIDE über alle Abläufe; Übungs-Pentest mit 49 Prüfungen; ZAP-Baseline und API-Scan; SSO-spezifische Kontrollen werden mit Spike S-01 nach 5.0 geprüft |
| Genehmigt von | architecture-lead mit security-lead (fiktiv), 2026-10-26 |
| Ablauf | 2027-04-30 |
| Plan | Abgleich 4.0.3 → 5.0 als Mapping-Tabelle bis zum Ablauf, danach Checkliste in 5.0 neu aufsetzen; Review alle 6 Monate laut Standards-Register |

### EX-02 Kein verteiltes Tracing mit OpenTelemetry

| Feld | Inhalt |
|---|---|
| Regel | Standards-Register „OpenTelemetry (OTel) – normativ für Instrumentierung“; Guideline Kap. 11, Abschnitt „Telemetry“ |
| Betroffen | CampusMarkt-Server (REQ-OPS-002), ADR-0002 („OTel optional“) |
| Grund | Der modulare Monolith läuft als ein Prozess, sodass verteiltes Tracing kaum Erkenntnisse bringt. Ein OTel-Collector wäre ein vierter Dienst im Docker-Beispiel (Konflikt mit ADR-0010). |
| Risiko | mittel: Langsame Abfragen über Modulgrenzen und Jobs lassen sich nur über Logs und Metriken zuordnen. |
| Kompensation | Korrelations-ID je Anfrage in allen Logs und Antworten (RFC-9457-Body); Prometheus-Metriken für Latenz, Fehler, Jobs und WebSockets; Alarme mit Runbooks |
| Genehmigt von | architecture-lead (fiktiv), 2026-10-26 |
| Ablauf | 2027-03-31 |
| Plan | OTel-SDK mit OTLP-Exporter als optionales Compose-Profil `monitoring` vor R2 (Backlog B-26) |

### EX-03 Befristete ASVS-Ausnahmen im Docker-Beispiel

| Feld | Inhalt |
|---|---|
| Regel | Guideline Kap. 07 (ASVS Level 2 als Basis); REQ-SEC-001 |
| Betroffen | ASVS 4.0.3 Kontrollen 1.1.7, 1.2.2, 1.6.2, 1.9.1, 2.4.5, 3.3.2, 4.3.1, 6.1.1, 6.4.1, 8.3.1, 8.3.7, 9.2.2, 11.1.7, 12.4.2, 13.1.3 (Details in [MAN-SEC-001](../05-umsetzung/nachweise/MAN-SEC-001.md)) |
| Grund | Das Docker-Beispiel läuft offline auf einem Rechner und hat weder Tresor, internes TLS noch SSO mit MFA. Diese Infrastruktur kommt erst mit einem Echtbetrieb (EPIC-12). |
| Risiko | niedrig im Beispiel, weil alle Ports nur an 127.0.0.1 gebunden sind und es keine echten Daten gibt; im Echtbetrieb hoch |
| Kompensation | Proxy-Profil mit TLS und HSTS; Pseudonymisierung (ADR-0014); zufällig erzeugte Geheimnisse in der DB; Go-live-Checkliste mit allen Punkten; `LEGAL_STRICT` und `DEMO_MODE=false` verhindern einen Echtbetrieb mit Demo-Konfiguration |
| Genehmigt von | security-lead (fiktiv), 2026-10-26 |
| Ablauf | 2027-03-31 |
| Plan | Vor einem Echtbetrieb einzeln schließen (Go-live-Checkliste, EPIC-12). Ohne Echtbetrieb bis zum Ablauf: Ausnahme mit neuer Begründung verlängern. |

### EX-04 Nicht erfüllte ASVS-Kontrollen mit Backlog-Eintrag

| Feld | Inhalt |
|---|---|
| Regel | Guideline Kap. 07 (ASVS Level 2); REQ-SEC-001 |
| Betroffen | ASVS 4.0.3 Kontrollen 2.1.5, 2.1.8, 2.1.12, 2.2.3, 2.5.5, 3.4.4 (Pentest-Befunde PT-F-04 bis PT-F-06 und PT-F-09) |
| Grund | Härtungs- und Komfortfunktionen mit niedrigem Risiko, für die die Kapazität in R1 fehlt |
| Risiko | niedrig: Passwortänderung über „Passwort vergessen“ möglich; Sitzungscookie mit `Secure`, `HttpOnly` und `SameSite=Lax` |
| Kompensation | Rate-Limits für Anmeldung und Zurücksetzen, Argon2id, Passwortrichtlinie mit Blockliste, Sicherheitsereignisse im Log |
| Genehmigt von | security-lead (fiktiv), 2026-10-26 |
| Ablauf | 2027-02-28 |
| Plan | Backlog B-59, B-61 und B-62 (R2); danach REQ-SEC-001 erneut prüfen |

### EX-05 SLSA Level 3 und signierte Images in einer Registry

| Feld | Inhalt |
|---|---|
| Regel | Guideline Kap. 07, Abschnitt „Secrets & supply chain“ (signierte, attestierbare CI-Artefakte); Standards-Register „SLSA v1.0, Ziel Level 2–3“ (normativ) |
| Betroffen | CI-Image-Artefakt (`docker save`), REQ-OPS-004 |
| Grund | Es gibt keine Container-Registry (Q-19, Abgabe als Quellcode bzw. Archiv). CI erzeugt eine Build-Provenance per GitHub-Attestation (Level 2). Signierte Images, deren Signatur beim Deployment geprüft wird (Level 3), brauchen eine Registry und eine Deployment-Policy. |
| Risiko | niedrig: Das Image wird lokal aus dem Quellcode gebaut. |
| Kompensation | Build-Provenance-Attestation des Image-Archivs in CI, SBOM (CycloneDX), Trivy-Scan, Images per Digest gepinnt (Renovate) |
| Genehmigt von | security-lead (fiktiv), 2026-10-26 |
| Ablauf | 2027-04-30 |
| Plan | Mit einer Registry im Echtbetrieb: cosign keyless signieren und die Signatur beim Deployment prüfen (EPIC-12) |
