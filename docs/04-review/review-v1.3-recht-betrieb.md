---
id: REVIEW-1.3-RECHT-BETRIEB
type: review
status: done
owner: architecture-lead
version: 1.0
created: 2026-10-25
last_updated: 2026-10-25
---

# Review v1.3: Recht, Auftritt und Betrieb (EPIC-13)

## Kurzfazit

Geprüft wurde der gesamte Umfang von EPIC-13 „Recht, Auftritt und Betrieb (Übung)“ (Commits `6a0d45c` bis `a359f83`):
- 29 neue und 6 geänderte Anforderungen;
- Rechtstexte und Prozessartefakte mit Platzhaltern;
- Architektur v1.2 mit ADR-0015 bis ADR-0018;
- Server, Web-App, englische Oberfläche, Betriebsinfrastruktur und Tests.

Drei unabhängige Reviewer haben **63 Befunde** gefunden, keinen kritischen. Hoch eingestuft wurden 9 Befunde:

| Gebiet | Hohe Befunde |
|---|---|
| Recht | Falsche Aussagen der Datenschutzerklärung über Logs und IP-Pseudonymisierung; fehlende Rechtsgrundlage bei rechtswidrigen Inhalten (DSA Art. 17 Abs. 3 lit. d); nicht offengelegtes automatisches Ausblenden; nicht nachgezogenes Löschkonzept |
| Betrieb | Doku versprach nach einer Wiederherstellung erneute Löschungen, die nicht stattfanden; Restore ohne Rückfallmöglichkeit; Architektur noch auf Planstand |
| Code | Vier-Augen-Prinzip umgehbar (live belegt) |

Der Code ist mit Commit `6e6fe40` korrigiert, die Dokumentation mit diesem Review-Stand. Offen bleiben nur Prüfpunkte für Justiziariat, Datenschutzbeauftragte/n und Steuerabteilung sowie bewusst hingenommene Grenzen (siehe unten).

## Prüfgrundlage und Methode

| Gegenstand | Stand |
|---|---|
| Anforderungen und Recht | `docs/02-anforderungen` (REQ-LEGAL-*, REQ-UX-003…007, REQ-PRIV-007/008, REQ-SEC-012/013, REQ-OPS-006…012, REQ-AVAIL-003, geänderte REQs), `apps/web/src/content/**`, `docs/06-recht/*` |
| Architektur und Betrieb | `docs/03-architektur/architektur.md` v1.2, ADR-0015…0018, `docs/07-betrieb/*`, `compose.yaml`, `docker/caddy`, `ops/**`, `scripts/backup.mjs`, `scripts/restore.mjs`, CI |
| Code | `git diff 751ee0d HEAD -- apps packages e2e scripts tests`, laufender Stack `cmc3` |
| Maßstab | Vorlage `_TEMPLATE.md` und Prüfregeln `scripts/trace.mjs`; DSGVO, DDG/MStV, DSA, TDDDG, LGGBehM RLP, PStTG; RFC 9116, RFC 8058; arc42/C4 |
| Methode | Drei unabhängige Reviewer, nicht die Autoren: **R** Anforderungen und Recht, **A** Architektur und Betrieb, **C** Code (Korrektheit, Sicherheit, Tests). Lesend, mit `trace.mjs`, `lint:deps`, `check-i18n`, Unit-Tests und eigenen Anfragen gegen den Stack |
| Hinweis | Kein Rechtsrat. Rechtliche Bewertungen sind als „bestätigt“ (Widerspruch zu Norm oder Code belegt) oder „Vermutung“ (Prüfung durch Justiziariat, DSB oder Steuerabteilung nötig) gekennzeichnet |

## Befunde: Anforderungen und Recht (RV-R)

