---
id: LEGAL-TOM
type: privacy
status: in-review
owner: security-lead
version: 1.1
created: 2026-10-24
last_updated: 2026-10-25
---

# Technische und organisatorische Maßnahmen (Art. 32 DSGVO)

> **Muster im Rahmen einer Übungsaufgabe – keine rechtsverbindlichen Angaben; vom Datenschutzbeauftragten der Hochschule zu prüfen.** Anforderung: REQ-LEGAL-011.

Die Maßnahmen beschreiben die **tatsächliche Architektur** des Docker-Beispiels ([Architektur](../03-architektur/architektur.md)). Spalte „Stand“:
- **umgesetzt**: im Code bzw. Docker-Beispiel vorhanden und geprüft.
- **im Beispiel**: als Übung umgesetzt, im Echtbetrieb zu ergänzen.
- **Echtbetrieb**: nur organisatorisch bzw. beim Hosting umsetzbar.

## 1. Vertraulichkeit

| Maßnahme | Umsetzung | Bezug | Stand |
|---|---|---|---|
| Zugang nur für Hochschulangehörige | Registrierung nur mit Whitelist-Domain und bestätigter Adresse; Aktionen nur mit bestätigtem, aktivem Konto | REQ-AUTH-001, REQ-SEC-011 | umgesetzt |
| Passwortspeicherung | Argon2id mit Salt; Passwortrichtlinie (≥ 12 Zeichen, Leak-Liste) | REQ-SEC-002/003 | umgesetzt |
| Sitzungen | zufälliger Schlüssel im Cookie `HttpOnly`, `Secure`, `SameSite`; in der Datenbank nur als Hash; Ablauf nach 30 Tagen; Sperre beendet alle Sitzungen | REQ-SEC-004, REQ-SEC-011 | umgesetzt |
| Schutz vor fremdgesteuerten Anfragen | CSRF-Prüfung für alle ändernden Anfragen | REQ-SEC-004 | umgesetzt |
| Content Security Policy | restriktive CSP, keine fremden Quellen; keine Drittanbieter-Ressourcen | REQ-PRIV-006 | umgesetzt |
| Autorisierung | Prüfung je Ressource, standardmäßig verweigern; Fremde erhalten 404 | REQ-SEC-006 | umgesetzt |
| Rollenkonzept | Mitglied, Moderator, Administrator; Rollenwechsel nur durch Administration, im Audit-Log | REQ-MOD-007 | umgesetzt |
| Datenminimierung im Chat | E-Mail-Adresse nur nach beidseitiger Zustimmung sichtbar; Moderation sieht nur gemeldeten Ausschnitt (± 5 Nachrichten) | REQ-CHAT-010, REQ-PRIV-004 | umgesetzt |
| Pseudonymisierung | IP- und E-Mail-Adressen in Rate-Limit-Schlüsseln nur als HMAC-SHA256 mit zufälligem, täglich rotiertem Schlüssel (`platform.ip_pepper`, Vorgänger nach 1 h gelöscht, kein Standardschlüssel) | ADR-0014, REQ-PRIV-002 | umgesetzt |
| Protokolle ohne Personenbezug | eigener Request-Log-Eintrag (Methode, Route ohne Query, Status, Dauer, Request-ID) ohne IP-Adresse und Port; Schwärzung (`redact`) von Cookies, Passwörtern, E-Mail; Einmal-Tokens nur im URL-Fragment bzw. im POST-Body | REQ-OPS-002 | umgesetzt (Unit-Test AT-OPS-002) |
| Beweissicherung datensparsam | bei Straftatverdacht nur pseudonymisierte Kopie mit Kontext, Originale werden fristgerecht gelöscht | REQ-LEGAL-008 | umgesetzt |
| Vier-Augen-Prinzip | Widersprüche entscheidet eine unbeteiligte Person (nicht Entscheider, Widersprechende, Betroffene oder Meldende); Zugriff auf Originaltexte nur im Widerspruch und protokolliert | REQ-LEGAL-007 | umgesetzt |
| Bilder ohne Metadaten | Neukodierung entfernt EXIF/GPS | REQ-SEC-007 | umgesetzt |
| Transportverschlüsselung | TLS ≥ 1.2 und HSTS am Reverse Proxy | REQ-OPS-009 | im Beispiel (Profil `proxy`, interne CA) |
| Verschlüsselung der Datensicherungen | Backup-Archive verschlüsselt ablegen | REQ-AVAIL-003 | Echtbetrieb |
| Zugriff auf Server | Anmeldung nur mit persönlichem Konto und zweitem Faktor; kein gemeinsamer Admin-Zugang | – | Echtbetrieb [Platzhalter: RZ-Richtlinie] |

