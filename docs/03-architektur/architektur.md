---
id: ARC-001
type: architecture
status: draft
owner: team-architektur
version: 1.3
created: 2026-10-20
last_updated: 2026-10-25
review_due: 2027-01-31
---

# Architekturdokumentation CampusMarkt (arc42, kompakt)

> **v1.3:** Befunde aus dem [Review v1.3](../04-review/review-v1.3-recht-betrieb.md) eingearbeitet: Stand der EPIC-13-Bausteine auf „umgesetzt“, Modul `reporting`, Datenmodell nach Migration 0003/0004 (Mitteilungen, Einmal-Links, Beweissicherung, Rechtsgrundlage, Pseudonymisierungsschlüssel), Vier-Augen-Regel vollständig, Einmal-Link im Fragment, Löschjournal und Restore mit Rückfall, Alarmregeln ohne Fehlalarme, QS-16 auf 5 min.
>
> **v1.2:** Recht, Auftritt und Betrieb als Übung mit Platzhaltern (EPIC-13, Q-23): Rechtstexte als versionierte Markdown-Inhalte ([ADR-0015](decisions/0015-rechtstexte-als-markdown.md)), englische Oberfläche ([ADR-0016](decisions/0016-internationalisierung.md)), optionale Compose-Profile für Reverse Proxy mit TLS/HSTS und Überwachung ([ADR-0017](decisions/0017-optionale-betriebsprofile.md)), Datensicherung mit getesteter Wiederherstellung ([ADR-0018](decisions/0018-datensicherung.md)). Neu: DSA-Begründung und Widerspruch (Vier-Augen), Wartungsmodus und Statusseite, DAC7-Auswertung, Fehlerseiten mit korrekten Statuscodes, Laufzeitsichten 6.5/6.6, Verteilungssicht 7.3, Querschnitt 8.8–8.11. Alle neuen Bausteine sind **geplant** (Spalte „Stand“ mit Backlog-ID B-43 … B-58; Sprint-Zuordnung im [Backlog](../02-anforderungen/03-backlog.md)). Prozessartefakte: [Recht](../06-recht/README.md), [Betrieb](../07-betrieb/README.md).
>
> **v1.1:** Befunde aus dem [Architektur-Review v1.0](../04-review/review-v1.0-architektur.md) behoben: Soll und Ist getrennt (Spalte „Stand“ mit Backlog-ID), Datenbankzugriff und Modulabhängigkeiten in der Komponentensicht, Löschung und Anonymisierung im Datenmodell, Schlüsselkonzept für die IP-Pseudonymisierung ([ADR-0014](decisions/0014-ip-pseudonymisierung.md)), Laufzeitsichten an den Code angeglichen, Qualitätsszenarien an die Anforderungen angeglichen.
>
> **v1.0:** Bausteinsicht, Kontext und Verteilung im **C4-Modell** (Mermaid-C4, [ADR-0012](decisions/0012-c4-notation.md)); angeglichen an Anforderungen v1 und die Fallstudie (Kontaktfreigabe, Anmeldung hinter `IdentityProviderPort`, [ADR-0013](decisions/0013-anmeldung-identity-provider-port.md)).
>
> **v0.2:** Kein öffentliches Hosting. Das Ergebnis ist ein lauffähiges **Docker-Beispiel** ([ADR-0010](decisions/0010-docker-demo-deployment.md)). Betriebsthemen für einen späteren Echtbetrieb stehen in EPIC-12 im [Backlog](../02-anforderungen/03-backlog.md).

