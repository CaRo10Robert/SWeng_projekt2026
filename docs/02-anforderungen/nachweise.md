---
id: EVIDENCE
type: verification
status: in-review
owner: qa-lead
version: 1.0
created: 2026-10-23
last_updated: 2026-10-23
---

# Nachweiskatalog

Alle Nachweise, auf die Anforderungen in `verification` verweisen (Guideline Kap. 01: Requirement → Acceptance/Control Evidence → Test). `scripts/trace.mjs` prüft, dass jede Nachweis-ID hier steht und dass automatisierte Nachweise (`AT-…`) in Testquellen markiert sind, sobald eine Anforderung `verified` ist.

| Präfix | Art | Ort |
|---|---|---|
| `AT-` | automatisierter Test (Unit, API/Smoke, E2E, Last) | `apps/server/src/**/*.test.ts`, `scripts/smoke-test.mjs`, `e2e/`, `tests/` – die ID steht im Testnamen |
| `MAN-` | manueller Nachweis mit Protokoll | `docs/04-review/` |
| `CTRL-` | Kontrolle (Fitness Function, CI-Prüfung, Konfiguration) | `package.json`-Skripte, CI-Workflow |

| ID | Art | Anforderung | Prüfung |
|---|---|---|---|
| `AT-A11Y-001` | automatisiert | REQ-A11Y-001 | E2E-Test – axe-core auf allen Routen, Ergebnis 0 `serious`/`critical`. |
| `MAN-A11Y-001` | manuell | REQ-A11Y-001 | Manuelle WCAG-Prüfung mit Screenreader – **noch nicht durchgeführt**. Vorbereitet: [Leitfaden](../05-umsetzung/nachweise/leitfaden-screenreader.md), [Protokollvorlage](../05-umsetzung/nachweise/protokollvorlage-screenreader.md) und ein [fiktives Beispielprotokoll](../05-umsetzung/nachweise/MAN-A11Y-001-fiktiv.md) (ausdrücklich **kein** Nachweis). Der Nachweis braucht eine echte Prüfung durch eine Person mit NVDA. |
| `AT-A11Y-002` | automatisiert | REQ-A11Y-002 | E2E-Test – neun Kernabläufe ausschließlich per Tastatur (neu). |
| `AT-A11Y-002-2` | automatisiert | REQ-A11Y-002 | E2E-Test – axe-core auf Registrierungs-, Anmelde-, Passwort-, Such-, Formular-, Detail-, Meine-Anzeigen- und Chatseite, 0 `serious`/`critical` (neu). |
| `MAN-A11Y-002` | manuell | REQ-A11Y-002 | Manuelle Tastatur- und Screenreader-Prüfung inklusive Dateiauswahl im Systemdialog – **noch nicht durchgeführt**; Ablauf und Vorlage im [Leitfaden Screenreader](../05-umsetzung/nachweise/leitfaden-screenreader.md). |
| `AT-ACC-001` | automatisiert | REQ-ACC-001 | Smoke-Test – Anzeigename, Studiengang und Übergabeorte ändern und Änderung im eigenen Profil prüfen (neu). |
| `AT-ACC-002` | automatisiert | REQ-ACC-002 | Smoke-Test – Löschung beantragen, Anmeldung bricht ab. |
| `AT-ACC-002-2` | automatisiert | REQ-ACC-002 | Integrationstest – Löschlauf nach Ablauf der Karenz entfernt alle personenbezogenen Daten und anonymisiert fremde Konversationen. |
| `AT-ACC-003` | automatisiert | REQ-ACC-003 | Smoke-Test „Datenexport (Art. 15/20)“ (bestehend). |
| `AT-ACC-004` | automatisiert | REQ-ACC-004 | Smoke-Test – Profilbild hochladen, Metadaten entfernt, Bild für andere Mitglieder sichtbar, Entfernen setzt Platzhalter (neu). |
| `CTRL-DEPCRUISE` | Kontrolle | REQ-ARCH-001, REQ-ARCH-006, REQ-AUTH-009, REQ-MAINT-002 | Modulgrenzen ohne Verstöße. |
| `MAN-ARCH-001` | manuell | REQ-ARCH-001 | Architektur-Review-Protokoll (QS-5) – [MAN-ARCH-001](../05-umsetzung/nachweise/MAN-ARCH-001.md). Die dependency-cruiser-Regel `no-payment-sdk-in-modules` verhindert Importe von Zahlungsdienstleister-SDKs in Fachmodulen; Deal-Ereignisse tragen `eventId`, `occurredAt` und `dealId`. |
| `MAN-ARCH-002` | manuell | REQ-ARCH-002 | Review-Protokoll im Spike PAY-02 (rechtliche Prüfung). Gilt ab EPIC-09; im MVP wird kein Geld verarbeitet. |
| `AT-ARCH-003` | automatisiert | REQ-ARCH-003 | Integrationstest – Domain in der Datenbank ergänzen, Registrierung mit dieser Domain gelingt (neu zu schreiben). |
| `MAN-ARCH-004` | manuell | REQ-ARCH-004 | Schema-Review der Migrationen – [MAN-ARCH-004](../05-umsetzung/nachweise/MAN-ARCH-004.md). Die Index-Befunde S-1 bis S-6 und S-4 (Zustimmungsnachweise ohne Profilbezug) sind mit Migration `0005_nachweise_korrekturen.sql` behoben; S-9 (Institutionsprüfung bei `GET /listings/:id`) ist vor EPIC-10 einzuplanen. |
| `AT-ARCH-005` | automatisiert | REQ-ARCH-005, REQ-AUTH-009 | `scripts/smoke-test.mjs` gegen ein frisch gestartetes Setup (bestehend). |
| `AT-AUTH-001` | automatisiert | REQ-AUTH-001 | Unit-Test der Entscheidungstabelle, jede Zeile ein Testfall (Grundlage: `apps/server/src/modules/identity/domain.test.ts`, „BR-01 Domain-Prüfung“). |
| `AT-AUTH-001-2` | automatisiert | REQ-AUTH-001 | Smoke-Test – Registrierung mit `x@hwg-lu.de.evil.com` wird mit `domain_not_allowed` abgelehnt (QS-1). |
| `AT-AUTH-002` | automatisiert | REQ-AUTH-002 | Smoke-Test – Bestätigung mit dem Link aus der **älteren** von zwei Mails meldet an. |
| `AT-AUTH-002-2` | automatisiert | REQ-AUTH-002 | Smoke-Test – derselbe Link ein zweites Mal liefert `token_used`, keine Sitzung. |
| `AT-AUTH-002-3` | automatisiert | REQ-AUTH-002 | (neu) abgelaufener Link liefert `token_expired` (Zeit über die Datenbank vorgestellt). |
| `AT-AUTH-002-4` | automatisiert | REQ-AUTH-002 | (neu) unbestätigtes Konto älter als 7 Tage wird vom Löschlauf entfernt; erneute Registrierung derselben Adresse ist möglich. |
| `AT-AUTH-003` | automatisiert | REQ-AUTH-003 | Unit-Test – BR-01-Tabelle prüft den abgeleiteten Typ je zugelassener Zeile. |
| `AT-AUTH-003-2` | automatisiert | REQ-AUTH-003 | Smoke-Test – nach Bestätigung einer `@studmail.hwg-lu.de`-Adresse ist der Typ „Studierende“. |
| `AT-AUTH-004` | automatisiert | REQ-AUTH-004 | Smoke-Test – zweite Registrierung derselben Adresse liefert identische Antwort. |
| `AT-AUTH-004-2` | automatisiert | REQ-AUTH-004 | (neu) Antwortinhalt und Median der Antwortzeit (je 30 Anfragen) für Registrierung, Anmeldung und Passwort-Reset mit existierender und nicht existierender Adresse vergleichen. |
| `AT-AUTH-005` | automatisiert | REQ-AUTH-005 | Smoke-Test – Anmeldung der Demo-Konten liefert das Profil und eine Sitzung. |
| `AT-AUTH-005-2` | automatisiert | REQ-AUTH-005 | neu zu schreiben – nach Abmelden liefert `/me` mit der alten Sitzung 401. |
| `AT-AUTH-006` | automatisiert | REQ-AUTH-006 | neu zu schreiben – Reset-Mail aus Mailpit, neues Passwort setzen, Anmeldung mit neuem Passwort, alte Sitzung liefert 401, zweite Nutzung liefert `token_used`. |
| `AT-AUTH-007` | automatisiert | REQ-AUTH-007 | (neu) Szenario-Test mit vorgestellter Zeit über alle Tabellenzeilen inkl. Versand der Bestätigungsmail. |
| `AT-AUTH-008` | automatisiert | REQ-AUTH-008 | neu zu schreiben – Konto per Moderationsentscheidung sperren, Neuregistrierung mit `+`-Alias legt kein Konto an und versendet keine Mail. |
| `AT-AUTH-009` | automatisiert | REQ-AUTH-009 | (neu) Test des Anmelde-Anwendungsfalls mit einem simulierten zweiten Verfahren: Kontoverknüpfung, Neuanlage, Ablehnung fremder bzw. fehlender Adresse. |
| `AT-AVAIL-001` | automatisiert | REQ-AVAIL-001 | Auswertung der Fehlerquote in den k6-Lasttests (neu zu schreiben). |
| `MAN-AVAIL-002` | manuell | REQ-AVAIL-002 | Protokoll der Restore-Übung – im Docker-Beispiel als Übung durchgeführt: [MAN-AVAIL-002](../05-umsetzung/nachweise/MAN-AVAIL-002.md). RTO gemessen 26 s (Restore-Skript 12,7 s) – erfüllt; das RPO dieser Anforderung ist mit der täglichen Sicherung des Beispiels **nicht** erreichbar und braucht im Echtbetrieb PITR bzw. WAL-Archivierung (EPIC-12). |
| `AT-AVAIL-003` | automatisiert | REQ-AVAIL-003 | Restore-Test `tests/ops/restore-test.mjs` in CI (Job `compose`) – Teil 1: Sicherung, Löschen des Stacks, Wiederherstellung; Zählungen identisch, Anmeldung möglich, Anzeige mit Bild wieder da, Dauer ≤ 15 min. Teil 2: eine nach der Sicherung gelöschte Anzeige bleibt nach der Wiederherstellung gelöscht (Löschjournal). Dazu Unit-Test des Löschjournals (`deletion-journal.test.ts`). |
| `CTRL-DOC-BACKUP` | Kontrolle | REQ-AVAIL-003 | Kontrolle `docs/07-betrieb/backup-restore.md` – Ablauf, Aufbewahrung, Verschlüsselung, Zuständigkeiten. |
| `AT-CHAT-001` | automatisiert | REQ-CHAT-001 | Smoke-Test – Konversation starten, Anbieter erhält die Nachricht. |
| `AT-CHAT-001-2` | automatisiert | REQ-CHAT-001 | API-Test – Antworten zu Konversation und Nachrichten enthalten keine E-Mail-Adressen (neu). |
| `AT-CHAT-001-3` | automatisiert | REQ-CHAT-001 | API-Test – Kontakt zur eigenen Anzeige wird abgelehnt (neu). |
| `AT-CHAT-001-4` | automatisiert | REQ-CHAT-001 | API-Test – Kontakt bei Blockierung wird mit „Kontakt nicht möglich“ abgelehnt (neu). |
| `AT-CHAT-002` | automatisiert | REQ-CHAT-002 | API-Test – zweimaliger (auch paralleler) Start liefert dieselbe Konversations-ID (neu; Grundlage: Smoke-Test „Konversation starten“). |
| `AT-CHAT-003` | automatisiert | REQ-CHAT-003 | Smoke-Test – Anbieter erhält die Nachricht in Echtzeit; zusätzlich Browser-Durchlauf mit zwei Konten. |
| `AT-CHAT-003-2` | automatisiert | REQ-CHAT-003 | E2E-Test – bei getrennter Verbindung erscheint die Nachricht durch Aktualisierung (neu). |
| `AT-CHAT-004` | automatisiert | REQ-CHAT-004 | Smoke-Test – gleiche Kennung erzeugt keine zweite Nachricht. |
| `AT-CHAT-004-2` | automatisiert | REQ-CHAT-004 | API-Test – Nachladen ab der letzten bekannten Nachricht ohne Lücke (neu). |
| `AT-CHAT-005` | automatisiert | REQ-CHAT-005 | Smoke-Test – Ungelesen-Zähler; Lesestatus nach Öffnen (Lesestatus-Prüfung neu zu ergänzen). |
| `AT-CHAT-006` | automatisiert | REQ-CHAT-006 | Unit-Test der Erkennung (Entscheidungstabelle). |
| `AT-CHAT-007` | automatisiert | REQ-CHAT-007 | API-Test – Längengrenze (neu). |
| `AT-CHAT-007-2` | automatisiert | REQ-CHAT-007 | API-Test – Rate-Limits für Konversationen und Nachrichten (neu). |
| `AT-CHAT-008` | automatisiert | REQ-CHAT-008 | API-Test Bild senden und Zugriffsschutz (neu). Noch nicht umgesetzt (⬜). |
| `AT-CHAT-009-2` | automatisiert | REQ-CHAT-009 | API-Test Preisvorschlag senden, annehmen, ablehnen (neu). Noch nicht umgesetzt (⬜). |
| `AT-CHAT-010` | automatisiert | REQ-CHAT-010 | Smoke-Test – einseitige Zustimmung gibt nichts preis, beidseitige Zustimmung zeigt die Adresse, Systemnachricht ohne Adresse, Widerruf blendet sie aus (neu). |
| `AT-CHAT-010-2` | automatisiert | REQ-CHAT-010 | Smoke-Test – fremder Nutzer erhält „nicht gefunden“ (neu). |
| `AT-CHAT-010-3` | automatisiert | REQ-CHAT-010 | Smoke-Test – Ablehnen, Sperrfrist für erneute Anfragen und Höchstzahl je Konversation (neu). |
| `AT-CHAT-010-4` | automatisiert | REQ-CHAT-010 | Smoke-Test – Zurückziehen vor Zustimmung entfernt die offene Anfrage; Blockierung blendet ausgetauschte Adressen für beide aus, neue Zustimmung ergibt „Kontakt nicht möglich“ (neu, Code-Review CR-14). |
| `AT-CHAT-011` | automatisiert | REQ-CHAT-011 | Smoke-Test – der Anbieter reserviert aus der Konversation, Deal ist „vereinbart“, Anzeige „reserviert“. |
| `AT-CHAT-011-2` | automatisiert | REQ-CHAT-011 | Smoke-Test – der Interessent darf den Deal nicht steuern. |
| `AT-DEMO-001` | automatisiert | REQ-DEMO-001 | Smoke-Test – Login mit Demo-Konto, Suche liefert Anzeigen, Queue ≥ 2 Fälle (bestehend: „Moderations-Queue enthält Seed-Meldung und Wortfilter-Fall“). |
| `AT-DEMO-002` | automatisiert | REQ-DEMO-002 | Smoke-Test – Auslösen liefert 202 und erzeugt die Erinnerungsmail in Mailpit (neu zu schreiben). |
| `AT-LEGAL-001` | automatisiert | REQ-LEGAL-001 | E2E-Test – Impressum ohne Anmeldung aus dem Seitenfuß erreichbar, HTTP 200 bei Direktaufruf, alle Pflichtabschnitte und der Muster-Hinweis sichtbar. |
| `CTRL-DOC-LEGAL-TEXTE` | Kontrolle | REQ-LEGAL-001, REQ-LEGAL-002, REQ-LEGAL-003, REQ-LEGAL-004, REQ-LEGAL-005 | Kontrolle der Rechtstexte unter `apps/web/src/content/legal/` – alle Pflichtabschnitte vorhanden, jede Betreiberangabe als fiktiver Übungswert erkennbar (Muster-Hinweis, „(fiktiv)“, Domain `.example`, Q-28), Version und Datum im Front Matter, Review protokolliert. |
| `AT-LEGAL-002` | automatisiert | REQ-LEGAL-002 | E2E-Test – Datenschutzerklärung ohne Anmeldung erreichbar, aus dem Registrierungsformular verlinkt, Abschnitte 1–12 und Version vorhanden. |
| `AT-LEGAL-002-2` | automatisiert | REQ-LEGAL-002 | E2E-Test – jede nach den Kernabläufen vorhandene Speicherung im Browser steht im Abschnitt „Cookies und lokale Speicherung“. |
| `AT-LEGAL-002-3` | automatisiert | REQ-LEGAL-002 | E2E-Test – bei neuer Fassung der Datenschutzerklärung erscheint für Mitglieder mit älterer Kenntnisnahme ein Hinweis mit Link; „Zur Kenntnis genommen“ per Tastatur speichert die Version im Konto, der Hinweis verschwindet. |
| `AT-LEGAL-003` | automatisiert | REQ-LEGAL-003 | E2E-Test – Nutzungsbedingungen und Community-Regeln ohne Anmeldung erreichbar, Version sichtbar, aus dem Registrierungsformular verlinkt. |
| `AT-LEGAL-003-2` | automatisiert | REQ-LEGAL-003 | Smoke- oder Unit-Test – Mitglied mit älterer Zustimmung muss erneut zustimmen; schreibende Anfrage vorher 403 `terms_required`; danach Version gespeichert. |
| `AT-LEGAL-004` | automatisiert | REQ-LEGAL-004 | E2E-Test – Erklärung von jeder Seite per Tastatur erreichbar, 5 Pflichtabschnitte und Kontaktmöglichkeit vorhanden. |
| `AT-LEGAL-005` | automatisiert | REQ-LEGAL-005 | E2E-Test – Kontaktseite ohne Anmeldung erreichbar, alle 7 Anliegen mit Weg sichtbar. |
| `AT-LEGAL-006` | automatisiert | REQ-LEGAL-006 | Smoke-Test – Entfernen einer gemeldeten Anzeige erzeugt für die Betroffene eine Mitteilung und eine E-Mail mit den Angaben 1–5, ohne Identität des Meldenden; bei „rechtswidriger Inhalt“ ohne Rechtsgrundlage 422 `legal_ground_required`, sonst erscheint die Rechtsgrundlage in Mitteilung und E-Mail. |
| `AT-LEGAL-006-2` | automatisiert | REQ-LEGAL-006 | Smoke-Test und Unit-Test – der Meldende erhält das Ergebnis mit Begründung und Rechtsbehelfen; Entscheidung ohne Regel, mit zu kurzer Begründung oder ohne Rechtsgrundlage ergibt 422. |
| `AT-LEGAL-007` | automatisiert | REQ-LEGAL-007 | Smoke-Test – Widerspruch aus der Mitteilung erzeugt einen Fall „Widerspruch“; zweiter Widerspruch 409. |
| `AT-LEGAL-007-2` | automatisiert | REQ-LEGAL-007 | Smoke-Test und Unit-Test – weder der ursprüngliche Entscheider noch Widersprechende, Betroffene oder Meldende können den Widerspruch entscheiden (403 `four_eyes`); Meldende entscheiden ihren Fall nicht (422). |
| `AT-LEGAL-007-3` | automatisiert | REQ-LEGAL-007 | Smoke-Test – Stattgeben stellt die Anzeige wieder her bzw. entsperrt das Konto (Anmeldung danach wieder möglich); beide Seiten erhalten eine Mitteilung; Audit-Log-Einträge vorhanden. |
| `AT-LEGAL-007-4` | automatisiert | REQ-LEGAL-007 | Smoke-Test – gesperrtes Konto widerspricht über den Link aus der E-Mail ohne Anmeldung; das Token steht nur im Fragment (`#token=`) und wird per POST übermittelt; unbekanntes Token 404, zweite Nutzung 410. Ein abgelaufenes Token (410 `token_expired`) ist nur per Unit-Test der Frist geprüft. |
| `AT-LEGAL-008` | automatisiert | REQ-LEGAL-008 | Smoke-Test – Entscheidung mit Kennzeichnung „Verdacht auf Straftat“ erzeugt Audit-Log-Eintrag und E-Mail an Administratoren; ohne Begründung 422; Mitteilung an Betroffene enthält die Kennzeichnung nicht. |
| `CTRL-DOC-DSA` | Kontrolle | REQ-LEGAL-008 | Kontrolle `docs/06-recht/dsa-prozesse.md` – Melde- und Abhilfeverfahren, Begründung, Widerspruch, Art. 18 und Kontaktstellen beschrieben, Zuständigkeiten als Platzhalter markiert. |
| `AT-LEGAL-009` | automatisiert | REQ-LEGAL-009 | Unit-Test – Schwellenfunktion mit den Grenzfällen der Tabelle. |
| `AT-LEGAL-009-2` | automatisiert | REQ-LEGAL-009 | Smoke-Test – Auswertung als JSON und CSV nur für Administratoren, Mitglied 403, Abruf im Audit-Log. |
| `CTRL-DOC-DAC7` | Kontrolle | REQ-LEGAL-009 | Kontrolle `docs/06-recht/dac7-konzept.md` – Zählregeln, Schwellen, fehlende Stammdaten und Meldeweg beschrieben. |
| `AT-LEGAL-010` | automatisiert | REQ-LEGAL-010 | E2E-Test – nach Gast- und Mitgliederabläufen enthalten Cookies, localStorage, sessionStorage, IndexedDB und Cache Storage nur Einträge der Allowlist; kein Cookie-Banner sichtbar. |
| `CTRL-DOC-VVT` | Kontrolle | REQ-LEGAL-011 | Kontrolle `docs/06-recht/vvt.md` – alle genannten Verarbeitungen mit allen Pflichtfeldern, Abgleich mit der Datenschutzerklärung. |
| `CTRL-DOC-TOM` | Kontrolle | REQ-LEGAL-011 | Kontrolle `docs/06-recht/toms.md` – Gliederung nach Art. 32, jede Maßnahme mit Anforderung und Nachweis. |
| `CTRL-DOC-AVV` | Kontrolle | REQ-LEGAL-012 | Kontrolle `docs/06-recht/auftragsverarbeitung.md` – Kategorien, Ort, Vertragsstatus und Checkliste vorhanden. |
| `CTRL-DOC-DATENPANNE` | Kontrolle | REQ-LEGAL-013 | Kontrolle `docs/06-recht/datenpannen-prozess.md` – Rollen, Fristen, Bewertung, Vorlagen vorhanden. |
| `MAN-LEGAL-013` | manuell | REQ-LEGAL-013 | Protokoll einer Tabletop-Übung – [MAN-LEGAL-013](../05-umsetzung/nachweise/MAN-LEGAL-013.md): fiktives Szenario, Bewertung nach 1 h 50 min, Meldung nach 28 h 50 min (Frist 72 h). Die Befunde T-1, T-3, T-4 und T-6 sind im Datenpannen-Prozess eingearbeitet. |
| `AT-LST-001` | automatisiert | REQ-LST-001 | Smoke-Test – Anzeige mit Bild anlegen, Status `aktiv`. |
| `MAN-LST-001` | manuell | REQ-LST-001 | Usability-Test mit 5 Studierenden, Median der Erstellzeit < 2 min – **noch nicht durchgeführt**. Vorbereitet: [Leitfaden](../05-umsetzung/nachweise/leitfaden-usability.md), [Protokollvorlage](../05-umsetzung/nachweise/protokollvorlage-usability.md) und ein [fiktives Beispielprotokoll](../05-umsetzung/nachweise/MAN-LST-001-fiktiv.md) (ausdrücklich **kein** Nachweis). |
| `AT-LST-002` | automatisiert | REQ-LST-002 | Unit-Test der Preisregel (Entscheidungstabelle oben). |
| `AT-LST-002-2` | automatisiert | REQ-LST-002 | Smoke-Test – Preis über 10.000 € wird mit 422 abgelehnt. |
| `AT-LST-003` | automatisiert | REQ-LST-003 | Smoke-Test – Upload, Verarbeitung, Auslieferung als Bild in allen Ansichten. |
| `AT-LST-003-2` | automatisiert | REQ-LST-003 | Unit- und Smoke-Test – Formaterkennung am Inhalt, Ablehnung mit 415. |
| `AT-LST-003-3` | automatisiert | REQ-LST-003 | Test mit GPS-EXIF-Foto, ausgelieferte Bilder ohne Metadaten (neu). |
| `AT-LST-004` | automatisiert | REQ-LST-004 | API-Test – Anlage ohne bzw. mit unbekanntem Übergabeort wird abgelehnt (neu). |
| `AT-LST-005` | automatisiert | REQ-LST-005 | API-Test – Attribute werden gespeichert und ausgeliefert, ungültige ISBN → 422 (neu). |
| `AT-LST-006` | automatisiert | REQ-LST-006 | Unit-Test des Zustandsautomaten (erlaubte und verbotene Übergänge). |
| `AT-LST-006-2` | automatisiert | REQ-LST-006 | API-Test – pausieren, reaktivieren, löschen, fremde Anzeige → 404 (neu). |
| `AT-LST-007` | automatisiert | REQ-LST-007 | Unit-Test der Übergänge reservieren, aufheben, abgeben. |
| `AT-LST-007-2` | automatisiert | REQ-LST-007 | Smoke-Test – Reservierung aus dem Chat setzt die Anzeige auf `reserviert`. |
| `AT-LST-008` | automatisiert | REQ-LST-008 | Szenario-Test mit vorgestellten Zeitstempeln – Erinnerung, Ablauf, Verlängerung, Löschung, Ablauf pausierter und Rückfall reservierter Anzeigen (neu). |
| `AT-LST-009` | automatisiert | REQ-LST-009 | API-/E2E-Test der Gast-Vorschau ohne Bild (neu). Noch nicht umgesetzt (⬜). |
| `AT-LST-010` | automatisiert | REQ-LST-010 | Unit-Test des Wortfilters (Entscheidungstabelle). |
| `AT-LST-010-2` | automatisiert | REQ-LST-010 | Smoke-Test – gefilterte Anzeige ist `in_review` und nicht suchbar. |
| `AT-LST-011` | automatisiert | REQ-LST-011 | API-Test – 31. Anzeige wird abgelehnt, auch bei gleichzeitigen Anfragen (neu). |
| `AT-LST-012` | automatisiert | REQ-LST-012 | Upload-Test mit HEIC-Beispielfoto inkl. Metadatenprüfung (neu). Noch nicht umgesetzt (⬜). |
| `CTRL-COVERAGE` | Kontrolle | REQ-MAINT-001 | Vitest-v8-Coverage mit Schwellen in `apps/server/vitest.config.ts`, Bericht als CI-Artefakt `coverage-server`. Messwerte (2026-10-26): Geschäftsregeln (`modules/*/domain.ts`) 100 % Zeilen (Schwelle 95 % Zeilen, 85 % Zweige, 95 % Funktionen); **Fachmodule insgesamt 15,9 %** (Schwelle 13 % = Messwert minus 2 Pp). **Lücke zu Kriterium (1) ≥ 80 % offen:** Die Services hängen an der Datenbank und werden nur über Smoke- und E2E-Tests ausgeführt, die nicht in die Messung eingehen. Lösungsweg: Server unter Smoke- und E2E-Tests mit `NODE_V8_COVERAGE` messen und mit der Unit-Coverage zusammenführen (Backlog B-64). |
| `CTRL-MUTATION` | Kontrolle | REQ-MAINT-001 | StrykerJS 10.0.0 auf die Geschäftsregeln (`stryker.config.mjs`), Workflow `mutation.yml` montags und auf Anforderung. Score **73,8 %** (Schwelle 60 %) – Kriterium (2) erfüllt; Ausreißer `platform/pseudonym.ts` 45,9 % (datenbanknahe Mutanten) und `listings/domain.ts` 59,3 %. |
| `AT-MOD-001` | automatisiert | REQ-MOD-001 | Smoke-Test – Mitglied meldet eine Anzeige über die API, der Fall erscheint in der Queue. |
| `AT-MOD-001-2` | automatisiert | REQ-MOD-001 | Smoke-Test – zweite Meldung desselben Mitglieds ergibt 409, Meldung eigener Inhalte 422. |
| `AT-MOD-002` | automatisiert | REQ-MOD-002 | Smoke-Test – Moderator sieht Seed-Meldung und Wortfilter-Fall und entscheidet „entfernen“ (bestehend: „Moderations-Queue …“, „Moderationsentscheidung“). |
| `AT-MOD-002-2` | automatisiert | REQ-MOD-002 | Smoke-Test – Mitglied erhält 403 auf die Queue (bestehend: „Mitglied hat keinen Zugriff auf Moderation“). |
| `AT-MOD-002-3` | automatisiert | REQ-MOD-002 | Smoke-Test – eine über die API erstellte Meldung ist innerhalb von 10 s in der Queue (neu). |
| `AT-MOD-003` | automatisiert | REQ-MOD-003 | Smoke-Test – nach der Entscheidung enthält das Audit-Log `moderation.remove` (bestehend: „Audit-Log protokolliert Entscheidung“) und Mailpit die Mitteilung an Betroffene. |
| `AT-MOD-003-2` | automatisiert | REQ-MOD-003 | Integrationstest – Änderung eines Eintrags in Entscheidungs- und Audit-Protokoll schlägt fehl. |
| `AT-MOD-004` | automatisiert | REQ-MOD-004 | Smoke-Test – drei Mitglieder melden eine Anzeige, sie verschwindet aus der Suche; die Betroffene erhält eine Mitteilung und eine E-Mail „vorläufig ausgeblendet, Prüfung läuft“ mit Hinweis auf die automatische Auslösung, ohne Namen der Meldenden. |
| `AT-MOD-005` | automatisiert | REQ-MOD-005 | Smoke-Test – nach Blockierung liefert das Senden 403 `contact_not_possible` und die Suche blendet die Anzeigen aus. |
| `AT-MOD-006` | automatisiert | REQ-MOD-006 | Smoke-Test – Bewertung nach abgeschlossenem Deal. Umsetzungsstand ⬜ (Could für R1). |
| `AT-MOD-007` | automatisiert | REQ-MOD-007 | Smoke-Test – Admin vergibt eine Rolle, das Audit-Log enthält `role.changed`. |
| `AT-MOD-007-2` | automatisiert | REQ-MOD-007 | Smoke-Test – Mitglied erhält 403 auf die Nutzerverwaltung. |
| `AT-MOD-008` | automatisiert | REQ-MOD-008 | Smoke-Test – Domain anlegen und deaktivieren. Umsetzungsstand ⬜ (Could für R1). |
| `AT-NOTI-001` | automatisiert | REQ-NOTI-001 | Smoke-Test – Verifikationsmail erscheint in Mailpit. |
| `AT-NOTI-001-2` | automatisiert | REQ-NOTI-001 | Integrationstest – je Mailart Auslöser ausführen und Eingang im Mail-Catcher prüfen (neu). |
| `AT-NOTI-002` | automatisiert | REQ-NOTI-002 | Szenario-Test mit verkürzter Wartezeit – Bündelung, Lesen vor Versand, kein Inhalt in der Mail (neu). |
| `AT-NOTI-003` | automatisiert | REQ-NOTI-003 | Szenario-Test – abbestellte Kategorie erzeugt keine Mail, Sicherheitsmail trotzdem (neu). |
| `MAN-NOTI-004` | manuell | REQ-NOTI-004 | Protokoll des mail-tester-Laufs und der Testzustellung – als Übung: [MAN-NOTI-004](../05-umsetzung/nachweise/MAN-NOTI-004.md). Header in Mailpit echt geprüft, DNS-Einträge syntaktisch gültig, mail-tester-Werte fiktiv (Q-28). Befunde behoben: Absender `no-reply@campusmarkt.example` (`MAIL_FROM`) passt zu den Beispiel-DNS-Einträgen, `Reply-To` ist die Kontaktstelle (`MAIL_REPLY_TO`). |
| `AT-NOTI-005` | automatisiert | REQ-NOTI-005 | Resilienztest QS-3 mit gestopptem Mail-Catcher (neu). |
| `CTRL-DLQ` | Kontrolle | REQ-NOTI-005 | Admin-Ansicht „Jobs/Dead Letters“ zeigt endgültig fehlgeschlagene Zustellungen – geprüft mit `tests/ops/dlq-test.mjs` (Mailpit gestoppt, Passwort-Reset angefordert, nach 302 s steht der Job mit Vorlage `password_reset` in der Ansicht, die App bleibt erreichbar); Protokoll [CTRL-DLQ](../05-umsetzung/nachweise/CTRL-DLQ.md). Läuft wegen der Dauer wöchentlich im Workflow `ops-weekly.yml`, nicht bei jedem Push. |
| `AT-NOTI-006` | automatisiert | REQ-NOTI-006 | E2E-Test mit simuliertem Push-Dienst (neu). Noch nicht umgesetzt (⬜); offline nur eingeschränkt vorführbar. |
| `AT-NOTI-007` | automatisiert | REQ-NOTI-007 | Konfigurationstest – App mit alternativem SMTP-Ziel starten, Mail kommt dort an (neu). |
| `AT-OPS-001` | automatisiert | REQ-OPS-001 | Smoke-Test „Readiness /health/ready“ (bestehend). |
| `AT-OPS-001-2` | automatisiert | REQ-OPS-001 | Resilienztest – Stopp unter Last ohne abgebrochene Anfragen (neu zu schreiben). |
| `AT-OPS-001-3` | automatisiert | REQ-OPS-001 | Ops-Test `tests/ops/db-outage-test.mjs` – Datenbank-Container gestoppt: Bereitschaft meldet „nicht bereit“ (503), Lebendigkeit bleibt „ok“, der App-Prozess läuft ohne Neustart weiter, Status-API meldet die Datenbank als gestört, Rechts- und Statusseite laden; nach dem Datenbankstart innerhalb von 60 s wieder bereit. Läuft in CI im Job `compose`. Hintergrund: Befund B-1 aus der Störungsübung [MAN-OPS-011](../05-umsetzung/nachweise/MAN-OPS-011.md); behoben durch Error-Handler an allen Pools, Ping-Timeout 2 s und Rückgriff auf den zuletzt bekannten Wartungszustand bei Lesefehlern. |
| `AT-OPS-002` | automatisiert | REQ-OPS-002 | Smoke-Test `/metrics` (bestehend) plus Unit-Test des Request-Logs (`apps/server/src/platform/http/server.test.ts`): Eintrag enthält Methode, Route ohne Query, Status, Dauer und Request-ID, aber keine IP-Adresse, keinen Port und keine Query-Werte wie `token=`. |
| `MAN-OPS-002` | manuell | REQ-OPS-002 | Review der Protokollfelder – Protokoll [MAN-OPS-002](../05-umsetzung/nachweise/MAN-OPS-002.md): Normalbetrieb ohne Personenbezug, Korrelations-ID in allen Einträgen; die Lücken P-1 (Request-ID aus dem Client) und P-2 (Rohpfad unbekannter Routen) sind behoben (Request-ID nur als UUID, unbekannte Pfade als `unmatched`). Sicherheitsereignisse (`auth.login`, `auth.login_failed`, `auth.login_throttled`, `access_denied`) tragen nur Pseudonyme. |
| `MAN-OPS-003` | manuell | REQ-OPS-003 | Protokoll des Onboarding-Tests – [MAN-OPS-003](../05-umsetzung/nachweise/MAN-OPS-003.md) (simuliert: frischer Clone, nur README-Schritte, 1 min 16 s bis zur Anmeldung mit vorhandenem Build-Cache). |
| `CTRL-CI-IMAGE` | Kontrolle | REQ-OPS-004 | CI-Job `compose` baut das Image aus sauberem Checkout, taggt es mit der Version aus `package.json` (`campusmarkt:<version>`) und legt das `docker save`-Archiv `campusmarkt-<version>.tar.gz` für 7 Tage als Artefakt ab (umgesetzt 2026-10-24). |
| `AT-OPS-005` | automatisiert | REQ-OPS-005 | Neustart-Test – zweiter Start meldet keine neue Migration und wird gesund (Grundlage: Frischstart-Zyklen; als Skript neu zu schreiben). |
| `AT-OPS-006` | automatisiert | REQ-OPS-006 | Smoke-Test – mit `MAINTENANCE_MODE=true` liefern Seiten und API 503 mit `Retry-After`, Health, Status und Rechtsseiten nicht. |
| `AT-OPS-006-2` | automatisiert | REQ-OPS-006 | Smoke-Test – Administrator setzt und entfernt eine Ankündigung (Mitglied 403), die Ankündigung ist öffentlich abrufbar, Audit-Log-Eintrag. |
| `AT-OPS-007` | automatisiert | REQ-OPS-007 | Smoke-Test – `/status` (Seite) und die zugehörige API sind ohne Anmeldung erreichbar, zeigen je Dienst „in Betrieb“ bzw. „gestört“ mit Zeitpunkt und enthalten keine Versionen, Hostnamen oder Fehlertexte. |
| `CTRL-ALERT-RULES` | Kontrolle | REQ-OPS-008 | CI-Kontrolle (Job `ops-config`) – `promtool check config`, `promtool test rules`, `amtool check-config`; jede Regel mit Annotation `runbook_url`. |
| `MAN-OPS-008` | manuell | REQ-OPS-008 | Protokoll der Alarmübung (App gestoppt → Mail in Mailpit ≤ 5 min) – [MAN-OPS-008](../05-umsetzung/nachweise/MAN-OPS-008.md): AppDown-Mail nach 196 s, Entwarnung nach 295 s (bis zu 5 min Verzögerung durch `group_interval`). Alarm-Links zeigen dank `--web.external-url` auf die lokal erreichbaren Adressen. |
| `AT-OPS-009` | automatisiert | REQ-OPS-009 | `tests/ops/proxy-test.mjs` gegen das Profil `proxy` (CI-Job `compose`) – Zertifikat der lokalen CA, Umleitung 308 von HTTP, HSTS-Header `max-age=31536000`, `/metrics` am Proxy 404, Anmeldung über HTTPS mit `Secure`-Cookie. Adresse im Beispiel: `https://campusmarkt.localhost:8443` (eigener Hostname, ADR-0017). |
| `AT-OPS-010` | automatisiert | REQ-OPS-010 | Smoke-Test – Benachrichtigungs-Mail in Mailpit trägt beide Header; Bestätigungsmail nicht. |
| `CTRL-DOC-MAIL` | Kontrolle | REQ-OPS-010 | Kontrolle `docs/07-betrieb/mail-zustellbarkeit.md` – SPF-, DKIM-, DMARC-Beispiele und Bounce-Ablauf vorhanden. |
| `CTRL-DOC-BETRIEB` | Kontrolle | REQ-OPS-011, REQ-SEC-012 | Kontrolle `docs/07-betrieb/` – Betriebshandbuch, Störungsprozess und Prozess für Sicherheitsmeldungen vorhanden. |
| `MAN-OPS-011` | manuell | REQ-OPS-011 | Protokoll einer Störungsübung (z. B. Datenbank gestoppt) nach dem Handbuch – [MAN-OPS-011](../05-umsetzung/nachweise/MAN-OPS-011.md): Störung nach 3 min 32 s behoben. Der Code-Befund B-1 (App-Absturz bei Datenbankausfall) ist behoben und durch AT-OPS-001-3 abgesichert; die Handbuch-Befunde H-1 bis H-4 sind im Betriebshandbuch und im Störungsprozess eingearbeitet (Schweregrade S1–S4 mit Reaktionszeiten, Runbook „Datenbank nicht erreichbar“, Ausweichkanal). |
| `CTRL-RENOVATE` | Kontrolle | REQ-OPS-012 | CI-Kontrolle – `renovate-config-validator` prüft `renovate.json`. |
| `AT-PERF-001` | automatisiert | REQ-PERF-001 | k6-Lasttest `tests/load/search.js` (geplant, siehe Umsetzungsstand). |
| `AT-PERF-002` | automatisiert | REQ-PERF-002 | k6-Lasttest Chat (neu zu schreiben; Umsetzungsstand ⬜ – nicht gemessen). |
| `AT-PERF-003` | automatisiert | REQ-PERF-003 | k6-Lasttest „Anzeige erstellen“ (neu zu schreiben; Umsetzungsstand ⬜). |
| `AT-PERF-004` | automatisiert | REQ-PERF-004 | k6-Lasttest Registrierung mit Mailpit-Abgleich (neu zu schreiben; Umsetzungsstand ⬜). |
| `AT-PERF-005` | automatisiert | REQ-PERF-005 | Lighthouse-CI-Lauf (neu zu schreiben; Umsetzungsstand ⬜). |
| `MAN-PORT-001` | manuell | REQ-PORT-001 | Protokoll des Onboarding-Tests – [MAN-PORT-001](../05-umsetzung/nachweise/MAN-PORT-001.md) (simuliert, 3 min 25 s). Die Befunde (feste Ports in `compose.dev.yaml`, Dev-Proxy ohne `.env`) sind behoben: Ports nur an 127.0.0.1 und per `DEV_DB_PORT`, `DEV_SMTP_PORT`, `DEV_MAILPIT_PORT` änderbar; Vite liest `VITE_API_TARGET` bzw. den `PORT` des Servers aus `.env`. |
| `CTRL-CI-MULTIARCH` | Kontrolle | REQ-PORT-002 | CI-Job `multiarch` (QEMU + Buildx) baut `linux/amd64` und `linux/arm64`, startet das arm64-Image unter Emulation bis „healthy“ und lädt beide Image-Archive hoch; der Smoke-Test läuft gegen amd64 im Job `compose`. Lokal geprüft: arm64 nativ „healthy“, amd64 per Emulation in 347 s gebaut. |
| `AT-PRIV-001` | automatisiert | REQ-PRIV-001 | (neu) Registrierung mit veralteter Version liefert 422 `terms_outdated`; Export enthält die Einwilligung mit Version und Zeitstempel. |
| `AT-PRIV-001-2` | automatisiert | REQ-PRIV-001 | nach Wechsel der aktuellen Version verlangt die Anmeldung eines bestehenden Mitglieds die erneute Zustimmung – wird durch den Smoke-Test zu `AT-LEGAL-003-2` und den E2E-Test zum Zustimmungsdialog belegt (REQ-LEGAL-003); ein eigener Test mit dieser ID entfällt. |
| `AT-PRIV-002` | automatisiert | REQ-PRIV-002 | Smoke-Test, (neu) erweitert – Antworten zu Anzeige, Konversation, Suche und Moderationsfall enthalten keine fremde E-Mail-Adresse; nach beidseitiger Freigabe nur das Gegenüber. |
| `AT-PRIV-002-2` | automatisiert | REQ-PRIV-002 | (neu) Daten zum Missbrauchsschutz älter als 7 Tage werden vom täglichen Löschjob entfernt. |
| `AT-PRIV-003` | automatisiert | REQ-PRIV-003 | (neu) Szenario-Test mit vorgestellter Zeit für Anzeigen (abgegeben 30 Tage, abgelaufen 90 Tage, pausiert 90 Tage, reserviert 30 Tage) und Konten (unbestätigt 7 Tage, Löschantrag 14 Tage). |
| `AT-PRIV-003-2` | automatisiert | REQ-PRIV-003 | Ops-Test `tests/ops/retention-test.mjs` – Datensätze werden per psql zurückdatiert, danach löst die Administration den Löschlauf aus (`POST /admin/demo/run-due-jobs`); geprüft werden Chats (12 Monate nach der letzten Nachricht), Meldungen und Entscheidungen (12 Monate nach Abschluss), Audit-Log (24 Monate), benutzte bzw. abgelaufene Links (7 Tage) und von der Moderation entfernte Anzeigen (12 Monate); jüngere Einträge bleiben. Läuft in CI im Job `compose`. |
| `AT-PRIV-003-3` | automatisiert | REQ-PRIV-003 | derselbe Ops-Test – Kontolöschung entfernt nur die eigenen Nachrichtentexte (Systemcode `message_deleted`), die Konversation bleibt für das Gegenüber mit „Ehemaliges Mitglied“. |
| `AT-PRIV-004` | automatisiert | REQ-PRIV-004 | neu zu schreiben – Meldung einer Nachricht in einer langen Konversation; Moderationsfall enthält höchstens 11 Nachrichten; Audit-Log enthält den Zugriff. |
| `MAN-PRIV-005` | manuell | REQ-PRIV-005 | Verzeichnis der Auftragsverarbeiter mit AV-Verträgen. |
| `AT-PRIV-006` | automatisiert | REQ-PRIV-006 | neu zu schreiben – Browser-Test protokolliert alle Netzwerkanfragen über Anmelden, Suchen, Anzeige, Chat; keine fremde Domain, nur ein Cookie. |
| `AT-PRIV-006-2` | automatisiert | REQ-PRIV-006 | neu zu schreiben – Smoke-Test prüft, dass die Content-Security-Policy nur den eigenen Ursprung erlaubt. |
| `CTRL-DOC-DSFA` | Kontrolle | REQ-PRIV-007 | Kontrolle `docs/06-recht/dsfa-schwellwertanalyse.md` – alle Kriterien bewertet, Ergebnis begründet. |
| `MAN-PRIV-007` | manuell | REQ-PRIV-007 | Übungs-DSFA `docs/06-recht/dsfa.md` mit fiktiver Stellungnahme der DSB und fiktiver Entscheidung liegt vor; alle Pflichtinhalte nach Art. 35 Abs. 7 und die sieben Mindestszenarien sind bewertet (Q-28). |
| `AT-PRIV-008` | automatisiert | REQ-PRIV-008 | Smoke-Test – `robots.txt` mit `Disallow: /`, Header `X-Robots-Tag` auf Start- und Rechtsseiten. |
| `MAN-SEC-001` | manuell | REQ-SEC-001 | ASVS-L2-Checkliste mit Nachweis je Kontrolle und ZAP-Bericht – [MAN-SEC-001](../05-umsetzung/nachweise/MAN-SEC-001.md), ZAP-Zusammenfassungen in `zap/` (Baseline 0 FAIL / 63 PASS, angemeldeter API-Scan 0 FAIL / 114 PASS). |
| `AT-SEC-002` | automatisiert | REQ-SEC-002 | neu zu schreiben – Test prüft Algorithmus und Parameter eines frisch erzeugten Hashes. |
| `AT-SEC-003` | automatisiert | REQ-SEC-003 | Unit-Test der Tabelle (Grundlage: `apps/server/src/modules/identity/domain.test.ts`, „Passwortrichtlinie“). |
| `AT-SEC-004` | automatisiert | REQ-SEC-004 | Smoke-Test – zustandsändernde Anfrage ohne Schutzmerkmal liefert 403 `csrf`. |
| `AT-SEC-004-2` | automatisiert | REQ-SEC-004 | (neu) Freigabe der Sitzungskennung nach dem Login prüfen: für Skripte unlesbar, nur sichere Verbindungen, nur gleiche Website. |
| `AT-SEC-004-3` | automatisiert | REQ-SEC-004 | (neu) Sitzung ist nach Abmelden und nach Passwort-Reset ungültig. |
| `AT-SEC-005` | automatisiert | REQ-SEC-005 | (neu) 5 falsche Passwörter, die 6. Anmeldung desselben Paars liefert 429 mit `Retry-After`. |
| `AT-SEC-005-2` | automatisiert | REQ-SEC-005 | (neu) 4. Registrierung derselben Adresse innerhalb einer Stunde liefert 429. |
| `AT-SEC-005-3` | automatisiert | REQ-SEC-005 | (neu) Registrierungen verschiedener Adressen von derselben IP: die 30. wird angenommen, die 31. liefert 429. |
| `AT-SEC-006` | automatisiert | REQ-SEC-006 | Smoke-Test – fremde Konversation 404, Mitglied auf Moderation 403, Interessent auf Deal 403. |
| `AT-SEC-006-2` | automatisiert | REQ-SEC-006 | neu zu schreiben – vollständige Autorisierungsmatrix (alle Zeilen) als Integrationstest. |
| `AT-SEC-007` | automatisiert | REQ-SEC-007 | Smoke-Test – Upload ohne gültige Bildsignatur liefert 415. |
| `AT-SEC-007-2` | automatisiert | REQ-SEC-007 | Smoke-Test – Bildabruf ohne Sitzung liefert 401. |
| `AT-SEC-007-3` | automatisiert | REQ-SEC-007 | Unit-Test der Formaterkennung am Inhalt (Grundlage: `listings/domain.test.ts`, „Magic Bytes“). |
| `AT-SEC-007-4` | automatisiert | REQ-SEC-007 | (neu) JPEG mit GPS-EXIF hochladen, ausgeliefertes Bild enthält keine EXIF-Daten. |
| `CTRL-CI-SCAN` | Kontrolle | REQ-SEC-008 | Pipeline-Lauf mit den vier Prüfungen und SBOM-Artefakt – CI-Job `security-scans`: SAST mit Semgrep (Regelsätze JavaScript, TypeScript, OWASP Top Ten, SARIF-Bericht), SCA mit `pnpm audit --audit-level high`, Secret-Scan mit gitleaks über die gesamte Historie, Image-Scan mit Trivy (HIGH/CRITICAL brechen den Lauf ab), SBOM im CycloneDX-Format als Artefakt `security-reports`. |
| `MAN-SEC-009` | manuell | REQ-SEC-009 | Threat-Model-Dokument mit Review-Vermerk – [Threat Model](../03-architektur/threat-model.md): STRIDE über 7 Abläufe mit Datenflussdiagramm und Vertrauensgrenzen; 39 Bedrohungen, davon 32 umgesetzt und getestet, 7 begründet akzeptiert, 0 offen; Review-Vermerk (fiktiv: security-lead, architecture-lead). |
| `CTRL-IMAGE-INSPECT` | Kontrolle | REQ-SEC-010 | Prüfung von Benutzer und Umgebung des Images sowie Start mit `read_only: true` (Compose) bis zum Status „healthy“. |
| `AT-SEC-011` | automatisiert | REQ-SEC-011 | (neu) Registrierung ohne Bestätigung: Anmeldung liefert `not_verified`; Anzeige anlegen, Bild hochladen und Anzeige bearbeiten ohne Sitzung liefern 401. |
| `AT-SEC-011-2` | automatisiert | REQ-SEC-011 | (neu) nach Sperre durch die Moderation liefern Anzeige anlegen, Bild hochladen und Bearbeiten mit der alten Sitzung 401. |
| `AT-SEC-011-3` | automatisiert | REQ-SEC-011 | (neu) nach beantragter Kontolöschung liefert Anzeige anlegen mit der alten Sitzung 401. |
| `AT-SEC-012` | automatisiert | REQ-SEC-012 | Smoke-Test – `/.well-known/security.txt` liefert 200, `text/plain`, alle Pflichtfelder, `Expires` in der Zukunft. |
| `CTRL-DOC-PENTEST` | Kontrolle | REQ-SEC-013 | Kontrolle `docs/07-betrieb/pentest-plan.md` – Umfang, Methode, Befundbehandlung vorhanden. |
| `MAN-SEC-013` | manuell | REQ-SEC-013 | Abschlussbericht des Penetrationstests – als Übungs-Pentest durchgeführt (kein externer Tester): [MAN-SEC-013](../05-umsetzung/nachweise/MAN-SEC-013.md), Rohdaten `pentest-results.json`, ZAP-Zusammenfassungen in `zap/`. 49 gezielte Prüfungen, 47 bestanden, 2 akzeptierte Demo-Befunde (PT-F-17 API-Doku im Demo-Modus, PT-F-18 `/metrics` am lokalen Port); kein kritischer oder hoher Befund. Behoben: PT-F-01, 02, 03, 13, 14, 15, 16. Offen als Backlog: PT-F-04 bis PT-F-12 (B-59 bis B-63). |
| `AT-SRCH-001` | automatisiert | REQ-SRCH-001 | Smoke-Test – Suche mit Tippfehler findet die Anzeige. |
| `AT-SRCH-001-2` | automatisiert | REQ-SRCH-001 | Smoke-Test – Suche mit abweichender Wortform findet Anzeigen. |
| `AT-SRCH-002` | automatisiert | REQ-SRCH-002 | API-Test – Filterkombinationen und Sortierungen gegen Seed-Daten (neu). |
| `AT-SRCH-003` | automatisiert | REQ-SRCH-003 | Smoke-Test – neu angelegte Anzeige wird unmittelbar gefunden. |
| `AT-SRCH-003-2` | automatisiert | REQ-SRCH-003 | Smoke-Test – pausierte Anzeige wird ≤ 10 s danach nicht mehr gefunden (neu). |
| `AT-SRCH-004` | automatisiert | REQ-SRCH-004 | API-Test – merken, Liste, entfernen, eigene Anzeige abgelehnt (neu). |
| `AT-SRCH-005` | automatisiert | REQ-SRCH-005 | Szenario-Test des täglichen Digests (neu). Noch nicht umgesetzt (⬜). |
| `AT-SRCH-006` | automatisiert | REQ-SRCH-006 | API-Test – Blockierung in beide Richtungen und Sperre blenden Anzeigen aus (neu). |
| `AT-UX-001` | automatisiert | REQ-UX-001 | E2E-Test – kein horizontales Scrollen bei 360 px auf allen Routen (Grundlage: bisheriger Browser-Durchlauf, als Test im Repo neu zu schreiben). |
| `AT-UX-001-2` | automatisiert | REQ-UX-001 | E2E-Test – Manifest und Service Worker sind vorhanden und registriert. |
| `MAN-UX-002` | manuell | REQ-UX-002 | Code-Review-Protokoll zur Auslagerung der Texte – [MAN-UX-002](../05-umsetzung/nachweise/MAN-UX-002.md). Chat-Systemnachrichten werden als Code mit Parametern gespeichert (`system_code`, `system_params`) und im Client übersetzt; Altdaten werden weiter am Text erkannt. |
| `AT-UX-003` | automatisiert | REQ-UX-003 | Smoke- oder E2E-Test – unbekannte Seite ergibt 404 mit Seite „Seite nicht gefunden“ und Links; unbekannter API-Pfad ergibt JSON-404. |
| `AT-UX-003-2` | automatisiert | REQ-UX-003 | Unit-Test – Fehlerbehandler liefert bei unerwartetem Fehler 500 mit Request-ID ohne Stacktrace. |
| `AT-UX-004` | automatisiert | REQ-UX-004 | E2E-Test – Gast sieht die Startseite mit Zugangsregel, drei Schritten, Registrieren und Anmelden; angemeldetes Mitglied wird zur Suche weitergeleitet; axe-core ohne Verstöße `serious`/`critical`. |
| `AT-UX-005` | automatisiert | REQ-UX-005 | E2E-Test – Hilfeseite ohne Anmeldung erreichbar, alle Themen als Überschrift vorhanden, Link aus dem Chat-Sicherheitshinweis führt zum Abschnitt „Betrugsmaschen“. |
| `AT-UX-006` | automatisiert | REQ-UX-006 | E2E-Test – alle öffentlichen und internen Routen sowie die 404-Seite enthalten die sechs Links im Seitenfuß. |
| `AT-UX-006-2` | automatisiert | REQ-UX-006 | Unit-Test – jede E-Mail-Vorlage enthält Absender, Impressum- und Datenschutz-Link. |
| `AT-UX-007` | automatisiert | REQ-UX-007 | E2E-Test – Sprachwechsel auf Englisch ändert Texte und `lang`, Wahl bleibt nach Neuladen erhalten. |
| `AT-UX-007-2` | automatisiert | REQ-UX-007 | Unit-Test – Schlüsselmengen Deutsch und Englisch sind gleich. |
| `AT-UX-007-3` | automatisiert | REQ-UX-007 | E2E-Test – englische Rechtstexte zeigen den Hinweis auf die verbindliche deutsche Fassung. |