| ID | Schwere | Ort | Befund | Art |
|---|---|---|---|---|
| RV-R-01 | hoch | `datenschutz.de.md`, VVT V-9, TOMs, DSFA; `server.ts` | Datenschutzerklärung sagt „Logs ohne IP“, Fastify protokollierte aber IP, Port und URL samt Query (auch Einmal-Tokens) | bestätigt |
| RV-R-02 | hoch | Datenschutzerklärung, VVT; `identity/service.ts` | „HMAC mit täglich wechselndem Schlüssel“ war nicht umgesetzt (fester Standard-Salt, ADR-0014 nur Proposed) | bestätigt |
| RV-R-03 | hoch | REQ-LEGAL-006, `trust.ts` | Bei rechtswidrigen Inhalten fehlte die Rechtsgrundlage mit Erläuterung (DSA Art. 17 Abs. 3 lit. d) | bestätigt |
| RV-R-04 | hoch | Nutzungsbedingungen, Community-Regeln, Datenschutzerklärung | Automatisches Ausblenden ab 3 Meldungen nirgends offengelegt (Art. 14 DSA); keine Mitteilung an Betroffene | bestätigt; Begründungspflicht nach Art. 17: Vermutung |
| RV-R-05 | hoch | REQ-PRIV-003 | Löschkonzept nicht nachgezogen (Sicherungen 30 statt 28 Tage; neue Kategorien fehlen) | bestätigt |
| RV-R-06 | mittel | Datenschutzerklärung, VVT | Abgeschlossene Deals fehlen als Verarbeitung | bestätigt |
| RV-R-07 | mittel | Datenschutzerklärung, VVT V-6/V-11 | Rechtsgrundlage lit. c, obwohl Anwendbarkeit von DSA und PStTG offen ist | Vermutung |
| RV-R-08 | mittel | REQ-PRIV-001, Datenschutzerklärung | Zustimmung zu Nutzungsbedingungen als „Einwilligung“ eingeordnet; neue Fassung der Datenschutzerklärung löste nichts aus | Vermutung (DSB) |
| RV-R-09 | mittel | `templates.ts`, `dsa.ts`, UC-36 | Mail an Meldende ohne Begründung und Rechtsbehelfe; Widerspruchsergebnis nur an eine Seite | bestätigt |
| RV-R-10 | mittel | REQ-MOD-002, NOTI-001, UX-002, PRIV-001, OPS-009, UC-35, `dsa-prozesse.md`, Nutzungsbedingungen, Kontakt | Mehrere Widersprüche zwischen Anforderungen, Texten und Code (5 statt 20 Zeichen, „Mails nur Deutsch“, Widerspruch „über Kontaktstelle“, fehlende Behördenadresse, zwei Platzhalter-Domains) | bestätigt |
| RV-R-11 | mittel | EPIC-13-REQs, Rechtskataster | Status `approved` trotz Code und markierter Tests | bestätigt |
| RV-R-12 | mittel | `datenpannen-prozess.md` | Keine Risikomatrix, keine Dokumentationsvorlage (Art. 33 Abs. 5), Rollen und Art. 33 Abs. 2 fehlen | bestätigt |
| RV-R-13 | mittel | `backup-restore.md`, `compose.mjs` | Wiederherstellung bringt sofort gelöschte Daten zurück; neueste Sicherung blieb über 28 Tage | bestätigt |
| RV-R-14 | mittel | Tests zu AT-LEGAL-005, -007-3, -003, AT-OPS-006, AT-LEGAL-002 | Tests prüfen nicht alle Akzeptanzkriterien (Kontaktseite ohne Widerspruch, Entsperren ungeprüft, Admin als Ausnahme nicht in der REQ) | bestätigt |
| RV-R-15 | mittel | `privacy/index.ts` | Beweissicherung stellte ganze Kontolöschung zurück, Kontext ± 5 fehlte | bestätigt |
| RV-R-16 | mittel | `dsfa-schwellwertanalyse.md` | Kriterium 4 (vertrauliche Kommunikation) unterbewertet; mit Kriterium 7 wären zwei Kriterien erfüllt | Vermutung (DSB) |
| RV-R-17 | mittel | Datenschutzerklärung, `dac7-konzept.md` | Widersprüchliche PStTG-Paragrafen; Tausch als feste Regel statt offener Punkt | bestätigt (Widerspruch); Fundstelle: Vermutung |
| RV-R-18 | mittel | REQ-LEGAL-004, Abgleich | Falsche Rechtsquelle (BITV 2.0/LBGG statt LGGBehM RLP); Methode „manuelle Prüfung“, die noch aussteht | Vermutung |
| RV-R-19 | niedrig | REQ-LEGAL-007 | Kein messbares Bearbeitungsziel (Art. 20 Abs. 4 „zeitnah“) | bestätigt |
| RV-R-20 | niedrig | REQ-LEGAL-008 | Should trotz Pflicht nach Art. 18 ohne sichtbare Begründung | bestätigt |
| RV-R-21 | niedrig | REQ-PRIV-008 | `Disallow: /` verhindert, dass Crawler `noindex` sehen; Entscheidung nicht dokumentiert | bestätigt |
| RV-R-22 | niedrig | Impressum, Nutzungsbedingungen, Datenschutzerklärung, REQ-LEGAL-001 | „Kontaktformular“ existiert nicht; Nutzungsrecht kürzer als Speicherung; Datenübertragbarkeit bei lit. e; Anwendbarkeit § 5 DDG | bestätigt bzw. Vermutung |
| RV-R-23 | niedrig | `scripts/trace.mjs` | AT-Tags zählten auch im Produktivcode | bestätigt |
| RV-R-24 | niedrig | Rechtskataster | Pflichtvorlagen für Transparenzberichte (DVO (EU) 2024/2835) nicht erwähnt | Vermutung |

