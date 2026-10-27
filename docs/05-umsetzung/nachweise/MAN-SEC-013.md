---
id: MAN-SEC-013
type: evidence
status: done
owner: security-lead
version: 1.0
created: 2026-10-26
last_updated: 2026-10-26
---

# MAN-SEC-013: Abschlussbericht Penetrationstest (Übung)

> **Übung, kein externer Penetrationstest.** Das Team hat den Test selbst nach dem [Pentest-Plan](../../07-betrieb/pentest-plan.md) durchgeführt. Vor einem Echtbetrieb ersetzt ihn ein unabhängiger Test (REQ-SEC-013, Go-live-Checkliste). Alle Namen und Firmen sind fiktiv.

## 1. Management Summary

CampusMarkt wurde am 2026-10-26 in einer Grey-Box-Prüfung getestet. Grundlage waren das Docker-Beispiel mit Demo-Daten, Testkonten je Rolle und Zugriff auf den Quellcode.

- **Kritische oder hohe Befunde:** keine.
- **Behoben während des Tests (7 Befunde, alle mit Nachtest):**
  - fehlende Upload-Quote (mittel)
  - Serverfehler bei `Origin: null` (niedrig)
  - Bilder von Anzeigen in Prüfung bei bekannter ID abrufbar (niedrig)
  - Klartext-Adressen in zwei Rate-Limit-Schlüsseln (niedrig)
  - fehlende Sicherheitsereignisse im Log (niedrig)
  - CSP mit `style-src 'unsafe-inline'` (niedrig)
  - fehlende Cross-Origin-Isolation (informativ)
- **Offen (9 Befunde, niedrig bzw. Empfehlung):** Komfort- und Härtungslücken aus dem ASVS-Abgleich, unter anderem kein Passwortwechsel im Profil, kein `__Host-`-Präfix und eine lange Sitzungsdauer. Sie gehen ins Backlog.
- **Akzeptiert für das Docker-Beispiel (2 Befunde):** öffentliche API-Doku im Demo-Modus und `/metrics` am lokalen App-Port.

| Ergebnis | Wert |
|---|---|
| Gezielte Prüfungen (Skript) | 49, davon 47 bestanden; die 2 übrigen sind akzeptierte Demo-Befunde |
| ZAP Baseline (passiv, Spider 3 min) | 0 FAIL, 63 PASS, 4 WARN (informativ) |
| ZAP API-Scan (aktiv, angemeldet als Mitglied, 50 Pfade) | 0 FAIL, 114 PASS, 2 WARN (informativ) |
| Serverfehler (HTTP 500) während aller Scans | 0 |
| Regressionstests nach Korrekturen | 238 Unit-Tests, 31 E2E, Smoke-Test vollständig grün |

**Bewertung:** Nach dem Pentest-Plan kann das System aus Sicht dieser Übung in den Probebetrieb gehen. Die Bedingung dafür ist erfüllt: keine offenen kritischen oder hohen Befunde, mittlere behoben.

## 2. Umfang und Rahmen

| Punkt | Festlegung |
|---|---|
| Ziel | Docker-Beispiel, Stack `cmh2` (app, db, mailpit), Image neu gebaut aus `feature/fallstudie-req-c4` |
| Zeitraum | 2026-10-26 (Übungswert statt KW 10/2027 laut Plan) |
| Methode | Grey-Box; OWASP WSTG; Prüfkatalog ASVS 4.0.3 Level 2 ([MAN-SEC-001](MAN-SEC-001.md)); Bedrohungen aus dem [Threat Model](../../03-architektur/threat-model.md) |
| Konten | Mitglieder Lea, Ben, Mia, Jonas; Moderator `mod`; Admin `admin`; frisch registrierte Testkonten |
| Werkzeuge | eigenes Prüfskript (Node.js, 49 Prüfungen, Ergebnis in [`pentest-results.json`](pentest-results.json)); OWASP ZAP 2.16.1 (`zap-baseline.py`, `zap-api-scan.py` mit OpenAPI und Sitzungs-Cookie); Playwright/Edge für CSP-Prüfungen im Browser |
| Im Umfang | Web-App, REST-API, WebSocket `/ws`, Uploads, Widerspruch und Einmal-Links, Moderation, Admin inkl. DAC7, Wartungsmodus, Header und Konfiguration |
| Nicht im Umfang | Proxy-Profil (TLS/HSTS separat durch AT-OPS-009 geprüft), Lasttests, Social Engineering, Infrastruktur des RZ |
| Notfallkontakt (fiktiv) | Musterprüf GmbH, +49 621 555-0150 |

## 3. Methodik

