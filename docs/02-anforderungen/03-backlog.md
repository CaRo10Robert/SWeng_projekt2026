---
id: BACKLOG
type: planning
status: in-review
owner: product-owner
version: 1.0
created: 2026-10-20
last_updated: 2026-10-23
---

# Product Backlog und Release-Planung

Das Product Backlog sammelt alle offenen Arbeiten, geordnet nach **WSJF** innerhalb des per MoSCoW festgelegten Release-Umfangs (Verfahren: [04-vorgehen.md §4–5](04-vorgehen.md#4-aufwandsschätzung)). Jeder Eintrag verweist auf Anforderungen in [req/](req/); der Status der Anforderungen steht im [Katalog-Index](02-anforderungen.md#6-katalog-index). Oben stehen konkretisierte Einträge, unten Platzhalter (Fallstudie FS-M12).

## 1. Epics

| Epic | Titel | Ziel | Release |
|---|---|---|---|
| EPIC-00 | Fundament & Docker-Beispiel | Repo, CI, Dockerfile + Compose (app, db, mailpit), Seed-Daten, Threat Model | R1 + laufend |
| EPIC-01 | Registrierung & Authentifizierung | Nur verifizierte Hochschulangehörige | R1 |
| EPIC-02 | Anzeigen | Angebote und Gesuche inkl. Tausch und Verschenken | R1 |
| EPIC-03 | Suche & Entdecken | Finden, Filtern, Merken, Suchaufträge | R1 / R2 |
| EPIC-04 | Chat | Anzeigenbezogene Echtzeit-Kommunikation inkl. Kontaktdaten-Freigabe | R1 |
| EPIC-05 | Benachrichtigungen & E-Mail | Zuverlässige Zustellung | R1 |
| EPIC-06 | Vertrauen & Moderation | Melden, Moderieren, Blockieren, Bewerten | R1 / R2 |
| EPIC-07 | Konto, Datenschutz & Barrierefreiheit | DSGVO-Rechte, Tastaturbedienbarkeit | R1 |
| EPIC-08 | Administration | Rollen, Whitelist-UI, Kategorien-UI, Statistiken | R1 / R2 |
| **EPIC-09** | **Bezahlung (Backlog)** | Optionale Online-Zahlung mit Käuferschutz | R4+ |
| **EPIC-10** | **Weitere Hochschulen (Backlog)** | Domains weiterer Hochschulen freischalten | R3+ |
| EPIC-11 | Native Apps (Backlog) | iOS/Android, falls die PWA nicht reicht | offen |
| **EPIC-12** | **Echtbetrieb (Backlog)** | Öffentliches Hosting inkl. Betreiberpflichten | nicht Teil des Projekts |

## 2. Product Backlog (R1, nach WSJF)

**Spalten:** SP = Story Points · NW = Nutzerwert · ZK = Zeitkritikalität · RR = Risikoreduktion · CoD = NW + ZK + RR · WSJF = CoD / SP. Skala für NW, ZK, RR: 1, 2, 3, 5, 8, 13. NW leitet sich aus der Kano-Kategorie ab (Basis 8, Leistung 5, Begeisterung 3, nicht kundenwirksam 1). ZK = 13 für Einträge, die die Fallstudie bis zur nächsten Veranstaltung verlangt. Die Story Points sind eine **Erstschätzung** (Analogie zum umgesetzten Prototyp) und werden im Refinement per Planning Poker bestätigt.

| # | Eintrag | Typ | Anforderungen | Kano | Risiko | Abhängig von | SP | NW | ZK | RR | CoD | WSJF | Sprint |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| B-03 | Angebote nur von verifizierten Nutzern: Abuse-Case-Tests | Feature/Test | REQ-SEC-011 | basis | hoch | – | 2 | 8 | 13 | 8 | 29 | 14,5 | 1 |
| B-04 | Nachverfolgbarkeit: Tests mit Nachweis-IDs markieren, `trace.mjs` in CI | Enabler | alle (FS-M14) | n/a | mittel | – | 3 | 1 | 13 | 5 | 19 | 6,3 | 1 |
| B-01 | Kontaktdaten nach beidseitiger Zustimmung freigeben | Feature | REQ-CHAT-010, REQ-PRIV-002, REQ-CHAT-001 | basis | hoch | – | 5 | 8 | 13 | 5 | 26 | 5,2 | 1 |
| B-02 | Tastaturbedienbarkeit der Kernabläufe, automatisiert mit axe-core | Feature/Test | REQ-A11Y-002, REQ-A11Y-001 | basis | mittel | – | 5 | 8 | 13 | 5 | 26 | 5,2 | 1 |
| S-01 | **Spike** Q-12: Anmeldung über die Hochschulkennung (RZ, DFN-AAI, OIDC) klären | Spike (Timebox 1 Tag) | REQ-AUTH-009 | – | hoch | – | 1 | – | 13 | 8 | – | – | 1 |
| B-16 | Manueller Screenreader- und Tastaturdurchlauf (NVDA) dokumentieren | Test | REQ-A11Y-001 | basis | mittel | B-02 | 2 | 8 | 5 | 5 | 18 | 9,0 | 2 |
| B-12 | Aufbewahrungsfristen für Chats, Meldungen, Audit-Log | Feature | REQ-PRIV-003 | basis | hoch | – | 3 | 8 | 3 | 8 | 19 | 6,3 | 2 |
| B-09 | Threat Model (STRIDE) für Registrierung, Chat, Upload, Kontaktfreigabe | Enabler | REQ-SEC-009 | n/a | hoch | – | 3 | 1 | 5 | 8 | 14 | 4,7 | 2 |
| B-15 | Ausblenden ab 3 Meldungen auch für Nachrichten und Profile | Feature | REQ-MOD-004 | basis | mittel | – | 3 | 5 | 2 | 5 | 12 | 4,0 | 2 |
| B-08 | Multi-Arch-Image (amd64, arm64) | Enabler | REQ-PORT-002 | n/a | mittel | B-07 | 2 | 1 | 3 | 3 | 7 | 3,5 | 2 |
| B-05 | Anmeldung hinter `IdentityProviderPort` kapseln | Enabler | REQ-AUTH-009 | n/a | mittel | S-01 | 3 | 1 | 3 | 5 | 9 | 3,0 | 2 |
| B-07 | CI: Build, Tests, Smoke-Test, Image nach GHCR | Enabler | REQ-OPS-004, REQ-ARCH-005 | n/a | mittel | – | 3 | 1 | 3 | 5 | 9 | 3,0 | 2 |
| B-18 | Testabdeckung und Mutation-Score messen | Enabler | REQ-MAINT-001 | n/a | niedrig | B-07 | 2 | 1 | 2 | 3 | 6 | 3,0 | 3 |
| B-10 | Lasttests (k6) für Suche, Chat, Anzeige, Registrierung | Test | REQ-PERF-001…004 | leistung | mittel | B-07 | 5 | 5 | 3 | 5 | 13 | 2,6 | 3 |
| B-11 | Re-Verifikation der Mitgliedschaft alle 12 Monate | Feature | REQ-AUTH-007, REQ-NOTI-001 | basis | mittel | – | 5 | 5 | 2 | 5 | 12 | 2,4 | 3 |
| B-06 | CI-Sicherheitsscans: SAST, SCA, Secret-Scan, Image-Scan, SBOM | Enabler | REQ-SEC-008 | n/a | hoch | B-07 | 8 | 1 | 5 | 8 | 14 | 1,8 | 3 |
| B-13 | Profilbild | Feature | REQ-ACC-001 | leistung | niedrig | – | 3 | 3 | 1 | 1 | 5 | 1,7 | 3 |
| B-17 | Texte in i18n-Ressourcen auslagern | Enabler | REQ-UX-002 | n/a | niedrig | – | 5 | 3 | 1 | 2 | 6 | 1,2 | 4 |
| B-14 | HEIC-Fotos annehmen und konvertieren | Feature | REQ-LST-003 | leistung | mittel | S-02 | 8 | 5 | 2 | 2 | 9 | 1,1 | 4 |
| S-02 | **Spike** HEIC-Dekodierung (libheif-Build vs. Konvertierung im Browser) | Spike | REQ-LST-003 | – | mittel | – | 1 | – | 2 | 3 | – | – | 4 |

**Platzhalter (Could, R2-Kandidaten):** REQ-CHAT-009 strukturierter Preisvorschlag (5 SP), REQ-MOD-006 Bewertungen (5 SP), REQ-LST-009 Vorschau-Link (3 SP), REQ-MOD-008 Whitelist-Oberfläche (3 SP), REQ-CHAT-008 Bilder im Chat (5 SP), REQ-SRCH-005 Suchaufträge (8 SP), REQ-NOTI-006 Web-Push (8 SP). Werden erst konkretisiert, wenn sie in den Release-Umfang rücken.

**Erledigt (Inkrement 0, Prototyp vom 2026-10-23):** alle Anforderungen mit Status `implemented` bzw. `verified` im [Katalog-Index](02-anforderungen.md#6-katalog-index).

## 3. Release- und Sprint-Plan

```mermaid
gantt
    title Release R1 (Annahme: WS 2026/27, 2-Wochen-Sprints)
    dateFormat YYYY-MM-DD
    axisFormat %d.%m.
    section Phase 0
    Analyse, Anforderungen, Architektur           :done, a1, 2026-10-20, 4d
    Inkrement 0: Prototyp (Docker-Beispiel)       :done, p0, 2026-10-22, 2d
    section R1
    Sprint 1: Constraints der Fallstudie          :s1, 2026-10-26, 14d
    Sprint 2: Datenschutz, Sicherheit, CI          :s2, after s1, 14d
    Sprint 3: Qualität und Re-Verifikation         :s3, after s2, 14d
    Sprint 4: Puffer, Demo-Härtung                 :s4, after s3, 14d
    section Meilensteine
    Feature Freeze                                 :milestone, ff, after s3, 0d
```

| Sprint | Sprint-Ziel | Einträge | SP |
|---|---|---|---|
| 1 | Die Constraints der Fallstudie sind umgesetzt und automatisiert nachgewiesen | B-03, B-04, B-01, B-02, S-01 | 16 |
| 2 | Datenschutz- und Sicherheitslücken geschlossen, CI läuft | B-16, B-12, B-09, B-15, B-08, B-05, B-07 | 19 |
| 3 | Qualitätsziele gemessen, Re-Verifikation umgesetzt | B-18, B-10, B-11, B-06, B-13 | 23 → im Planning kürzen |
| 4 | Puffer, Fehlerbehebung, Demo-Härtung (nach Feature Freeze) | Fehler, Dokumentation | – |

## 4. Backlog: EPIC-09 Bezahlfunktion

**Ziel:** Optionale Online-Zahlung, z. B. für Beschäftigte, die nicht bar zahlen wollen, oder für spätere Versandabwicklung zwischen Hochschulen.

| ID | Item | Typ | Notiz |
|---|---|---|---|
| PAY-01 | **Spike:** PSP-Auswahl (Stripe Connect, Mangopay, Adyen for Platforms) nach Kriterien: Marktplatz-Lizenz, KYC-Flow, Gebühren, EU-Datenhaltung, Sandbox | Discovery | Ergebnis: ADR |
| PAY-02 | **Spike:** Rechtliche Prüfung: ZAG (keine eigene Geldverwahrung), DAC7/PStTG-Meldepflichten, Verbraucherrecht (Käuferschutz **nicht voreinstellen**), Gebührenmodell | Discovery | mit Hochschul-Justiziariat |
| PAY-03 | Als Anbieter möchte ich ein Auszahlungskonto beim PSP einrichten (KYC beim PSP, nicht bei uns) | User Story | UC-50 |
| PAY-04 | Als Interessent möchte ich einen angenommenen Preisvorschlag online bezahlen | User Story | UC-51, baut auf REQ-CHAT-009 (Deal) auf |
| PAY-05 | Als Käufer möchte ich den Erhalt bestätigen, damit die Zahlung freigegeben wird (sonst automatische Freigabe nach X Tagen) | User Story | UC-52 |
| PAY-06 | Als Käufer möchte ich eine Zahlung reklamieren (Dispute) | User Story | UC-53 |
| PAY-07 | Webhook-Empfang mit Signaturprüfung, Idempotenz und Outbox | Technisch | ADR-0006 |
| PAY-08 | Revisionssicheres Zahlungs-Ledger (append-only) | Datenanforderung | ADR-0006 |
| PAY-09 | DAC7-Meldedaten erfassen, falls Schwellen überschritten werden (30 Verkäufe oder 2.000 € pro Jahr) | Rechtlich | abhängig von PAY-02 |

**Vorleistungen im MVP** (damit EPIC-09 später additiv ist): Deal-Konzept, Domain Events `DealAgreed`, `DealCompleted`, `DealCancelled`, Geldbeträge als Integer in Cent mit Währung, Ports & Adapters (REQ-ARCH-001/002).

## 5. Backlog: EPIC-10 Weitere Hochschulen

| ID | Item | Notiz |
|---|---|---|
| INST-01 | Whitelist-Verwaltung per Admin-UI (REQ-MOD-008) | Daten bereits mandantenfähig (REQ-ARCH-004) |
| INST-02 | Entscheidung: **eine** gemeinsame Community (Metropolregion Rhein-Neckar) oder **getrennte** Communities pro Hochschule | Produktentscheidung |
| INST-03 | Campus-Standorte pro Institution | Datenmodell vorbereitet |
| INST-04 | Anmeldung über Hochschul-SSO (DFN-AAI / Shibboleth, SAML oder OIDC) | hängt an Q-12 / S-01, REQ-AUTH-009 |
| INST-05 | Onboarding-Prozess für neue Hochschulen (Ansprechpartner, Moderation vor Ort) | Organisatorisch |

## 6. Backlog: EPIC-12 Echtbetrieb (nicht Teil des Projekts)

| ID | Item | Bezug |
|---|---|---|
| OPS-01 | Betreiber klären (Hochschule, AStA), Impressum (DDG), Datenschutzerklärung, AGB, Nutzungsregeln | Review O-1 |
| OPS-02 | Hosting in der EU / im Hochschul-RZ, AV-Verträge | REQ-PRIV-005 |
| OPS-03 | Echter SMTP-Relay mit SPF/DKIM/DMARC, Bounce-Verarbeitung | REQ-NOTI-004 |
| OPS-04 | Verfügbarkeits-SLO, RTO/RPO, Backups mit PITR, Restore-Übung | REQ-AVAIL-001/002 |
| OPS-05 | Monitoring, Alarme, Runbooks, Incident-Prozess | Guideline Kap. 11 |
| OPS-06 | Skalierung: `api`/`worker` getrennt, `PgNotifyAdapter`, S3-Adapter | ADR-0004, 0007 |
| OPS-07 | DSFA-Prüfung, DSA-Prozesse mit realen Moderator/innen | REQ-PRIV-007 |
| OPS-08 | Hochschul-SSO | INST-04 |

## 7. Ideen (ungepriorisiert)

- Kategorie „Leihen“ (z. B. Taschenrechner für die Klausur, Werkzeug)
- Semesterstart-Kampagne „Erstsemester-Paket“
- Englische Oberfläche (REQ-UX-002)
- Nachhaltigkeits-Statistik („X kg Re-Use“)
- Übergabe-Bestätigung per QR-Code auf dem Campus
