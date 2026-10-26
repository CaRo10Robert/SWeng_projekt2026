---
id: MAN-SEC-001
type: evidence
status: done
owner: security-lead
version: 1.0
created: 2026-10-26
last_updated: 2026-10-26
---

# MAN-SEC-001: OWASP-ASVS-Checkliste Level 2

> Nachweis für [REQ-SEC-001](../../02-anforderungen/req/REQ-SEC-001.md). Er ist eine **Übung**, keine externe Prüfung.
>
> **Gegenstand:** Docker-Beispiel auf `feature/fallstudie-req-c4`, Stand 2026-10-26 (Stack `cmh2`, frisch gebaut).
>
> **Messmittel:**
> - Code-Durchsicht.
> - Unit-, Smoke- und E2E-Tests.
> - [Übungs-Pentest](MAN-SEC-013.md) mit 49 Prüfungen.
> - OWASP ZAP 2.16.1: Baseline-Scan und angemeldeter API-Scan, Zusammenfassungen in [`zap/`](zap/).
>
> **Zugehörig:** [Threat Model](../../03-architektur/threat-model.md).

## Grundlage und Abweichung

- **Katalog:** Die Checkliste folgt **ASVS 4.0.3**. Dessen Kontrollnummern sind stabil und in Werkzeugen wie ZAP verbreitet.
- **Abweichung:** REQ-SEC-001 nennt ASVS 5.0. Die Prüfinhalte der anwendbaren Kapitel (Authentisierung, Sitzung, Zugriffskontrolle, Validierung und Kodierung, Dateien, Konfiguration, Datenschutz, Protokollierung) decken sich inhaltlich. Eine Umstellung der Nummern auf 5.0 bleibt ein offener Punkt; die Anforderung muss das nachziehen.
- **Umfang:** Aufgeführt sind die Kontrollen der Stufen L1 und L2 je Kapitel V1 bis V14. Kontrollen, die nur für L3 gelten, entfallen.
- **Statuswerte:**
  - ✅ erfüllt
  - ◐ teilweise bzw. mit befristeter Ausnahme
  - ❌ nicht erfüllt
  - N/A nicht anwendbar, mit Begründung
- **Ausnahmen:** Jede Ausnahme hat einen Genehmigungsvermerk (fiktiv: security-lead, 2026-10-26) und ein Ablaufdatum, nämlich spätestens den Go-live (EPIC-12).

## V1 Architektur, Design, Threat Modeling