## Befunde: Architektur und Betrieb (RV-A)

| ID | Schwere | Ort | Befund | Art |
|---|---|---|---|---|
| RV-A-01 | hoch | ADR-0018, `backup-restore.md`, R-14 | Doku behauptete, Löschungen würden nach einer Wiederherstellung erneut ausgeführt; das gab es nicht (Art. 17 DSGVO) | bestätigt |
| RV-A-02 | hoch | `scripts/restore.mjs` | `DROP DATABASE` vor `pg_restore` ohne Rückfall; scheitert das Einspielen, ist der alte Stand verloren | bestätigt |
| RV-A-03 | hoch | `architektur.md` v1.2 | Nicht nachgezogen: Bausteine auf „geplant“, Modul `reporting` fehlt, Datenmodell veraltet | bestätigt |
| RV-A-04 | mittel | `alerts.yml`, Alertmanager | `HighErrorRate` alarmiert bei jeder Wartung und bei wenig Last; keine `inhibit_rules` | bestätigt |
| RV-A-05 | mittel | `alerts.yml`, `metrics.ts` | `BackupMissing` feuert sofort bei Neustart, bei DB-Ausfall und nach Restore eines älteren Dumps | bestätigt |
| RV-A-06 | mittel | QS-16, `monitoring-alarmierung.md` | QS-16 fordert 2 min, gemessen 184 s; REQ-OPS-008 fordert ≤ 5 min | bestätigt |
| RV-A-07 | mittel | `compose.yaml`, ADR-0017, TLS-Doku | „TRUST_PROXY wirkt nicht“ veraltet; Profil setzt die Werte nicht; `trustProxy: true` vertraut allen Hops | bestätigt |
| RV-A-08 | mittel | ADR-0016 | Drei undokumentierte Abweichungen: Gerätewahl überschreibt Kontosprache, `RegisterBody` ohne `locale`, falscher Katalogpfad | bestätigt |
| RV-A-09 | mittel | `backup-restore.md`, ADR-0018 | Empfehlung „vor dem Restore Wartungsmodus setzen“ wirkungslos, weil die App gestoppt wird | bestätigt |
| RV-A-10 | mittel | Go-live-Checkliste, Betriebshandbuch, Update-Prozess | `TERMS_VERSION` veraltet; `LEGAL_STRICT`, `UNSUBSCRIBE_SECRET`, `SECURITY_CONTACT`, `MAINTENANCE_UNTIL`, `TRUST_PROXY`, HTTPS-`PUBLIC_URL`, DB-Passwort, Alarm-Empfänger und weicher Wartungsmodus fehlen | bestätigt |
| RV-A-11 | mittel | `platform/ops.ts` | Statusprüfung ohne In-flight-Deduplizierung; viele Abrufe → viele SMTP-/DB-Prüfungen | bestätigt |
| RV-A-12 | niedrig | ADR-0018, Backup-Doku | „Es fehlt keine Datei“ gilt nur für neue, nicht für zwischen Dump und tar gelöschte Bilder | bestätigt |
| RV-A-13 | niedrig | `backup.mjs` | Abgebrochene Sicherung ohne Manifest wurde wie gültige behandelt | bestätigt |
| RV-A-14 | niedrig | `restore.mjs` | Projekt im Manifest nicht geprüft; fehlende Manifest-Einträge nicht erzwungen | bestätigt |
| RV-A-15 | niedrig | `.dockerignore` | `backups/` und `caddy-root.crt` im Build-Kontext | bestätigt |
| RV-A-16 | niedrig | Update-Prozess, `ci.yml` | Doku „kein Automerge“ widerspricht `renovate.json`; Tool-Versionen in CI nicht von Renovate gepflegt; Hash-Tag fehlt | bestätigt |
| RV-A-17 | niedrig | `buildSecurityTxt` | `Policy`/`Canonical` mit `http://` widersprechen RFC 9116 | bestätigt |
| RV-A-18 | niedrig | `alerts.yml`, §8.6 | `JobFailures` zählt jeden Fehlversuch, nicht nur endgültig gescheiterte Jobs | bestätigt |
| RV-A-19 | niedrig | Statusseite | Drei unterschiedliche Beschreibungen der Statusbereiche | bestätigt |
| RV-A-20 | niedrig | `server.ts` | SPA-Rückfall nur für GET, `HEAD` lieferte 404 | Vermutung, aus Code abgeleitet |