## 2. Integrität

| Maßnahme | Umsetzung | Bezug | Stand |
|---|---|---|---|
| Eingabeprüfung | Schemas (TypeBox) für alle API-Eingaben; Bildformat am Inhalt (Magic Bytes) | REQ-SEC-007, REQ-ARCH-* | umgesetzt |
| Unveränderliches Audit-Log | Moderations- und Verwaltungsentscheidungen mit Begründung, nur anfügen | REQ-MOD-003 | umgesetzt |
| Gehärtetes Image | Benutzer `node` (kein root), Dateisystem schreibgeschützt, `no-new-privileges` | REQ-SEC-010 | umgesetzt |
| Abhängigkeiten | gepinnte Versionen, Lockfile; automatische Updates mit Renovate; Sicherheitsscans in CI | REQ-OPS-012, REQ-SEC-008 | im Beispiel (Scans geplant B-06) |
| Vier-Augen-Prinzip | Widerspruch entscheidet eine andere Person als die Erstentscheidung | REQ-LEGAL-007 | im Beispiel |

## 3. Verfügbarkeit und Belastbarkeit

| Maßnahme | Umsetzung | Bezug | Stand |
|---|---|---|---|
| Begrenzung von Anfragen | Rate-Limits für Anmeldung, Registrierung, Nachrichten, Kontaktaktionen | REQ-SEC-005 | umgesetzt |
| Zuverlässiger Mailversand | Jobs mit Wiederholung (Transactional Outbox, pg-boss) | REQ-NOTI-005, ADR-0005 | umgesetzt |
| Gesundheitsprüfung | `/health/live`, `/health/ready`, geordnetes Herunterfahren | REQ-OPS-001 | umgesetzt |
| Überwachung und Alarmierung | Prometheus-Metriken, Alarmregeln, Benachrichtigung | REQ-OPS-008 | im Beispiel (Profil `monitoring`) |
| Datensicherung | täglich `pg_dump` und Archiv der Bilder, höchstens 28 Tage rollierend | REQ-AVAIL-003 | im Beispiel (Skripte, Restore-Test) |
| Wartungsmodus | geplante Wartung mit 503 und Hinweisseite, Ankündigung vorab | REQ-OPS-006 | im Beispiel |

## 4. Wiederherstellbarkeit

| Maßnahme | Umsetzung | Bezug | Stand |
|---|---|---|---|
| Wiederherstellung | `node scripts/restore.mjs`: Einspielen in temporäre Datenbank und temporäres Bildverzeichnis, erst danach Tausch (Rückfall auf den alten Stand bei Fehler); Löschjournal wird danach erneut abgespielt (Art. 17); Restore-Test automatisiert | REQ-AVAIL-003, ADR-0018 | im Beispiel |
| Ziele | RPO 24 h, RTO 4 h (Beispielwerte) | REQ-AVAIL-002 | Echtbetrieb |
| Notfallprozess | Incident-Prozess mit Schweregraden und Postmortem | REQ-OPS-011 | im Beispiel (Dokument) |

## 5. Verfahren zur regelmäßigen Überprüfung

| Maßnahme | Umsetzung | Bezug | Stand |
|---|---|---|---|
| Automatisierte Prüfungen | CI bei jeder Änderung: Unit-, E2E-, Smoke-Tests, Modulgrenzen, Nachverfolgbarkeit | REQ-OPS-004 | umgesetzt |
| Threat Model | Registrierung, Chat, Upload | REQ-SEC-009 | geplant |
| Penetrationstest | vor dem Go-live nach ASVS L2 | REQ-SEC-013 | Echtbetrieb ([Plan](../07-betrieb/pentest-plan.md)) |
| Löschkonzept | täglicher Lauf löscht nach Fristen; Löschjournal außerhalb der Datenbank für Wiederherstellungen | REQ-PRIV-003, ADR-0018 | umgesetzt (Löschläufe für Meldungen, Widersprüche und Mitteilungen geplant) |
| Jährliche Überprüfung | VVT, TOMs, Rechtstexte durch DSB | REQ-LEGAL-011 | Echtbetrieb |

## 6. Organisatorische Maßnahmen

- Verpflichtung der Moderatorinnen, Moderatoren und Administratoren auf Vertraulichkeit [Platzhalter: Verpflichtungserklärung der Hochschule].
- Schulung zu Moderation, DSA-Begründungen und Datenpannen vor Rollenvergabe.
- Rollen nach dem Prinzip der minimalen Rechte; jährliche Überprüfung der Rollenliste.
- Meldeweg für Datenpannen ([Prozess](datenpannen-prozess.md)) und Sicherheitslücken (`/.well-known/security.txt`, REQ-SEC-012).