| ASVS | Kontrolle (Kurzform) | Status | Beleg |
|---|---|---|---|
| 1.1.1 | Sicherer Entwicklungsprozess | ✅ | DoR/DoD und Reviews in `docs/02-anforderungen/04-vorgehen.md`; Reviews v0.2, v1.0, v1.1, v1.3 |
| 1.1.2 | Threat Modeling bei Designänderungen | ✅ | `docs/03-architektur/threat-model.md` (MAN-SEC-009), Pflege per DoD |
| 1.1.3 | Sicherheitsvorgaben in User Stories | ✅ | Abschnitt „Fehler- und Missbrauchsfälle“ in jeder REQ ab Risiko mittel (`_TEMPLATE.md`) |
| 1.1.4 | Vertrauensgrenzen dokumentiert | ✅ | Threat Model Kap. 2; architektur.md 5.1/7 |
| 1.1.5 | Architektur auf hoher Ebene | ✅ | architektur.md (C4, ADR-0012) |
| 1.1.6 | Zentrale Sicherheitskontrollen | ✅ | `platform/http/server.ts` (CSRF, Header, Fehler), `platform/http/auth.ts` (`requireAuth`/`requireRole`) |
| 1.1.7 | Checkliste für sicheres Programmieren | ◐ | ASVS-Checkliste und Guideline vorhanden, keine eigene Programmier-Checkliste; Ausnahme bis Go-live |
| 1.2.1 | Eigene, minimal berechtigte Konten für Komponenten | ✅ | Container als `node`, Code gehört root, Dateisystem schreibgeschützt (CTRL-IMAGE-INSPECT) |
| 1.2.2 | Kommunikation zwischen Komponenten authentisiert | ◐ | Datenbank mit Passwort; SMTP zu Mailpit ohne Authentisierung im Docker-Netz; Ausnahme bis Go-live (echter SMTP mit Auth, REQ-NOTI-004) |
| 1.2.3 | Ein geprüftes Authentisierungsverfahren | ✅ | `IdentityProviderPort` (ADR-0013), `resolveLogin` |
| 1.2.4 | Gleich starke Anmeldewege | ✅ | nur ein Weg (Passwort), SSO-Adapter später über denselben Port |
| 1.4.1 | Zugriffskontrolle an vertrauenswürdiger Stelle | ✅ | serverseitig, deny by default (`auth.ts:29`) |
| 1.4.4 | Ein einheitlicher Mechanismus | ✅ | `requireRole` und Teilnahmeprüfung je Modul (`participant()`) |
| 1.4.5 | Feature- bzw. attributbasiert | ✅ | Rollen plus Besitz bzw. Teilnahme je Ressource (REQ-SEC-006) |
| 1.5.1 | Ein- und Ausgabevorgaben definiert | ✅ | TypeBox-Contracts `packages/contracts` (einzige Quelle) |
| 1.5.2 | Keine Deserialisierung nicht vertrauenswürdiger Objekte | ✅ | nur `JSON.parse`, keine Objekt-Serialisierung |
| 1.5.3 | Validierung auf vertrauenswürdiger Ebene | ✅ | Fastify-Schemaprüfung serverseitig |
| 1.5.4 | Kodierung nahe am Interpreter | ✅ | parametrisiertes SQL (`platform/sql.ts:25`), React-Escaping, HTML-Escaping in Mails |
| 1.6.1 | Richtlinie für Schlüssel | ✅ | ADR-0014 (Pepper, Rotation), Geheimnisse in `platform.setting` |
| 1.6.2 | Schlüssel geschützt | ◐ | in der DB, nicht in einem Tresor; Ausnahme bis Go-live |
| 1.6.3 | Keine fest einkodierten Schlüssel | ✅ | Standardwerte entfernt (RV-C-02, RV-R-02) |
| 1.6.4 | Symmetrische Schlüssel als geschützte Geheimnisse | ✅ | wie 1.6.2 |
| 1.7.1 | Einheitliches Logformat | ✅ | pino JSON, Request-ID (`server.ts`, `requestLogEntry`) |
| 1.7.2 | Logs an entferntes System | N/A | Docker-Beispiel: `docker logs`; im Echtbetrieb zentrales Logging (EPIC-12) |
| 1.8.1 | Sensible Daten identifiziert | ✅ | VVT, Datenklassen architektur.md 8.4 |
| 1.8.2 | Schutzniveaus je Datenklasse | ✅ | architektur.md 8.4, Löschkonzept REQ-PRIV-003 |
| 1.9.1 | Verschlüsselte Kommunikation zwischen Komponenten | ◐ | extern TLS über das Profil `proxy`; intern im Docker-Netz unverschlüsselt; Ausnahme bis Go-live |
| 1.9.2 | Echtheit der Gegenstelle geprüft | ◐ | wie 1.9.1 |
| 1.10.1 | Quellcodeverwaltung mit Nachvollziehbarkeit | ✅ | git, Commits mit Refs auf Backlog-IDs |
| 1.11.1 | Geschäftsabläufe dokumentiert | ✅ | Use Cases, Zustandsmodell (02-anforderungen.md §4) |
| 1.11.2 | Wertvolle Abläufe threadsicher | ✅ | `FOR UPDATE` bei Deal, Kontaktfreigabe, Widerspruch |
| 1.12.2 | Uploads getrennt bzw. sicher ausgeliefert | ✅ | nur neu kodiertes WebP über `/media`, `nosniff`, CSP |
| 1.14.1 | Trennung der Komponenten | ✅ | eigene Container für app, db, mailpit |
| 1.14.2 | Signierte Artefakte | N/A | kein Registry-Vertrieb (Q-19); Image-Archiv mit SHA in CI |
| 1.14.3 | Pipeline warnt bei veralteten Komponenten | ✅ | Renovate (CTRL-RENOVATE), SCA in CI (CTRL-CI-SCAN) |
| 1.14.4 | Automatisierter Build und Deployment | ✅ | `.github/workflows/ci.yml`, `docker compose up --build` |
| 1.14.5 | Sandbox bzw. Container | ✅ | Docker, non-root, read-only |
| 1.14.6 | Keine veraltete Client-Technik | ✅ | React-SPA, kein Flash oder Java |

## V2 Authentisierung