**Soll und Ist.** Diese Architektur beschreibt den Zielzustand für Release R1. Wo ein Baustein noch nicht umgesetzt ist, nennt die Spalte bzw. Markierung **„Stand“** den Backlog-Eintrag und den Sprint (z. B. „geplant B-01, Sprint 1“). Der Umsetzungsstand je Anforderung steht im generierten [Katalog-Index](../02-anforderungen/02-anforderungen.md#6-katalog-index).

## 1. Einführung und Ziele

### 1.1 Aufgabenstellung
Ein Marktplatz für Angehörige der HWG LU zum Verkaufen, Tauschen, Verschenken und Suchen von Gegenständen. Er hat einen integrierten Chat und versendet E-Mails. Der Zugang ist auf verifizierte Hochschuladressen beschränkt. Ausgeliefert wird er als lokal startbares Docker-Setup. Details: [Use Cases](../02-anforderungen/01-use-cases.md), [Anforderungen](../02-anforderungen/02-anforderungen.md).

### 1.2 Qualitätsziele (Top 5, priorisiert)

| Prio | Qualitätsmerkmal (ISO 25010) | Ziel | Szenario |
|---|---|---|---|
| 1 | **Sicherheit** (Authentizität, Vertraulichkeit) | Nur Hochschulangehörige, private Chats bleiben privat, Kontaktdaten nur nach beidseitiger Zustimmung | QS-1, QS-2, QS-10, QS-13, QS-14 |
| 2 | **Wartbarkeit** (Modularität, Erweiterbarkeit) | Bezahlung, weitere Hochschulen und Produktivbetrieb ohne Umbau der Fachlogik | QS-5, QS-6, QS-8 |
| 3 | **Portabilität** (Installierbarkeit) | Image-Build ≤ 10 min (mit Internet); danach `docker compose up` bis zum Login mit Demo-Konto ≤ 3 min, offline, ohne externe Konten (REQ-OPS-003) | QS-9 |
| 4 | **Zuverlässigkeit** | Keine verlorenen Nachrichten oder E-Mails | QS-3, QS-4, QS-12 |
| 5 | **Benutzbarkeit** (inkl. Barrierefreiheit) | Anzeige in < 2 min, WCAG 2.2 AA, Kernabläufe vollständig per Tastatur | REQ-LST-001, REQ-A11Y-001, REQ-A11Y-002, QS-11 |

### 1.3 Stakeholder

| Rolle | Erwartung |
|---|---|
| Studierende, Beschäftigte (Zielnutzer, im Projekt durch Personas und Testnutzer vertreten) | Einfach, sicher, kostenlos |
| Projektteam (Studierende SWeng) | Machbar im Semester, gut lernbar, guideline-konform |
| Dozent/in, Prüfer/in | Nachvollziehbare Methodik (UML, arc42, C4, ADRs, Traceability), Demo mit einem Befehl startbar |

## 2. Randbedingungen

| Typ | Randbedingung |
|---|---|
| Organisatorisch | Studienprojekt, kleines Team, Semester-Zeitrahmen, kein Budget |
| Organisatorisch | DEV Guideline ist verbindlich. Abweichungen nur per ADR oder Exception |
| **Technisch** | **Kein öffentliches Hosting. Auslieferung als Docker-Image + Compose-Datei, lokal lauffähig, ohne Internetzugang** (ADR-0010) |
| Technisch | Web-first (PWA). Keine native App |
| Rechtlich | Kein Produktivbetrieb. DSGVO, DSA und BITV werden **konzeptionell** berücksichtigt (Privacy by Design). Betreiberpflichten (Impressum, Datenschutzerklärung, Nutzungsbedingungen, Barrierefreiheitserklärung, DSA-Prozesse, DAC7) werden als **Übung mit Platzhaltern** umgesetzt; Betreiber im Muster ist die Hochschule als öffentliche Stelle in Rheinland-Pfalz (Q-23, [Rechtskataster](../06-recht/rechtskataster.md)). Kein Rechtsrat; vor einem Echtbetrieb prüft der/die Datenschutzbeauftragte |
| Fachlich | Domain-Whitelist `hwg-lu.de`, `studmail.hwg-lu.de` |
| Fallstudie (MWI131) | Kontaktdaten erst nach beidseitiger Zustimmung (C-01), Tastaturbedienbarkeit (C-02), Anmeldung über die Hochschulkennung (C-03, dokumentierte Abweichung, ADR-0013), Angebote nur von verifizierten Nutzern (C-04) – siehe [Constraints](../02-anforderungen/02-anforderungen.md#3-constraints-und-ihre-operationalisierung) |

## 3. Kontextabgrenzung

### 3.1 C4 Ebene 1: Systemkontext

Zeigt CampusMarkt als **ein** Softwaresystem mit seinen Nutzern und Nachbarsystemen. Nachbarsysteme mit dem Zusatz **„geplant“** sind noch nicht angebunden; Mermaid-C4 kann Beziehungen nicht gestrichelt darstellen, daher steht der Status in Beschriftung und Tabelle.

```mermaid
C4Context
    title C4 Ebene 1 – Systemkontext CampusMarkt
    Person(gast, "Gast", "Person ohne Konto; sieht Startseite, Rechtstexte, Hilfe und Statusseite")
    Person(mitglied, "Mitglied", "Studierende oder Beschäftigte der HWG LU; Anbieter und Interessent zugleich")
    Person(mod, "Moderator / Admin", "Bearbeitet Meldungen, vergibt Rollen")
    Person(pruefer, "Prüfer/in", "Nur Docker-Beispiel: liest abgefangene Mails")
    Person(betreiber, "Betreiber", "Übung: Sicherung, Wartung, Alarme (Rolle der Hochschule)")
    System(cm, "CampusMarkt", "Marktplatz für Hochschulangehörige: Anzeigen, Suche, Chat, Kontaktfreigabe, Moderation")
    System_Ext(mail, "E-Mail-System", "Beispiel: Mailpit (fängt alle Mails ab); Echtbetrieb: SMTP-Relay der Hochschule")
    System_Ext(idp, "Identity Provider der Hochschule", "geplant (Q-12, ADR-0013)")
    System_Ext(psp, "Zahlungsdienstleister", "geplant (EPIC-09, ADR-0006)")
    System_Ext(crawler, "Suchmaschinen", "ausgeschlossen per robots.txt und noindex (REQ-PRIV-008)")
    Rel(gast, cm, "registriert sich, liest Rechtstexte und Hilfe", "HTTPS")
    Rel(mitglied, cm, "inseriert, sucht, chattet", "HTTPS, WSS")
    Rel(mod, cm, "moderiert, verwaltet", "HTTPS")
    Rel(cm, mail, "sendet Verifikations- und Hinweis-Mails", "SMTP")
    Rel(mail, gast, "stellt Bestätigungslink zu", "E-Mail")
    Rel(mail, mitglied, "stellt Hinweise zu", "E-Mail")
    Rel(pruefer, mail, "liest Mails in der Web-UI", "HTTP :8025")
    Rel(cm, idp, "authentifiziert (geplant)", "OIDC/SAML")
    Rel(cm, psp, "Zahlungen (geplant)", "HTTPS, Webhooks")
    Rel(betreiber, cm, "sichert, setzt Wartung, erhält Alarme (geplant)", "Skripte, HTTPS, E-Mail")
    Rel(crawler, cm, "wird abgewiesen", "HTTPS")
    UpdateLayoutConfig($c4ShapeInRow="4", $c4BoundaryInRow="1")
```

| Element | Art | Verantwortung | Bezug | Stand |
|---|---|---|---|---|
| Gast | Person | Registrierung mit Whitelist-Adresse; ohne Konto Startseite, Rechtstexte, Hilfe, Statusseite | UC-01, UC-08, REQ-AUTH-001, REQ-LEGAL-001…005, REQ-UX-004/005 | Registrierung umgesetzt; öffentliche Seiten umgesetzt (B-43, B-45) |
| Mitglied | Person | Anbieter und Interessent; Rollen „Käufer/Verkäufer“ sind kontextabhängig | UC-10 … UC-25 | umgesetzt |
| Moderator / Admin | Person | Meldungen entscheiden, Rollen vergeben | UC-32, UC-42 | umgesetzt |
| Prüfer/in | Person (nur Beispiel) | Verifikations- und Hinweis-Mails in Mailpit lesen | ADR-0010 | umgesetzt |
| Betreiber | Person (Übung) | Sicherung und Wiederherstellung, Wartungsmodus, Reaktion auf Alarme nach Runbook | UC-44, UC-45, REQ-AVAIL-003, REQ-OPS-006…011 | umgesetzt (B-53, B-54, B-56, B-57) |
| Suchmaschinen | Externes System (ausgeschlossen) | Dürfen keine Inhalte indexieren; `robots.txt` mit `Disallow: /`, Header `X-Robots-Tag: noindex, nofollow` | REQ-PRIV-008 | umgesetzt (B-52) |
| CampusMarkt | Softwaresystem (Scope dieses Dokuments) | Alle fachlichen Funktionen | alle REQ | teilweise, siehe Index |
| E-Mail-System | Externes System | Zustellung transaktionaler Mails | REQ-NOTI-*, ADR-0005 | umgesetzt (Mailpit) |
| Identity Provider der Hochschule | Externes System | Anmeldung über die Hochschulkennung | Fallstudie FS-C3, Q-12 | **geplant** (Spike S-01) |
| Zahlungsdienstleister | Externes System | Zahlungsabwicklung ohne eigene Geldverwahrung | ADR-0006, REQ-ARCH-002 | **geplant** (EPIC-09) |

### 3.2 Technischer Kontext

| Schnittstelle | Protokoll | Daten | Richtung |
|---|---|---|---|
| Browser ↔ CampusMarkt | HTTP auf `localhost:8080` (Echtbetrieb: HTTPS) | SPA-Dateien, REST/JSON `/api/v1` | bidirektional |
| Browser ↔ CampusMarkt | WebSocket `/ws` | Chat-Ereignisse (JSON, Typen in `packages/contracts`) | bidirektional |
| CampusMarkt → E-Mail-System | SMTP (`mailpit:1025`), per Umgebungsvariablen austauschbar | E-Mails | ausgehend |
| Browser → Mailpit-UI | HTTP `localhost:8025` | abgefangene E-Mails (nur Beispiel) | – |
| *(Profil `proxy`)* Browser ↔ Reverse Proxy | HTTPS `campusmarkt.localhost:8443`, Weiterleitung von HTTP | wie oben, zusätzlich HSTS | bidirektional |
| *(Profil `monitoring`)* Prometheus → CampusMarkt | HTTP `app:8080/metrics` (nur internes Compose-Netz) | Metriken | eingehend |
| *(Profil `monitoring`)* Alertmanager → E-Mail-System | SMTP `mailpit:1025` | Alarm-Mails | ausgehend |
| *(geplant)* CampusMarkt ↔ IdP | OIDC oder SAML (Umleitung + Rückruf) | Identität, Hochschulkennung | bidirektional |
| *(geplant)* CampusMarkt ↔ PSP | HTTPS-API + signierte Webhooks | Zahlungen | bidirektional |

## 4. Lösungsstrategie

| Ziel / Problem | Lösungsansatz | ADR |
|---|---|---|
| Kleines Team, schnelle Iteration, später erweiterbar | **Modularer Monolith** mit klaren fachlichen Modulen, **ein** Anwendungs-Image | [ADR-0001](decisions/0001-modularer-monolith.md) |
| Ein Image, wenige Konzepte | **TypeScript**: React-SPA (Vite), ausgeliefert durch Fastify. PostgreSQL mit handgeschriebenem SQL über ein parametrisierendes `sql`-Template (kein ORM, [ADR-0011](decisions/0011-mvp-umsetzung.md) Nr. 1). Kein Redis, kein S3 | [ADR-0002](decisions/0002-tech-stack.md) |
| Vertrauen durch Hochschulzugehörigkeit | Eigene, schlanke Authentifizierung mit E-Mail-Verifikation und Domain-Whitelist, Sessions in Postgres | [ADR-0003](decisions/0003-authentifizierung.md) |
| Echtzeit-Chat | Empfang per WebSocket, Senden per REST (idempotent), Postgres als Quelle der Wahrheit, Fan-out hinter einem `RealtimeBroker`-Port | [ADR-0004](decisions/0004-chat-echtzeit.md) |
| Zuverlässiger E-Mail-Versand | Jobs werden mit **pg-boss transaktional** eingereiht (Outbox-Muster), `MailPort` → Mailpit; Wiederholungsplan überbrückt ≥ 30 min Ausfall | [ADR-0005](decisions/0005-email-versand.md) |
| Bezahlung später ohne Umbau | **Ports & Adapters**: `PaymentPort`, Deal-Konzept und Domain Events (publish/subscribe) schon im MVP | [ADR-0006](decisions/0006-bezahlung-erweiterungspunkt.md) |
| Bilder | Docker-Volume hinter `StoragePort`, Verarbeitung im Job | [ADR-0007](decisions/0007-bildspeicherung.md) |
| Suche ohne Zusatzinfrastruktur | **PostgreSQL-Volltextsuche** + `pg_trgm` | [ADR-0008](decisions/0008-suche-postgres.md) |
| API-Vertrag | **REST + OpenAPI 3.1**, Schema-first aus TypeBox-Schemas in `packages/contracts`; WebSocket-Ereignisse als TypeScript-Typen im selben Paket (kein AsyncAPI-Dokument) | [ADR-0009](decisions/0009-api-rest-openapi.md), [ADR-0011](decisions/0011-mvp-umsetzung.md) Nr. 2 |
| Kein Hosting, trotzdem vorführbar | **Docker Compose**: `app` + `db` + `mailpit`, Seed-Daten mit Demo-Konten | [ADR-0010](decisions/0010-docker-demo-deployment.md) |
| Anmeldung über die Hochschulkennung (FS-C3) später ohne Umbau | Anmeldeverfahren hinter einem zweistufigen `IdentityProviderPort`; im Beispiel Hochschuladresse + Passwort (Stand: umgesetzt B-05; SSO-Adapter nach S-01) | [ADR-0013](decisions/0013-anmeldung-identity-provider-port.md) |
| Kontaktdaten nur nach beidseitiger Zustimmung (FS-C1) | Zustimmungen als Zustand der Konversation; Adresse nur als Konversationsangabe, nie als Nachricht (Stand: umgesetzt B-01) | REQ-CHAT-010 |
| IP-Adressen nur pseudonymisiert | HMAC-SHA256 mit zufälligem, täglich rotiertem Schlüssel in der Datenbank (Stand: umgesetzt) | [ADR-0014](decisions/0014-ip-pseudonymisierung.md) |
| Rechtstexte ohne zweite Quelle, Platzhalter nie live | **Markdown-Dateien im Repo**, zur Build-Zeit gebündelt, mit `react-markdown` ohne HTML gerendert; Version der Nutzungsbedingungen über ein Build-Manifest an den Server; `LEGAL_STRICT` verhindert den Start mit Platzhaltern (Stand: umgesetzt (B-43)) | [ADR-0015](decisions/0015-rechtstexte-als-markdown.md) |
| Internationale Studierende | **react-intl** mit ICU MessageFormat, Kataloge `de`/`en`, Sprachwahl im Konto bzw. auf ausdrücklichen Wunsch im Browser; CI prüft Kataloge (Stand: umgesetzt B-51) | [ADR-0016](decisions/0016-internationalisierung.md) |
| TLS, HSTS und Alarmierung vorführbar, ohne den Standardstart zu ändern | **Optionale Compose-Profile** `proxy` (Caddy, `tls internal`, eigener Hostname `campusmarkt.localhost`) und `monitoring` (Prometheus + Alertmanager → Mailpit) (Stand: umgesetzt (B-54, B-55)) | [ADR-0017](decisions/0017-optionale-betriebsprofile.md) |
| Datenverlust begrenzen, Wiederherstellung belegt | `pg_dump` + Uploads-Archiv per Skript, **Restore-Test in CI** (Stand: umgesetzt B-56) | [ADR-0018](decisions/0018-datensicherung.md) |
| Professioneller Auftritt, sauberer Betrieb | Fehlerseiten mit echten Statuscodes (404/500/503), Wartungsmodus mit Ankündigung, öffentliche Statusseite, `robots.txt`/`noindex`, `security.txt` (Stand: umgesetzt (B-44, B-52, B-53)) | §8.10, §8.11 |
| Architektur verständlich und prüfbar dokumentieren | **C4-Modell** als Mermaid-C4-Diagramme, eine Ebene je Diagramm, gerendert mit `scripts/check-diagrams.mjs` (in CI, B-07) | [ADR-0012](decisions/0012-c4-notation.md) |

**Leitprinzip:** Alles, was im Beispiel bewusst einfacher gelöst ist (Fan-out, Storage, Mail, Rate-Limit-Store, Suche, Job-Queue), steckt hinter einem **Port**. Ein späterer Echtbetrieb (EPIC-12) tauscht Adapter, nicht Fachlogik.

## 5. Bausteinsicht (C4 Ebene 2 und 3)

**Notation:** C4-Modell nach Simon Brown, als Mermaid-C4-Diagramme im Markdown ([ADR-0012](decisions/0012-c4-notation.md)). Jedes Diagramm zeigt genau **eine** Ebene und nennt sie im Titel (Guideline Kap. 02). Die Ebenen verfeinern sich: Das Softwaresystem aus 3.1 wird in 5.1 in Container zerlegt, die Container „Anwendung“ und „Web-App“ in 5.2 und 5.3 in Komponenten. Die vierte C4-Ebene (Code) wird bewusst nicht gezeichnet; sie ergibt sich aus dem Quellcode. Beziehungen zwischen Komponenten im selben Prozess sind Funktionsaufrufe (TypeScript, in-process), sofern nicht anders beschriftet.

| C4-Begriff | Bedeutung im Projekt |
|---|---|
| Softwaresystem | CampusMarkt als Ganzes (Scope dieser Architektur) |
| Container | separat ausführbare bzw. Daten haltende Einheit: Web-App im Browser, Anwendungsprozess, Datenbank, Dateiablage. *Nicht zu verwechseln mit Docker-Containern* (siehe Verteilungssicht 7.1) |
| Komponente | Baustein innerhalb eines Containers mit klarer Schnittstelle: Fachmodul (`apps/server/src/modules/*`), Port, Adapter, eingehender Adapter |

### 5.1 C4 Ebene 2: Container

```mermaid
C4Container
    title C4 Ebene 2 – Container von CampusMarkt
    Person(gast, "Gast", "Browser")
    Person(mitglied, "Mitglied", "Browser oder installierte PWA")
    Person(mod, "Moderator / Admin", "Browser")
    System_Boundary(cm, "CampusMarkt") {
        Container(spa, "Web-App", "React 19, Vite, TanStack Router/Query, PWA", "Oberfläche für Gäste, Mitglieder und Moderation; läuft im Browser")
        Container(app, "Anwendung", "Node.js 22, Fastify, pg-boss", "REST-API /api/v1, WebSocket /ws, Auslieferung der Web-App, Job-Worker und Zeitsteuerung")
        ContainerDb(db, "Datenbank", "PostgreSQL 17", "Fachdaten je Modul-Schema, Sessions, Job-Queue, Volltextindex")
        ContainerDb(files, "Bildablage", "Dateisystem (Docker-Volume)", "Originale in Quarantäne, verarbeitete WebP-Bilder")
        Container(proxy, "Reverse Proxy", "Caddy 2, Profil proxy", "optional: TLS (tls internal), HSTS, Weiterleitung http zu https")
        Container(mon, "Überwachung", "Prometheus und Alertmanager, Profil monitoring", "optional: Metriken, Alarmregeln, Alarm-Mails")
    }
    Person(betreiber, "Betreiber", "Übung")
    System_Ext(mail, "E-Mail-System", "Mailpit / SMTP-Relay")
    System_Ext(idp, "Identity Provider", "geplant")
    System_Ext(psp, "Zahlungsdienstleister", "geplant")
    Rel(gast, spa, "registriert sich")
    Rel(mitglied, spa, "bedient")
    Rel(mod, spa, "bedient")
    Rel(app, spa, "liefert Web-App aus", "HTTP, statische Dateien")
    Rel(spa, app, "ruft API auf, empfängt Ereignisse", "JSON/HTTPS, WSS")
    Rel(app, db, "liest/schreibt eigenes Schema je Modul, reiht Jobs ein", "SQL")
    Rel(app, files, "speichert/liest Bilder", "Dateisystem")
    Rel(app, mail, "sendet E-Mails", "SMTP")
    Rel(app, idp, "authentifiziert (geplant)", "OIDC/SAML")
    Rel(app, psp, "Zahlungen (geplant)", "HTTPS")
    Rel(proxy, app, "leitet weiter (optional)", "HTTP, WS")
    Rel(mon, app, "liest Metriken (optional)", "HTTP /metrics")
    Rel(mon, mail, "sendet Alarme (optional)", "SMTP")
    Rel(betreiber, mon, "sieht Alarme und Regeln")
    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

| Container | Technologie | Verantwortung | Qualitätsziele / Anforderungen | ADR | Stand |
|---|---|---|---|---|---|
| Web-App | React-SPA (Vite), PWA | Darstellung, Tastaturbedienung, Echtzeit-Empfang, Degradation auf Polling | REQ-A11Y-001/002, REQ-UX-001, REQ-CHAT-003 | 0002 | umgesetzt (Kontaktfreigabe B-01, Tastatur-E2E B-02) |
| Anwendung | Node.js 22, Fastify, pg-boss | Fachlogik aller Module, Autorisierung, Jobs (E-Mail, Bilder, Fristen) | REQ-SEC-*, REQ-NOTI-005, REQ-OPS-* | 0001, 0002, 0004, 0005 | umgesetzt; offene Teile siehe 5.2 |
| Datenbank | PostgreSQL 17 | Quelle der Wahrheit, transaktionale Outbox (Jobs im selben Commit), Volltextsuche | REQ-CHAT-004, REQ-SRCH-001, REQ-PERF-001 | 0005, 0008 | umgesetzt |
| Bildablage | Docker-Volume `uploads` hinter `StoragePort` | Bilder außerhalb des Web-Roots, Auslieferung nur über die Anwendung | REQ-LST-003, REQ-SEC-007 | 0007 | umgesetzt |
| Reverse Proxy (Profil `proxy`) | Caddy 2 | TLS mit lokaler CA, HSTS nur für `campusmarkt.localhost`, Weiterleitung, WebSocket, `/metrics` gesperrt | REQ-OPS-009 | 0017 | umgesetzt (B-55) |
| Überwachung (Profil `monitoring`) | Prometheus, Alertmanager | Metriken sammeln, Alarmregeln auswerten, Alarme per Mail an Mailpit | REQ-OPS-008 | 0017 | umgesetzt (B-54) |
| Identity Provider | extern | Anmeldung mit Hochschulkennung | REQ-AUTH-009 | 0013 | geplant (S-01) |
| Zahlungsdienstleister | extern | Zahlungen | REQ-ARCH-001/002 | 0006 | geplant (EPIC-09) |

**Standardstart unverändert:** `docker compose up` startet weiter nur `app`, `db` und `mailpit` (ADR-0010, REQ-ARCH-005). Reverse Proxy und Überwachung kommen nur mit `--profile proxy` bzw. `--profile monitoring` dazu (ADR-0017). Sicherung und Wiederherstellung sind Skripte außerhalb der Anwendung (`scripts/backup.mjs`, `scripts/restore.mjs`, ADR-0018), kein eigener Container.

**Startmodi:** Die Anwendung kennt die Modi `all` (Standard im Beispiel), `api` und `worker` (`APP_MODE`). Im Docker-Beispiel laufen API und Worker in **einem** Prozess mit getrennten Concurrency-Pools (Bulkhead). Für einen Echtbetrieb werden daraus zwei Container gleicher Codebasis **ohne Änderung der Fachlogik**; nötig sind nur Betriebsanpassungen (siehe 7.2): Healthcheck des Worker-Containers per Kommando statt HTTP, `TRUST_PROXY` hinter einem Reverse Proxy und ein `PgNotifyAdapter`, damit Ereignisse aus Jobs WebSockets erreichen (Stand: Health und `TRUST_PROXY` geplant B-41, Sprint 2).

### 5.2 C4 Ebene 3: Komponenten der Anwendung

Die Anwendung ist ein **modularer Monolith** (ADR-0001). Drei Diagramme derselben Ebene (ADR-0012 Regel 4): 5.2.1 zeigt die eingehenden Adapter und Fachmodule, 5.2.2 die Fachmodule mit Plattform, Ports und Adaptern, 5.2.3 die Abhängigkeiten zwischen den Fachmodulen.

#### 5.2.1 Eingehende Adapter und Fachmodule

```mermaid
C4Component
    title C4 Ebene 3 – Anwendung: eingehende Adapter und Fachmodule
    UpdateLayoutConfig($c4ShapeInRow="1", $c4BoundaryInRow="2")
    Container(spa, "Web-App", "React-SPA", "im Browser")
    Container_Boundary(app, "Anwendung") {
        Boundary(inb, "Eingehende Adapter", "Schicht") {
            Component(http, "HTTP-API", "Fastify, TypeBox", "REST /api/v1, Validierung, CSRF, Session, Problem Details")
            Component(admin, "Admin-API und Audit", "Fastify, platform/audit", "Rollen, Audit-Log, Job- und Dead-Letter-Übersicht, Demo-Werkzeug, Wartung und Ankündigung, DAC7-Auswertung")
            Component(ops, "Betriebs-Endpunkte", "Fastify-Hooks, platform/http", "Wartungsmodus (503), /status, robots.txt, security.txt, 404 für unbekannte Pfade")
            Component(ws, "WebSocket-Gateway", "@fastify/websocket", "/ws, Authentifizierung beim Handshake, Origin-Prüfung")
            Component(jobs, "Job-Worker und Zeitsteuerung", "pg-boss", "E-Mail, Bilder, Fristen, ungelesene Nachrichten, Domain Events")
        }
        Boundary(mods, "Fachmodule", "Schicht") {
            Component(identity, "identity", "Modul", "Registrierung, Anmeldung, Sessions, Rollen, Whitelist, Benachrichtigungs-Einstellungen")
            Component(listings, "listings", "Modul", "Anzeigen, Bilder, Lebenszyklus, Inhaltsprüfung")
            Component(search, "search", "Modul", "Suche, Merkliste")
            Component(messaging, "messaging", "Modul", "Konversationen, Nachrichten, Kontaktfreigabe, Deals")
            Component(trust, "trust", "Modul", "Meldungen, Moderation, Begründung, Widerspruch (Vier-Augen), Straftatverdacht, Blockieren")
            Component(privacy, "privacy", "Modul", "Export, Kontolöschung")
            Component(notifications, "notifications", "Modul", "E-Mail-Vorlagen de/en mit Rechts-Fußzeile, Versand unter Beachtung der Einstellungen")
        }
    }
    Rel(spa, http, "Anfragen", "JSON/HTTPS")
    Rel(spa, ws, "empfängt Ereignisse", "WSS")
    Rel(http, identity, "ruft öffentliche API auf")
    Rel(http, listings, "ruft öffentliche API auf")
    Rel(http, search, "ruft öffentliche API auf")
    Rel(http, messaging, "ruft öffentliche API auf")
    Rel(http, trust, "ruft öffentliche API auf")
    Rel(http, privacy, "ruft öffentliche API auf")
    Rel(admin, identity, "Rollen, Nutzerliste")
    Rel(admin, messaging, "DAC7: abgeschlossene Deals je Verkäufer")
    Rel(spa, ops, "Statusseite, Wartungshinweis", "JSON/HTTPS")
    Rel(ws, messaging, "senden, gelesen markieren")
    Rel(jobs, listings, "Bilder, Fristen")
    Rel(jobs, messaging, "ungelesene Nachrichten, Deal-Ereignisse")
    Rel(jobs, privacy, "Löschfristen")
    Rel(jobs, notifications, "Mails")
```

#### 5.2.2 Fachmodule, Plattform, Ports und Adapter

Port und zugehöriger Adapter sind in einem Kasten zusammengefasst („Port → Adapter“), damit das Diagramm lesbar bleibt; im Code liegen die Ports in `platform/ports/`, die Adapter in `platform/adapters/` und werden nur in `main.ts` verdrahtet.

```mermaid
C4Component
    title C4 Ebene 3 – Anwendung: Fachmodule, Plattform, Ports und Adapter
    UpdateLayoutConfig($c4ShapeInRow="1", $c4BoundaryInRow="2")
    Container_Boundary(app, "Anwendung") {
        Boundary(mods, "Fachlogik und Plattform", "Schicht") {
            Component(modules, "Fachmodule", "identity, listings, search, messaging, trust, privacy, notifications", "kennen nur Ports, nie Adapter; SQL nur auf das eigene Schema")
            Component(dbaccess, "Datenbankzugriff", "platform/db, sql-Template, pg", "Database/Tx, Unit of Work, transaktionales Enqueue")
            Component(idport, "IdentityProviderPort → Passwortverfahren", "Modul identity", "umgesetzt B-05; später OIDC/SAML-Adapter")
            Component(payport, "PaymentPort", "nur Schnittstelle", "EPIC-09, ADR-0006")
            Component(settings, "Einstellungen und Rechtsinhalte", "platform/settings, legal-manifest.json", "Wartungsmodus, Ankündigung, Version der Nutzungsbedingungen, LEGAL_STRICT")
        }
        Boundary(ports, "Ports und Adapter", "Schicht") {
            Component(mailport, "MailPort → SMTP-Adapter", "Nodemailer", "Versand mit Timeout 10 s")
            Component(storeport, "StoragePort → Dateisystem-Adapter", "fs", "Bilder; Produktivpfad: S3-Adapter")
            Component(rtport, "RealtimeBroker → In-Process-Adapter", "EventEmitter", "Fan-out an WebSockets; Skalierungspfad: Postgres LISTEN/NOTIFY")
            Component(jobport, "JobQueue → pg-boss-Adapter", "pg-boss", "Outbox, Retry, Dead-Letter, publish/subscribe")
            Component(searchport, "SearchPort → Postgres-Volltext-Adapter", "tsvector, pg_trgm", "Fallback Titelsuche")
            Component(rlport, "RateLimitStore → Postgres-Adapter", "SQL, HMAC", "feste Zeitfenster, pseudonymisierte Schlüssel")
        }
    }
    System_Ext(mail, "E-Mail-System", "SMTP")
    ContainerDb(files, "Bildablage", "Docker-Volume")
    ContainerDb(db, "Datenbank", "PostgreSQL 17")
    System_Ext(psp, "Zahlungsdienstleister", "geplant")
    Rel(modules, dbaccess, "eigenes Schema", "SQL")
    Rel(modules, idport, "Anmeldung")
    Rel(modules, mailport, "sendet")
    Rel(modules, storeport, "speichert")
    Rel(modules, rtport, "veröffentlicht")
    Rel(modules, jobport, "reiht ein")
    Rel(modules, searchport, "sucht")
    Rel(modules, rlport, "zählt")
    Rel(dbaccess, db, "SQL")
    Rel(settings, dbaccess, "Einstellungen", "SQL")
    Rel(payport, psp, "geplant", "HTTPS")
    Rel(mailport, mail, "SMTP")
    Rel(storeport, files, "liest/schreibt")
    Rel(jobport, db, "SQL")
    Rel(searchport, db, "SQL")
    Rel(rlport, db, "SQL")
```

#### 5.2.3 Abhängigkeiten zwischen den Fachmodulen

Module rufen einander nur über ihr öffentliches API (`index.ts`, späte Bindung über `ModuleDeps.modules`) oder über Domain Events (pg-boss, im selben Commit eingereiht). **Abhängigkeitsrichtung (Entscheidung OE-1):** `messaging` darf `listings` synchron aufrufen; `listings` informiert `messaging` nur über Domain Events. Heute ruft `listings` noch synchron `messaging.onListingStatusChanged` und `findConversationId` auf (Stand: Umstellung geplant B-39, R2).

```mermaid
C4Component
    title C4 Ebene 3 – Anwendung: Abhängigkeiten zwischen Fachmodulen
    UpdateLayoutConfig($c4ShapeInRow="1", $c4BoundaryInRow="2")
    Container_Boundary(app, "Anwendung") {
        Boundary(left, "Aufrufer", "Fachmodule") {
            Component(privacy, "privacy", "Modul", "Export, Kontolöschung über alle Module")
            Component(trust, "trust", "Modul", "Moderation")
            Component(messaging, "messaging", "Modul", "Chat, Kontaktfreigabe, Deals")
            Component(search, "search", "Modul", "Suche")
        }
        Boundary(right, "Aufgerufene", "Fachmodule") {
            Component(listings, "listings", "Modul", "Anzeigen")
            Component(identity, "identity", "Modul", "Konten, Adressen")
            Component(notifications, "notifications", "Modul", "Mails")
        }
    }
    Rel(privacy, listings, "1")
    Rel(privacy, identity, "2")
    Rel(privacy, notifications, "3")
    Rel(trust, listings, "4")
    Rel(trust, identity, "5")
    Rel(trust, notifications, "6")
    Rel(messaging, listings, "7")
    Rel(messaging, identity, "8")
    Rel(messaging, notifications, "9")
    Rel(search, listings, "10")
    Rel(listings, messaging, "11")
    Rel(notifications, identity, "12")
```

| # | Von → Nach | Zweck (Aufruf der öffentlichen API, TypeScript in-process) |
|---|---|---|
| 1 | privacy → listings | Export, Löschung |
| 2 | privacy → identity | Export, Löschung |
| 3 | privacy → notifications | Löschbestätigung |
| 4 | trust → listings | entfernen, ausblenden |
| 5 | trust → identity | sperren, Namen |
| 6 | trust → notifications | Entscheidungs-Mail |
| 7 | messaging → listings | Anzeige lesen, Deal-Status |
| 8 | messaging → identity | Namen, freigegebene Adresse |
| 9 | messaging → notifications | Hinweis-Mail |
| 10 | search → listings | Karten laden |
| 11 | listings → messaging | Statuswechsel (heute synchron; Ziel: Domain Event, B-39) |
| 12 | notifications → identity | Adresse, Einstellungen |

Weitere Aufrufe: `trust → messaging` (Nachrichtenkontext, Entfernen), `messaging`/`search → trust` (Blockierungen), `listings → trust` (Fall der Inhaltsprüfung) und `listings → search` (Merkliste). Alle über das öffentliche API.

**Neu mit EPIC-13 (umgesetzt):** Das Modul `reporting` (`modules/reporting/`, nur Routen und reine Domänenfunktionen, keine eigenen Tabellen) ruft für die DAC7-Auswertung `messaging` auf (abgeschlossene Deals je Verkäufer und Kalenderjahr) und `identity` (Anzeigenamen). Rohdaten anderer Schemas liest sie nicht; Modulregel 2 bleibt gewahrt. Begründung und Widerspruch bleiben vollständig in `trust` und nutzen die bestehenden Aufrufe `trust → notifications` (Mitteilung) und `trust → identity` (Sperre aufheben, Namen). Es entsteht **keine** neue Abhängigkeit zwischen Fachmodulen.

| Komponente | Ort im Code | Verantwortung | Wichtige Anforderungen | Stand |
|---|---|---|---|---|
| HTTP-API | `apps/server/src/platform/http/` + `routes.ts` je Modul | Validierung gegen den Vertrag (`packages/contracts`), Session, CSRF, Fehlerformat | REQ-SEC-004, REQ-SEC-006 | umgesetzt |
| Admin-API und Audit | `modules/admin.ts`, `platform/audit.ts` | Rollen, Audit-Log (append-only), Job- und Dead-Letter-Übersicht, Demo-Werkzeug | REQ-MOD-007, REQ-NOTI-005, REQ-DEMO-002 | umgesetzt |
| WebSocket-Gateway | `modules/messaging/routes.ts` (`websocketRoute`) | Echtzeit-Empfang, Origin-Prüfung; Senden per WS nur als Alternative, die Web-App sendet per REST | REQ-CHAT-003 | umgesetzt |
| Job-Worker und Zeitsteuerung | `platform/adapters/pg-boss-queue.ts`, `registerJobs` je Modul | Asynchrone Arbeit, Retry, Dead-Letter; Zeitgeber Ü-11/Ü-17/Ü-18 (`listings-maintenance`, stündlich) und Kontolöschung (`privacy-purge`, täglich 03:17); Zeitgeber Ü-12, Ü-13 (inkl. `DealCancelled` und Hinweis-Mail) und Ü-19 | REQ-NOTI-005, REQ-LST-007/008, REQ-PRIV-003 | umgesetzt; Ü-12/Ü-13/Ü-19 geplant B-32 (Sprint 3) |
| identity | `modules/identity/` | Zugang, BR-01, Rollen, Benachrichtigungs-Einstellungen (`PATCH /me`) | REQ-AUTH-*, REQ-SEC-002…005, REQ-SEC-011 | umgesetzt, inkl. `IdentityProviderPort` (B-05) und Registrierungsgrenzen Q-18 (B-34) |
| listings | `modules/listings/` | Anzeigen und Bilder | REQ-LST-* | umgesetzt |
| search | `modules/search/` | Suche, Merkliste | REQ-SRCH-* | umgesetzt |
| messaging | `modules/messaging/` | Chat, **Kontaktfreigabe**, Deals | REQ-CHAT-*, REQ-PRIV-002 | umgesetzt (Kontaktfreigabe B-01) |
| trust | `modules/trust/` | Meldungen, Moderation, Blockieren | REQ-MOD-* | umgesetzt |
| privacy | `modules/privacy/` | Export, Löschung über alle Module | REQ-ACC-002/003, REQ-PRIV-003 | umgesetzt; Anonymisierung statt Löschen fremder Konversationen geplant B-22 (Sprint 2) |
| notifications | `modules/notifications/` | Vorlagen, Versand über MailPort unter Beachtung der Einstellungen aus `identity` | REQ-NOTI-* | umgesetzt; Wiederholungsplan ≥ 30 min geplant B-36 (Sprint 2) |
| Datenbankzugriff | `platform/db.ts`, `platform/sql.ts` | Verbindung, Unit of Work, parametrisiertes SQL | REQ-SEC-001 (Injection) | umgesetzt |
| Ports + Adapter | `platform/ports/`, `platform/adapters/` | Austauschbare Infrastruktur | REQ-ARCH-006 | umgesetzt; HMAC-Pseudonyme mit rotierendem Schlüssel (`platform/pseudonym.ts`, B-35, Review v1.3); publish/subscribe geplant B-40 (Sprint 2) |
| IdentityProviderPort | `modules/identity/` (Passwortverfahren intern), später SSO-Adapter in `platform/adapters/` | Anmeldeverfahren austauschbar (ADR-0013) | REQ-AUTH-009 | umgesetzt B-05; SSO-Adapter nach S-01 |
| PaymentPort | `modules/payments/payment-port.ts` | Erweiterungspunkt Bezahlung | REQ-ARCH-001/002 | Schnittstelle vorhanden, Adapter EPIC-09 |
| Betriebs-Endpunkte | `platform/http/` (Hooks und Routen) | Wartungsmodus (503 mit `Retry-After`, Ausnahmen siehe §8.11), `/api/v1/status` und Seite `/status`, `robots.txt`, `/.well-known/security.txt`, `X-Robots-Tag`, 404 für unbekannte Pfade | REQ-OPS-006/007, REQ-UX-003, REQ-PRIV-008, REQ-SEC-012 | umgesetzt (B-44, B-52, B-53) |
| Einstellungen und Rechtsinhalte | `platform/settings.ts` (Tabelle `platform.setting`), `legal-manifest.json` aus dem Web-Build | Wartungsmodus und Ankündigung (Cache 10 s), `termsVersion` aus dem Manifest, Startprüfung `LEGAL_STRICT` | REQ-OPS-006, REQ-LEGAL-003 | umgesetzt (B-43, B-53) |
| DSA-Begründung und Widerspruch | `modules/trust/` | Begründung an Betroffene mit Regel und Widerspruchshinweis; Widerspruch binnen 6 Monaten (DSA Art. 20 Abs. 1), auch für Meldende bei abgelehnter Meldung, Entscheidung durch einen **anderen** Moderator; Straftatverdacht als Kennzeichen mit Pflichtbegründung | REQ-LEGAL-006/007/008 | umgesetzt (B-46, B-47) |
| DAC7-Auswertung | `modules/reporting/` → `messaging.completedSales`, `identity` (öffentliche APIs) | Verkäufer mit ≥ 30 abgeschlossenen Deals oder ≥ 2.000 € je Kalenderjahr, JSON ohne E-Mail-Adressen, CSV mit Adresse und Schutz vor Formel-Injektion, nur Admin, Audit-Eintrag | REQ-LEGAL-009 | umgesetzt (B-48) |
| E-Mail-Fußzeile und Sprache | `modules/notifications/` | Jede Mail mit Links zu Impressum, Datenschutz und Einstellungen; Vorlagen je Sprache | REQ-UX-006, REQ-UX-007 | umgesetzt (B-43, B-51) |
| Sicherung und Wiederherstellung | `scripts/backup.mjs`, `scripts/restore.mjs` (außerhalb der Anwendung) | `pg_dump` + Uploads-Archiv, Prüfsummen, Restore über temporäre Datenbank mit Rückfall (App gestoppt), Löschjournal (`platform/deletion-journal.ts`, Befehl `replay-deletions`) | REQ-AVAIL-003 | umgesetzt (B-56) |

**Modulregeln und ihre Prüfung (Fitness Functions, REQ-MAINT-002):**

| # | Regel | Prüfung | Stand |
|---|---|---|---|
| 1 | Ein Modul hat ein öffentliches API (`index.ts`); alles andere ist intern | dependency-cruiser `module-internals` (`pnpm lint:deps`) | umgesetzt. Hinweis: Bei `listings` und `messaging` ist das API heute der ganze Service; schmale Schnittstellen geplant B-42 (R2) |
| 2 | Module greifen nie auf Tabellen anderer Module zu; jedes Modul hat ein eigenes Postgres-Schema | Test, der SQL-Texte in `modules/<m>/**` auf andere Schemas als `<m>.` prüft (dependency-cruiser sieht nur Importe) | geplant B-38 (Sprint 2); bis dahin Code-Review |
| 3 | Kommunikation zwischen Modulen synchron über das öffentliche API oder asynchron über Domain Events (Jobs im selben Commit) | Regel 1 + Review | umgesetzt (Zyklus `listings ↔ messaging` bis B-39) |
| 4 | `domain.ts` ist frei von Frameworks und Plattform | dependency-cruiser `domain-is-pure` | umgesetzt |
| 5 | Fachmodule kennen nur Ports, nie Adapter; die Plattform kennt keine Fachmodule | dependency-cruiser `modules-only-know-ports`, `no-infrastructure-libs-in-modules`, `platform-independent-of-modules` | umgesetzt |

### 5.3 C4 Ebene 3: Komponenten der Web-App

```mermaid
C4Component
    title C4 Ebene 3 – Web-App
    Person(mitglied, "Mitglied", "Tastatur, Maus, Screenreader")
    Person(mod, "Moderator / Admin", "Browser")
    Container_Boundary(spa, "Web-App") {
        Component(router, "Routen und Seiten", "TanStack Router", "Startseite, Registrierung, Suche, Anzeige, Formular, Chat mit Kontaktfreigabe, Profil, Moderation, Admin, Fehler-, Status- und Wartungsseite; Rollen-Guards")
        Component(legal, "Rechts- und Hilfeseiten", "react-markdown, content/legal, content/help", "Impressum, Datenschutz, Nutzungsbedingungen, Community-Regeln, Barrierefreiheit, Kontakt, Hilfe; ohne Anmeldung")
        Component(i18n, "Internationalisierung", "react-intl, Kataloge de und en", "Sprachwahl, html lang, Formatierung von Datum und Preis")
        Component(ui, "UI-Bausteine", "React, Tailwind, natives dialog", "zugängliche Formulare, Fokus-Management, ARIA-Live")
        Component(client, "API-Client", "fetch, TanStack Query", "CSRF-Header, Problem Details, Cache")
        Component(rt, "Echtzeit-Hook", "WebSocket", "Reconnect mit Backoff, Nachladen, Polling im Degradationsmodus")
        Component(sw, "Service Worker", "vite-plugin-pwa", "cacht nur statische Dateien, keine API- oder Medienantworten")
    }
    Container(app, "Anwendung", "Fastify")
    Rel(mitglied, router, "bedient")
    Rel(mod, router, "bedient")
    Rel(router, ui, "rendert mit")
    Rel(router, legal, "öffentliche Routen")
    Rel(router, i18n, "Texte")
    Rel(router, client, "lädt/ändert Daten")
    Rel(rt, client, "aktualisiert Cache")
    Rel(client, app, "JSON", "HTTPS")
    Rel(rt, app, "Ereignisse", "WSS")
    Rel(sw, app, "lädt statische Dateien", "HTTPS")
    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

| Komponente | Ort im Code | Verantwortung | Bezug zu den 9 Kernabläufen (REQ-A11Y-002) | Stand |
|---|---|---|---|---|
| Routen und Seiten | `apps/web/src/routes/`, `router.tsx` | Seiten je Use Case, Rollen-Guards für Moderation und Admin | Registrierung, Anmeldung, Passwort zurücksetzen, Suche, Anzeige erstellen inkl. Bild, Anzeige verwalten, Nachricht senden, Melden, Kontaktfreigabe | umgesetzt |
| UI-Bausteine | `apps/web/src/components/` | Zugängliche Grundbausteine, sichtbarer Fokus, ARIA-Live im Chat | alle 9 | umgesetzt; Tastatur-E2E und axe-core in `e2e/` (B-02) |
| API-Client | `apps/web/src/api/` | Aufrufe, CSRF-Header, Fehlerbehandlung | alle 9 | umgesetzt |
| Echtzeit-Hook | `apps/web/src/lib/realtime.ts` | WebSocket, Reconnect, Nachladen per `?after=`, Polling | Nachricht senden | umgesetzt |
| Service Worker | erzeugt durch `vite-plugin-pwa` | Installierbarkeit (PWA); cacht ausschließlich statische Dateien, damit keine personenbezogenen Antworten im Gerät verbleiben | – | umgesetzt |
| Rechts- und Hilfeseiten | `apps/web/src/routes/legal.tsx`, Inhalte `apps/web/src/content/` | Darstellung der Markdown-Inhalte (ADR-0015), Inhaltsverzeichnis, Muster-Hinweis, Footer-Links auf jeder Seite | – (öffentlich, REQ-LEGAL-001…005, REQ-UX-005/006) | umgesetzt (B-43, B-45) |
| Startseite, Fehler-, Status- und Wartungsseite | `apps/web/src/routes/` | Startseite für Gäste, 404 mit Suche und Hilfe, Seite für Serverfehler, `/status`, Hinweis bei 503 | – (REQ-UX-003/004, REQ-OPS-006/007) | umgesetzt (B-44, B-45, B-53) |
| Internationalisierung | `apps/web/src/i18n/` | Kataloge, Sprachschalter, `<html lang>`, Übersetzung von Fehlercodes | alle 9 (Texte, Labels) | umgesetzt (B-51) |
| Widerspruch | `apps/web/src/routes/profile.tsx` bzw. eigene Seite | Mitteilungen zu Moderationsentscheidungen, Widerspruch einlegen (UC-35); Moderationsseite mit Widerspruchs-Queue (UC-36) | Melden (Folgeablauf) | umgesetzt (B-46) |

### 5.4 Fachliches Datenmodell (Auszug)

Modulübergreifende Bezüge sind **Referenzen (ID, kein Fremdschlüssel)**, weil jedes Modul ein eigenes Schema hat (Modulregel 2); sie sind im Diagramm als `ref` gekennzeichnet. Echte Fremdschlüssel (`FK`) gibt es nur innerhalb eines Moduls.

```mermaid
erDiagram
    INSTITUTION ||--o{ ALLOWED_DOMAIN : hat
    INSTITUTION ||--o{ USER : gehoert_zu
    USER ||--o{ SESSION : hat
    USER ||--o{ CONSENT : gibt
    USER ||--o{ LISTING : "erstellt (ref)"
    LISTING }o--|| CATEGORY : in
    LISTING ||--o{ LISTING_IMAGE : hat
    LISTING }o--o{ CAMPUS_LOCATION : "uebergabe_an (ref)"
    LISTING ||--o{ CONVERSATION : "betrifft (ref)"
    USER ||--o{ CONVERSATION : "Interessent (ref)"
    CONVERSATION ||--o{ MESSAGE : enthaelt
    CONVERSATION ||--o{ DEAL : fuehrt_zu
    CONVERSATION ||--o{ CONTACT_CONSENT : freigabe_durch
    DEAL ||--o| PAYMENT : "BACKLOG (ref)"
    MODERATION_CASE ||--o{ REPORT : sammelt
    MODERATION_CASE ||--o{ DECISION : fuehrt_zu
    DECISION ||--o| APPEAL : "angefochten durch"
    SETTING {
        string key PK
        jsonb value
        timestamptz updated_at
        uuid updated_by "ref identity.user"
    }
    USER ||--o{ BLOCK : "blockiert (ref)"
    USER ||--o{ FAVORITE : "merkt (ref)"

    INSTITUTION {
        uuid id PK
        string name
    }
    ALLOWED_DOMAIN {
        string domain PK
        uuid institution_id FK
        string user_type
        bool active
    }
    USER {
        uuid id PK
        uuid institution_id FK
        citext email
        citext email_canonical UK
        string display_name
        string user_type
        string status
        string role
        string locale "de oder en"
        string privacy_ack_version "zur Kenntnis genommene Fassung"
        timestamptz verified_at
    }
    SESSION {
        string token_hash PK
        uuid user_id FK
        timestamptz expires_at
    }
    CONSENT {
        uuid id PK
        uuid user_id FK "Soll: nullable, anonymisierbar"
        string kind
        string version
        timestamptz given_at
    }
    LISTING {
        uuid id PK
        uuid owner_id "ref identity.user"
        string kind
        string price_type
        int price_cents
        string currency
        string status
        timestamptz expires_at
        tsvector search_doc
    }
    CONVERSATION {
        uuid id PK
        uuid listing_id "ref listings.listing"
        uuid buyer_id "ref identity.user"
        uuid seller_id "ref identity.user"
        timestamptz last_message_at
    }
    MESSAGE {
        uuid id PK
        uuid conversation_id FK
        uuid sender_id "ref identity.user"
        uuid client_msg_id
        text body "Soll: nullable"
        timestamptz created_at
        timestamptz read_at
        timestamptz deleted_at "Soll"
    }
    CONTACT_CONSENT {
        uuid conversation_id PK
        uuid user_id PK
        string state
        timestamptz granted_at
        timestamptz withdrawn_at
        timestamptz declined_at
        int request_count
        timestamptz last_request_at
    }
    DEAL {
        uuid id PK
        uuid conversation_id FK
        uuid listing_id "ref listings.listing"
        uuid seller_id "ref identity.user"
        uuid buyer_id "ref identity.user"
        int agreed_price_cents
        string currency
        string status
    }
    PAYMENT {
        uuid id PK
        uuid deal_id "ref messaging.deal"
        string psp_ref
        string status
    }
    MODERATION_CASE {
        uuid id PK
        string target_type
        uuid target_id "ref"
        string status
        bool hidden
    }
    REPORT {
        uuid id PK
        uuid case_id FK
        uuid reporter_id "nullable, ref"
        string reason
    }
    DECISION {
        uuid id PK
        uuid case_id FK
        uuid moderator_id "ref"
        string decision
        string reason
        string rule_ref "Regel (lit. e)"
        text legal_ground "Norm und Erläuterung (lit. d), Pflicht bei illegal_content"
        string criminal_suspicion "none, suspected, imminent_danger"
        text criminal_suspicion_reason
        bool automated_detection
        timestamptz notified_at
    }
    APPEAL {
        uuid id PK
        uuid decision_id FK
        uuid appellant_id "ref identity.user"
        string appellant_role "subject, reporter"
        text reason
        string status "open, upheld, reversed"
        uuid reviewer_id "ref, unbeteiligt (Vier-Augen)"
        text outcome_reason
        timestamptz created_at
        timestamptz decided_at
    }
    APPEAL_TOKEN {
        text token_hash PK
        uuid decision_id FK
        uuid user_id "ref"
        timestamptz expires_at "Fristende 6 Monate"
        timestamptz used_at
    }
    NOTICE {
        uuid id PK
        uuid user_id "ref"
        string kind "decision, appeal_result, provisional_hide"
        string recipient_role "subject, reporter"
        uuid decision_id "FK, nullable"
        uuid case_id "FK, nur provisional_hide"
        uuid appeal_id "FK, nullable"
        timestamptz read_at
    }
    EVIDENCE_HOLD {
        uuid id PK
        uuid decision_id FK
        string target_type
        uuid target_id "ref"
        bool urgent
        timestamptz held_until "höchstens 6 Monate"
        timestamptz released_at
    }
    EVIDENCE_COPY {
        uuid id PK
        uuid hold_id FK
        jsonb content "pseudonymisierte Kopie mit Kontext"
    }
    DECISION ||--o{ APPEAL : "wird angefochten"
    DECISION ||--o{ APPEAL_TOKEN : "Einmal-Link"
    DECISION ||--o{ NOTICE : "wird mitgeteilt"
    DECISION ||--o{ EVIDENCE_HOLD : "sichert"
    EVIDENCE_HOLD ||--o{ EVIDENCE_COPY : "enthält"
```

Weitere Spalten aus den Migrationen 0003/0004: `messaging.message.removed_at`, `original_body`, `original_kind` (Originaltext entfernter Nachrichten für die Wiederherstellung bei Stattgabe, 6 Monate, nicht bei offenem Widerspruch), `listings.listing.status_before_removal` (Status vor der Entfernung), `platform.ip_pepper` (Pseudonymisierungsschlüssel, ADR-0014). `SETTING` hält außer Wartungsmodus und Ankündigung auch `backup.last_success_at` und das Abmelde-Geheimnis (`unsubscribe.secret`, falls keine Variable gesetzt ist).

`CONTACT_CONSENT` hält je Teilnehmer und Konversation den Zustand der Kontaktfreigabe (REQ-CHAT-010): `state` ∈ {`granted`, `withdrawn`, `declined`}, mit Zeitpunkten für Zustimmung, Widerruf und Ablehnung sowie Zähler und Zeitpunkt der letzten Anfrage für die Sperrfrist (24 h) und die Höchstzahl (3). Die Adresse selbst bleibt im Modul `identity` und wird nur bei beidseitiger Zustimmung über ein schmales API gelesen (siehe 8.1). Ein Deal je Konversation kann nach Storno neu entstehen; offen ist höchstens einer je Anzeige. (Stand: umgesetzt B-01, Migration `0002_contact_consent.sql`.)

`APPEAL` hält den Widerspruch gegen genau eine Entscheidung. Pro Entscheidung und widersprechender Person (Betroffene oder Meldende, `appellant_role`) gibt es höchstens einen Widerspruch. Er ist binnen 6 Monaten nach `notified_at` möglich (DSA Art. 20 Abs. 1); widersprechen können Betroffene und Meldende, deren Meldung abgelehnt wurde. Entschieden wird er von einem Moderator, der nicht der ursprüngliche Entscheider ist; die Anwendung prüft das (`reviewer_id ≠ decision.moderator_id`), weil ein Constraint über zwei Zeilen in Postgres nur per Trigger ginge. `SETTING` (Schema `platform`) hält Wartungsmodus und Ankündigung. `USER.locale` speichert die Sprachwahl (ADR-0016).

Unique-Constraints (Auszug): `USER(email_canonical)` · `CONVERSATION(listing_id, buyer_id)` (REQ-CHAT-002) · `MESSAGE(conversation_id, client_msg_id)` (REQ-CHAT-004, Idempotenz) · `DEAL(listing_id) WHERE status = 'agreed'` · `ALLOWED_DOMAIN(domain)` · `APPEAL(decision_id, appellant_id)` (geplant). Die Job-Tabellen verwaltet pg-boss in einem eigenen Schema `pgboss`.

#### Löschung und Anonymisierung (Soll-Modell, REQ-PRIV-003, REQ-ACC-002)

| Datenobjekt | Bei Kontolöschung | Modellierung | Stand |
|---|---|---|---|
| Konto, Sessions, Tokens | gelöscht | `identity.user` + `ON DELETE CASCADE` | umgesetzt |
| Anzeigen, Bilder, Merkliste, Blockierungen | gelöscht | je Modul über `privacy` | umgesetzt |
| Eigene Nachrichten | Text gelöscht, Nachricht bleibt als Platzhalter; das Gegenüber behält die Konversation | `message.body` nullable + `deleted_at`; „Ehemaliges Mitglied“ entsteht, weil `sender_id` nicht mehr auflösbar ist | geplant B-22 (Sprint 2); heute werden ganze Konversationen gelöscht |
| Meldungen des Mitglieds | bleiben für die Frist, ohne Personenbezug | `report.reporter_id := NULL` | umgesetzt |
| Einwilligungen | Nachweis bleibt ohne Profilbezug | `consent.user_id` nullable, `anonymized_at` | geplant B-22 (Sprint 2) |
| Kontaktfreigaben | mit der Konversation gelöscht bzw. für das Gegenüber ausgeblendet | `CONTACT_CONSENT` | Kaskade mit der Konversation umgesetzt (B-01); Ausblenden geplant B-22 |

## 6. Laufzeitsicht

Teilnehmernamen folgen den C4-Sichten (ADR-0012 Regel 5): Web-App, Anwendung: &lt;Komponente&gt;, Datenbank, E-Mail-System (Mailpit).

### 6.1 Registrierung mit E-Mail-Verifikation

```mermaid
sequenceDiagram
    autonumber
    actor G as Gast
    participant SPA as Web-App
    participant A as Anwendung: identity
    participant DB as Datenbank
    participant J as Anwendung: Job-Worker
    participant MP as E-Mail-System (Mailpit)

    G->>SPA: Formular absenden
    SPA->>A: POST /api/v1/auth/register
    A->>A: Rate-Limit prüfen (je Adresse und je IP, REQ-SEC-005)
    A->>A: E-Mail normalisieren, Domain gegen Whitelist (BR-01)
    A->>A: Passwort prüfen (Länge, lokale Leak-Liste), Argon2id-Hash
    A->>DB: BEGIN → INSERT user (unbestätigt), consent, token-hash<br/>Job send-email einreihen → COMMIT
    A-->>SPA: 202 Accepted (neutrale Antwort)
    SPA-->>G: „Bitte E-Mail bestätigen“
    Note over DB,J: asynchron
    J->>DB: Job abholen (SKIP LOCKED)
    J->>MP: SMTP senden (Timeout 10 s, Wiederholung mit Backoff)
    G->>MP: Mail öffnen (im Beispiel in der Mailpit-UI)
    G->>SPA: Link /verify?token=… öffnen
    SPA->>A: POST /api/v1/auth/verify
    A->>DB: Token-Hash prüfen (einmalig, ≤ 24 h), Status aktiv, Session anlegen
    A-->>SPA: Session-Cookie (HttpOnly, Secure, SameSite=Lax)
```

### 6.2 Chat-Nachricht senden

```mermaid
sequenceDiagram
    autonumber
    actor I as Interessent
    participant SPA as Web-App
    participant MSG as Anwendung: messaging
    participant DB as Datenbank
    participant RB as Anwendung: RealtimeBroker
    participant WS as Anwendung: WebSocket-Gateway
    actor V as Anbieter

    I->>SPA: Nachricht absenden
    SPA->>MSG: POST /api/v1/conversations/{id}/messages {body, clientMsgId}
    MSG->>MSG: Teilnahme, Blockierung, Rate-Limit prüfen
    MSG->>DB: BEGIN → INSERT message ON CONFLICT (conversation_id, client_msg_id) DO NOTHING<br/>Job notify-unread (startAfter 15 min) → COMMIT
    MSG-->>SPA: 201 Message
    MSG->>RB: publish(Anbieter, message)
    RB->>WS: Ereignis an verbundene Sockets
    WS-->>V: message (falls verbunden)
    Note over V,DB: Nach 15 min prüft der Job read_at.<br/>Ist die Nachricht ungelesen, folgt eine gebündelte E-Mail ohne Inhalt.
    V->>SPA: Konversation öffnen
    SPA->>MSG: POST /api/v1/conversations/{id}/read
    MSG->>DB: UPDATE read_at
    MSG->>RB: publish(Interessent, read)
```

**Senden:** Die Web-App sendet per REST (idempotent über `clientMsgId`, bis zu drei Wiederholungen mit derselben ID); das WebSocket-Gateway nimmt `send`- und `read`-Ereignisse ebenfalls an, die Web-App nutzt sie aber nicht. **Wiederherstellung nach Verbindungsabbruch:** Nach dem Reconnect lädt der Client Verpasstes per REST mit `GET /conversations/{id}/messages?after=<letzte ID>` nach; solange keine Verbindung besteht, fragt er alle 10 s ab. Die Zustellung ist **at-least-once**, die Idempotenz entsteht über `client_msg_id` (REQ-CHAT-004).
**Skalierungspfad (nicht im Beispiel):** Der `RealtimeBroker`-Adapter wird gegen `PgNotifyAdapter` (Postgres `LISTEN/NOTIFY`) getauscht. Danach sind mehrere `api`-Instanzen möglich, und Ereignisse aus Worker-Prozessen erreichen WebSockets.

### 6.3 Anzeige mit Bildern veröffentlichen

```mermaid
sequenceDiagram
    autonumber
    actor M as Mitglied
    participant SPA as Web-App
    participant L as Anwendung: listings
    participant ST as Anwendung: StoragePort
    participant DB as Datenbank
    participant J as Anwendung: Job-Worker

    M->>SPA: Bilder wählen, Formular ausfüllen
    SPA->>L: POST /api/v1/uploads (multipart, ≤ 10 MB je Datei)
    L->>ST: put(quarantine/…)
    L-->>SPA: 201 {uploads}
    SPA->>L: POST /api/v1/listings {…, imageIds}
    L->>L: Validierung, Inhaltsprüfung (REQ-LST-010), Limit 30
    L->>DB: BEGIN → INSERT listing (aktiv oder in Prüfung)<br/>Job process-image je Bild → COMMIT
    L-->>SPA: 201 Created
    J->>ST: Original laden, Magic Bytes prüfen,<br/>WebP neu kodieren (Metadaten entfernt), 3 Größen
    J->>DB: Bildstatus ready
```

### 6.4 Kontaktdaten freigeben (UC-25, REQ-CHAT-010) – umgesetzt (B-01)

```mermaid
sequenceDiagram
    autonumber
    actor A as Lea (Interessent)
    participant SPA as Web-App
    participant MSG as Anwendung: messaging
    participant ID as Anwendung: identity
    participant DB as Datenbank
    participant RB as Anwendung: RealtimeBroker
    actor B as Ben (Anbieter)

    A->>SPA: „Kontaktdaten teilen“ bestätigen
    SPA->>MSG: POST /api/v1/conversations/{id}/contact {action: grant}
    MSG->>MSG: Teilnahme, Blockierung, Sperrfrist (24 h) und Höchstzahl (3) prüfen
    MSG->>DB: Zustimmung von Lea speichern (granted_at)
    MSG->>RB: publish(Ben, conversation)
    RB-->>B: Anfrage „Lea möchte Kontaktdaten austauschen“
    alt Ben stimmt zu
        B->>SPA: „Zustimmen“
        SPA->>MSG: POST /api/v1/conversations/{id}/contact {action: grant}
        MSG->>DB: Zustimmung von Ben speichern + Systemnachricht ohne Adressen
        MSG->>RB: publish(Lea, Ben, conversation)
        A->>SPA: Konversation laden
        SPA->>MSG: GET /api/v1/conversations/{id}
        MSG->>ID: getSharedContactAddresses([Ben]) – nur wenn beide zugestimmt haben
        MSG-->>SPA: contact.counterpartEmail (Konversationsangabe)
    else Ben lehnt ab
        B->>SPA: „Ablehnen“
        SPA->>MSG: POST /api/v1/conversations/{id}/contact {action: decline}
        MSG->>DB: declined_at speichern, Sperrfrist beginnt
        MSG->>RB: publish(Lea, conversation)
    else Widerruf oder Blockierung
        A->>SPA: „Zustimmung widerrufen“ bzw. Blockierung
        SPA->>MSG: POST /api/v1/conversations/{id}/contact {action: withdraw}
        MSG->>DB: withdrawn_at speichern
        MSG-->>SPA: contact.counterpartEmail = null für beide
    end
    Note over MSG,DB: Die Adresse wird nie als Nachricht gespeichert und erscheint daher<br/>nicht im gemeldeten Kontext (REQ-PRIV-004).
```

### 6.5 Widerspruch gegen eine Moderationsentscheidung (UC-35, UC-36, REQ-LEGAL-006/007) – umgesetzt (B-46)

```mermaid
sequenceDiagram
    autonumber
    actor M as Mitglied (betroffen)
    participant SPA as Web-App
    participant T as Anwendung: trust
    participant DB as Datenbank
    participant N as Anwendung: notifications
    actor M1 as Moderator 1
    actor M2 as Moderator 2

    M1->>SPA: Entscheidung „entfernen“ mit Regel und Begründung
    SPA->>T: POST /api/v1/moderation/cases/{id}/decision
    T->>DB: BEGIN → Entscheidung, Audit-Eintrag, notified_at<br/>Mail-Job einreihen → COMMIT
    T->>N: Begründung mit Regel, Folgen und Widerspruchshinweis (6 Monate)
    M->>SPA: Mitteilung öffnen, „Widerspruch einlegen“
    SPA->>T: POST /api/v1/moderation/decisions/{id}/appeal {reason}
    T->>T: betroffen oder meldend? Frist? noch kein Widerspruch? Begründung ≥ 20 Zeichen?
    T->>DB: Widerspruch speichern (open), Audit-Eintrag
    T-->>SPA: 201 Widerspruch eingegangen
    M2->>SPA: Widerspruchs-Queue öffnen
    SPA->>T: GET /api/v1/moderation/appeals?status=open
    T-->>SPA: Widersprüche mit canDecide (falsch bei eigener Entscheidung, eigenem Widerspruch oder Beteiligung)
    M2->>SPA: „Entscheidung aufheben“ mit Begründung
    SPA->>T: POST /api/v1/moderation/appeals/{id}/decision
    T->>T: Vier-Augen-Prüfung: M2 ist weder Entscheider noch Widersprechende, Betroffene oder Meldende (sonst 403 four_eyes)
    alt aufgehoben
        T->>DB: Inhalt mit vorherigem Status wiederherstellen bzw. Sperre aufheben (nur ohne weitere Sperre), Status reversed<br/>Inhalt nicht mehr vorhanden → 409 restore_impossible
    else bestätigt
        T->>DB: Status upheld
    end
    T->>N: Ergebnis mit Begründung an beide Seiten (Betroffene und Meldende)
    Note over T,DB: Alle Schritte stehen im Audit-Log (REQ-MOD-003).<br/>Ein gesperrtes Konto erreicht den Widerspruch über den Link in der Mail, ohne Anmeldung.
```

**Gesperrte Konten:** Wer gesperrt ist, kann sich nicht anmelden (REQ-SEC-011). Die Begründungs-Mail enthält deshalb einen einmaligen, 6 Monate gültigen Link (gehashtes Token wie bei der Verifikation). Das Token steht nur im **URL-Fragment** (`/widerspruch#token=…`), gelangt so nicht in Server-Logs und wird per `POST /api/v1/appeals/token/info` bzw. `POST /api/v1/appeals/token` übermittelt; danach entfernt die Web-App es aus der Adresszeile. Ältere Links mit `?token=` funktionieren weiter. Der Link öffnet nur das Widerspruchsformular für genau diese Entscheidung.

**Originaltext für Prüfende:** Bei einem Widerspruch gegen das Entfernen einer Nachricht sehen Prüfende deren Originaltext; jeder Zugriff erzeugt einen Audit-Eintrag (RV-C-10). Originaltexte werden nicht gelöscht, solange ein Widerspruch offen ist.

### 6.6 Wartungsmodus (UC-44, REQ-OPS-006) – umgesetzt (B-53)

```mermaid
sequenceDiagram
    autonumber
    actor AD as Administrator
    actor M as Mitglied
    participant SPA as Web-App
    participant H as Anwendung: Betriebs-Endpunkte
    participant S as Anwendung: Einstellungen
    participant DB as Datenbank

    AD->>SPA: Ankündigung „Wartung heute 18–19 Uhr“ setzen
    SPA->>H: PUT /api/v1/admin/announcement
    H->>S: speichern, Audit-Eintrag
    S->>DB: platform.setting
    M->>SPA: beliebige Seite
    SPA->>H: GET /api/v1/status
    H-->>SPA: Ankündigung als Banner
    AD->>SPA: Wartungsmodus einschalten
    SPA->>H: PUT /api/v1/admin/maintenance {on: true, until}
    M->>SPA: Anzeige anlegen
    SPA->>H: POST /api/v1/listings
    H->>S: Wartungsmodus aktiv? (Cache ≤ 10 s)
    H-->>SPA: 503 Problem Details, Retry-After
    SPA-->>M: Wartungsseite mit Zeitpunkt, Rechtstexte und Statusseite bleiben erreichbar
    Note over H,S: Ausnahmen: Health, Status, Anmeldung und Admin-API für Admins,<br/>statische Dateien und Rechtsseiten. Harte Wartung per MAINTENANCE_MODE=true beim Start.
```

## 7. Verteilungssicht

### 7.1 C4 Verteilungsdiagramm: Docker-Beispiel (verbindlich für das Projekt)

```mermaid
C4Deployment
    title C4 Verteilung – Docker-Beispiel auf dem Prüfrechner
    Deployment_Node(host, "Prüf- oder Entwicklerrechner", "Windows, macOS oder Linux mit Docker") {
        Deployment_Node(browser, "Browser", "Edge, Chrome, Firefox, Safari") {
            Container(spa, "Web-App", "React-SPA, PWA")
            Container(mpui, "Mailpit-Oberfläche", "Web-UI :8025")
        }
        Deployment_Node(compose, "Docker Compose", "Projekt campusmarkt") {
            Deployment_Node(appc, "Docker-Container app", "Image campusmarkt, non-root, read-only") {
                Container(app, "Anwendung", "Node.js, Fastify, Modus all")
                ContainerDb(files, "Bildablage", "Docker-Volume uploads")
            }
            Deployment_Node(dbc, "Docker-Container db", "postgres:17-alpine") {
                ContainerDb(db, "Datenbank", "PostgreSQL 17, Volume pgdata")
            }
            Deployment_Node(mpc, "Docker-Container mailpit", "axllent/mailpit") {
                System_Ext(mail, "E-Mail-System", "Mailpit, SMTP :1025")
            }
        }
    }
    Rel(spa, app, "HTTP :8080, WS")
    Rel(mpui, mail, "HTTP :8025")
    Rel(app, db, "SQL :5432")
    Rel(app, files, "Dateisystem")
    Rel(app, mail, "SMTP :1025")
    UpdateLayoutConfig($c4ShapeInRow="2", $c4BoundaryInRow="2")
```

**Hinweise:** Mailpit ist im C4-Modell ein **externes System** (es vertritt den SMTP-Relay des Echtbetriebs), wird im Beispiel aber lokal als dritter Compose-Dienst betrieben. Das Volume `uploads` ist in den Container `app` eingehängt und deshalb dort gezeichnet.

| Aspekt | Festlegung |
|---|---|
| Start | `docker compose up --build` |
| Start-Reihenfolge | `app` wartet per Healthcheck auf `db` |
| Migrationen | laufen beim Start automatisch, idempotent (REQ-OPS-005) |
| Seed-Daten | `SEED_DEMO=true`: Institution, Whitelist, Standorte, Kategorien, Demo-Konten, 30 Anzeigen, Chats, offene Meldung (REQ-DEMO-001) |
| Konfiguration | nur Umgebungsvariablen (`.env.example`), keine Secrets im Image |
| Health | `/health/live`, `/health/ready`, Docker-`HEALTHCHECK` (Modus `all`/`api`) |
| Logs | JSON auf stdout, ohne personenbezogene Daten |
| Reset | `docker compose down -v` |

| Umgebung | Zweck | Infrastruktur | Stand |
|---|---|---|---|
| `local` | Entwicklung | `compose.dev.yaml` (db + mailpit), App per `pnpm dev` | umgesetzt |
| `ci` | Tests | GitHub Actions: Typprüfung, Unit-Tests, `lint:deps`, `trace.mjs`, Image-Build, E2E- und Smoke-Test gegen das Compose-Setup | umgesetzt B-07 (`.github/workflows/ci.yml`) |
| `demo` | Abgabe / Vorführung | `docker compose up` | umgesetzt |
| `demo` + Profile | Vorführung Betrieb | `docker compose --profile proxy --profile monitoring up` | umgesetzt (B-54, B-55) |

| Aspekt (Betrieb, EPIC-13) | Festlegung |
|---|---|
| Sicherung | `node scripts/backup.mjs` → `backups/<Zeitstempel>/` mit `db.dump`, `uploads.tar.gz`, `manifest.json` (ADR-0018) |
| Wiederherstellung | `node scripts/restore.mjs <ordner>`; App läuft dabei im Wartungsmodus; in CI nach jeder Änderung getestet |
| Wartung | `MAINTENANCE_MODE=true` (harte Wartung beim Start) oder per Admin-Oberfläche (weiche Wartung) |
| Aktualisierung | Renovate-Pull-Requests (REQ-OPS-012), Ablauf in [docs/07-betrieb/update-prozess.md](../07-betrieb/update-prozess.md) |
| Runbooks | [Betriebshandbuch](../07-betrieb/betriebshandbuch.md), [Störungen](../07-betrieb/incident-prozess.md), [Datenpannen](../06-recht/datenpannen-prozess.md) |

### 7.2 Ausblick Echtbetrieb (nicht Teil des Projekts, EPIC-12)
Gleiches Image. Getrennte `api`- und `worker`-Instanzen, managed Postgres mit PITR, echter SMTP-Relay (SPF/DKIM/DMARC, Vorlage in [mail-zustellbarkeit.md](../07-betrieb/mail-zustellbarkeit.md)), S3-Adapter, `PgNotifyAdapter`, Reverse Proxy mit TLS (Vorlage: Profil `proxy`, ADR-0017), Tracing (geplant R2). Die Betreiberpflichten (Impressum, Datenschutzerklärung, DSA-Prozesse) sind als Übung mit Platzhaltern vorhanden (EPIC-13); vor dem Go-live werden die Platzhalter ersetzt und rechtlich geprüft ([Go-live-Checkliste](../07-betrieb/go-live-checkliste.md), `LEGAL_STRICT=true`). Die **Fachlogik** ändert sich nicht; nötig sind folgende Betriebsanpassungen:
- **Health im Worker-Modus:** Der Worker startet keinen HTTP-Server; sein Healthcheck läuft per Kommando (Datenbank erreichbar, pg-boss aktiv) statt über `/health/ready` (geplant B-41, Sprint 2).
- **`TRUST_PROXY`:** Hinter einem Reverse Proxy wird die Client-IP aus `X-Forwarded-For` übernommen, sonst teilten sich alle Nutzer einen Rate-Limit-Schlüssel. Die App vertraut genau einem Hop; im Profil `proxy` setzt `.env.proxy.example` die Variable (Stand: umgesetzt, Review v1.3).
- **Ereignisse aus Jobs:** erreichen WebSockets erst mit dem `PgNotifyAdapter`, weil der In-Process-Broker nur innerhalb eines Prozesses verteilt.
- **`/metrics`:** nur intern erreichbar (eigener Port oder Proxy-Regel), nicht öffentlich.

### 7.3 Optionale Betriebsprofile `proxy` und `monitoring` (ADR-0017) – umgesetzt (B-54, B-55)

```mermaid
C4Deployment
    title C4 Verteilung – Docker-Beispiel mit den Profilen proxy und monitoring
    Deployment_Node(host2, "Prüf- oder Entwicklerrechner", "Docker") {
        Deployment_Node(browser2, "Browser", "Edge, Chrome, Firefox, Safari") {
            Container(spa2, "Web-App", "über https://campusmarkt.localhost:8443")
        }
        Deployment_Node(compose2, "Docker Compose", "Projekt campusmarkt") {
            Deployment_Node(proxyc, "Docker-Container proxy", "caddy:2.11.6-alpine, Profil proxy") {
                Container(proxy2, "Reverse Proxy", "TLS intern, HSTS, Weiterleitung")
            }
            Deployment_Node(appc2, "Docker-Container app", "Image campusmarkt") {
                Container(app2, "Anwendung", "Fastify, TRUST_PROXY=true")
            }
            Deployment_Node(promc, "Docker-Container prometheus", "prom/prometheus:v3.15.0, Profil monitoring, 127.0.0.1:9090") {
                Container(prom2, "Prometheus", "Abfrage alle 15 s, Alarmregeln")
            }
            Deployment_Node(amc, "Docker-Container alertmanager", "prom/alertmanager:v0.34.1, Profil monitoring, 127.0.0.1:9093") {
                Container(am2, "Alertmanager", "Gruppierung, Mail-Versand")
            }
            Deployment_Node(mpc2, "Docker-Container mailpit", "axllent/mailpit") {
                System_Ext(mail2, "E-Mail-System", "Mailpit")
            }
        }
    }
    Rel(spa2, proxy2, "HTTPS :8443, WSS")
    Rel(proxy2, app2, "HTTP :8080")
    Rel(prom2, app2, "HTTP /metrics")
    Rel(prom2, am2, "Alarme")
    Rel(am2, mail2, "SMTP :1025")
    UpdateLayoutConfig($c4ShapeInRow="2", $c4BoundaryInRow="2")
```

**Hinweise:** `db` ist der Übersicht halber nicht gezeichnet (unverändert wie 7.1). HSTS gilt nur für `campusmarkt.localhost`, nicht für `localhost`, damit andere lokale Dienste nicht betroffen sind (Risiko R-13).

**Ablauf der Datensicherung (ADR-0018, B-56):**

```mermaid
flowchart LR
    B1["backup.mjs"] --> B2["pg_dump -Fc im Container db"]
    B2 --> B3["tar der Uploads im Container app"]
    B3 --> B4["manifest.json mit SHA-256, Migration, Version"]
    B4 --> B7["Umbenennen von .partial, Kopie des Löschjournals"]
    B7 --> B6["Zeitpunkt in platform.setting"]
    B6 --> B5[("backups/Zeitstempel")]
    B5 --> R1["restore.mjs"]
    R1 --> R2["Manifest, Prüfsummen, Projekt und Migration prüfen"]
    R2 --> R3["App stoppen"]
    R3 --> R4["pg_restore in temporäre Datenbank"]
    R4 --> R5["Uploads in .restore-new entpacken"]
    R5 --> R7["Tausch von Datenbank und Bildern<br/>(vorher Fehler: alter Stand bleibt)"]
    R7 --> R8["Löschjournal seit Sicherung abspielen"]
    R8 --> R6["App starten, Migrationen idempotent"]
```

## 8. Querschnittliche Konzepte

### 8.1 Sicherheit
- **Authentifizierung:** serverseitige Sessions (gehashtes Opaque-Token in Postgres), Cookie `HttpOnly; Secure; SameSite=Lax`. Siehe ADR-0003. Nur Konten mit Status `aktiv` erhalten eine gültige Sitzung; eine Sperre oder Löschung entzieht jeden Zugriff sofort (REQ-SEC-011).
- **Autorisierung:** zentrale Prüfung pro Ressource in den Fachmodulen, *deny by default*; fremde Ressourcen liefern 404 (REQ-SEC-006).
- **Eingaben:** Validierung an der Grenze gegen die TypeBox-Schemas aus `packages/contracts` (Fastify), aus denen auch die OpenAPI-Spezifikation erzeugt wird. Ausgabe-Encoding durch React. Strikte CSP (die SPA kommt vom selben Origin). CSRF-Schutz über Pflicht-Header und Origin-Prüfung (ADR-0011).
- **Container-Härtung:** Non-root-User, Read-only-Root-FS, `no-new-privileges`, keine Secrets im Image, minimales Base-Image. Image-Scan (Trivy), Renovate, SCA, Secret-Scan und SBOM sind geplant (B-06, Sprint 4).
- **Rate-Limits (REQ-SEC-005, Q-18):** Anmeldung 5 Fehlversuche je (Adresse, IP) in 15 min, Registrierung 3 je Adresse und 30 je IP und Stunde; immer Wartezeit statt Kontosperre. Der Zählerspeicher liegt in derselben Datenbank; ist sie nicht erreichbar, wird die Anfrage abgelehnt (**fail closed**). Schlüssel enthalten keine Klartext-Adressen oder -IPs, sondern HMAC-Pseudonyme (ADR-0014). Die Anmeldung zählt einen Versuch zuerst atomar und setzt den Zähler bei Erfolg zurück. (Stand: umgesetzt B-34, B-35.)
- **Pseudonymisierte IP-Adressen (ADR-0014):** HMAC-SHA256 mit einem zufälligen 256-Bit-Schlüssel aus `platform.ip_pepper`. Er wird beim ersten Gebrauch erzeugt, falls keiner gültig ist, und nach 24 h beim nächsten Gebrauch gewechselt; der Vorgänger bleibt 1 h gültig (längstes Zählfenster) und wird dann gelöscht. Kein Standardwert im Code, kein Secret im Image; für mehrere Instanzen tragfähig. Gespeicherte Werte sind ohne den Schlüssel nicht zurückrechenbar und höchstens 7 Tage vorhanden (REQ-PRIV-002). (Stand: umgesetzt, Review v1.3 RV-R-02; der frühere feste Salt ist entfernt.)
- **Vertrauensgrenze Kontaktfreigabe (REQ-CHAT-010, REQ-PRIV-002):** Die Entscheidung „darf die Adresse sehen“ ist eine reine Funktion in `messaging/domain.ts` (beide Zustimmungen erteilt, keine Blockierung, Gegenüber aktiv) und wird tabellarisch getestet. `identity` stellt dafür ein schmales API `getSharedContactAddresses(userIds)` bereit, das nur für aktive Konten die bei der Registrierung eingegebene Adresse liefert; das bestehende `getContact` bleibt dem Versand von E-Mails (`notifications`) vorbehalten. In `packages/contracts` tragen nur `Me`, `AdminUser` und `ContactShare.counterpartEmail` E-Mail-Felder; die Smoke-Prüfung AT-CHAT-001-2 stellt sicher, dass Konversationen und Nachrichten außerhalb von `contact` keine Adresse enthalten. Die Adresse ist nie Teil einer Nachricht, daher sieht die Moderation sie auch im gemeldeten Kontext nicht. Zustimmungen erscheinen im Datenexport. Missbrauchsschutz über Sperrfrist (24 h) und Höchstzahl (3). (Stand: umgesetzt B-01.)
- **Demo-spezifisch:** Demo-Passwörter stehen nur in der Seed-Dokumentation und werden nur bei `SEED_DEMO=true` angelegt.
- **Meldeweg für Sicherheitslücken (REQ-SEC-012):** `/.well-known/security.txt` nach RFC 9116 mit `Contact`, `Expires`, `Preferred-Languages` und `Policy`; Kontakt als Platzhalter. Ablauf in [docs/07-betrieb/incident-prozess.md](../07-betrieb/incident-prozess.md) (Stand: umgesetzt B-52).
- **Keine Indexierung (REQ-PRIV-008):** `robots.txt` mit `Disallow: /` und Header `X-Robots-Tag: noindex, nofollow` auf allen Antworten (Stand: umgesetzt B-52).
- **Transportverschlüsselung (REQ-OPS-009):** im Beispiel optional über das Profil `proxy` mit HSTS (ADR-0017); das Sitzungscookie ist bereits `Secure`.
- **Penetrationstest (REQ-SEC-013):** vor einem Go-live nach ASVS L2, Plan in [docs/07-betrieb/pentest-plan.md](../07-betrieb/pentest-plan.md).

### 8.2 Zuverlässigkeit
- **Transaktionales Enqueue** (pg-boss im selben Commit) für alle Seiteneffekte. Kein Seiteneffekt geht verloren, keiner wird ohne Commit ausgeführt.
- **Timeouts** für alle externen Aufrufe (SMTP 10 s), **Retry** nur idempotent mit Backoff, Dead-Letter-Queue mit Übersicht im Admin-Bereich.
- **Wiederholungsplan E-Mail (REQ-NOTI-005, ADR-0005):** `retryLimit: 4`, `retryDelaySeconds: 120`, exponentiell → Wartezeiten von mindestens 2 + 4 + 8 + 16 = 30 min (mit Zufallsanteil bis 60 min). Ein Ausfall des Mailservers bis 30 min wird ohne Verlust überbrückt; danach steht die Mail in der Dead-Letter-Übersicht. (Stand: geplant B-36, Sprint 2; heute 10 s Grundabstand.)
- **Domain Events per publish/subscribe:** Ereignisse wie `DealAgreed` werden pro Konsument in eine eigene Queue verteilt, damit weitere Konsumenten (z. B. `payments`) rein additiv hinzukommen (geplant B-40, Sprint 2).
- **Graceful Shutdown** bei `SIGTERM` (`docker compose stop`): keine neuen Requests annehmen, WebSockets schließen (Client verbindet neu), laufende Jobs beenden (≤ 30 s).
- **Degradation:** Chat fällt auf Polling zurück. Suche fällt auf Titel-ILIKE zurück.

### 8.3 E-Mail-Konzept
- Vorlagen als TypeScript-Funktionen (HTML + Text) im Modul `notifications`, deutsch und i18n-fähig ([ADR-0011](decisions/0011-mvp-umsetzung.md) Nr. 3).
- **Keine Chatinhalte** in E-Mails, nur Hinweise mit Link.
- Im Beispiel landen alle Mails in Mailpit. Damit ist auch die Registrierung mit echten Adressformaten wie `@studmail.hwg-lu.de` gefahrlos vorführbar, weil nichts das Rechnernetz verlässt.
- Zustellbarkeit (SPF/DKIM/DMARC, Bounces) ist für das Beispiel nicht relevant; Beispiel-DNS-Einträge für den Echtbetrieb stehen in [mail-zustellbarkeit.md](../07-betrieb/mail-zustellbarkeit.md) (REQ-OPS-010).
- **Fußzeile (REQ-UX-006):** Jede Mail enthält Links zu Impressum, Datenschutzerklärung und den Benachrichtigungs-Einstellungen; Werbung gibt es nicht (nur transaktionale Mails) (Stand: umgesetzt B-43).
- **One-Click-Abmeldung (REQ-OPS-010):** Nicht-transaktionale Mails tragen `List-Unsubscribe` und `List-Unsubscribe-Post`. Das Token ist ein HMAC mit einem zufälligen Geheimnis aus `platform.setting` (oder `UNSUBSCRIBE_SECRET`); ein GET zeigt nur eine Bestätigungsseite, erst der POST meldet ab. RFC 8058 verlangt eine HTTPS-URI – konform also erst mit HTTPS-`PUBLIC_URL` (Profil `proxy` bzw. Echtbetrieb), im lokalen Standardstart über HTTP formal nicht (RV-C-13).
- **Sprache:** Mails gehen in der Konto-Sprache (ADR-0016, umgesetzt B-51).
- **Begründung bei Moderation (DSA Art. 17):** Die Entscheidungs-Mail enthält Entscheidung, Regel bzw. bei rechtswidrigen Inhalten die Rechtsgrundlage (`legal_ground`), Tatsachen, ob automatisiert erkannt (Wortfilter, vorläufiges Ausblenden) und den Widerspruchsweg; Meldende erhalten Ergebnis, Begründung und Rechtsbehelfe (REQ-LEGAL-006, REQ-MOD-003, Vorlage in [dsa-prozesse.md](../06-recht/dsa-prozesse.md)). Beim vorläufigen Ausblenden ab drei Meldungen geht eine Mitteilung `provisional_hide` an die Betroffene (REQ-MOD-004).

### 8.4 Datenschutz: Datenklassen und verantwortliche Löschläufe

> Die Fristen sind verbindlich in [REQ-PRIV-003](../02-anforderungen/req/REQ-PRIV-003.md) festgelegt. Diese Übersicht ordnet die Datenklassen den Modulen und Löschläufen zu; sie nennt bewusst keine eigenen Fristen. Welche Fristen bereits automatisch durchgesetzt werden, zeigt der [Katalog-Index](../02-anforderungen/02-anforderungen.md#6-katalog-index) (REQ-PRIV-003 ist erst teilweise umgesetzt).

| Datenkategorie | Klasse | Modul | Löschlauf |
|---|---|---|---|
| E-Mail-Adresse, Passwort-Hash, Sessions, Tokens | vertraulich | identity | Kontolöschung über `privacy-purge` (täglich 03:17); unbestätigte Konten und Tokens geplant B-12 |
| Einwilligungen | vertraulich (Nachweis) | identity | Anonymisierung bei Kontolöschung geplant B-22 |
| Anzeigen, Bilder | intern (nur Mitglieder) | listings | `listings-maintenance` (stündlich); Ü-12/Ü-13/Ü-19 geplant B-32 |
| Merkliste | intern | search | mit dem Konto |
| Chatnachrichten, Deals, Kontaktfreigaben | **vertraulich** | messaging | Fristen für Chats geplant B-12; Kontolöschung mit Anonymisierung geplant B-22 |
| Meldungen, Moderationsentscheidungen, Blockierungen | vertraulich | trust | Fristen geplant B-12 |
| Audit-Log (Admin- und Moderationsaktionen) | vertraulich | platform | Frist geplant B-12 |
| Zählerspeicher Rate-Limit (pseudonymisierte IP und Adresse) | vertraulich | platform | täglich in `privacy-purge` |
| IP-Pseudonymisierungsschlüssel | geheim | platform | Rotation täglich, Vorgänger nach 1 h gelöscht (ADR-0014, umgesetzt) |
| Löschjournal | intern (nur IDs) | platform, Volume `journal` | 35 Tage, außerhalb der Datenbank (ADR-0018) |
| Anwendungs-Logs | intern, **ohne PII** | – | Container-Logs, nicht persistiert |
| Widersprüche | vertraulich | trust | wie Moderationsentscheidungen, Fristen geplant B-12 |
| DAC7-Auswertung | vertraulich | admin (keine eigene Speicherung, nur Export) | Exporte liegen beim Betreiber; Aufbewahrung nach PStTG (vom DSB zu prüfen), Konzept in [dac7-konzept.md](../06-recht/dac7-konzept.md) |
| Sicherungen | vertraulich | Betrieb (außerhalb der Anwendung) | Rotation: alle der letzten 7 Tage, danach je Woche die neueste; gelöschte Konten verschwinden nach ≤ 28 Tagen auch aus Sicherungen (ADR-0018) |
| Einstellungen, Ankündigung | intern | platform | bis zur Änderung |
| Sprachwahl | intern | identity (`user.locale`) bzw. Browser (`cm_locale`, nur auf Wunsch) | mit dem Konto bzw. durch Nutzer löschbar |

### 8.5 Erweiterungspunkt Bezahlung (ADR-0006)

```mermaid
flowchart LR
    subgraph MVP ["Ab MVP vorhanden"]
        MSG["messaging<br/>Deal: agreed / completed / cancelled"]
        Q["Domain Events<br/>(pg-boss publish/subscribe,<br/>eine Queue je Konsument)"]
    end
    subgraph LATER ["EPIC-09 (später, additiv)"]
        HOOK["Webhook-Controller<br/>(Signatur, Idempotenz)"]
        PAYM["payments-Modul<br/>Checkout, Release, Refund"]
        PORT{{"PaymentPort<br/>createCheckout()<br/>releaseFunds()<br/>refund()<br/>onboardSeller()"}}
        STR["Adapter Stripe Connect"]
        MAN["Adapter Mangopay"]
        LED[("payments.ledger<br/>append-only")]
    end
    PSP["PSP (lizenziert)"]

    MSG -- "DealAgreed" --> Q --> PAYM
    PAYM --> PORT
    PORT -. implementiert .- STR
    PORT -. implementiert .- MAN
    STR --> PSP
    PSP -- "Webhook" --> HOOK --> PAYM
    PAYM --> LED
    PAYM -- "PaymentCaptured" --> Q --> MSG
```

**Kernaussagen:**
- Geld fließt **nur** über den PSP (Marktplatz- bzw. Split-Produkt). Die Plattform ist nie im Geldfluss (ZAG).
- KYC der Verkäufer übernimmt der PSP.
- `payments` hängt von `messaging` nur über Events ab. Umgekehrt gibt es **keine** Abhängigkeit.
- Domain Events werden per **publish/subscribe** verteilt: Jeder Konsument (heute ein protokollierender Konsument, später `payments`) hat eine eigene Queue und erhält eine Kopie, statt mit anderen um dieselben Jobs zu konkurrieren. So bleibt `payments` rein additiv (Stand: geplant B-40, Sprint 2; heute eine Queue `deal-events` mit einem Konsumenten).
- Bezahlung ist pro Deal **opt-in** und nie voreingestellt (Verbraucherrecht, vgl. KG Berlin / Vinted).
- Im Docker-Beispiel wäre ein **Fake-PSP-Adapter** (Sandbox-Simulation) ausreichend, um den Ablauf zu zeigen, ohne externe Konten.

### 8.6 Observability (Beispiel-Niveau)
Strukturierte JSON-Logs (pino) mit Korrelations-ID; der Request-Log ist ein eigener Eintrag mit Methode, Route ohne Query, Status, Dauer und Request-ID, **ohne IP-Adresse, Port und Query-Werte** (REQ-OPS-002, Unit-Test AT-OPS-002); `/metrics` im Prometheus-Format (Request-Latenzen, Job-Durchsatz, WS-Verbindungen), Health-Endpunkte. Im Beispiel ist `/metrics` ohne Anmeldung auf Port 8080 erreichbar; im Profil `proxy` ist es am Proxy gesperrt, im Echtbetrieb gehört es auf einen internen Port bzw. hinter eine Proxy-Regel. **Überwachung und Alarmierung** (REQ-OPS-008) liefert das Profil `monitoring` (ADR-0017): Prometheus mit Alarmregeln auf Symptome (App nicht erreichbar oder nicht bereit, Fehlerrate ab Mindestlast und nicht im Wartungsmodus, Latenz, endgültig gescheiterte Jobs `outcome="dead"`, Wartungsmodus zu lange aktiv, fehlende Sicherung; Folgealarme werden per `inhibit_rules` unterdrückt), Alertmanager sendet an Mailpit; jede Regel verweist auf ein Runbook in [monitoring-alarmierung.md](../07-betrieb/monitoring-alarmierung.md). Neu ist die Metrik `app_ready` (0/1) aus der Readiness-Prüfung (Stand: umgesetzt (B-54)). Zuschaltbares Tracing (OpenTelemetry) ist geplant (R2); Grafana bleibt Could.

### 8.7 Barrierefreiheit und UX
Die neun Kernabläufe aus REQ-A11Y-002 (Registrierung, Anmeldung, Passwort zurücksetzen, Suche, Anzeige erstellen inkl. Bild, Anzeige verwalten, Nachricht senden, Melden, Kontaktfreigabe) sind vollständig per Tastatur bedienbar und werden automatisiert nur mit Tastatur durchlaufen; axe-core prüft die Kernseiten (Fallstudie FS-C2; Stand: automatisierter Test umgesetzt B-02, `e2e/tests/keyboard.spec.ts`). Die Auswahl im Dateidialog des Betriebssystems wird manuell geprüft (MAN-A11Y-002). Eigene zugängliche Basisbausteine (Tailwind, natives `<dialog>`, [ADR-0011](decisions/0011-mvp-umsetzung.md) Nr. 6), sichtbarer Fokus, Fokus-Management im Chat (ARIA-Live-Region für neue Nachrichten).

### 8.8 Rechtliche Inhalte und Versionierung (ADR-0015)
- **Eine Quelle:** Rechtstexte und Hilfe liegen als Markdown in `apps/web/src/content/`. Die Doku in `docs/06-recht/` verlinkt sie nur. Die Version der Nutzungsbedingungen erreicht den Server über `legal-manifest.json`. Eine abweichende Zustimmung erzwingt die erneute Zustimmung vor schreibenden Aktionen (REQ-LEGAL-003).
- **Erreichbarkeit:** Alle Rechtsseiten sind öffentlich, von jeder Seite über den Footer mit einem Klick erreichbar und aus jeder E-Mail verlinkt (REQ-UX-006). Sie bleiben auch im Wartungsmodus erreichbar.
- **Platzhalter:** Format `[Platzhalter: …]` plus Muster-Hinweis (`sample: true`). `LEGAL_STRICT=true` verhindert im Echtbetrieb den Start mit Platzhaltern (Risiko R-11).
- **Sicherheit:** kein HTML im Markdown, keine `javascript:`-Links, kein `dangerouslySetInnerHTML`; die CSP bleibt unverändert.
- **Kein Cookie-Banner (Q-24, REQ-LEGAL-010):** Es gibt nur das Sitzungscookie und – auf ausdrücklichen Wunsch – die Sprachwahl im Browser. Beides ist nach TDDDG § 25 Abs. 2 Nr. 2 einwilligungsfrei und in der Datenschutzerklärung aufgeführt. Jede weitere Speicherung auf dem Endgerät braucht vorher eine Einwilligung. Ein E2E-Test prüft, dass nach den Kernabläufen keine weiteren Cookies oder Speichereinträge entstehen (Erweiterung von AT-PRIV-006).

### 8.9 Internationalisierung (ADR-0016)
- `react-intl` mit ICU MessageFormat, Kataloge `de` (Quelle) und `en`, Schlüssel `bereich.seite.element`.
- Sprachermittlung: Konto-Einstellung → ausdrückliche Wahl im Browser (`cm_locale`) → `navigator.languages` → `de`.
- `<html lang>` folgt der Sprache (WCAG 3.1.1). Fehlertexte übersetzt die Web-App anhand des stabilen `code` aus Problem Details. Mails gehen in der Konto-Sprache.
- Bei Rechtstexten ist nur die deutsche Fassung verbindlich; die englische trägt einen Hinweis.
- `scripts/check-i18n.mjs` prüft in CI gleiche Schlüssel, gültige ICU-Syntax und gleiche Platzhalter (Risiko R-12).

### 8.10 Fehlerbehandlung und HTTP-Statuscodes (REQ-UX-003)

| Situation | Antwort der API (`/api/*`) | Antwort für Seitenaufrufe (HTML) |
|---|---|---|
| Unbekannte API-Route | 404 Problem Details | – |
| Bekannte SPA-Route (z. B. `/impressum`, `/listings/{id}`) | – | 200, SPA (`index.html`); fehlt die Ressource, zeigt die SPA „nicht gefunden“ |
| Unbekannter Pfad | – | **404** mit SPA, die die Fehlerseite zeigt (Liste der Routenpräfixe auf dem Server, abgeleitet aus dem Router) |
| Unerwarteter Fehler | 500 Problem Details ohne interne Details, Korrelations-ID im Log und in der Antwort | Fehlerseite mit Korrelations-ID und „Erneut versuchen“ |
| Wartungsmodus | 503 Problem Details mit `Retry-After` | Wartungsseite; Rechtsseiten und `/status` bleiben erreichbar |
| Rate-Limit | 429 mit `Retry-After` (unverändert) | Hinweis mit Wartezeit |

Die 404-Seite bietet Suche (für Mitglieder), Startseite und Hilfe. Fehlerseiten sind barrierefrei: Überschrift mit Fokus und verständlicher Text ohne Fachjargon. Fehlerseiten werden nicht indexiert (siehe 8.1).

### 8.11 Betrieb: Sicherung, Überwachung, Wartung, Aktualisierung
- **Sicherung und Wiederherstellung (ADR-0018, REQ-AVAIL-003):** Skripte außerhalb der Anwendung, Wiederherstellung in CI getestet (QS-15).
- **Überwachung und Alarmierung (ADR-0017, REQ-OPS-008):** siehe 8.6, Alarm innerhalb von 5 min (QS-16).
- **Wartungsmodus und Ankündigung (REQ-OPS-006):**
  - *Weich:* Der Admin schaltet ihn in der Oberfläche ein, gespeichert in `platform.setting` mit 10 s Cache.
  - *Hart:* `MAINTENANCE_MODE=true` beim Start, z. B. während einer Wiederherstellung.
  - Ausnahmen: `/health/*`, `/status` und `/api/v1/status`, statische Dateien, Rechtsseiten, Anmeldung und Admin-API für Admins.
  - Jede Änderung steht im Audit-Log.
- **Statusseite (REQ-OPS-007):** `/status` öffentlich, aus der Readiness-Prüfung und dem Wartungsmodus abgeleitet. Sie zeigt nur den Gesamtzustand (`operational`, `degraded`, `maintenance`), den Zustand der Bereiche `app`, `database`, `email` und `realtime` (Vertrag `SystemStatus`) und die Ankündigung; Prüfungen laufen höchstens einmal gleichzeitig, die Route ist auf 50 Anfragen je 10 s begrenzt; keine internen Details (Versionen, Hosts, Fehlermeldungen).
- **Aktualisierung (REQ-OPS-012):** Renovate gruppiert Updates. Sicherheitsupdates kommen sofort, alle anderen wöchentlich; CI muss grün sein, und vor dem Update wird gesichert ([update-prozess.md](../07-betrieb/update-prozess.md)).
- **Störungen und Datenpannen (REQ-OPS-011, REQ-LEGAL-013):** Schweregrade, Rollen und Kommunikation über Ankündigung bzw. Statusseite. Bei Personenbezug greift der Datenpannen-Prozess mit Meldung binnen 72 h ([incident-prozess.md](../07-betrieb/incident-prozess.md), [datenpannen-prozess.md](../06-recht/datenpannen-prozess.md)).

## 9. Architekturentscheidungen

| ADR | Titel | Status |
|---|---|---|
| [0001](decisions/0001-modularer-monolith.md) | Modularer Monolith statt Microservices | Accepted |
| [0002](decisions/0002-tech-stack.md) | Tech-Stack: TypeScript, React-SPA + Fastify, PostgreSQL, pg-boss (teilweise präzisiert durch 0011) | Accepted |
| [0003](decisions/0003-authentifizierung.md) | Eigene Authentifizierung mit Hochschul-E-Mail-Verifikation (ergänzt durch 0013) | Accepted |
| [0004](decisions/0004-chat-echtzeit.md) | Chat über WebSocket, Fan-out hinter einem Port | Accepted |
| [0005](decisions/0005-email-versand.md) | E-Mail über transaktionale pg-boss-Jobs und MailPort | Accepted |
| [0006](decisions/0006-bezahlung-erweiterungspunkt.md) | Bezahlung als späteres Modul hinter PaymentPort | Accepted |
| [0007](decisions/0007-bildspeicherung.md) | Bilder auf Docker-Volume hinter StoragePort (teilweise präzisiert durch 0011) | Accepted |
| [0008](decisions/0008-suche-postgres.md) | Suche mit PostgreSQL-Volltext | Accepted |
| [0009](decisions/0009-api-rest-openapi.md) | REST + OpenAPI 3.1 (Umsetzung Schema-first, präzisiert durch 0011) | Accepted |
| [0010](decisions/0010-docker-demo-deployment.md) | Auslieferung als lokales Docker-Beispiel | Accepted |
| [0011](decisions/0011-mvp-umsetzung.md) | Umsetzungsentscheidungen im MVP (SQL ohne ORM, Schema-first-Vertrag, CSRF, HEIC) | Accepted |
| [0012](decisions/0012-c4-notation.md) | C4-Modell als Notation, Mermaid-C4-Diagramme | Accepted |
| [0013](decisions/0013-anmeldung-identity-provider-port.md) | Anmeldung hinter einem IdentityProviderPort (Hochschulkennung, Q-12) | Proposed (Abstimmung mit Dozent/in) |
| [0014](decisions/0014-ip-pseudonymisierung.md) | Pseudonymisierung von IP-Adressen mit rotierendem Schlüssel | Proposed |
| [0015](decisions/0015-rechtstexte-als-markdown.md) | Rechtstexte als versionierte Markdown-Inhalte im Repository | Accepted (vorläufig, Q-23) |
| [0016](decisions/0016-internationalisierung.md) | Internationalisierung mit react-intl (ICU MessageFormat) | Accepted (vorläufig, Q-25) |
| [0017](decisions/0017-optionale-betriebsprofile.md) | Optionale Compose-Profile für Reverse Proxy und Überwachung (erweitert 0010) | Accepted (vorläufig, Q-27) |
| [0018](decisions/0018-datensicherung.md) | Datensicherung mit pg_dump und Uploads-Archiv, Wiederherstellung in CI getestet | Accepted (vorläufig, Q-23) |

## 10. Qualitätsszenarien

| ID | Merkmal | Szenario (Stimulus → Reaktion → Messgröße) |
|---|---|---|
| QS-1 | Sicherheit | Ein Angreifer registriert sich mit `x@hwg-lu.de.evil.com` → das System lehnt ab → 0 Konten mit nicht gelisteter Domain (Decision-Table-Test, REQ-AUTH-001) |
| QS-2 | Vertraulichkeit | Ein Mitglied ruft `GET /conversations/{fremde-id}` auf → 404 (keine Existenzpreisgabe) → 100 % der Autorisierungsmatrix grün |
| QS-3 | Zuverlässigkeit | Der Mailserver (Mailpit) ist während einer Registrierung **30 min** nicht erreichbar und startet danach neu → der Job bleibt in der Queue → Mail erscheint nach dem Neustart, 0 verloren; in CI mit verkürzter Zeitbasis geprüft (REQ-NOTI-005) |
| QS-4 | Zuverlässigkeit | Die Netzverbindung des Browsers fällt aus und kehrt zurück → nach Wiederherstellung des Netzes verbindet die Web-App ≤ 5 s neu (Backoff wird beim Ereignis `online` zurückgesetzt) und lädt Verpasstes per `?after=` nach → keine verlorene oder doppelte Nachricht (REQ-CHAT-003/004) |
| QS-5 | Erweiterbarkeit | Ein PSP-Adapter wird ergänzt → nur das neue Modul `payments`, eine weitere Queue für Domain Events und additive Migrationen → 0 Änderungen in `listings`, `identity` und `messaging` |
| QS-6 | Erweiterbarkeit | Hochschule B wird freigeschaltet → Eintrag in `institution` + `allowed_domain` → ohne neues Image, < 1 h Aufwand |
| QS-7 | Performance | Lasttest gegen das Docker-Beispiel (k6, 20 Such-req/s, 10.000 Seed-Anzeigen) → Such-p95 < 500 ms und p99 < 1.500 ms auf einem Standard-Laptop (REQ-PERF-001) |
| QS-8 | Erweiterbarkeit | Echtbetrieb soll S3 statt Volume nutzen → neuer `StoragePort`-Adapter + Konfiguration → 0 Änderungen in Fachmodulen |
| QS-9 | Portabilität | Prüfer/in klont das Repo auf einem Rechner mit Docker → Image-Build ≤ 10 min (mit Internet) → `docker compose up` bis zum Login mit Demo-Konto ≤ 3 min, ohne Internet (REQ-OPS-003) |
| QS-10 | Vertraulichkeit | Lea stimmt der Kontaktfreigabe zu, Ben noch nicht → keiner sieht die Adresse des anderen; ein Moderator öffnet den gemeldeten Kontext → keine Adresse sichtbar (REQ-CHAT-010) |
| QS-11 | Benutzbarkeit | Ein Mitglied ohne Maus durchläuft die **9 Kernabläufe** (Registrierung, Anmeldung, Passwort zurücksetzen, Suche, Anzeige erstellen inkl. Bild, Anzeige verwalten, Nachricht senden, Melden, Kontaktfreigabe) → alle Schritte nur mit Tastatur möglich, Fokus jederzeit sichtbar; axe-core meldet 0 Verstöße `serious`/`critical` auf den Kernseiten; die Dateiauswahl im Systemdialog ist manuell geprüft (MAN-A11Y-002) (REQ-A11Y-002) |
| QS-12 | Performance | 200 gleichzeitige WebSocket-Verbindungen, 5 Nachrichten/s → Zeit vom Eingang beim Server bis zur Zustellung an den verbundenen Empfänger p95 < 2 s (REQ-PERF-002) |
| QS-13 | Sicherheit | Ein Konto wird gesperrt, während es noch eine gültige Sitzung hat → die nächste Anfrage mit der alten Sitzung (z. B. Anzeige anlegen, Bild hochladen) wird abgewiesen → 0 Aktionen gesperrter oder unbestätigter Konten (REQ-SEC-011) |
| QS-14 | Verfügbarkeit / Sicherheit | Zum Semesterstart registrieren sich 30 Studierende über dieselbe öffentliche Campus-IP innerhalb einer Stunde → alle 30 Registrierungen werden angenommen, die 31. erhält eine Wartezeit; eine Adresse kann höchstens 3-mal je Stunde registrieren (REQ-SEC-005, Q-18) |
| QS-15 | Zuverlässigkeit (Wiederherstellbarkeit) | Das Volume `pgdata` geht verloren (`docker compose down -v`) → Wiederherstellung aus der letzten Sicherung mit `scripts/restore.mjs` → Login mit Demo-Konto, alle Anzeigen und Bilder der Sicherung vorhanden, Dauer ≤ 15 min; in CI nach jeder Änderung geprüft (REQ-AVAIL-003) |
| QS-16 | Betreibbarkeit | Der Container `app` stürzt ab (Profil `monitoring`) → Alarm `AppDown` als Mail in Mailpit → spätestens 5 min nach dem Ausfall (REQ-OPS-008); gemessen 184 s in der Alarmübung MAN-OPS-008 (Regel `for: 2m` + Auswertung 15 s + `group_wait` 30 s) |
| QS-17 | Betreibbarkeit | Der Admin schaltet den Wartungsmodus ein → schreibende Anfragen von Mitgliedern erhalten 503 mit `Retry-After` und die Wartungsseite → Rechtsseiten, `/status` und Health bleiben erreichbar, innerhalb von 10 s wirksam (REQ-OPS-006) |
| QS-18 | Rechtskonformität | Gast und Mitglied erreichen Impressum, Datenschutzerklärung und Kontakt von **jeder** Seite und aus jeder E-Mail mit einem Klick, ohne Anmeldung, auch im Wartungsmodus → 100 % der Seiten im E2E-Test (REQ-UX-006, REQ-LEGAL-001) |
| QS-19 | Benutzbarkeit / Korrektheit | Ein Aufruf von `/gibt-es-nicht` → HTTP-Status 404 (nicht 200) und Fehlerseite mit Weg zurück; `/api/v1/gibt-es-nicht` → 404 Problem Details (REQ-UX-003) |
| QS-20 | Rechtskonformität (DSA) | Ein Moderator versucht, einen Widerspruch gegen seine eigene Entscheidung zu entscheiden → 403 → 0 Widersprüche ohne Vier-Augen-Prinzip (REQ-LEGAL-007) |
| QS-21 | Benutzbarkeit (Internationalisierung) | Ein neuer Text wird nur im deutschen Katalog ergänzt → CI schlägt fehl (`check-i18n.mjs`) → 0 fehlende Schlüssel in `en` auf `main` (REQ-UX-007) |

## 11. Risiken und technische Schulden

| ID | Risiko | Eintritt / Auswirkung | Maßnahme |
|---|---|---|---|
| R-1 | Kritische Masse ist im Beispiel nicht erlebbar, die Plattform wirkt leer | hoch / mittel | Seed-Daten mit realistischen Anzeigen und Konversationen (REQ-DEMO-001) |
| R-2 | ~~Hochschul-Spamfilter blockieren Mails~~ | entfällt (Mailpit) | → EPIC-12 |
| R-3 | Exmatrikulierte behalten Postfächer | mittel / mittel | Re-Verifikation alle 12 Monate (REQ-AUTH-007) ist für **R2** geplant (Q-14) und **nicht umgesetzt**; bis dahin bleibt das Risiko bestehen |
| R-4 | ~~Betreiberrolle ungeklärt~~ | entfällt (kein Hosting) | → EPIC-12 |
| R-5 | Eigene Auth ist fehleranfällig | mittel / hoch | Bewährte Bibliotheken, ASVS-L2-Checkliste, Tests (ADR-0003) |
| R-6 | Docker-Setup läuft auf Prüfrechnern nicht (ARM vs. x86, Ports belegt, Docker-Version) | mittel / **hoch** | Basis-Images sind multi-arch und das Image wird lokal gebaut; Multi-Arch-Build in CI geplant (B-08); Ports per `.env` änderbar; Smoke-Test von `docker compose up` (in CI, B-07); README mit Troubleshooting |
| R-7 | Teamkapazität | mittel / mittel | Schlanker Stack (ADR-0010), MoSCoW konsequent anwenden |
| R-8 | Fallstudien-Constraint FS-C3 (Anmeldung über die Hochschulkennung) wird nicht anerkannt | mittel / hoch | Dokumentierte Abweichung, ADR-0013, Abstimmung mit Dozent/in (Q-12, Spike S-01) |
| R-9 | Mermaid-C4 ist experimentell, Layout begrenzt | mittel / niedrig | Kleine Diagramme, Prüfung mit `scripts/check-diagrams.mjs`; Ausweg Structurizr DSL (ADR-0012) |
| R-10 | Zyklus `listings ↔ messaging` über späte Bindung | mittel / mittel | Abhängigkeitsrichtung festgelegt (OE-1), Umstellung auf Domain Events B-39 |
| R-11 | Platzhalter oder Musterhinweise bleiben in einem Echtbetrieb stehen | mittel / **hoch** | `LEGAL_STRICT=true` verhindert den Start mit Platzhaltern (ADR-0015); [Go-live-Checkliste](../07-betrieb/go-live-checkliste.md) |
| R-12 | Englische Übersetzung veraltet oder unvollständig | hoch / mittel | `scripts/check-i18n.mjs` in CI, deutscher Katalog als Quelle, Review-Hinweis (ADR-0016) |
| R-13 | HSTS für `localhost` würde andere lokale Dienste auf https zwingen | mittel / mittel | Proxy-Profil nur unter `campusmarkt.localhost`, im Beispiel ohne `includeSubDomains`/`preload` (ADR-0017) |
| R-14 | Gelöschte personenbezogene Daten leben in Sicherungen weiter bzw. kommen mit einer Wiederherstellung zurück | sicher / niedrig | Rotation streng ≤ 28 Tage, in Datenschutzerklärung und VVT genannt; Löschjournal außerhalb der Datenbank wird nach jeder Wiederherstellung abgespielt (ADR-0018); Restgrenze: Verlust aller Volumes kostet die Journal-Einträge seit der letzten Sicherung |
| R-15 | Rechtstexte der Übung sind inhaltlich unzutreffend oder unvollständig | mittel / hoch (nur im Echtbetrieb) | Kennzeichnung als Muster, Prüfung durch DSB und Justiziariat vor Go-live, Rechtskataster als Prüfliste |
| R-16 | Widerspruch gesperrter Konten nicht möglich, weil keine Anmeldung | mittel / mittel | Einmal-Link mit Token in der Begründungs-Mail (6.5) |

## 12. Glossar

| Begriff | Bedeutung |
|---|---|
| Anzeige | Angebot oder Gesuch eines Mitglieds |
| C4-Modell | Notation für Softwarearchitektur mit den Ebenen Systemkontext, Container, Komponente, Code (Simon Brown) |
| Container (C4) | Separat ausführbare oder Daten haltende Einheit eines Softwaresystems (Web-App, Anwendung, Datenbank); nicht gleichbedeutend mit Docker-Container |
| Kontaktfreigabe | Beidseitige Zustimmung zweier Konversationsteilnehmer, einander die Hochschul-E-Mail-Adresse anzuzeigen |
| Inhaltsprüfung | Automatische Prüfung einer Anzeige vor der Veröffentlichung (REQ-LST-010); im MVP als Wortliste umgesetzt |
| Angebot / Gesuch | Anzeigentyp: Ich biete etwas an / ich suche etwas |
| Preistyp | Festpreis, VB (Verhandlungsbasis), zu verschenken, Tausch |
| Übergabeort | Campus-Standort, an dem die Übergabe stattfinden kann |
| Konversation | Chatverlauf zwischen Anbieter und genau einem Interessenten zu genau einer Anzeige |
| Deal | Vereinbarung über einen Preis bzw. eine Übergabe innerhalb einer Konversation. Grundlage der späteren Bezahlung |
| Whitelist | Liste zugelassener E-Mail-Domains |
| Outbox-Muster | Seiteneffekte werden transaktional mit der Fachänderung gespeichert und danach asynchron verarbeitet (hier: pg-boss-Jobs) |
| Mailpit | Mail-Catcher für Entwicklung und Demo: nimmt SMTP an und zeigt die Mails in einer Weboberfläche, ohne sie zuzustellen |
| Port / Adapter | Schnittstelle der Fachlogik nach außen / austauschbare technische Implementierung |
| Pseudonymisierung | Ersetzen eines Merkmals (z. B. IP-Adresse) durch einen Wert, der ohne zusätzlichen, getrennt aufbewahrten Schlüssel nicht zurückgeführt werden kann |
| PSP | Payment Service Provider, Zahlungsdienstleister |
| DSA | Digital Services Act (EU-Verordnung 2022/2065) |
| Begründung (DSA Art. 17) | Mitteilung an Betroffene bei Entfernen, Ausblenden oder Sperren: Entscheidung, Tatsachen, Regel bzw. Rechtsgrundlage, ob automatisiert erkannt, Rechtsbehelfe |
| Widerspruch (DSA Art. 20) | Internes Beschwerdeverfahren gegen eine Moderationsentscheidung, binnen 6 Monaten nach der Entscheidung, entschieden nach dem Vier-Augen-Prinzip |
| Vier-Augen-Prinzip | Eine Entscheidung wird von einer zweiten, unabhängigen Person geprüft; hier entscheidet nie der ursprüngliche Moderator über den Widerspruch |
| Impressum | Anbieterkennzeichnung nach § 5 Digitale-Dienste-Gesetz (DDG) |
| Datenschutzerklärung | Information der Betroffenen nach Art. 13 DSGVO |
| VVT | Verzeichnis von Verarbeitungstätigkeiten nach Art. 30 DSGVO |
| TOMs | Technische und organisatorische Maßnahmen nach Art. 32 DSGVO |
| DAC7 / PStTG | EU-Richtlinie 2021/514 bzw. deutsches Plattformen-Steuertransparenzgesetz: Meldepflicht von Plattformen für Verkäufer ab bestimmten Schwellen |
| Platzhalter | Kennzeichnung `[Platzhalter: …]` für Betreiberdaten, die in der Übung nicht real sind |
| Wartungsmodus | Betriebszustand, in dem die Anwendung Anfragen mit 503 und `Retry-After` beantwortet; Rechtsseiten und Status bleiben erreichbar |
| Statusseite | Öffentliche Seite mit dem Betriebszustand ohne interne Details |
| Reverse Proxy | Vorgeschalteter Server, der TLS beendet und Anfragen an die Anwendung weiterleitet (hier Caddy) |
| HSTS | HTTP Strict Transport Security: Der Browser nutzt für einen Hostnamen nur noch HTTPS |
| Compose-Profil | Gruppe von Diensten in `compose.yaml`, die nur mit `--profile` gestartet wird |
| RPO / RTO | Recovery Point Objective (maximal tolerierter Datenverlust) / Recovery Time Objective (maximale Wiederherstellungsdauer) |
| BCP 47 | Standard für Sprachcodes (`de`, `en`) |
| ICU MessageFormat | Standardsyntax für übersetzbare Texte mit Plural- und Auswahlregeln |
| security.txt | Datei nach RFC 9116 unter `/.well-known/`, die den Meldeweg für Sicherheitslücken nennt |