## Befunde: Code (RV-C)

| ID | Schwere | Ort | Befund | Art |
|---|---|---|---|---|
| RV-C-01 | hoch | `trust/dsa.ts`, `trust/domain.ts` | Vier-Augen umgehbar: Widersprechende entschieden über eigenen Widerspruch, Meldende über eigenen Fall | bestätigt (live belegt) |
| RV-C-02 | mittel | `config.ts`, `notifications/domain.ts` | Abmelde-Token mit öffentlich bekanntem Standardgeheimnis fälschbar | bestätigt (live) |
| RV-C-03 | mittel | `messaging/service.ts`, `dsa.ts` | Stattgabe nach Ablauf der Löschfrist meldet Erfolg, Nachricht bleibt leer | bestätigt |
| RV-C-04 | mittel | `identity/service.ts`, `dsa.ts` | Rücknahme einer Sperre hob jede Sperre auf | bestätigt |
| RV-C-05 | mittel | `privacy/index.ts`, `messaging/service.ts` | Beweissicherung lückenhaft (Löschung durch Gegenüber) | bestätigt |
| RV-C-06 | mittel | `platform/http/terms.ts` | Bei veralteter Zustimmung gesperrt: Widerruf der Kontaktfreigabe, Blockieren, Melden, Benachrichtigungen | bestätigt |
| RV-C-07 | mittel | Fastify-Request-Log | Einmal-Tokens (Widerspruch, Abmeldung) im Klartext im Log | bestätigt |
| RV-C-08 | niedrig | `api/auth.ts` | Gerätewahl überschrieb bei jedem Login die Kontosprache | bestätigt |
| RV-C-09 | niedrig | `listings/service.ts` | Wiederhergestellte Anzeige immer `active` statt vorherigem Status | bestätigt |
| RV-C-10 | niedrig | Vertrag `Appeal` | Prüfende sahen den Originaltext entfernter Nachrichten nicht | bestätigt |
| RV-C-11 | niedrig | `AppealBody` u. a. | `minLength` vor `trim()`: Begründung aus Leerzeichen angenommen | bestätigt |
| RV-C-12 | niedrig | DAC7-Bericht | JSON enthielt E-Mail-Adressen (widerspricht §8.1) | bestätigt |
| RV-C-13 | niedrig | `List-Unsubscribe` | Mit `http://`-`PUBLIC_URL` formal nicht RFC-8058-konform | Vermutung |
| RV-C-14 | niedrig | Tests | Vier-Augen-Negativfälle fehlten | bestätigt |
| RV-C-15 | niedrig | AT-OPS-010 | Kein Test mit gefälschtem Token, keine Prüfung „GET ändert nichts“ | bestätigt |
| RV-C-16 | niedrig | AT-LEGAL-007-4 | Unbekanntes/abgelaufenes Token und Entsperren ungeprüft | bestätigt |
| RV-C-17 | niedrig | AT-LEGAL-003-2 | Nur `PATCH /me` geprüft, nicht wiederholbar | bestätigt |
| RV-C-18 | niedrig | AT-LEGAL-010 / i18n | Kein Test, dass `cm_locale` vor dem Klick fehlt | bestätigt |
| RV-C-19 | niedrig | AT-LEGAL-009-2 | Test besteht auch mit leerer Verkäuferliste | bestätigt |