| ASVS | Kontrolle | Status | Beleg |
|---|---|---|---|
| 2.1.1 | Passwort mindestens 12 Zeichen | ✅ | `Password` minLength 12 (`contracts/identity.ts:53`), AT-SEC-003 |
| 2.1.2 | mindestens 64 Zeichen erlaubt | ✅ | maxLength 256 |
| 2.1.3 | Keine Kürzung | ✅ | Argon2id über das ganze Passwort |
| 2.1.4 | Unicode erlaubt | ✅ | keine Zeichenbeschränkung |
| 2.1.5 | Passwort ändern möglich | ❌ | nur über „Passwort vergessen“ → **Befund PT-F-04** |
| 2.1.6 | Ändern verlangt das alte Passwort | N/A | folgt aus 2.1.5 |
| 2.1.7 | Abgleich mit geleakten Passwörtern | ✅ | lokale Blockliste (`passwordBlocklistFile`), AT-SEC-003 |
| 2.1.8 | Stärkeanzeige | ❌ | keine Anzeige → **Befund PT-F-05** |
| 2.1.9 | Keine Kompositionsregeln | ✅ | `checkPassword` (`identity/domain.ts:55`) |
| 2.1.10 | Kein erzwungener Wechsel | ✅ | nicht vorhanden |
| 2.1.11 | Einfügen und Passwortmanager erlaubt | ✅ | `autoComplete="current-password"`/`"new-password"` (`routes/auth.tsx`) |
| 2.1.12 | Passwort anzeigen möglich | ❌ | kein Umschalter → **Befund PT-F-05** |
| 2.2.1 | Schutz vor Automatisierung | ✅ | 5 Fehlversuche je (Konto, IP) in 15 min, atomar (PT-AUTH-04, AT-SEC-005) |
| 2.2.2 | Schwache Faktoren nur als Zusatz | ✅ | keine SMS- oder E-Mail-Codes als Faktor |
| 2.2.3 | Benachrichtigung nach Änderung der Zugangsdaten | ❌ | keine Mail nach Passwort-Reset → **Befund PT-F-06** |
| 2.3.1 | Initiale Zugangsdaten zufällig und befristet | ✅ | Links mit 256 Bit, befristet, einmalig (PT-TOK-01/02) |
| 2.4.1 | Passwörter gesalzen gehasht | ✅ | Argon2id (`identity/service.ts:14`) |
| 2.4.2 | Salz mindestens 32 Bit | ✅ | Argon2-Standard 128 Bit |
| 2.4.4 | Rechenaufwand angemessen | ✅ | m = 19 MiB, t = 2, p = 1 (OWASP-Minimum für Argon2id) |
| 2.4.5 | Zusätzliche Ableitung mit Geheimnis (Pepper) | ◐ | kein Pepper für Passwort-Hashes; Ausnahme bis Go-live, siehe PT-F-07 |
| 2.5.1 | Geheimnis für die Wiederherstellung nicht im Klartext gespeichert | ✅ | nur Token-Hash (`identity/domain.ts:79`) |
| 2.5.2 | Keine Passworthinweise oder Wissensfragen | ✅ | nicht vorhanden |
| 2.5.3 | Passwort wird nie angezeigt | ✅ | Reset per Link |
| 2.5.4 | Keine geteilten oder Standardkonten | ◐ | Demo-Konten mit gemeinsamem Passwort nur im Demo-Modus; Go-live-Checkliste verlangt `SEED_DEMO=false` |
| 2.5.5 | Benachrichtigung bei Faktorwechsel | ❌ | wie 2.2.3, PT-F-06 |
| 2.5.6 | Sicheres „Passwort vergessen“ | ✅ | gleiche Antworten, Token einmalig, alle Sitzungen beendet (`identity/service.ts:329`), PT-AUTH-03 |
| 2.7–2.9 | Einmalcodes, OTP, kryptografische Faktoren | N/A | keine zweiten Faktoren; MFA über das Hochschul-SSO (ADR-0013); Ausnahme siehe 4.3.1 |
| 2.10.1–2.10.4 | Dienstkonten ohne Standard-Zugangsdaten | ◐ | DB-Passwort per Variable, Demo-Wert in `compose.yaml`; Go-live-Checkliste: ersetzen |

## V3 Sitzungsverwaltung

| ASVS | Kontrolle | Status | Beleg |
|---|---|---|---|
| 3.1.1 | Keine Sitzungs-Token in URLs | ✅ | nur Cookie `cm_session` |
| 3.2.1 | Neues Token bei Anmeldung | ✅ | `newToken()` je Login, PT-SESS-01 (Fixation) |
| 3.2.2 | Mindestens 64 Bit Entropie | ✅ | 256 Bit (`identity/domain.ts:75`) |
| 3.2.3 | Sichere Ablage im Browser | ✅ | Cookie `HttpOnly; Secure; SameSite=Lax`, PT-SESS-02 |
| 3.2.4 | Erzeugung mit CSPRNG | ✅ | `randomBytes` |
| 3.3.1 | Abmelden beendet die Sitzung serverseitig | ✅ | `identity/service.ts:282`, PT-SESS-03 |
| 3.3.2 | Erneute Anmeldung nach höchstens 12 h bzw. 30 min Leerlauf (L2) | ◐ | 30 Tage absolut, keine Leerlaufgrenze; **Ausnahme** bis SSO (Threat Model T-09), PT-F-08 |
| 3.3.3 | Andere Sitzungen nach Passwortwechsel beenden | ✅ | Reset löscht alle Sitzungen (`:329`) |
| 3.3.4 | Aktive Sitzungen einsehen und beenden | ◐ | Sitzungsliste nur im Datenexport, kein „Überall abmelden“ → PT-F-08 |
| 3.4.1 | Cookie mit `Secure` | ✅ | `COOKIE_SECURE=true` |
| 3.4.2 | Cookie mit `HttpOnly` | ✅ | `identity/routes.ts:28` |
| 3.4.3 | Cookie mit `SameSite` | ✅ | `Lax` |
| 3.4.4 | Präfix `__Host-` | ❌ | Name `cm_session` ohne Präfix → **Befund PT-F-09** |
| 3.4.5 | Pfad und Domain eng | ✅ | `Path=/`, keine Domain |
| 3.5.x | Token-basierte Sitzungen (JWT) | N/A | serverseitige Sitzungen |
| 3.7.1 | Erneute Anmeldung vor kritischen Änderungen | ◐ | Kontolöschung verlangt das Passwort (`DeleteAccountBody`); Rollenwechsel und DAC7 ohne erneute Bestätigung → PT-F-10 |

