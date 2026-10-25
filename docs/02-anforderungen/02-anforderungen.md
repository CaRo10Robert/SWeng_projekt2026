---
id: REQ-CATALOG
type: requirements
status: in-review
owner: team-produkt
version: 1.2
created: 2026-10-20
last_updated: 2026-10-24
---

# Anforderungskatalog

> **v1.0:** Umstellung auf **eine Datei pro Anforderung** mit maschinenlesbarem Front Matter (Guideline Kap. 01, Review D-2) und Abgleich mit der Fallstudie MWI131 Kap. 2 ([00-fallstudie-abgleich.md](00-fallstudie-abgleich.md)). Die Inhalte des Katalogs v0.2 stehen vollständig in den Einzeldateien; der alte Stand ist in der Versionsverwaltung nachvollziehbar. Keine ID wurde umnummeriert oder gelöscht.

## Aufbau der Anforderungsdokumentation

| Dokument | Inhalt |
|---|---|
| [00-fallstudie-abgleich.md](00-fallstudie-abgleich.md) | Anforderungen der Fallstudie, Abweichungen, offene Entscheidung Q-12 |
| [01-use-cases.md](01-use-cases.md) | Akteure, Use-Case-Diagramme, Use-Case-Dokumente |
| **Dieses Dokument** | Geschäftsziele, Scope, Constraints, Zustandsmodell, Katalog-Index |
| [req/](req/) | Je Anforderung eine Datei (Vorlage: [req/_TEMPLATE.md](req/_TEMPLATE.md)) |
| [nachweise.md](nachweise.md) | Katalog der Nachweise (Tests, manuelle Prüfungen, Kontrollen) |
| [03-backlog.md](03-backlog.md) | Product Backlog mit Kano, Risiko, Abhängigkeiten, Story Points, WSJF; Release-Plan |
| [04-vorgehen.md](04-vorgehen.md) | Vorgehensmodell, Definition of Ready/Done, Schätzung, Nachverfolgbarkeit, Change-Management |
| [05-entscheidungen.md](05-entscheidungen.md) | Entscheidungslog der fachlichen Fragen (Q-…) |
| [06-abgleich-recht-betrieb.md](06-abgleich-recht-betrieb.md) | Ist/Soll-Abgleich und Rechtskataster für Recht, Auftritt und Betrieb (EPIC-13, Übung mit Platzhaltern) |

**Darstellung je Typ (Guideline Kap. 01):** User Stories mit Akzeptanzkriterien (Given–When–Then) und INVEST-Prüfung, Geschäftsregeln mit Entscheidungstabelle, Datenanforderungen mit Schema und Grenzwerten, Qualitätsanforderungen mit **Qualitätsmerkmal, Metrik, Akzeptanzkriterium, Messverfahren und -kontext** (Fallstudie FS-M3), Sicherheitsanforderungen als Kontrolle oder Abuse Case, Architektur-Constraints als Shall-Satz mit ADR und Konformitätsprüfung.

**Klassen (Fallstudie FS-M2):** `functional` (was das System leistet), `quality` (wie gut), `domain` (Regeln des Problembereichs, z. B. Whitelist, Nutzertypen, Campus-Standorte, Preistypen), `constraint` (vorgegebene Beschränkungen, z. B. aus der Fallstudie, aus Gesetzen oder vom Auftraggeber).

**Kano (Fallstudie FS-M4):** `basis` (Fehlen erzeugt Unzufriedenheit, z. B. Datenschutz, Zugangsbeschränkung), `leistung` (mehr ist besser, z. B. Suchqualität, Antwortzeit), `begeisterung` (unerwartet, z. B. Echtzeit-Lesestatus), `n/a` (nicht kundenwirksam, z. B. Betrieb und Architektur).

**Vorzugsbenennungen** (Review v0.2, R-31): *Mitglied* (verifizierte Person), *Anbieter* / *Interessent* (Rolle in Bezug auf eine Anzeige), *Anzeige* (Angebot oder Gesuch), *Anzeigentitel* (Titel einer Anzeige), *Anzeigename* (öffentlicher Name eines Mitglieds), *Moderations-Queue*, *Inhaltsprüfung* (automatischer Wortfilter), *Kontaktfreigabe* (beidseitige Freigabe der Kontaktdaten), *Deal* (Reservierung bzw. Abgabe an eine bestimmte Person).

## 1. Geschäftsziele (Traceability-Anker)

| ID | Ziel | Messgröße |
|---|---|---|
| BG-1 | Vertrauenswürdiger Marktplatz nur für Hochschulangehörige | 100 % der aktiven Konten mit verifizierter Whitelist-Domain |
| BG-2 | Niedrige Einstiegshürde | Usability-Test mit 5 Studierenden: Registrierung + erste Anzeige in < 5 min ohne Hilfe |
| BG-3 | Abschlüsse ermöglichen | Ablauf „Anzeige → Chat → reserviert → abgegeben“ im Beispiel vollständig vorführbar (E2E-Test) |
| BG-4 | Rechtskonform **konzipiert** (Privacy by Design, Barrierefreiheit) | DSGVO-Betroffenenrechte, DSA-Meldeverfahren und Tastaturbedienbarkeit umgesetzt und getestet |
| BG-5 | Erweiterbarkeit | Bezahlung, weitere Hochschulen, Hochschul-SSO und Echtbetrieb ohne Umbau des Kerns nachrüstbar |
| BG-6 | Vorführbarkeit | Ein Befehl startet ein vollständig befülltes Beispiel |

## 2. Scope: Prozesse im und außerhalb des Prototyps

Antwort auf Aufgabe II a) der Fallstudie. „Im Scope“ heißt: im Release R1 prototypisch umgesetzt und im Docker-Beispiel vorführbar.