1. **Automatisierter Basisscan:** ZAP Baseline auf die SPA und die öffentlichen Seiten.
2. **Angemeldeter API-Scan:** ZAP-Aktivscan über alle Pfade der OpenAPI-Beschreibung, als Mitglied. Das Sitzungs-Cookie und der CSRF-Header wurden per Replacer gesetzt. `/auth/logout` und `/me/delete` sind ausgenommen, damit die Sitzung während des Scans bestehen bleibt.
3. **Gezielte Angriffe** nach den Schwerpunkten des Plans:
   - Anmeldung und Konten erkennen
   - Sitzung
   - CSRF
   - IDOR und Rollen
   - Upload
   - Injection und XSS
   - Tokens
   - WebSocket
   - Umgehen des Wartungsmodus
   - Header und Informationspreisgabe
4. **Code-Durchsicht** der betroffenen Stellen, Abgleich mit ASVS L2.
5. **Korrektur und Nachtest:** Jeder behobene Befund hat einen Regressionstest. Danach liefen alle Prüfungen erneut auf einem frisch gebauten Stack.

**Einstufung:** Der Schweregrad folgt einem CVSS-3.1-ähnlichen Basiswert.

| Schweregrad | Basiswert |
|---|---|
| kritisch | ≥ 9,0 |
| hoch | 7,0–8,9 |
| mittel | 4,0–6,9 |
| niedrig | 0,1–3,9 |
| informativ | 0 |

## 4. Befunde

### 4.1 Behoben während des Tests

| ID | Schwere (CVSS) | Befund | Reproduktion | Korrektur | Nachtest |
|---|---|---|---|---|---|
| PT-F-03 | mittel (4,3 · AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:N/A:L) | Keine Upload-Quote je Mitglied: Ein Mitglied kann unbegrenzt Bilder hochladen und den Speicher füllen. | 13 × 8 Bilder an `POST /uploads` → alle 201 | Quote 100 Bilder je Mitglied und Stunde (`listings/domain.ts` `UPLOAD_QUOTA`, `listings/service.ts`) | Smoke-Test `[AT-SEC-005] Upload-Quote …`, PT-UP-07: 13. Anfrage → 429 |
| PT-F-01 | niedrig (3,7 · AV:N/AC:H/PR:N/UI:N/S:U/C:N/I:N/A:L) | `Origin: null` (Sandbox-iframe, Datenschutz-Browser) führte bei schreibenden Anfragen zu HTTP 500 statt 403. Der CSRF-Schutz war nicht umgehbar, aber der Fehlerpfad war ungeprüft. Gleiches Muster beim WebSocket-Handshake. | `PATCH /api/v1/me` mit `Origin: null` und Schutz-Header → 500 | Gemeinsame Funktion `isSameOrigin` (`platform/http/auth.ts`); nicht parsebare Origins gelten als fremd (CSRF und `/ws`) | Unit-Test `[AT-SEC-004] CSRF: Origin-Prüfung ohne Serverfehler`; PT-CSRF-03 → 403 |
| PT-F-02 | niedrig (3,1 · AV:N/AC:H/PR:L/UI:N/S:U/C:L/I:N/A:N) | Bilder einer Anzeige, die der Wortfilter in die Prüfung geschickt hat, waren bei bekannter Bild-ID für andere Mitglieder abrufbar. Die Anzeige selbst war korrekt verborgen. | Bild-ID der eigenen Anzeige in Prüfung als anderes Mitglied an `GET /media/<id>/sm` → 200 | Sichtbarkeit der Bilder wie bei der Anzeige: in Prüfung, entfernt, ausgeblendet oder gesperrt nur für Anbieter und Moderation (`MEDIA_HIDDEN_STATUSES`) | Smoke-Test `[AT-SEC-006] Autorisierung: Bild einer Anzeige in Prüfung …`; PT-AC-11 → 404 |
| PT-F-16 | niedrig (2,7 · Zugriff auf die DB nötig) | Rate-Limit-Schlüssel für „Bestätigung erneut senden“ und „Passwort zurücksetzen“ enthielten die E-Mail-Adresse im Klartext. Das widersprach ADR-0014 und der Datenschutzerklärung. | `SELECT key FROM platform.rate_limit` nach einem Reset-Antrag | Schlüssel mit HMAC-Pseudonym (`identity/service.ts`, `resend:`/`reset:`) | DB-Abfrage: neue Schlüssel nur noch als Pseudonym |
| PT-F-15 | niedrig | Keine Sicherheitsereignisse im Log (Anmeldung, Fehlversuch, Drosselung, verweigerter Zugriff). ASVS 7.1.3, 7.2.1, 7.2.2 | Log-Durchsicht | Ereignisse `auth.login`, `auth.login_failed`, `auth.login_throttled`, `access_denied`, nur mit täglich wechselndem Pseudonym, ohne IP oder Adresse (REQ-OPS-002) | Unit-Test im Log-Test (AT-OPS-002); Log nach Smoke- und Pentest-Lauf: 65 × `access_denied`, 13 × `auth.login_failed`, 8 × `auth.login_throttled`, keine IP |
| PT-F-13 | niedrig (ZAP 10055, „Medium“) | CSP mit `style-src 'unsafe-inline'` | ZAP Baseline | `style-src 'self'`; die statischen Seiten (Wartung, Abmeldung) erlauben ihren festen `<style>`-Block per SHA-256-Hash (`cspFor`, `server.ts`) | Unit-Tests `[AT-PRIV-006-2] CSP ohne unsafe-inline …`; Browserprüfung von 18 Seiten ohne CSP-Verletzung; ZAP 10055 bestanden |
| PT-F-14 | informativ (ZAP 90004) | Keine Cross-Origin-Isolation (Spectre) | ZAP Baseline | `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`, `Cross-Origin-Embedder-Policy` (außer `/api/docs`) | Unit-Test „Isolations-Header“; ZAP 90004 bestanden; E2E 31/31 |