## V4 Zugriffskontrolle

| ASVS | Kontrolle | Status | Beleg |
|---|---|---|---|
| 4.1.1 | Durchsetzung serverseitig | ✅ | `requireAuth`/`requireRole`, `participant()` |
| 4.1.2 | Attribute nicht manipulierbar | ✅ | Rolle aus der Sitzung; Mass Assignment wirkungslos (PT-AC-07, PT-INJ-04) |
| 4.1.3 | Geringste Rechte | ✅ | drei Rollen, Admin-Funktionen nur für Admin (PT-AC-05) |
| 4.1.5 | Sicheres Fehlverhalten | ✅ | Fremde bekommen 404, keine Existenzpreisgabe (QS-2) |
| 4.2.1 | Schutz vor IDOR | ✅ | PT-AC-01/02/08/10/11, AT-SEC-006 |
| 4.2.2 | CSRF-Schutz | ✅ | Schutz-Header und Origin-Prüfung (`server.ts:99-104`), PT-CSRF-01…04, AT-SEC-004 |
| 4.3.1 | MFA für Verwaltungsoberflächen | ◐ | **Ausnahme**: MFA über das Hochschul-SSO (ADR-0013), bis Go-live |
| 4.3.2 | Kein Verzeichnis-Listing | ✅ | `@fastify/static` ohne Listing, unbekannte Pfade 404 |
| 4.3.3 | Zusätzliche Freigabe für wertvolle Aktionen (L2) | ◐ | Vier-Augen bei Widersprüchen (RV-C-01); Rollenwechsel ohne zweite Person → PT-F-10 |

## V5 Validierung, Bereinigung, Kodierung

| ASVS | Kontrolle | Status | Beleg |
|---|---|---|---|
| 5.1.1 | HTTP Parameter Pollution | ✅ | Schemaprüfung; doppelte Query-Werte verworfen |
| 5.1.2 | Mass Assignment | ✅ | `additionalProperties` je Schema, PT-AC-07 |
| 5.1.3 | Validierung per Positivliste | ✅ | TypeBox (Enums, Längen, Formate) |
| 5.1.4 | Strukturierte Daten typisiert | ✅ | UUID, Timestamp und E-Mail als Formate |
| 5.1.5 | Weiterleitungen nur auf erlaubte Ziele | ✅ | `redirect`-Parameter nur als Pfad der eigenen SPA (`router.tsx`); keine serverseitigen Weiterleitungen auf Nutzerziele |
| 5.2.1 | HTML aus Nutzereingaben bereinigt | ✅ | kein Nutzer-HTML; Markdown nur aus dem Repo, `skipHtml` (ADR-0015) |
| 5.2.2 | Unstrukturierte Daten bereinigt | ✅ | Texte als Text gerendert (React) |
| 5.2.3 | Keine Mail-Injection | ✅ | Empfänger nur aus der DB, Werte in Vorlagen escaped (PT-INJ-05) |
| 5.2.4 | Kein `eval` und keine dynamische Codeausführung | ✅ | nicht vorhanden; CSP ohne `unsafe-eval` |
| 5.2.5 | Keine Template-Injection | ✅ | PT-INJ-01, ZAP 90035/90036 |
| 5.2.6 | SSRF | ✅ | keine Abrufe auf vom Nutzer gelieferte URLs |
| 5.2.7 | SVG und skriptfähige Inhalte | ✅ | SVG abgelehnt (PT-UP-01) |
| 5.2.8 | Skriptfähige Vorlagen | N/A | keine |
| 5.3.1 | Kontextgerechte Kodierung | ✅ | React, HTML-Escaping in Mails und statischen Seiten |
| 5.3.3 | Schutz vor XSS | ✅ | CSP `script-src 'self'`, kein `dangerouslySetInnerHTML`; `style-src` ohne `unsafe-inline` (im Pentest gehärtet) |
| 5.3.4 | Parametrisierte Datenbankabfragen | ✅ | `sql`-Template (`platform/sql.ts:25`), PT-INJ-02 |
| 5.3.6 | JSON-Injection | ✅ | `JSON.stringify` bzw. Fastify-Serialisierung |
| 5.3.7–5.3.10 | LDAP, OS-Befehle, Dateipfade, XPath | ✅ | nicht genutzt bzw. UUID-Schema (PT-UP-06); ZAP 90020/90037/6 |
| 5.5.1–5.5.4 | Deserialisierung, XML/XXE | ✅ | nur JSON; ZAP 90023 bestanden |