| Prozess | Prozessschritte im Scope | Out of Scope (R1) | Anforderungen |
|---|---|---|---|
| P1 Zugang | Registrieren mit Hochschuladresse, Adresse bestätigen, Anmelden, Abmelden, Passwort zurücksetzen; Anmeldeverfahren austauschbar gekapselt (Q-12) | Anmeldung per Hochschul-SSO (dokumentierte Abweichung von FS-C3, ADR-0013), Re-Verifikation nach 12 Monaten (R2, Q-14), MFA | REQ-AUTH-001…006, 008, 009, REQ-SEC-002…005, REQ-SEC-011 |
| P2 Anbieten | Angebot/Gesuch direkt veröffentlichen inkl. Bilder (JPEG, PNG, WebP), automatische Inhaltsprüfung, bearbeiten, pausieren, reaktivieren, verlängern, löschen, Ablauf | Entwürfe und Vorschau vor dem Veröffentlichen (Won't R1), HEIC-Fotos (REQ-LST-012, R2), Malware-Scan (Won't, Q-16), teilbarer Vorschau-Link (REQ-LST-009, C) | REQ-LST-001…008, 010, 011, REQ-SEC-007, REQ-SEC-011 |
| P3 Finden | Freitextsuche, Filter, Sortierung, Merkliste | Suchaufträge mit E-Mail-Digest (C) | REQ-SRCH-* |
| P4 Kontakt und Absprache | Anbieter kontaktieren, Nachrichten in Echtzeit, Lesestatus, **Kontaktdaten nach beidseitiger Zustimmung freigeben**, für eine Person reservieren, an sie abgeben | Bilder im Chat (C), strukturierter Preisvorschlag (REQ-CHAT-009, C), Web-Push (C) | REQ-CHAT-001…007, 010, 011, REQ-NOTI-001…003, 005, 007 |
| P5 Übergabe und Abschluss | Abschluss im System markieren (Deal-Kern mit Ereignissen für die spätere Bezahlung) | Die Übergabe selbst (offline auf dem Campus), Bezahlung (EPIC-09), Versand, Bewertungen (C) | REQ-CHAT-011, REQ-LST-007, REQ-ARCH-001/002 |
| P6 Vertrauen und Moderation | Melden mit Eingangsbestätigung in der Oberfläche, automatisch ausblenden, Moderations-Queue, Entscheidung mit Begründung, Blockieren, dauerhaft sperren | Befristete Sperren (Q-15), Bewertungen (C). Widerspruch, Begründung nach DSA Art. 17 und Kennzeichnung von Straftatverdacht sind seit Q-22 im Scope (P10) | REQ-MOD-001…005, 007 |
| P7 Konto und Datenschutz | Profil pflegen (Anzeigename, Studiengang, Übergabeorte), Daten exportieren, Konto mit Karenz löschen, Benachrichtigungen abbestellen, Fristen und Löschungen | Profilbild (REQ-ACC-004, R2, Q-14) | REQ-ACC-001…003, REQ-PRIV-* |
| P8 Administration | Rollen vergeben, Audit-Log, Job-Übersicht, Demo-Werkzeug | Whitelist- und Kategorienverwaltung per Oberfläche (C) | REQ-MOD-007/008, REQ-DEMO-* |
| P9 Betrieb | Start per Docker Compose, Migrationen, Health, Logs, Metriken, Wartungsmodus, Statusseite, Datensicherung mit Restore-Test, optionale Profile für Monitoring und TLS (Q-27) | Öffentliches Hosting (EPIC-12), weitere Hochschulen (EPIC-10), native Apps (EPIC-11), gewerbliche Anbieter, Wohnungsbörse, Werbung | REQ-OPS-*, REQ-AVAIL-003, REQ-ARCH-005/006 |
| P10 Recht und Auftritt (EPIC-13, Übung, Q-23) | Impressum, Datenschutzerklärung, Nutzungsbedingungen und Community-Regeln, Erklärung zur Barrierefreiheit, Kontaktstelle, Begründung und Widerspruch nach DSA, Kennzeichnung Straftatverdacht, DAC7-Auswertung, Startseite, Hilfe, Fehlerseiten, englische Oberfläche; Prozessdokumente (VVT, TOMs, AVV, Datenpannen, DSFA-Schwellwertanalyse, Betriebshandbuch) mit Platzhaltern | Echte Betreiberangaben, Meldung an BZSt und Behörden, Abschluss von AV-Verträgen, Durchführung des Penetrationstests (EPIC-12) | REQ-LEGAL-*, REQ-UX-003…007, REQ-PRIV-007/008, REQ-SEC-012/013 |

## 3. Constraints und ihre Operationalisierung

Antwort auf Aufgabe II b) der Fallstudie: Jeder vorgegebene Constraint wird in überprüfbare Anforderungen überführt (Operationalisierung, FS-C5). Die Nachweise stehen in den verlinkten Anforderungen und im [Nachweiskatalog](nachweise.md); `node scripts/trace.mjs` prüft die Kette automatisch.