## Positiv

- Widerspruchs-Token: 256 Bit, nur als SHA-256 gespeichert, einmalig (`FOR UPDATE` + `used_at`), an Entscheidung und Person gebunden; eindeutiger Index gegen doppelte Widersprüche.
- Wartungsmodus: robuste Ausnahmen (Umgehungsversuche mit `;.js`, `#.js`, `//` geblockt), `Retry-After` begrenzt, Health bleibt „healthy“.
- Markdown-Rendering ohne HTML und mit sicherer URL-Transformation; CSV-Schutz gegen Formel-Injektion; Mail-HTML escaped.
- WSJF B-43…B-58 korrekt nachgerechnet; Pflichtfelder, Reviewer und MoSCoW-Begründungen vollständig; alle AT-IDs der EPIC-13-Anforderungen in Tests markiert.
- Fristen im Code (Widerspruch 6 Monate, Beweissicherung 6 Monate, Begründung ≥ 20 Zeichen, Sicherungen 28 Tage) stimmen mit den Texten überein.
- CI aller EPIC-13-Commits grün; Port-Bindung an `127.0.0.1`, HSTS ohne `includeSubDomains`, `/metrics` am Proxy gesperrt.

## Offene Prüfpunkte für Justiziariat, DSB und Steuerabteilung