## V6 Kryptografie

| ASVS | Kontrolle | Status | Beleg |
|---|---|---|---|
| 6.1.1 | Personenbezogene Daten verschlüsselt gespeichert (L2) | N/A | Docker-Beispiel; im Echtbetrieb Volume- bzw. Datenbankverschlüsselung im RZ (EPIC-12); **Ausnahme** bis Go-live |
| 6.2.1 | Sicheres Verhalten bei Kryptofehlern | ✅ | Fehler führen zu 4xx/5xx ohne Details |
| 6.2.2 | Geprüfte Bibliotheken | ✅ | Node `crypto`, `@node-rs/argon2` |
| 6.2.5 | Keine unsicheren Algorithmen | ✅ | SHA-256, HMAC-SHA256, Argon2id |
| 6.3.1 | CSPRNG | ✅ | `randomBytes`, `randomUUID` |
| 6.3.2 | GUIDs als UUIDv4 | ✅ | `randomUUID` |
| 6.4.1 | Geheimnisverwaltung (L2) | ◐ | Pepper und Abmeldeschlüssel zufällig in `platform.setting`, DB-Passwort per Variable; kein Tresor; Ausnahme bis Go-live |
| 6.4.2 | Schlüssel nicht im Code und nicht in Logs | ✅ | Logger maskiert Cookie, Passwort, Token (`platform/logger.ts:8-18`) |

## V7 Fehlerbehandlung und Protokollierung

| ASVS | Kontrolle | Status | Beleg |
|---|---|---|---|
| 7.1.1 | Keine Zugangsdaten oder Sitzungs-Token im Log | ✅ | `redact` und Request-Log ohne Query (`server.ts`, `requestLogEntry`), AT-OPS-002 |
| 7.1.2 | Keine weiteren sensiblen Daten | ✅ | keine IP, E-Mail oder Inhalte; Sicherheitsereignisse nur mit HMAC-Pseudonym (im Pentest ergänzt) |
| 7.1.3 | Sicherheitsereignisse protokolliert | ✅ | `auth.login`, `auth.login_failed`, `auth.login_throttled`, `access_denied`; Moderation im Audit-Log (im Pentest ergänzt) |
| 7.1.4 | Genug Kontext für Untersuchungen | ✅ | Zeitpunkt, Request-ID, Route, Status, Pseudonym |
| 7.2.1 | Authentisierungsentscheidungen protokolliert | ✅ | wie 7.1.3 |
| 7.2.2 | Abgelehnte Zugriffe protokolliert | ✅ | `access_denied` mit Status, Code, Route (`server.ts`, Unit-Test) |
| 7.3.1 | Log-Injection verhindert | ✅ | JSON-Logs (pino) |
| 7.3.4 | Zeit synchronisiert | ✅ | Containerzeit des Hosts, UTC |
| 7.4.1 | Allgemeine Fehlermeldung mit ID | ✅ | Problem Details mit `requestId`, AT-UX-003-2 |
| 7.4.2 | Ausnahmen zentral behandelt | ✅ | `setErrorHandler` |
| 7.4.3 | Letzte Auffangbehandlung | ✅ | 500 ohne Interna; im Pentest gefundenen 500er bei `Origin: null` behoben |

## V8 Datenschutz