Zusätzlich gehärtet: Die interaktive API-Doku ist nur noch mit `API_DOCS=true` aktiv; der Standardwert folgt `DEMO_MODE` (siehe PT-F-17).

### 4.2 Offen (Backlog)

| ID | Schwere | Befund | Empfehlung |
|---|---|---|---|
| PT-F-04 | niedrig | Kein Passwortwechsel im Profil, nur über „Passwort vergessen“ (ASVS 2.1.5/2.1.6) | `POST /me/password` mit altem Passwort, danach andere Sitzungen beenden |
| PT-F-05 | niedrig | Keine Stärkeanzeige und kein „Passwort anzeigen“ (ASVS 2.1.8, 2.1.12) | Umschalter und einfache Stärkeanzeige im Formular |
| PT-F-06 | niedrig | Keine Mail nach einer Passwortänderung (ASVS 2.2.3, 2.5.5) | Hinweismail „Dein Passwort wurde geändert“ mit Link zum Zurücksetzen |
| PT-F-07 | niedrig | Kein Pepper für Passwort-Hashes (ASVS 2.4.5) | Pepper analog ADR-0014 bzw. erledigt mit SSO |
| PT-F-08 | niedrig | Sitzung 30 Tage ohne Leerlaufgrenze; keine Übersicht „aktive Sitzungen / überall abmelden“ (ASVS 3.3.2, 3.3.4) | Leerlaufgrenze und Sitzungsübersicht; mit SSO nach dessen Regeln (Threat Model T-09) |
| PT-F-09 | niedrig | Cookie ohne `__Host-`-Präfix (ASVS 3.4.4) | `__Host-cm_session`; dabei Tests und Datenschutzerklärung anpassen |
| PT-F-10 | niedrig | Rollenwechsel und DAC7-Export ohne erneute Bestätigung bzw. zweite Person (ASVS 3.7.1, 4.3.3) | erneute Passwortabfrage bzw. Vier-Augen für Rollenwechsel |
| PT-F-11 | Empfehlung | Kein Alarm bei Häufungen fehlgeschlagener Anmeldungen (ASVS 11.1.8) | Metrik aus `auth.login_failed`/`auth.login_throttled` und Alarmregel |
| PT-F-12 | Empfehlung | JSON-Antworten ohne `Content-Disposition: attachment` (ASVS 14.4.2) | Header für `/api/*` ergänzen |

### 4.3 Für das Docker-Beispiel akzeptiert

| ID | Schwere | Befund | Begründung | Bedingung für den Echtbetrieb |
|---|---|---|---|---|
| PT-F-17 | informativ | `/api/docs` ohne Anmeldung (PT-INFO-01) | Im Demo-Modus gewollt (README); ohne Demo-Modus aus | `DEMO_MODE=false`, `API_DOCS` nicht setzen |
| PT-F-18 | informativ | `/metrics` am App-Port ohne Anmeldung (PT-INFO-02) | Port nur an `127.0.0.1`, am Proxy 404, Monitoring scrapt intern | App-Port nicht veröffentlichen (Go-live-Checkliste) |
| – | informativ | One-Click-Abmeldelink mit Token in der URL (ZAP 10024) | RFC 8058 verlangt die URL; Logs ohne Query | – |

## 5. Bestandene Prüfungen (Auszug)

