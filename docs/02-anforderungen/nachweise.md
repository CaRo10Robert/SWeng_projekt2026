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
| `MAN-A11Y-001` | manuell | REQ-A11Y-001 | Manuelle WCAG-Prüfung mit Screenreader, Protokoll im Review-Ordner. |
| `AT-A11Y-002` | automatisiert | REQ-A11Y-002 | E2E-Test – neun Kernabläufe ausschließlich per Tastatur (neu). |
| `AT-A11Y-002-2` | automatisiert | REQ-A11Y-002 | E2E-Test – axe-core auf Registrierungs-, Anmelde-, Passwort-, Such-, Formular-, Detail-, Meine-Anzeigen- und Chatseite, 0 `serious`/`critical` (neu). |
| `MAN-A11Y-002` | manuell | REQ-A11Y-002 | Manuelle Tastatur- und Screenreader-Prüfung inklusive Dateiauswahl im Systemdialog, Protokoll im Review-Ordner (neu). |
| `AT-ACC-001` | automatisiert | REQ-ACC-001 | Smoke-Test – Anzeigename, Studiengang und Übergabeorte ändern und Änderung im eigenen Profil prüfen (neu). |
| `AT-ACC-002` | automatisiert | REQ-ACC-002 | Smoke-Test – Löschung beantragen, Anmeldung bricht ab. |
| `AT-ACC-002-2` | automatisiert | REQ-ACC-002 | Integrationstest – Löschlauf nach Ablauf der Karenz entfernt alle personenbezogenen Daten und anonymisiert fremde Konversationen. |
| `AT-ACC-003` | automatisiert | REQ-ACC-003 | Smoke-Test „Datenexport (Art. 15/20)“ (bestehend). |
| `AT-ACC-004` | automatisiert | REQ-ACC-004 | Smoke-Test – Profilbild hochladen, Metadaten entfernt, Bild für andere Mitglieder sichtbar, Entfernen setzt Platzhalter (neu). |
| `CTRL-DEPCRUISE` | Kontrolle | REQ-ARCH-001, REQ-ARCH-006, REQ-AUTH-009, REQ-MAINT-002 | Modulgrenzen ohne Verstöße. |
| `MAN-ARCH-001` | manuell | REQ-ARCH-001 | Architektur-Review-Protokoll (QS-5). |
| `MAN-ARCH-002` | manuell | REQ-ARCH-002 | Review-Protokoll im Spike PAY-02 (rechtliche Prüfung). Gilt ab EPIC-09; im MVP wird kein Geld verarbeitet. |
| `AT-ARCH-003` | automatisiert | REQ-ARCH-003 | Integrationstest – Domain in der Datenbank ergänzen, Registrierung mit dieser Domain gelingt (neu zu schreiben). |
| `MAN-ARCH-004` | manuell | REQ-ARCH-004 | Schema-Review der Migrationen. |
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
| `MAN-AVAIL-002` | manuell | REQ-AVAIL-002 | Protokoll der Restore-Übung (erst im Echtbetrieb). |
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
| `AT-CHAT-011` | automatisiert | REQ-CHAT-011 | Smoke-Test – der Anbieter reserviert aus der Konversation, Deal ist „vereinbart“, Anzeige „reserviert“. |
| `AT-CHAT-011-2` | automatisiert | REQ-CHAT-011 | Smoke-Test – der Interessent darf den Deal nicht steuern. |
| `AT-DEMO-001` | automatisiert | REQ-DEMO-001 | Smoke-Test – Login mit Demo-Konto, Suche liefert Anzeigen, Queue ≥ 2 Fälle (bestehend: „Moderations-Queue enthält Seed-Meldung und Wortfilter-Fall“). |
| `AT-DEMO-002` | automatisiert | REQ-DEMO-002 | Smoke-Test – Auslösen liefert 202 und erzeugt die Erinnerungsmail in Mailpit (neu zu schreiben). |
| `AT-LST-001` | automatisiert | REQ-LST-001 | Smoke-Test – Anzeige mit Bild anlegen, Status `aktiv`. |
| `MAN-LST-001` | manuell | REQ-LST-001 | Usability-Test mit 5 Studierenden, Median der Erstellzeit < 2 min (noch nicht durchgeführt). |
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
| `CTRL-COVERAGE` | Kontrolle | REQ-MAINT-001 | Coverage-Schwelle in der Testkonfiguration (neu einzurichten). |
| `CTRL-MUTATION` | Kontrolle | REQ-MAINT-001 | Mutationstestlauf (neu einzurichten). |
| `AT-MOD-001` | automatisiert | REQ-MOD-001 | Smoke-Test – Mitglied meldet eine Anzeige über die API, der Fall erscheint in der Queue. |
| `AT-MOD-001-2` | automatisiert | REQ-MOD-001 | Smoke-Test – zweite Meldung desselben Mitglieds ergibt 409, Meldung eigener Inhalte 422. |
| `AT-MOD-002` | automatisiert | REQ-MOD-002 | Smoke-Test – Moderator sieht Seed-Meldung und Wortfilter-Fall und entscheidet „entfernen“ (bestehend: „Moderations-Queue …“, „Moderationsentscheidung“). |
| `AT-MOD-002-2` | automatisiert | REQ-MOD-002 | Smoke-Test – Mitglied erhält 403 auf die Queue (bestehend: „Mitglied hat keinen Zugriff auf Moderation“). |
| `AT-MOD-002-3` | automatisiert | REQ-MOD-002 | Smoke-Test – eine über die API erstellte Meldung ist innerhalb von 10 s in der Queue (neu). |
| `AT-MOD-003` | automatisiert | REQ-MOD-003 | Smoke-Test – nach der Entscheidung enthält das Audit-Log `moderation.remove` (bestehend: „Audit-Log protokolliert Entscheidung“) und Mailpit die Mitteilung an Betroffene. |
| `AT-MOD-003-2` | automatisiert | REQ-MOD-003 | Integrationstest – Änderung eines Eintrags in Entscheidungs- und Audit-Protokoll schlägt fehl. |
| `AT-MOD-004` | automatisiert | REQ-MOD-004 | Smoke-Test – drei Mitglieder melden eine Anzeige, sie verschwindet aus der Suche. |
| `AT-MOD-005` | automatisiert | REQ-MOD-005 | Smoke-Test – nach Blockierung liefert das Senden 403 `contact_not_possible` und die Suche blendet die Anzeigen aus. |
| `AT-MOD-006` | automatisiert | REQ-MOD-006 | Smoke-Test – Bewertung nach abgeschlossenem Deal. Umsetzungsstand ⬜ (Could für R1). |
| `AT-MOD-007` | automatisiert | REQ-MOD-007 | Smoke-Test – Admin vergibt eine Rolle, das Audit-Log enthält `role.changed`. |
| `AT-MOD-007-2` | automatisiert | REQ-MOD-007 | Smoke-Test – Mitglied erhält 403 auf die Nutzerverwaltung. |
| `AT-MOD-008` | automatisiert | REQ-MOD-008 | Smoke-Test – Domain anlegen und deaktivieren. Umsetzungsstand ⬜ (Could für R1). |
| `AT-NOTI-001` | automatisiert | REQ-NOTI-001 | Smoke-Test – Verifikationsmail erscheint in Mailpit. |
| `AT-NOTI-001-2` | automatisiert | REQ-NOTI-001 | Integrationstest – je Mailart Auslöser ausführen und Eingang im Mail-Catcher prüfen (neu). |
| `AT-NOTI-002` | automatisiert | REQ-NOTI-002 | Szenario-Test mit verkürzter Wartezeit – Bündelung, Lesen vor Versand, kein Inhalt in der Mail (neu). |
| `AT-NOTI-003` | automatisiert | REQ-NOTI-003 | Szenario-Test – abbestellte Kategorie erzeugt keine Mail, Sicherheitsmail trotzdem (neu). |
| `MAN-NOTI-004` | manuell | REQ-NOTI-004 | Protokoll des mail-tester-Laufs und der Testzustellung (erst im Echtbetrieb). |
| `AT-NOTI-005` | automatisiert | REQ-NOTI-005 | Resilienztest QS-3 mit gestopptem Mail-Catcher (neu). |
| `CTRL-DLQ` | Kontrolle | REQ-NOTI-005 | Admin-Ansicht „Jobs/Dead Letters“ zeigt endgültig fehlgeschlagene Zustellungen. |
| `AT-NOTI-006` | automatisiert | REQ-NOTI-006 | E2E-Test mit simuliertem Push-Dienst (neu). Noch nicht umgesetzt (⬜); offline nur eingeschränkt vorführbar. |
| `AT-NOTI-007` | automatisiert | REQ-NOTI-007 | Konfigurationstest – App mit alternativem SMTP-Ziel starten, Mail kommt dort an (neu). |
| `AT-OPS-001` | automatisiert | REQ-OPS-001 | Smoke-Test „Readiness /health/ready“ (bestehend). |
| `AT-OPS-001-2` | automatisiert | REQ-OPS-001 | Resilienztest – Stopp unter Last ohne abgebrochene Anfragen (neu zu schreiben). |
| `AT-OPS-002` | automatisiert | REQ-OPS-002 | Smoke-Test `/metrics` (bestehend) plus Protokollsuche nach personenbezogenen Daten (Protokollsuche neu). |
| `MAN-OPS-002` | manuell | REQ-OPS-002 | Review der Protokollfelder. |
| `MAN-OPS-003` | manuell | REQ-OPS-003 | Protokoll des Onboarding-Tests. |
| `CTRL-CI-IMAGE` | Kontrolle | REQ-OPS-004 | CI-Job baut das Image aus sauberem Checkout, taggt es nach SemVer und legt das `docker save`-Archiv als Artefakt ab (neu; Umsetzungsstand ⬜). |
| `AT-OPS-005` | automatisiert | REQ-OPS-005 | Neustart-Test – zweiter Start meldet keine neue Migration und wird gesund (Grundlage: Frischstart-Zyklen; als Skript neu zu schreiben). |
| `AT-PERF-001` | automatisiert | REQ-PERF-001 | k6-Lasttest `tests/load/search.js` (geplant, siehe Umsetzungsstand). |
| `AT-PERF-002` | automatisiert | REQ-PERF-002 | k6-Lasttest Chat (neu zu schreiben; Umsetzungsstand ⬜ – nicht gemessen). |
| `AT-PERF-003` | automatisiert | REQ-PERF-003 | k6-Lasttest „Anzeige erstellen“ (neu zu schreiben; Umsetzungsstand ⬜). |
| `AT-PERF-004` | automatisiert | REQ-PERF-004 | k6-Lasttest Registrierung mit Mailpit-Abgleich (neu zu schreiben; Umsetzungsstand ⬜). |
| `AT-PERF-005` | automatisiert | REQ-PERF-005 | Lighthouse-CI-Lauf (neu zu schreiben; Umsetzungsstand ⬜). |
| `MAN-PORT-001` | manuell | REQ-PORT-001 | Protokoll des Onboarding-Tests. |
| `CTRL-CI-MULTIARCH` | Kontrolle | REQ-PORT-002 | Multi-Arch-Build mit Smoke-Test in der CI (neu einzurichten; Umsetzungsstand ⬜). |
| `AT-PRIV-001` | automatisiert | REQ-PRIV-001 | (neu) Registrierung mit veralteter Version liefert 422 `terms_outdated`; Export enthält die Einwilligung mit Version und Zeitstempel. |
| `AT-PRIV-001-2` | automatisiert | REQ-PRIV-001 | (neu) nach Wechsel der aktuellen Version verlangt die Anmeldung eines bestehenden Mitglieds die erneute Zustimmung. |
| `AT-PRIV-002` | automatisiert | REQ-PRIV-002 | Smoke-Test, (neu) erweitert – Antworten zu Anzeige, Konversation, Suche und Moderationsfall enthalten keine fremde E-Mail-Adresse; nach beidseitiger Freigabe nur das Gegenüber. |
| `AT-PRIV-002-2` | automatisiert | REQ-PRIV-002 | (neu) Daten zum Missbrauchsschutz älter als 7 Tage werden vom täglichen Löschjob entfernt. |
| `AT-PRIV-003` | automatisiert | REQ-PRIV-003 | (neu) Szenario-Test mit vorgestellter Zeit für Anzeigen (abgegeben 30 Tage, abgelaufen 90 Tage, pausiert 90 Tage, reserviert 30 Tage) und Konten (unbestätigt 7 Tage, Löschantrag 14 Tage). |
| `AT-PRIV-003-2` | automatisiert | REQ-PRIV-003 | (neu) Szenario-Test für Chats (12 Monate), Meldungen, Audit-Log, Links und entfernte Anzeigen. |
| `AT-PRIV-003-3` | automatisiert | REQ-PRIV-003 | (neu) Kontolöschung: eigene Nachrichtentexte entfernt, Konversation des Gegenübers bleibt mit „Ehemaliges Mitglied“. |
| `AT-PRIV-004` | automatisiert | REQ-PRIV-004 | neu zu schreiben – Meldung einer Nachricht in einer langen Konversation; Moderationsfall enthält höchstens 11 Nachrichten; Audit-Log enthält den Zugriff. |
| `MAN-PRIV-005` | manuell | REQ-PRIV-005 | Verzeichnis der Auftragsverarbeiter mit AV-Verträgen. |
| `AT-PRIV-006` | automatisiert | REQ-PRIV-006 | neu zu schreiben – Browser-Test protokolliert alle Netzwerkanfragen über Anmelden, Suchen, Anzeige, Chat; keine fremde Domain, nur ein Cookie. |
| `AT-PRIV-006-2` | automatisiert | REQ-PRIV-006 | neu zu schreiben – Smoke-Test prüft, dass die Content-Security-Policy nur den eigenen Ursprung erlaubt. |
| `MAN-PRIV-007` | manuell | REQ-PRIV-007 | Prüfprotokoll zur DSFA-Pflicht. |
| `MAN-SEC-001` | manuell | REQ-SEC-001 | ASVS-L2-Checkliste mit Nachweis je Kontrolle und ZAP-Bericht. |
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
| `CTRL-CI-SCAN` | Kontrolle | REQ-SEC-008 | Pipeline-Lauf mit den vier Prüfungen und SBOM-Artefakt. |
| `MAN-SEC-009` | manuell | REQ-SEC-009 | Threat-Model-Dokument mit Review-Vermerk. |
| `CTRL-IMAGE-INSPECT` | Kontrolle | REQ-SEC-010 | Prüfung von Benutzer und Umgebung des Images sowie Start mit `read_only: true` (Compose) bis zum Status „healthy“. |
| `AT-SEC-011` | automatisiert | REQ-SEC-011 | (neu) Registrierung ohne Bestätigung: Anmeldung liefert `not_verified`; Anzeige anlegen, Bild hochladen und Anzeige bearbeiten ohne Sitzung liefern 401. |
| `AT-SEC-011-2` | automatisiert | REQ-SEC-011 | (neu) nach Sperre durch die Moderation liefern Anzeige anlegen, Bild hochladen und Bearbeiten mit der alten Sitzung 401. |
| `AT-SEC-011-3` | automatisiert | REQ-SEC-011 | (neu) nach beantragter Kontolöschung liefert Anzeige anlegen mit der alten Sitzung 401. |
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
| `MAN-UX-002` | manuell | REQ-UX-002 | Code-Review-Protokoll zur Auslagerung der Texte. |