| ASVS | Kontrolle | Status | Beleg |
|---|---|---|---|
| 8.1.1 | Sensible Daten nicht in Server-Caches | ✅ | API mit `Cache-Control: no-store` (PT-HDR-02) |
| 8.1.2 | Zwischengespeicherte Kopien bereinigt | ✅ | kein serverseitiger Cache |
| 8.1.3 | Minimale Parameter | ✅ | Schemata ohne Zusatzfelder |
| 8.1.4 | Ungewöhnliche Anfragemengen erkennen | ✅ | Rate-Limits, Upload-Quote (im Pentest ergänzt), Alarme (REQ-OPS-008) |
| 8.2.1 | Anti-Caching-Header | ✅ | wie 8.1.1 |
| 8.2.2 | Keine sensiblen Daten im Browserspeicher | ✅ | nur `cm_locale` (AT-LEGAL-010) |
| 8.2.3 | Daten nach Sitzungsende gelöscht | ✅ | Abfrage-Cache wird beim Logout geleert |
| 8.3.1 | Sensible Daten im Body, nicht in der URL | ◐ | Ausnahme: Abmelde-Token in der URL (RFC 8058), Logs ohne Query; Widerspruchs-Token im Fragment |
| 8.3.2 | Export und Löschung durch Betroffene | ✅ | `/me/export`, `/me/delete` (REQ-ACC-002/003) |
| 8.3.3 | Verständliche Information | ✅ | Datenschutzerklärung (REQ-LEGAL-002) |
| 8.3.4 | Sensible Daten erfasst, Richtlinie vorhanden | ✅ | VVT, TOMs, Löschkonzept |
| 8.3.5 | Zugriff auf sensible Daten protokolliert | ✅ | Audit bei DAC7 und Originaltext entfernter Nachrichten |
| 8.3.6 | Sensible Daten im Speicher bereinigt | N/A | JavaScript-Laufzeit |
| 8.3.7 | Verschlüsselung sensibler Daten (L2) | ◐ | wie 6.1.1, Ausnahme |
| 8.3.8 | Aufbewahrungsfristen umgesetzt | ✅ | Löschläufe, Sicherungen höchstens 28 Tage, Löschjournal (REQ-PRIV-003, AT-AVAIL-003) |

## V9 Kommunikation

| ASVS | Kontrolle | Status | Beleg |
|---|---|---|---|
| 9.1.1 | TLS für alle Verbindungen der Nutzer | ◐ | Profil `proxy` mit TLS und HSTS (AT-OPS-009); Standardstart über `http://localhost` (nur `127.0.0.1`); im Echtbetrieb Pflicht (Go-live-Checkliste) |
| 9.1.2 | Starke Cipher Suites | ✅ | Caddy-Standard (TLS 1.2/1.3, AEAD) |
| 9.1.3 | Nur TLS 1.2 und neuer | ✅ | Caddy-Standard |
| 9.2.1 | Ausgehende TLS-Verbindungen mit geprüften Zertifikaten | N/A | keine ausgehenden Verbindungen außer SMTP im Docker-Netz |
| 9.2.2 | Verschlüsselte Verbindungen zu Backends | ◐ | DB und SMTP im internen Docker-Netz unverschlüsselt; Ausnahme bis Go-live (siehe 1.9.1) |
| 9.2.3 | Authentisierte Backend-Verbindungen | ◐ | DB mit Passwort, SMTP im Beispiel ohne (siehe 1.2.2) |

## V10 Schadcode

| ASVS | Kontrolle | Status | Beleg |
|---|---|---|---|
| 10.2.1 | Kein Abfluss von Daten an fremde Server | ✅ | keine Drittanbieter-Ressourcen (REQ-PRIV-006, AT-PRIV-006) |
| 10.3.1 | Integrität bei Auto-Updates | N/A | keine Selbstaktualisierung; Service Worker nur vom eigenen Ursprung |
| 10.3.2 | Subresource Integrity für fremde Ressourcen | N/A | keine fremden Ressourcen (CSP `'self'`) |
| 10.3.3 | Schutz vor Subdomain-Übernahme | N/A | keine eigenen DNS-Einträge im Beispiel; Echtbetrieb: Go-live-Checkliste |

## V11 Geschäftslogik

| ASVS | Kontrolle | Status | Beleg |
|---|---|---|---|
| 11.1.1 | Abläufe nur in der vorgesehenen Reihenfolge | ✅ | Zustandsmodell Anzeige und Deal (`nextStatus`, AT-LST-006/007), Kontaktfreigabe (`decideContactAction`) |
| 11.1.2 | Realistische Zeiten je Schritt | ✅ | Rate-Limits für Login, Registrierung, Nachrichten, Konversationen |
| 11.1.3 | Grenzen je Geschäftsaktion | ✅ | 30 aktive Anzeigen (`MAX_ACTIVE_LISTINGS`), 3 Kontaktanfragen, 1 Widerspruch je Entscheidung, Upload-Quote |
| 11.1.4 | Schutz vor Massenautomatisierung | ✅ | wie 11.1.2 und 11.1.3 |
| 11.1.5 | Grenzen gegen Missbrauch der Logik | ✅ | 24-h-Sperrfrist Kontaktfreigabe (CR-02), Vier-Augen (RV-C-01) |
| 11.1.6 | Keine Race Conditions (L2) | ✅ | `FOR UPDATE`, eindeutige Indizes (Review v1.1 CR-03, v1.3) |
| 11.1.7 | Überwachung ungewöhnlicher Aktivität (L2) | ◐ | Sicherheitsereignisse im Log, Alarme für Fehlerrate; keine Auswertung je Konto; Ausnahme bis Go-live |
| 11.1.8 | Alarme bei Angriffen (L2) | ◐ | Alertmanager-Regeln für Verfügbarkeit (REQ-OPS-008); keine Regel für Anmelde-Spitzen → Empfehlung PT-F-11 |