| ID | Constraint | Quelle | Operationalisiert in | Prüfbarkeit |
|---|---|---|---|---|
| C-01 | Kontaktdaten von Käufern und Verkäufern erst nach beidseitiger Zustimmung sichtbar | Fallstudie FS-C1 | REQ-CHAT-010, REQ-PRIV-002, REQ-CHAT-001 | Automatisierter Test: einseitige Zustimmung → keine Adresse; beidseitig → Adresse; Widerruf → ausgeblendet; Fremde → 404 |
| C-02 | Angebotsformular und zentrale Funktionen vollständig per Tastatur bedienbar und barrierearm | Fallstudie FS-C2, BITV 2.0 | REQ-A11Y-002, REQ-A11Y-001 | Automatisierter Browser-Test nur mit Tastatur über alle Kernabläufe; axe-core 0 Verstöße `serious`/`critical`; manueller Screenreader-Durchlauf |
| C-03 | Anmeldung über die Hochschulkennung | Fallstudie FS-C3 | REQ-AUTH-009, REQ-AUTH-001, REQ-AUTH-002, REQ-AUTH-005 | **Dokumentierte Abweichung** (Q-12, ADR-0013): Im Docker-Beispiel ist die verifizierte Hochschuladresse die Kennung; das Anmeldeverfahren ist austauschbar gekapselt. Prüfung: Fitness Function (nur `identity` kennt Anmeldeverfahren), Test des Anmeldeablaufs gegen ein simuliertes zweites Verfahren, Entscheidungstabellen-Test BR-01 für die Kennung |
| C-04 | Angebote ausschließlich von verifizierten Nutzern | Fallstudie FS-C4 | REQ-SEC-011, REQ-AUTH-002 | Abuse-Case-Tests: unverifiziert, gesperrt, Löschung beantragt, ohne Sitzung → kein Angebot möglich |
| C-05 | Zugang nur für Hochschulangehörige mit Whitelist-Domain | Auftraggeber | REQ-AUTH-001, REQ-AUTH-008, REQ-ARCH-003 | Entscheidungstabellen-Test, Smoke-Test mit fremder Domain |
| C-06 | Kein öffentliches Hosting; Auslieferung als Docker-Beispiel, offline lauffähig | Auftraggeber (ADR-0010) | REQ-ARCH-005, REQ-OPS-001…005, REQ-DEMO-001 | Smoke-Test gegen frisch gestartetes Compose-Setup |
| C-07 | Bezahlung später ohne Umbau nachrüstbar; keine Kundengelder auf der Plattform | Auftraggeber, ZAG | REQ-ARCH-001, REQ-ARCH-002 | Architektur-Konformitätsprüfung (Modulgrenzen), Review gegen ADR-0006 |
| C-08 | Datenschutz nach DSGVO (Privacy by Design) | Gesetz | REQ-PRIV-001…007, REQ-ACC-002/003 | Export- und Löschtests, Audit-Log-Prüfung, Netzwerk-Scan ohne Drittanbieter |
| C-09 | Melde- und Abhilfeverfahren nach DSA | Gesetz | REQ-MOD-001…003 | Akzeptanztests Melden/Entscheiden, Audit-Log unveränderlich |
| C-10 | Vorgaben der DEV Guideline | Projekt | REQ-MAINT-002, REQ-ARCH-006, REQ-SEC-008, REQ-OPS-004 | Fitness Functions und `trace.mjs` in CI bei jedem Pull Request (Backlog B-07, Sprint 1) |
| C-11 | Rechts- und Betreiberpflichten eines Online-Marktplatzes (DDG, DSGVO, TDDDG, DSA, BITV 2.0, PStTG) als Übung mit Platzhaltern | Auftraggeber (Q-23), Gesetz | REQ-LEGAL-001…013, REQ-UX-006, REQ-PRIV-007/008 | E2E-Tests der Rechtsseiten und Links, Speicher-Allowlist, Smoke-Tests für Begründung, Widerspruch und DAC7; Kontrollen der Prozessdokumente (CTRL-DOC-…); Rechtskataster in [06-abgleich-recht-betrieb.md](06-abgleich-recht-betrieb.md) |

## 4. Zustandsmodell Anzeige (normativ)

Quelle der Wahrheit ist die **Übergangstabelle**; das Diagramm veranschaulicht sie. REQ-LST-006, -007, -008, -010, REQ-CHAT-011 und REQ-MOD-002/-004 sind daraus abgeleitet. Entwürfe gibt es in R1 nicht: Anzeigen werden beim Speichern direkt veröffentlicht (Entscheidung Review v0.2, R-05).

| # | Von | Ereignis | Wächter (Bedingung) | Nach | Auslöser | Anforderung |
|---|---|---|---|---|---|---|
| Ü-1 | – | veröffentlichen | Inhaltsprüfung ohne Treffer | aktiv | Anbieter | REQ-LST-001 |
| Ü-2 | – | veröffentlichen | Inhaltsprüfung schlägt an | in Prüfung | Anbieter | REQ-LST-010 |
| Ü-3 | aktiv, pausiert, reserviert | bearbeiten | Inhaltsprüfung schlägt an | in Prüfung | Anbieter | REQ-LST-010 |
| Ü-4 | in Prüfung | freigeben | – | aktiv | Moderation | REQ-MOD-002 |
| Ü-5 | in Prüfung | ablehnen | – | entfernt | Moderation | REQ-MOD-002 |
| Ü-6 | aktiv | pausieren | – | pausiert | Anbieter | REQ-LST-006 |
| Ü-7 | pausiert | reaktivieren | Ablaufdatum nicht erreicht, sonst mit Verlängerung | aktiv | Anbieter | REQ-LST-006 |
| Ü-8 | aktiv | reservieren | – | reserviert | Anbieter (direkt oder im Chat) | REQ-LST-007, REQ-CHAT-011 |
| Ü-9 | reserviert | Reservierung aufheben | – | aktiv | Anbieter | REQ-LST-007 |
| Ü-10 | aktiv, reserviert | abgeben | – | abgegeben | Anbieter | REQ-LST-007, REQ-CHAT-011 |
| Ü-11 | aktiv | Laufzeit 60 Tage erreicht | – | abgelaufen | Zeitgeber | REQ-LST-008 |
| Ü-12 | pausiert | 90 Tage pausiert | – | abgelaufen | Zeitgeber | REQ-LST-008 |
| Ü-13 | reserviert | 30 Tage reserviert | – | aktiv (Hinweis an Anbieter) | Zeitgeber | REQ-LST-007 |
| Ü-14 | aktiv, abgelaufen | verlängern | – | aktiv (+60 Tage) | Anbieter | REQ-LST-008 |
| Ü-15 | aktiv, pausiert, reserviert, abgegeben, abgelaufen | entfernen | Moderationsentscheidung | entfernt | Moderation | REQ-MOD-002 |
| Ü-16 | jeder außer entfernt | löschen | – | gelöscht | Anbieter | REQ-LST-006 |
| Ü-17 | abgegeben | 30 Tage | – | gelöscht | Zeitgeber | REQ-LST-008, REQ-PRIV-003 |
| Ü-18 | abgelaufen | 90 Tage | – | gelöscht | Zeitgeber | REQ-LST-008, REQ-PRIV-003 |
| Ü-19 | entfernt | 12 Monate | – | gelöscht | Zeitgeber | REQ-PRIV-003 |