> **Durch Übungsannahmen Q-28 ersetzt (2026-10-25).** Der Auftraggeber hat festgelegt, dass ein Real-World-Szenario mit fiktiven, nicht rechtsverbindlichen Werten genügt. Jeder Punkt der Tabelle ist im [Entscheidungslog](../02-anforderungen/05-entscheidungen.md#übungsannahmen-zu-q-28) als Annahme A-1 … A-22 festgelegt; die DSFA liegt als Übung vor ([DSFA](../06-recht/dsfa.md)).

| Punkt | Zuständig | Wo dokumentiert |
|---|---|---|
| Anwendbarkeit des DSA auf ein kostenloses Angebot einer öffentlichen Stelle (Entgeltlichkeit); davon hängt lit. c oder lit. e als Rechtsgrundlage ab | Justiziariat | Abgleich §3, `dsa-prozesse.md`, Rechtskataster, Datenschutzerklärung |
| Pflicht zur vollständigen Begründung bei vorläufigem Ausblenden (Art. 17 Abs. 1) | Justiziariat | `dsa-prozesse.md` |
| Anwendbarkeit § 5 DDG; Auffangnorm § 18 Abs. 1 MStV | Justiziariat | REQ-LEGAL-001 |
| Einordnung der Hilfsmittel nach Art. 22 DSGVO; Rechtsgrundlage der Zustimmung; DSFA (Schwellwertanalyse ergibt „erforderlich“) | DSB | Datenschutzerklärung §8, REQ-PRIV-001, `dsfa-schwellwertanalyse.md` |
| Anwendbarkeit PStTG (§ 3, reine Inseratsplattform), Tausch als Vergütung, Fundstellen für Aufbewahrung und Sperre | Steuerabteilung | `dac7-konzept.md`, Datenschutzerklärung |
| Fundstelle der Landesverordnung zur Barrierefreiheit (LGGBehM RLP) | Justiziariat | REQ-LEGAL-004 |
| Transparenzbericht-Vorlagen nach DVO (EU) 2024/2835 | Justiziariat | `dsa-prozesse.md`, Rechtskataster |

## Behebung (2026-10-25)

Code: Commit `6e6fe40`. Dokumentation: dieser Stand (Anforderungen mit Historienzeile „Review v1.3“, Rechtstexte, `docs/06-recht`, `docs/07-betrieb`, ADR-0014/0016/0017/0018, `architektur.md` v1.3, README).

| Befund | Status | Behebung |
|---|---|---|
| RV-R-01 | behoben | Eigener Request-Log ohne IP, Port und Query (Unit-Test AT-OPS-002); Datenschutzerklärung, VVT, TOMs, DSFA an Ist-Stand |
| RV-R-02 | behoben | ADR-0014 umgesetzt (`platform.ip_pepper`, tägliche Rotation, auch E-Mail-Pseudonyme); ADR auf Accepted; Texte angeglichen |
| RV-R-03 | behoben | Pflichtfeld `legalGround` bei `illegal_content` (422 `legal_ground_required`), in Mail und Mitteilung; REQ-LEGAL-006 lit. d/e getrennt |
| RV-R-04 | behoben | Mitteilung `provisional_hide` und Mail an Betroffene; Offenlegung in Nutzungsbedingungen §8 Nr. 6, Community-Regeln, Datenschutzerklärung §8; REQ-MOD-004 |
| RV-R-05 | behoben | REQ-PRIV-003 v2.1 mit allen neuen Kategorien und 28 Tagen |
| RV-R-06 | behoben | Deals als eigene Verarbeitung in Datenschutzerklärung und VVT (V-13) |
| RV-R-07 | dokumentiert | Rechtsgrundlage „lit. c, soweit anwendbar, sonst lit. e“ mit Platzhalter; offene Prüfpunkte in Abgleich und Kataster |
| RV-R-08 | behoben | „Zustimmung/Kenntnisnahme“ statt „Einwilligung“; Hinweis bei neuer Datenschutzerklärung (`POST /me/privacy-ack`); REQ-PRIV-001, REQ-LEGAL-002 |
| RV-R-09 | behoben | Meldende erhalten Begründung und Rechtsbehelfe; Ergebnis an beide Seiten; REQ-MOD-003, REQ-LEGAL-006/007 |
| RV-R-10 | behoben | Alle genannten Widersprüche angeglichen; Kontaktseite mit Abschnitt Widerspruch und Behördenadresse; Platzhalter-Domain einheitlich `hwg-lu.example` (Plattform `campusmarkt.example`) |
| RV-R-11 | behoben | Alle EPIC-13-Anforderungen `implemented`; Rechtskataster-Stand aktualisiert. `verified` folgt nach dem finalen Lauf |
| RV-R-12 | behoben | Datenpannen-Prozess mit Rollen, Erreichbarkeit, Art. 33 Abs. 2, Risikomatrix, Dokumentationsvorlage, Übung vor Echtbetrieb |
| RV-R-13 | behoben | Löschjournal mit `replay-deletions`; Rotation streng 28 Tage (Code und Doku) |
| RV-R-14 | behoben | AT-LEGAL-007-3 prüft Entsperren und Anmeldung; Tags getrennt; Kontaktseite ergänzt; REQ-OPS-006 nennt alle Ausnahmen. AT-LEGAL-002 prüft weiter nur Überschriften und Version (bewusst; Inhalt per CTRL-DOC-LEGAL-TEXTE) |
| RV-R-15 | behoben | Beweissicherung als pseudonymisierte Kopie mit ± 5 Nachrichten (`trust.evidence_copy`), keine Zurückstellung der Löschung; REQ-LEGAL-008; Bilder werden nicht kopiert (offen) |
| RV-R-16 | dokumentiert | Kriterium 4 neu bewertet → DSFA vor Echtbetrieb erforderlich; Go-live-Checkliste; Bestätigung durch DSB offen |
| RV-R-17 | dokumentiert | Paragrafen durch Platzhalter für die Steuerabteilung ersetzt; Tausch als offener Prüfpunkt |
| RV-R-18 | behoben | Rechtsquelle LGGBehM RLP + RL (EU) 2016/2102 + DB (EU) 2018/1523; Methode ehrlich |
| RV-R-19 | behoben | Bearbeitungsziel mit Platzhalter und Messverfahren in REQ-LEGAL-007 |
| RV-R-20 | behoben | Begründung der Einstufung Should in REQ-LEGAL-008 |
| RV-R-21 | dokumentiert | Entscheidung zu `Disallow` und `noindex` in REQ-PRIV-008 |
| RV-R-22 | behoben | „Kontaktformular“ entfernt; Nutzungsrecht an Speicherdauer gekoppelt; Hinweis zur Datenübertragbarkeit; § 5 DDG/§ 18 MStV in REQ-LEGAL-001 |
| RV-R-23 | behoben | `trace.mjs` zählt Tags nur in Testquellen |
| RV-R-24 | dokumentiert | Transparenzbericht-Vorlagen im Rechtskataster und in `dsa-prozesse.md` |
| RV-A-01 | behoben | Löschjournal (Volume `journal`, Kopie neben den Sicherungen, 35 Tage), automatisch nach jeder Wiederherstellung |
| RV-A-02 | behoben | Restore über temporäre Datenbank und `.restore-new`, Tausch erst nach Erfolg |
| RV-A-03 | behoben | `architektur.md` v1.3: Stand „umgesetzt“, Modul `reporting`, Datenmodell nach 0003/0004, Laufzeitsicht 6.5, Ablauf 7.3 |
| RV-A-04 | behoben | Wartungsausschluss, Mindestlast 0,1/s, `inhibit_rules` |
| RV-A-05 | behoben | NaN statt 0 bei unlesbarem Wert, „nie gesichert“ erst nach 26 h Laufzeit, Zeitstempel nach Restore korrekt |
| RV-A-06 | behoben | QS-16 auf ≤ 5 min (gemessen 184 s) |
| RV-A-07 | behoben | `.env.proxy.example`, `trustProxy` auf einen Hop, Doku und ADR-0017 angeglichen |
| RV-A-08 | behoben | `RegisterBody.locale`; Gerätewahl nur aus derselben Sitzung; ADR-0016 mit Nachtrag |
| RV-A-09 | behoben | Empfehlung gestrichen (Backup-Doku, ADR-0018) |
| RV-A-10 | behoben | Go-live-Checkliste und Betriebshandbuch ergänzt (Variablen, weicher Wartungsmodus, DB-Passwort, Alarm-Empfänger) |
| RV-A-11 | behoben | Laufende Prüfungen geteilt, Statusroute begrenzt (50 je 10 s) |
| RV-A-12 | dokumentiert | Aussage eingeschränkt (Backup-Doku, ADR-0018); fehlende Bilder hingenommen |
| RV-A-13 | behoben | `<ts>.partial`, nur Verzeichnisse mit Manifest zählen |
| RV-A-14 | behoben | Projektprüfung (`--other-project`), Pflichtdateien erzwungen |
| RV-A-15 | behoben | `.dockerignore` um `backups`, `caddy-root.crt`, `.env.*` |
| RV-A-16 | behoben | Doku zu Automerge; Tool-Versionen im `env`-Block mit Regex-Manager und Gleichheitsprüfung; Tag `<version>-<sha>` |
| RV-A-17 | behoben | `Policy`/`Canonical` nur bei HTTPS |
| RV-A-18 | behoben | Ausgänge `ok`/`retry`/`dead`, Alarm nur bei `dead`; §8.6 angeglichen |
| RV-A-19 | behoben | Bereiche einheitlich nach `SystemStatus` (`app`, `database`, `email`, `realtime`) |
| RV-A-20 | behoben | `HEAD` wie `GET` |
| RV-C-01 | behoben | Vier-Augen vollständig (Widersprechende, Betroffene, Meldende ausgeschlossen; Meldende entscheiden ihren Fall nicht); Negativtests AT-LEGAL-007-2 |
| RV-C-02 | behoben | Zufälliges Geheimnis in `platform.setting`, optional `UNSUBSCRIBE_SECRET`; Test mit gefälschtem Token |
| RV-C-03 | behoben | Originaltexte bei offenem Widerspruch nicht gelöscht; `restore_impossible` |
| RV-C-04 | behoben | Entsperren nur ohne weitere aktive Sperre |
| RV-C-05 | behoben | mit RV-R-15 |
| RV-C-06 | behoben | Schutzrechte ohne aktuelle Zustimmung erlaubt (tabellarisch getestet) |
| RV-C-07 | behoben | mit RV-R-01; Token im Fragment und per POST |
| RV-C-08 | behoben | mit RV-A-08 |
| RV-C-09 | behoben | `status_before_removal` |
| RV-C-10 | behoben | Originaltext für Prüfende, Zugriff im Audit-Log |
| RV-C-11 | behoben | Mindestlänge nach `trim()` |
| RV-C-12 | behoben | JSON ohne Adressen, nur CSV |
| RV-C-13 | dokumentiert | Hinweis in `architektur.md` §8 (Mail) und REQ-OPS-010; Go-live verlangt HTTPS-`PUBLIC_URL` |
| RV-C-14 | behoben | Vier-Augen-Negativfälle in Smoke- und Unit-Tests |
| RV-C-15 | behoben | Gefälschtes Token 404, GET ändert nichts |
| RV-C-16 | teilweise | Unbekannt 404 und benutzt 410 geprüft; abgelaufenes Token nur per Unit-Test der Frist (per API nicht herstellbar) |
| RV-C-17 | teilweise | Prüft zusätzlich erlaubte Sprachänderung; bleibt je Stack einmalig (README-Hinweis) |
| RV-C-18 | behoben | Test: `localStorage` leer vor der Wahl |
| RV-C-19 | behoben | Test mit echtem Verkauf über 2.500 € und Formel im Anzeigenamen |

## Bewusst hingenommene Grenzen

- Das Löschjournal hilft nicht, wenn alle Volumes verloren gehen; dann gelten nur die Einträge bis zur letzten Sicherung. Sperren und Entsperren stehen nicht im Journal.
- Die Beweissicherung kopiert keine Bilder.
- Löschläufe für Meldungen, Entscheidungen, Widersprüche, Mitteilungen und abgelaufene Einmal-Links fehlen noch; diese Daten werden bisher nur mit dem Konto gelöscht (REQ-PRIV-003, Stand).
- Die Versionen der Rechtstexte im Front Matter wurden für die inhaltlichen Korrekturen dieses Reviews **nicht** erhöht. Eine neue Version der Nutzungsbedingungen würde für alle Konten eine erneute Zustimmung erzwingen. Im Echtbetrieb ist jede wesentliche Änderung eine neue Version.