| Bereich | Ergebnis |
|---|---|
| Konten erkennen | Login, Registrierung und Reset antworten gleich (PT-AUTH-01…03); Laufzeitunterschied < 250 ms durch Dummy-Hash |
| Brute Force | 12 parallele Fehlversuche: höchstens 5 geprüft, Rest 429 (PT-AUTH-04) |
| Sitzung | Fixation verhindert, Cookie-Attribute korrekt, Abmelden serverseitig (PT-SESS-01…03) |
| CSRF | ohne Header, fremder Origin, Formular-POST → 403 (PT-CSRF-01…04) |
| IDOR und Rollen | fremde Anzeigen, Konversationen, Deals, Mitteilungen, Widersprüche; Mitglied bzw. Moderator auf Admin-Funktionen → 403/404 (PT-AC-01…11) |
| Upload | SVG, HTML, Polyglot, > 10 MB, > 8 Dateien, Pfad-Traversal abgewiesen bzw. neutralisiert (PT-UP-01…07) |
| Injection | SQL, Template, Prototype Pollution, kaputtes JSON, HTML in Mails ohne Wirkung (PT-INJ-01…05); ZAP: keine Treffer bei SQLi, XSS, SSTI, Command Injection, XXE, Path Traversal |
| Tokens | Bestätigungs- und Reset-Links einmalig; geratene Widerspruchs- und Abmelde-Tokens → 404 (PT-TOK-01…04) |
| WebSocket | ohne Sitzung und mit fremdem Origin kein Kanal (PT-WS-01…03) |
| Wartungsmodus | 9 Pfad-Tricks liefern 503/404, Anmeldung bleibt möglich (PT-MNT-01) |
| Header | CSP ohne `unsafe-*`, `frame-ancestors 'none'`, `nosniff`, `X-Frame-Options`, Referrer-Policy, `no-store` für die API, keine Versionsbanner (PT-HDR-01…03) |

## 6. Empfehlungen und Backlog

- **Backlog:** PT-F-04 bis PT-F-12 übernehmen. Vorschlag: ein Eintrag „Konto-Sicherheit (Passwortwechsel, Benachrichtigung, Sitzungsübersicht, `__Host-`-Cookie)“ und einer „Sicherheitsalarme und Härtung (Alarm Anmelde-Spitzen, `Content-Disposition`)“.
- **Vor einem Echtbetrieb:**
  - unabhängigen Pentest beauftragen (REQ-SEC-013);
  - Ausnahmen aus [MAN-SEC-001](MAN-SEC-001.md) schließen, also TLS intern, Verschlüsselung im Ruhezustand, Geheimnistresor und MFA über SSO.
- **Wiederholung:** Das Prüfskript und die ZAP-Aufrufe sind wiederholbar (Abschnitt 7) und sollten vor jeder Abgabe laufen. Ein CI-Job wäre möglich, kostet aber etwa 2 min Laufzeit.

## 7. Reproduktion

```bash
# frischer Stack
docker compose -p cmh2 down -v
APP_PORT=8090 MAILPIT_PORT=8033 docker compose -p cmh2 up --build -d --wait
# ZAP Baseline im Docker-Netz des Stacks
docker run --rm --network cmh2_default -v "$PWD/zap:/zap/wrk" ghcr.io/zaproxy/zaproxy:2.16.1 \
  zap-baseline.py -t http://app:8080 -m 3 -J baseline.json -I
# ZAP API-Scan, angemeldet (Cookie aus POST /api/v1/auth/login, CSRF-Header per Replacer)
docker run --rm --network cmh2_default -v "$PWD/zap:/zap/wrk" ghcr.io/zaproxy/zaproxy:2.16.1 \
  zap-api-scan.py -t /zap/wrk/openapi-auth.json -f openapi -O http://app:8080 -J api.json -I \
  -z "-config replacer.full_list(0).matchtype=REQ_HEADER -config replacer.full_list(0).matchstr=Cookie \
      -config replacer.full_list(0).replacement=cm_session=… -config replacer.full_list(0).enabled=true …"
```

`openapi-auth.json` ist die OpenAPI-Beschreibung aus `/api/docs/json` ohne `/auth/logout` und `/me/delete`. Die gezielten Prüfungen stehen mit Ergebnis in [`pentest-results.json`](pentest-results.json). Das Prüfskript selbst ist nicht im Repository (Übung). Die ZAP-Zusammenfassungen liegen in [`zap/baseline.json`](zap/baseline.json) und [`zap/api-summary.json`](zap/api-summary.json); die vollständigen HTML-Berichte sind wegen ihrer Größe (bis 2,7 MB) nicht abgelegt.

## Abnahme

| Rolle | Name (fiktiv) | Datum | Ergebnis |
|---|---|---|---|
| security-lead | Dr. Erika Mustermann | 2026-10-26 | Bericht abgenommen; keine offenen kritischen, hohen oder mittleren Befunde |
| Prüfer (Übung) | Team CampusMarkt | 2026-10-26 | Test durchgeführt, Nachtest bestanden |