**Ausgeblendet** ist kein eigener Zustand, sondern ein Merkmal: Ab 3 Meldungen verschiedener Mitglieder (REQ-MOD-004) oder bei gesperrtem Anbieter erscheint eine Anzeige nicht mehr in Suche und Detailansicht für andere, behält aber ihren Zustand. In der Suche erscheinen nur **aktive** und **reservierte**, nicht ausgeblendete Anzeigen.

```mermaid
stateDiagram-v2
    [*] --> Aktiv : Ü-1 veröffentlichen
    [*] --> InPruefung : Ü-2 Inhaltsprüfung schlägt an
    Aktiv --> InPruefung : Ü-3 bearbeiten [Treffer]
    InPruefung --> Aktiv : Ü-4 freigeben
    InPruefung --> Entfernt : Ü-5 ablehnen
    Aktiv --> Pausiert : Ü-6
    Pausiert --> Aktiv : Ü-7
    Aktiv --> Reserviert : Ü-8
    Reserviert --> Aktiv : Ü-9 / Ü-13 nach 30 Tagen
    Aktiv --> Abgegeben : Ü-10
    Reserviert --> Abgegeben : Ü-10
    Aktiv --> Abgelaufen : Ü-11 nach 60 Tagen
    Pausiert --> Abgelaufen : Ü-12 nach 90 Tagen
    Abgelaufen --> Aktiv : Ü-14 verlängern
    Aktiv --> Entfernt : Ü-15 Moderation
    Abgegeben --> Geloescht : Ü-17 nach 30 Tagen
    Abgelaufen --> Geloescht : Ü-18 nach 90 Tagen
    Entfernt --> Geloescht : Ü-19 nach 12 Monaten
    Aktiv --> Geloescht : Ü-16 löschen
    Geloescht --> [*]
```

Nicht jede Zeile der Tabelle ist als Pfeil gezeichnet (Ü-3 aus pausiert/reserviert, Ü-15 und Ü-16 aus allen genannten Zuständen), damit das Diagramm lesbar bleibt.

## 5. Traceability

```mermaid
flowchart LR
    FS["Fallstudie FS-C1…C5"] --> C["Constraints C-01…C-10"]
    BG["Geschäftsziele BG-1…6"] --> E["Epics EPIC-00…12"]
    C --> R["Anforderungen REQ-…<br/>(req/*.md)"]
    E --> R
    UC["Use Cases UC-…"] --> R
    R --> B["Backlog-Einträge<br/>(03-backlog.md)"]
    R --> N["Nachweise AT/MAN/CTRL<br/>(nachweise.md)"]
    N --> T["Tests und Kontrollen<br/>(markiert mit AT-ID)"]
    B --> K["Commits<br/>(Footer Refs: REQ-…)"]
    T --> CI["scripts/trace.mjs<br/>+ CI-Bericht"]
```

## 6. Katalog-Index

<!-- req-index:start (generiert mit `node scripts/trace.mjs --write`, nicht von Hand bearbeiten) -->

**Stand:** 132 Anforderungen · R1-Must verifiziert: 41 von 83 (49 %)

| Status | Stufe (Vorlesung) | Anzahl |
|---|---|---|
| approved | Konkretisiert (bereit) | 36 |
| implemented | Umsetzung | 33 |
| verified | Test | 63 |