## V12 Dateien und Ressourcen

| ASVS | Kontrolle | Status | Beleg |
|---|---|---|---|
| 12.1.1 | Große Dateien abgelehnt | ✅ | 10 MB je Datei, 8 Dateien (PT-UP-04/05) |
| 12.1.2 | Komprimierte Dateien geprüft (L2) | ✅ | `limitInputPixels` 50 MP gegen Dekompressionsbomben; Archive werden nicht angenommen |
| 12.1.3 | Quote je Nutzer (L2) | ✅ | 100 Bilder je Mitglied und Stunde (im Pentest ergänzt, AT-SEC-005, PT-UP-07) |
| 12.2.1 | Dateityp per Inhalt geprüft (L2) | ✅ | Magic Bytes (`sniffImageType`), AT-SEC-007 |
| 12.3.1 | Dateinamen nicht für Pfade genutzt | ✅ | Speicher-Schlüssel aus UUIDs |
| 12.3.2–12.3.6 | Keine Pfadmanipulation, kein Ausführen, kein SSRF | ✅ | PT-UP-06; keine Ausführung hochgeladener Dateien |
| 12.4.1 | Ablage außerhalb des Web-Roots | ✅ | Volume `/data/uploads`, Auslieferung nur über `/media` |
| 12.4.2 | Virenscan der Uploads | ◐ | **Ausnahme** Q-16 (Won't): stattdessen Neukodierung zu WebP |
| 12.5.1 | Nur erlaubte Dateitypen ausgeliefert | ✅ | statische Dateien aus dem Build, Medien nur als WebP |
| 12.5.2 | Uploads nie als HTML oder Skript ausgeliefert | ✅ | `image/webp`, `nosniff`, `Content-Disposition: inline` nur für Bilder (PT-UP-03) |
| 12.6.1 | SSRF-Schutz | N/A | keine serverseitigen Abrufe von Nutzer-URLs |

## V13 API und Webdienste

| ASVS | Kontrolle | Status | Beleg |
|---|---|---|---|
| 13.1.1 | Einheitliche Kodierung | ✅ | UTF-8 JSON |
| 13.1.3 | Keine sensiblen Daten in URLs | ◐ | Ausnahme Abmelde-Token (RFC 8058), siehe 8.3.1; ZAP 10024 „Sensitive Information in URL“ nur dafür |
| 13.1.4 | Autorisierung an URI und Ressource | ✅ | Rolle je Route, Besitz bzw. Teilnahme je Ressource |
| 13.1.5 | Unerwartete Content-Types abgelehnt (L2) | ✅ | Fastify: 415 für unbekannte Typen |
| 13.2.1 | Nur erlaubte HTTP-Methoden | ✅ | Routen nur mit definierten Methoden, sonst 404 |
| 13.2.2 | JSON-Schemaprüfung | ✅ | TypeBox je Route |
| 13.2.3 | CSRF-Schutz für die REST-API | ✅ | wie 4.2.2 |
| 13.2.5 | Content-Type geprüft (L2) | ✅ | wie 13.1.5 |
| 13.2.6 | Header und Herkunft geprüft (L2) | ✅ | Origin-Prüfung, Proxy-Header nur aus einem Hop |
| 13.3.x | SOAP | N/A | – |
| 13.4.x | GraphQL | N/A | – |

## V14 Konfiguration

| ASVS | Kontrolle | Status | Beleg |
|---|---|---|---|
| 14.1.1 | Wiederholbarer Build | ✅ | Multi-Stage-Dockerfile, gepinnte Versionen, Lockfile |
| 14.1.2 | Sichere Compiler-Optionen | N/A | Node.js/TypeScript |
| 14.1.3 | Gehärtete Serverkonfiguration | ✅ | non-root, read-only, nur nötige Ports (CTRL-IMAGE-INSPECT) |
| 14.1.4 | Automatisierte Bereitstellung | ✅ | CI und Compose |
| 14.2.1 | Komponenten aktuell | ✅ | Renovate, SCA-Scan in CI (CTRL-CI-SCAN) |
| 14.2.2 | Unnötige Funktionen entfernt | ◐ | `/api/docs` nur mit `API_DOCS` bzw. im Demo-Modus (im Pentest eingeführt); `/metrics` nur lokal (PT-INFO-01/02, akzeptiert für die Demo) |
| 14.2.3 | Externe Ressourcen nur mit SRI | N/A | keine externen Ressourcen |
| 14.2.4 | Komponenten aus vertrauenswürdigen Quellen | ✅ | npm-Registry mit Lockfile, offizielle Images mit exakten Versionen |
| 14.2.5 | Software-Stückliste (SBOM, L2) | ✅ | SBOM im CI-Job Sicherheitsscans (CTRL-CI-SCAN) |
| 14.2.6 | Angriffsfläche reduziert | ✅ | Ports nur an `127.0.0.1`, Proxy sperrt `/metrics` |
| 14.3.2 | Debug-Modus aus | ✅ | `NODE_ENV=production`, Fehler ohne Stacktrace |
| 14.3.3 | Keine Versionsangaben in Headern | ✅ | weder `Server` noch `X-Powered-By` (PT-HDR-03) |
| 14.4.1 | Content-Type mit Zeichensatz | ✅ | `application/json; charset=utf-8`, `text/html; charset=utf-8` |
| 14.4.2 | API-Antworten mit `Content-Disposition` | ◐ | JSON ohne `Content-Disposition: attachment`; Risiko gering wegen `nosniff` und CSP; Empfehlung PT-F-12 |
| 14.4.3 | Content-Security-Policy | ✅ | ohne `unsafe-inline`/`unsafe-eval`; Inline-CSS statischer Seiten per Hash (im Pentest gehärtet, ZAP 10055 bestanden) |
| 14.4.4 | `X-Content-Type-Options: nosniff` | ✅ | `server.ts:136` |
| 14.4.5 | HSTS | ✅ | Proxy-Profil (AT-OPS-009); im Standardstart ohne TLS nicht anwendbar |
| 14.4.6 | Referrer-Policy | ✅ | `same-origin` |
| 14.4.7 | Kein Einbetten in fremde Seiten | ✅ | `frame-ancestors 'none'`, `X-Frame-Options: DENY` |
| 14.5.1 | Nur erlaubte Methoden | ✅ | wie 13.2.1 |
| 14.5.2 | Origin nicht zur Authentisierung genutzt | ✅ | Origin nur zusätzlich zum Schutz-Header und Cookie |
| 14.5.3 | CORS nur für erlaubte Ursprünge | ✅ | keine CORS-Header, also kein fremder Ursprung erlaubt |
| 14.5.4 | Vom Proxy gesetzte Header vertrauenswürdig | ✅ | `trustProxy` nur ein Hop und nur mit `TRUST_PROXY=true` |

## Auswertung

Die Zahlen unten zählen die Zeilen dieser Checkliste. Zeilen mit Bereichen (z. B. 5.3.7–5.3.10) zählen einfach.

| Status | Anzahl | Anteil an anwendbaren Kontrollen |
|---|---|---|
| ✅ erfüllt | 159 | 84 % |
| ◐ teilweise bzw. Ausnahme | 25 | 13 % |
| ❌ nicht erfüllt | 6 | 3 % |
| N/A | 17 | – |

**Bewertung gegen das Akzeptanzkriterium von REQ-SEC-001** („100 % der anwendbaren Kontrollen erfüllt oder mit begründeter, befristeter Ausnahme; 0 offene hohe Befunde aus dem Pentest“):
- **Pentest:** keine hohen oder kritischen Befunde.
- **Ausnahmen:** Alle ◐-Kontrollen sind begründet und bis zum Go-live befristet. Freigabe fiktiv durch security-lead am 2026-10-26.
- **Nicht erfüllt:** Die ❌-Kontrollen sind Komfort- und Härtungslücken mit niedrigem Risiko (Pentest-Befunde PT-F-04 bis PT-F-06 und PT-F-09). Sie sind ins Backlog übernommen (siehe [MAN-SEC-013](MAN-SEC-013.md), Abschnitt Empfehlungen).
- **Ergebnis:** REQ-SEC-001 ist **bedingt erfüllt**. Für „erfüllt“ müssen die ❌-Kontrollen behoben oder als befristete Ausnahme genehmigt sein.

## Review-Vermerk

| Rolle | Name (fiktiv) | Datum | Ergebnis |
|---|---|---|---|
| security-lead | Dr. Erika Mustermann | 2026-10-26 | Checkliste geprüft; Ausnahmen bis Go-live genehmigt |
| qa-lead | Jonas Beispiel | 2026-10-26 | Belege stichprobenartig nachvollzogen (Tests, ZAP-Berichte) |