| ID | Titel | Klasse | MoSCoW (R1) | Kano | Risiko | Status | Nachweise |
|---|---|---|---|---|---|---|---|
| [REQ-A11Y-001](req/REQ-A11Y-001.md) | Barrierefreiheit nach WCAG 2.2 AA | quality | M | basis | high | implemented | AT-A11Y-001, MAN-A11Y-001 |
| [REQ-A11Y-002](req/REQ-A11Y-002.md) | Vollständige Tastaturbedienbarkeit der Kernabläufe | quality | M | basis | high | implemented | AT-A11Y-002, AT-A11Y-002-2, MAN-A11Y-002 |
| [REQ-ACC-001](req/REQ-ACC-001.md) | Profil pflegen | functional | M | basis | low | verified | AT-ACC-001 |
| [REQ-ACC-002](req/REQ-ACC-002.md) | Konto löschen mit Karenzzeit | functional | M | basis | high | approved | AT-ACC-002, AT-ACC-002-2 |
| [REQ-ACC-003](req/REQ-ACC-003.md) | Daten exportieren | functional | S | leistung | medium | verified | AT-ACC-003 |
| [REQ-ACC-004](req/REQ-ACC-004.md) | Profilbild | functional | S | leistung | medium | approved | AT-ACC-004 |
| [REQ-ARCH-001](req/REQ-ARCH-001.md) | Bezahlung als späteres Modul hinter einem Port | constraint | M | n/a | high | implemented | CTRL-DEPCRUISE, MAN-ARCH-001 |
| [REQ-ARCH-002](req/REQ-ARCH-002.md) | Keine Verwahrung von Kundengeldern | constraint | M | n/a | high | approved | MAN-ARCH-002 |
| [REQ-ARCH-003](req/REQ-ARCH-003.md) | Whitelist als Daten statt Code | constraint | M | n/a | medium | implemented | AT-ARCH-003 |
| [REQ-ARCH-004](req/REQ-ARCH-004.md) | Mandantenfähigkeit vorbereitet | constraint | S | n/a | low | implemented | MAN-ARCH-004 |
| [REQ-ARCH-005](req/REQ-ARCH-005.md) | Auslieferung als lokales Docker-Compose-Setup | constraint | M | n/a | high | verified | AT-ARCH-005 |
| [REQ-ARCH-006](req/REQ-ARCH-006.md) | Vereinfachte Infrastruktur hinter Ports | constraint | M | n/a | medium | verified | CTRL-DEPCRUISE |
| [REQ-AUTH-001](req/REQ-AUTH-001.md) | Registrierung nur mit Hochschul-Domain (BR-01) | domain | M | basis | high | verified | AT-AUTH-001, AT-AUTH-001-2 |
| [REQ-AUTH-002](req/REQ-AUTH-002.md) | Hochschuladresse per Link bestätigen | functional | M | basis | high | approved | AT-AUTH-002, AT-AUTH-002-2, AT-AUTH-002-3, AT-AUTH-002-4 |
| [REQ-AUTH-003](req/REQ-AUTH-003.md) | Nutzertyp aus der Domain ableiten | domain | S | n/a | low | verified | AT-AUTH-003, AT-AUTH-003-2 |
| [REQ-AUTH-004](req/REQ-AUTH-004.md) | Keine Offenlegung bestehender Konten | constraint | M | basis | high | implemented | AT-AUTH-004, AT-AUTH-004-2 |
| [REQ-AUTH-005](req/REQ-AUTH-005.md) | Anmelden und Abmelden | functional | M | basis | medium | verified | AT-AUTH-005, AT-AUTH-005-2 |
| [REQ-AUTH-006](req/REQ-AUTH-006.md) | Passwort per E-Mail-Link zurücksetzen | functional | M | basis | medium | verified | AT-AUTH-006 |
| [REQ-AUTH-007](req/REQ-AUTH-007.md) | Mitgliedschaft jährlich re-verifizieren | domain | S | n/a | medium | approved | AT-AUTH-007 |
| [REQ-AUTH-008](req/REQ-AUTH-008.md) | Gesperrte Adressen nicht erneut registrieren | functional | M | basis | medium | verified | AT-AUTH-008 |
| [REQ-AUTH-009](req/REQ-AUTH-009.md) | Anmeldeverfahren austauschbar (Hochschulkennung) | constraint | M | n/a | high | verified | CTRL-DEPCRUISE, AT-AUTH-009, AT-ARCH-005 |
| [REQ-AVAIL-001](req/REQ-AVAIL-001.md) | Verfügbarkeit der kritischen Funktionen | quality | W | basis | medium | approved | AT-AVAIL-001 |
| [REQ-AVAIL-002](req/REQ-AVAIL-002.md) | Wiederherstellungsziele der Datenhaltung | quality | W | n/a | medium | approved | MAN-AVAIL-002 |
| [REQ-AVAIL-003](req/REQ-AVAIL-003.md) | Datensicherung und getestete Wiederherstellung im Docker-Beispiel | quality | M | n/a | high | verified | AT-AVAIL-003, CTRL-DOC-BACKUP |
| [REQ-CHAT-001](req/REQ-CHAT-001.md) | Anbieter über anzeigenbezogenen Chat kontaktieren | functional | M | basis | high | verified | AT-CHAT-001, AT-CHAT-001-2, AT-CHAT-001-3, AT-CHAT-001-4 |
| [REQ-CHAT-002](req/REQ-CHAT-002.md) | Genau eine Konversation pro Anzeige und Interessent | functional | M | basis | medium | verified | AT-CHAT-002 |
| [REQ-CHAT-003](req/REQ-CHAT-003.md) | Nachrichten in Echtzeit empfangen | functional | M | leistung | medium | implemented | AT-CHAT-003, AT-CHAT-003-2 |
| [REQ-CHAT-004](req/REQ-CHAT-004.md) | Nachrichten genau einmal anzeigen, keine verlieren | quality | M | basis | medium | verified | AT-CHAT-004, AT-CHAT-004-2 |
| [REQ-CHAT-005](req/REQ-CHAT-005.md) | Ungelesene Nachrichten erkennen | functional | S | leistung | low | verified | AT-CHAT-005 |
| [REQ-CHAT-006](req/REQ-CHAT-006.md) | Sicherheitshinweis bei Links, IBAN und Telefonnummern | constraint | S | basis | low | verified | AT-CHAT-006 |
| [REQ-CHAT-007](req/REQ-CHAT-007.md) | Begrenzung von Nachrichtenlänge und Sendehäufigkeit | constraint | M | n/a | medium | implemented | AT-CHAT-007, AT-CHAT-007-2 |
| [REQ-CHAT-008](req/REQ-CHAT-008.md) | Bilder im Chat senden | functional | C | begeisterung | medium | approved | AT-CHAT-008 |
| [REQ-CHAT-009](req/REQ-CHAT-009.md) | Preisvorschlag im Chat | functional | C | begeisterung | low | approved | AT-CHAT-009-2 |
| [REQ-CHAT-010](req/REQ-CHAT-010.md) | Kontaktdaten erst nach beidseitiger Zustimmung freigeben | constraint | M | basis | high | verified | AT-CHAT-010, AT-CHAT-010-2, AT-CHAT-010-3, AT-CHAT-010-4 |
| [REQ-CHAT-011](req/REQ-CHAT-011.md) | Reservierung und Abgabe für eine Person (Deal-Kern) | functional | M | basis | medium | verified | AT-CHAT-011, AT-CHAT-011-2 |
| [REQ-DEMO-001](req/REQ-DEMO-001.md) | Demo-Daten auf Knopfdruck | constraint | M | n/a | low | verified | AT-DEMO-001 |
| [REQ-DEMO-002](req/REQ-DEMO-002.md) | Zeitgesteuerte Abläufe sofort auslösen | functional | S | n/a | low | verified | AT-DEMO-002 |
| [REQ-LEGAL-001](req/REQ-LEGAL-001.md) | Impressum | constraint | M | basis | medium | verified | AT-LEGAL-001, CTRL-DOC-LEGAL-TEXTE |
| [REQ-LEGAL-002](req/REQ-LEGAL-002.md) | Datenschutzerklärung | constraint | M | basis | high | verified | AT-LEGAL-002, AT-LEGAL-002-2, AT-LEGAL-002-3, CTRL-DOC-LEGAL-TEXTE |
| [REQ-LEGAL-003](req/REQ-LEGAL-003.md) | Nutzungsbedingungen und Community-Regeln | constraint | M | basis | medium | verified | AT-LEGAL-003, AT-LEGAL-003-2, CTRL-DOC-LEGAL-TEXTE |
| [REQ-LEGAL-004](req/REQ-LEGAL-004.md) | Erklärung zur Barrierefreiheit | quality | M | basis | medium | verified | AT-LEGAL-004, CTRL-DOC-LEGAL-TEXTE |
| [REQ-LEGAL-005](req/REQ-LEGAL-005.md) | Zentrale Kontaktstelle | constraint | M | basis | low | verified | AT-LEGAL-005, CTRL-DOC-LEGAL-TEXTE |
| [REQ-LEGAL-006](req/REQ-LEGAL-006.md) | Begründung an Betroffene bei Moderationsentscheidungen | functional | M | basis | high | verified | AT-LEGAL-006, AT-LEGAL-006-2 |
| [REQ-LEGAL-007](req/REQ-LEGAL-007.md) | Widerspruch gegen Moderationsentscheidungen | functional | M | basis | high | verified | AT-LEGAL-007, AT-LEGAL-007-2, AT-LEGAL-007-3, AT-LEGAL-007-4 |
| [REQ-LEGAL-008](req/REQ-LEGAL-008.md) | Verdacht auf Straftaten kennzeichnen und eskalieren | functional | S | n/a | high | verified | AT-LEGAL-008, CTRL-DOC-DSA |
| [REQ-LEGAL-009](req/REQ-LEGAL-009.md) | Auswertung meldepflichtiger Anbieter (DAC7) | functional | S | n/a | medium | verified | AT-LEGAL-009, AT-LEGAL-009-2, CTRL-DOC-DAC7 |
| [REQ-LEGAL-010](req/REQ-LEGAL-010.md) | Einwilligung vor nicht notwendiger Speicherung auf Endgeräten | constraint | M | basis | medium | verified | AT-LEGAL-010 |
| [REQ-LEGAL-011](req/REQ-LEGAL-011.md) | Verzeichnis der Verarbeitungstätigkeiten und TOMs | constraint | M | n/a | medium | verified | CTRL-DOC-VVT, CTRL-DOC-TOM |
| [REQ-LEGAL-012](req/REQ-LEGAL-012.md) | Auftragsverarbeitung dokumentiert | constraint | S | n/a | low | verified | CTRL-DOC-AVV |
| [REQ-LEGAL-013](req/REQ-LEGAL-013.md) | Prozess für Datenschutzverletzungen | constraint | M | n/a | high | implemented | CTRL-DOC-DATENPANNE, MAN-LEGAL-013 |
| [REQ-LST-001](req/REQ-LST-001.md) | Angebot oder Gesuch schnell erstellen | functional | M | basis | medium | implemented | AT-LST-001, MAN-LST-001 |
| [REQ-LST-002](req/REQ-LST-002.md) | Preistypen und Preisgrenzen | domain | M | basis | low | verified | AT-LST-002, AT-LST-002-2 |
| [REQ-LST-003](req/REQ-LST-003.md) | Bilder hochladen, Metadaten entfernen, Vorschaubilder | functional | M | leistung | medium | implemented | AT-LST-003, AT-LST-003-2, AT-LST-003-3 |
| [REQ-LST-004](req/REQ-LST-004.md) | Übergabeort aus Campus-Standorten | domain | M | basis | low | verified | AT-LST-004 |
| [REQ-LST-005](req/REQ-LST-005.md) | Studienbezogene Attribute für Bücher und Skripte | domain | S | begeisterung | low | verified | AT-LST-005 |
| [REQ-LST-006](req/REQ-LST-006.md) | Eigene Anzeige bearbeiten, pausieren, reaktivieren, löschen | functional | M | basis | low | verified | AT-LST-006, AT-LST-006-2 |
| [REQ-LST-007](req/REQ-LST-007.md) | Anzeige als reserviert oder abgegeben markieren | functional | M | basis | low | approved | AT-LST-007, AT-LST-007-2 |
| [REQ-LST-008](req/REQ-LST-008.md) | Ablauf, Erinnerung, Verlängerung und Löschfristen von Anzeigen | functional | S | leistung | low | approved | AT-LST-008 |
| [REQ-LST-009](req/REQ-LST-009.md) | Teilbarer Link mit Vorschau für Nicht-Mitglieder | functional | C | begeisterung | medium | approved | AT-LST-009 |
| [REQ-LST-010](req/REQ-LST-010.md) | Verbotene Inhalte vor Veröffentlichung in die Moderation | constraint | M | basis | medium | verified | AT-LST-010, AT-LST-010-2 |
| [REQ-LST-011](req/REQ-LST-011.md) | Höchstens 30 aktive Anzeigen pro Mitglied | functional | S | n/a | low | implemented | AT-LST-011 |
| [REQ-LST-012](req/REQ-LST-012.md) | HEIC-Fotos annehmen | functional | C | leistung | medium | approved | AT-LST-012 |
| [REQ-MAINT-001](req/REQ-MAINT-001.md) | Testabdeckung der Fachlogik | quality | S | n/a | medium | approved | CTRL-COVERAGE, CTRL-MUTATION |
| [REQ-MAINT-002](req/REQ-MAINT-002.md) | Geprüfte Modulgrenzen | constraint | M | n/a | medium | verified | CTRL-DEPCRUISE |
| [REQ-MOD-001](req/REQ-MOD-001.md) | Inhalte und Mitglieder melden | functional | M | basis | high | verified | AT-MOD-001, AT-MOD-001-2 |
| [REQ-MOD-002](req/REQ-MOD-002.md) | Moderations-Queue bearbeiten | functional | M | basis | high | verified | AT-MOD-002, AT-MOD-002-2, AT-MOD-002-3 |
| [REQ-MOD-003](req/REQ-MOD-003.md) | Entscheidungen begründen und unveränderlich protokollieren | constraint | M | basis | high | implemented | AT-MOD-003, AT-MOD-003-2 |
| [REQ-MOD-004](req/REQ-MOD-004.md) | Vorläufiges Ausblenden ab drei Meldungen | functional | S | basis | medium | approved | AT-MOD-004 |
| [REQ-MOD-005](req/REQ-MOD-005.md) | Mitglieder blockieren | functional | S | leistung | medium | verified | AT-MOD-005 |
| [REQ-MOD-006](req/REQ-MOD-006.md) | Übergabepartner bewerten | functional | C | begeisterung | medium | approved | AT-MOD-006 |
| [REQ-MOD-007](req/REQ-MOD-007.md) | Rollen vergeben und entziehen | functional | M | n/a | high | verified | AT-MOD-007, AT-MOD-007-2 |
| [REQ-MOD-008](req/REQ-MOD-008.md) | Whitelist-Domains über eine Oberfläche verwalten | functional | C | n/a | medium | approved | AT-MOD-008 |
| [REQ-NOTI-001](req/REQ-NOTI-001.md) | Transaktionale E-Mails | functional | M | basis | high | implemented | AT-NOTI-001, AT-NOTI-001-2 |
| [REQ-NOTI-002](req/REQ-NOTI-002.md) | Gebündelte Benachrichtigung über neue Nachrichten ohne Inhalt | functional | M | leistung | medium | implemented | AT-NOTI-002 |
| [REQ-NOTI-003](req/REQ-NOTI-003.md) | Benachrichtigungen pro Kategorie abbestellen | functional | S | leistung | low | implemented | AT-NOTI-003 |
| [REQ-NOTI-004](req/REQ-NOTI-004.md) | Authentifizierter E-Mail-Versand (SPF, DKIM, DMARC) | quality | W | basis | high | approved | MAN-NOTI-004 |
| [REQ-NOTI-005](req/REQ-NOTI-005.md) | Zuverlässige E-Mail-Zustellung | quality | M | basis | medium | implemented | AT-NOTI-005, CTRL-DLQ |
| [REQ-NOTI-006](req/REQ-NOTI-006.md) | Web-Push-Benachrichtigungen | functional | C | begeisterung | low | approved | AT-NOTI-006 |
| [REQ-NOTI-007](req/REQ-NOTI-007.md) | Mailserver per Konfiguration austauschbar | constraint | M | n/a | low | implemented | AT-NOTI-007 |
| [REQ-OPS-001](req/REQ-OPS-001.md) | Gesundheitsprüfung und geordnetes Herunterfahren | quality | M | n/a | medium | implemented | AT-OPS-001, AT-OPS-001-2 |
| [REQ-OPS-002](req/REQ-OPS-002.md) | Beobachtbarkeit ohne personenbezogene Daten | quality | M | n/a | medium | approved | AT-OPS-002, MAN-OPS-002 |
| [REQ-OPS-003](req/REQ-OPS-003.md) | Schnellstart und Fehlerbehebung dokumentiert | quality | M | n/a | low | implemented | MAN-OPS-003 |
| [REQ-OPS-004](req/REQ-OPS-004.md) | Reproduzierbarer, versionierter Image-Build | quality | M | n/a | medium | verified | CTRL-CI-IMAGE |
| [REQ-OPS-005](req/REQ-OPS-005.md) | Automatische, idempotente Datenbankmigration | quality | M | n/a | medium | implemented | AT-OPS-005 |
| [REQ-OPS-006](req/REQ-OPS-006.md) | Wartungsmodus und Ankündigungen | quality | S | n/a | medium | verified | AT-OPS-006, AT-OPS-006-2 |
| [REQ-OPS-007](req/REQ-OPS-007.md) | Öffentliche Statusseite | quality | C | leistung | low | verified | AT-OPS-007 |
| [REQ-OPS-008](req/REQ-OPS-008.md) | Überwachung und Alarmierung | quality | S | n/a | medium | implemented | CTRL-ALERT-RULES, MAN-OPS-008 |
| [REQ-OPS-009](req/REQ-OPS-009.md) | Verschlüsselte Verbindung mit HSTS über Reverse Proxy | constraint | S | n/a | medium | verified | AT-OPS-009 |
| [REQ-OPS-010](req/REQ-OPS-010.md) | Zustellbarkeit der E-Mails | constraint | C | n/a | low | verified | AT-OPS-010, CTRL-DOC-MAIL |
| [REQ-OPS-011](req/REQ-OPS-011.md) | Betriebshandbuch, Störungs- und Notfallprozess | constraint | M | n/a | medium | implemented | CTRL-DOC-BETRIEB, MAN-OPS-011 |
| [REQ-OPS-012](req/REQ-OPS-012.md) | Automatisierte Aktualisierung von Abhängigkeiten | constraint | S | n/a | low | verified | CTRL-RENOVATE |
| [REQ-PERF-001](req/REQ-PERF-001.md) | Antwortzeit der Suche | quality | M | leistung | medium | approved | AT-PERF-001 |
| [REQ-PERF-002](req/REQ-PERF-002.md) | Zustellzeit von Chatnachrichten | quality | M | leistung | medium | approved | AT-PERF-002 |
| [REQ-PERF-003](req/REQ-PERF-003.md) | Antwortzeit beim Erstellen einer Anzeige | quality | M | leistung | low | approved | AT-PERF-003 |
| [REQ-PERF-004](req/REQ-PERF-004.md) | Zeit bis zum Versand der Bestätigungsmail | quality | M | basis | medium | approved | AT-PERF-004 |
| [REQ-PERF-005](req/REQ-PERF-005.md) | Ladeverhalten der Oberfläche | quality | S | leistung | low | approved | AT-PERF-005 |
| [REQ-PORT-001](req/REQ-PORT-001.md) | Entwicklungsumgebung mit einem Befehl | quality | S | n/a | low | implemented | MAN-PORT-001 |
| [REQ-PORT-002](req/REQ-PORT-002.md) | Lauffähig auf x86- und ARM-Rechnern | quality | M | n/a | medium | approved | CTRL-CI-MULTIARCH |
| [REQ-PRIV-001](req/REQ-PRIV-001.md) | Versionierte Einwilligungen | constraint | M | n/a | medium | approved | AT-PRIV-001, AT-PRIV-001-2 |
| [REQ-PRIV-002](req/REQ-PRIV-002.md) | Datenminimierung und Schutz der Kontaktdaten | constraint | M | basis | high | approved | AT-PRIV-002, AT-PRIV-002-2 |
| [REQ-PRIV-003](req/REQ-PRIV-003.md) | Löschkonzept mit Fristen je Datenkategorie | constraint | M | n/a | high | approved | AT-PRIV-003, AT-PRIV-003-2, AT-PRIV-003-3 |
| [REQ-PRIV-004](req/REQ-PRIV-004.md) | Moderation sieht nur gemeldeten Chat-Kontext | constraint | M | basis | high | implemented | AT-PRIV-004 |
| [REQ-PRIV-005](req/REQ-PRIV-005.md) | Hosting und Auftragsverarbeiter in der EU | constraint | W | n/a | high | approved | MAN-PRIV-005 |
| [REQ-PRIV-006](req/REQ-PRIV-006.md) | Kein Tracking, keine Drittanbieter-Ressourcen | constraint | M | basis | medium | verified | AT-PRIV-006, AT-PRIV-006-2 |
| [REQ-PRIV-007](req/REQ-PRIV-007.md) | Prüfung der Datenschutz-Folgenabschätzung | constraint | S | n/a | medium | implemented | CTRL-DOC-DSFA, MAN-PRIV-007 |
| [REQ-PRIV-008](req/REQ-PRIV-008.md) | Keine Indexierung durch Suchmaschinen | constraint | S | basis | low | verified | AT-PRIV-008 |
| [REQ-SEC-001](req/REQ-SEC-001.md) | OWASP ASVS Level 2 | quality | M | basis | high | approved | MAN-SEC-001 |
| [REQ-SEC-002](req/REQ-SEC-002.md) | Passwörter mit Argon2id speichern | constraint | M | n/a | high | implemented | AT-SEC-002 |
| [REQ-SEC-003](req/REQ-SEC-003.md) | Passwortrichtlinie | constraint | M | basis | medium | verified | AT-SEC-003 |
| [REQ-SEC-004](req/REQ-SEC-004.md) | Sichere Sitzungen und Schutz vor fremdgesteuerten Anfragen | constraint | M | basis | high | verified | AT-SEC-004, AT-SEC-004-2, AT-SEC-004-3 |
| [REQ-SEC-005](req/REQ-SEC-005.md) | Begrenzung von Anfragen (Rate-Limits) | constraint | M | n/a | high | implemented | AT-SEC-005, AT-SEC-005-2, AT-SEC-005-3 |
| [REQ-SEC-006](req/REQ-SEC-006.md) | Autorisierung pro Ressource, standardmäßig verweigern | constraint | M | basis | high | implemented | AT-SEC-006, AT-SEC-006-2 |
| [REQ-SEC-007](req/REQ-SEC-007.md) | Sicherer Umgang mit hochgeladenen Bildern | constraint | M | basis | medium | approved | AT-SEC-007, AT-SEC-007-2, AT-SEC-007-3, AT-SEC-007-4 |
| [REQ-SEC-008](req/REQ-SEC-008.md) | Sicherheitsprüfungen in der CI-Pipeline | constraint | M | n/a | medium | approved | CTRL-CI-SCAN |
| [REQ-SEC-009](req/REQ-SEC-009.md) | Threat Model für Registrierung, Chat und Upload | constraint | M | n/a | high | approved | MAN-SEC-009 |
| [REQ-SEC-010](req/REQ-SEC-010.md) | Gehärtetes Anwendungs-Image | constraint | M | n/a | medium | verified | CTRL-IMAGE-INSPECT |
| [REQ-SEC-011](req/REQ-SEC-011.md) | Angebote nur von verifizierten Mitgliedern | constraint | M | basis | high | verified | AT-SEC-011, AT-SEC-011-2, AT-SEC-011-3 |
| [REQ-SEC-012](req/REQ-SEC-012.md) | Meldeweg für Sicherheitslücken | constraint | S | n/a | low | verified | AT-SEC-012, CTRL-DOC-BETRIEB |
| [REQ-SEC-013](req/REQ-SEC-013.md) | Penetrationstest vor dem Go-live | constraint | S | n/a | medium | implemented | CTRL-DOC-PENTEST, MAN-SEC-013 |
| [REQ-SRCH-001](req/REQ-SRCH-001.md) | Freitextsuche mit Wortstämmen und Tippfehlertoleranz | functional | M | leistung | medium | verified | AT-SRCH-001, AT-SRCH-001-2 |
| [REQ-SRCH-002](req/REQ-SRCH-002.md) | Filtern und Sortieren | functional | M | leistung | low | implemented | AT-SRCH-002 |
| [REQ-SRCH-003](req/REQ-SRCH-003.md) | Aktualität der Suche | quality | S | leistung | low | verified | AT-SRCH-003, AT-SRCH-003-2 |
| [REQ-SRCH-004](req/REQ-SRCH-004.md) | Anzeigen merken | functional | S | leistung | low | verified | AT-SRCH-004 |
| [REQ-SRCH-005](req/REQ-SRCH-005.md) | Suchaufträge mit täglicher E-Mail | functional | C | begeisterung | low | approved | AT-SRCH-005 |
| [REQ-SRCH-006](req/REQ-SRCH-006.md) | Keine Anzeigen blockierter oder gesperrter Nutzer in der Suche | functional | M | basis | medium | implemented | AT-SRCH-006 |
| [REQ-UX-001](req/REQ-UX-001.md) | Mobile Nutzung und Installierbarkeit | quality | M | basis | medium | implemented | AT-UX-001, AT-UX-001-2 |
| [REQ-UX-002](req/REQ-UX-002.md) | Deutsche Oberfläche, übersetzbar vorbereitet | quality | S | basis | low | approved | MAN-UX-002 |
| [REQ-UX-003](req/REQ-UX-003.md) | Fehlerseiten und korrekte HTTP-Statuscodes | functional | M | basis | medium | verified | AT-UX-003, AT-UX-003-2 |
| [REQ-UX-004](req/REQ-UX-004.md) | Startseite für Gäste | functional | S | leistung | low | verified | AT-UX-004 |
| [REQ-UX-005](req/REQ-UX-005.md) | Hilfe, FAQ und Sicherheitstipps | functional | S | leistung | low | verified | AT-UX-005 |
| [REQ-UX-006](req/REQ-UX-006.md) | Rechtliche Links auf jeder Seite und in jeder E-Mail | constraint | M | basis | medium | verified | AT-UX-006, AT-UX-006-2 |
| [REQ-UX-007](req/REQ-UX-007.md) | Englische Oberfläche | functional | S | leistung | medium | verified | AT-UX-007, AT-UX-007-2, AT-UX-007-3 |

<!-- req-index:end -->
