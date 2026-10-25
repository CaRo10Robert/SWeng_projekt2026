---
id: GAP-RECHT-BETRIEB
type: requirements
status: in-review
owner: product-owner
version: 1.1
created: 2026-10-24
last_updated: 2026-10-25
---

# Abgleich Recht, Auftritt und Betrieb (EPIC-13)

> **Übungsaufgabe.** CampusMarkt hat keinen Echtbetrieb (ADR-0010). Auf Wunsch des Auftraggebers werden die Rechts- und Betreiberpflichten eines Online-Marktplatzes trotzdem vollständig umgesetzt. Statt echter Betreiberdaten stehen erkennbare Platzhalter im Format `[Platzhalter: …]` (Entscheidung Q-23). Betreiber im Muster ist die Hochschule als öffentliche Stelle in Rheinland-Pfalz. **Das Dokument ist kein Rechtsrat**; vor einem Echtbetrieb prüfen die/der Datenschutzbeauftragte und das Justiziariat der Hochschule.

## 1. Ausgangslage

Die Frage des Auftraggebers am 2026-10-24: Sind alle Grundlagen einer professionellen Website vorhanden, etwa Impressum, 404-Seite, DSGVO und Cookie-Banner? Und was braucht eine Seite für einen sauberen Echtbetrieb? Der Abgleich unten vergleicht den Stand von Code und Anforderungen nach Sprint 1 mit dem Soll. Aus jeder Lücke entsteht eine Anforderung in EPIC-13 oder eine Änderung an einer bestehenden.

## 2. Ist/Soll-Abgleich

| # | Thema | Ist (Code und Anforderungen, Stand Sprint 1) | Soll | Anforderung | Backlog |
|---|---|---|---|---|---|
| G-1 | Impressum | fehlt; nur als Aufgabe für den Echtbetrieb genannt (EPIC-12, OPS-01) | Seite mit Pflichtangaben, von jeder Seite erreichbar | REQ-LEGAL-001 | B-43 |
| G-2 | Datenschutzerklärung | fehlt, obwohl die Registrierung die Kenntnisnahme abfragt (REQ-PRIV-001) | Art.-13-Informationen inkl. Cookies und lokaler Speicherung | REQ-LEGAL-002 | B-43 |
| G-3 | Nutzungsbedingungen, Community-Regeln | Zustimmung wird mit Version gespeichert, ein Text fehlt; erneute Zustimmung bei neuer Version ist geplant (B-25) | versionierte Texte, erneute Zustimmung | REQ-LEGAL-003, REQ-PRIV-001 | B-43, B-25 |
| G-4 | Erklärung zur Barrierefreiheit | fehlt; technische Barrierefreiheit getestet (REQ-A11Y-001/002) | Erklärung mit Feedback-Möglichkeit | REQ-LEGAL-004 | B-43 |
| G-5 | Kontaktstelle (DSA Art. 11/12) | fehlt | Kontaktseite für Nutzer und Behörden | REQ-LEGAL-005 | B-43 |
| G-6 | Begründung an Betroffene (DSA Art. 17) | E-Mail mit Entscheidung und Begründung (REQ-MOD-003); verletzte Regel, Hinweis auf automatisierte Erkennung und Rechtsbehelfe fehlen; keine Mitteilung im Konto | vollständige Begründung, Mitteilung im Konto | REQ-LEGAL-006 | B-46 |
| G-7 | Widerspruch (DSA Art. 20) | außerhalb des Systems per E-Mail (Q-15) | im System, 6 Monate, Vier-Augen-Prinzip | REQ-LEGAL-007 (Q-22) | B-46 |
| G-8 | Verdacht auf Straftaten (DSA Art. 18) | Prozess offen (Q-4) | Kennzeichnung, Eskalation, Beweissicherung; Prozess | REQ-LEGAL-008 | B-47 |
| G-9 | Steuermeldepflicht (DAC7) | nicht betrachtet | Auswertung je Kalenderjahr | REQ-LEGAL-009 (Q-26) | B-48 |
| G-10 | Cookie-Banner | keiner, nur das Sitzungscookie `cm_session` und kein Tracking (REQ-PRIV-006) | **bewusst kein Banner**, Regel mit automatischer Prüfung für künftige Speicherungen | REQ-LEGAL-010 (Q-24) | B-49 |
| G-11 | VVT, TOMs | fehlen | Dokumente mit Verweis auf Anforderungen | REQ-LEGAL-011 | B-50 |
| G-12 | Auftragsverarbeitung | nur als EPIC-12-Aufgabe (OPS-02) | Übersicht und Checkliste | REQ-LEGAL-012 | B-50 |
| G-13 | Datenpannen (72 h) | fehlt | Prozess mit Übung | REQ-LEGAL-013 | B-50 |
| G-14 | DSFA | Prüfpflicht im Echtbetrieb (REQ-PRIV-007, Won't) | Schwellwertanalyse als Übung | REQ-PRIV-007 | B-50 |
| G-15 | 404-Seite | SPA-Komponente „Seite nicht gefunden“ mit einem Link; der Server liefert für **jede** unbekannte Adresse `index.html` mit Status 200 (`apps/server/src/platform/http/server.ts`) | 404/500/503 mit korrektem Status und Wegen zurück | REQ-UX-003 | B-44 |
| G-16 | Startseite für Gäste | Gäste landen auf der Anmeldung | erklärende Startseite | REQ-UX-004 | B-45 |
| G-17 | Hilfe, FAQ, Sicherheitstipps | Sicherheitshinweis im Chat ohne Ziel (REQ-CHAT-006) | Hilfeseite mit Betrugsmaschen | REQ-UX-005 | B-45 |
| G-18 | Seitenfuß, E-Mail-Fußzeile | Seitenfuß „Demo-Version – kein Echtbetrieb“; E-Mails ohne Impressum | Rechtslinks überall | REQ-UX-006 | B-43 |
| G-19 | Englische Oberfläche | nur deutsch; Auslagerung der Texte geplant (REQ-UX-002, B-17 in R2) | komplette englische Fassung | REQ-UX-007 (Q-25) | B-51 |
| G-20 | Suchmaschinen | keine Angabe | `robots.txt`, `X-Robots-Tag` | REQ-PRIV-008 | B-52 |
| G-21 | Sicherheitslücken melden | kein Kontakt | `security.txt` und Prozess | REQ-SEC-012 | B-52 |
| G-22 | Penetrationstest | nur ASVS-Checkliste (B-23) | Testplan vor Go-live | REQ-SEC-013 | B-57 |
| G-23 | Wartung, Ankündigung | fehlt | Wartungsmodus mit 503, Banner | REQ-OPS-006 | B-53 |
| G-24 | Statusseite | fehlt; `/health/*` nur technisch | öffentliche Statusseite | REQ-OPS-007 | B-53 |
| G-25 | Monitoring, Alarmierung | `/metrics` ohne Alarme | Profil `monitoring`, Alarme an Mailpit | REQ-OPS-008 (Q-27) | B-54 |
| G-26 | TLS, HSTS | nur HTTP im Beispiel; Cookies `Secure` | Profil `proxy` | REQ-OPS-009 (Q-27) | B-55 |
| G-27 | E-Mail-Zustellbarkeit | Mailpit; keine DNS-Vorgaben | SPF/DKIM/DMARC dokumentiert, One-Click-Abmeldung | REQ-OPS-010 | B-57 |
| G-28 | Betriebshandbuch, Störungen | nur Schnellstart (REQ-OPS-003) | Handbuch, Störungsprozess, Go-live-Checkliste | REQ-OPS-011 | B-57 |
| G-29 | Abhängigkeiten aktualisieren | manuell | Renovate | REQ-OPS-012 | B-58 |
| G-30 | Datensicherung | keine; Ziele nur für den Echtbetrieb (REQ-AVAIL-002, Won't) | Sicherung und Restore-Test im Beispiel | REQ-AVAIL-003 | B-56 |

## 3. Rechtskataster

Zuordnung der Normen zu Pflichten und zu ihrer Umsetzung. Die Prozessdokumente liegen unter `docs/06-recht/` und `docs/07-betrieb/`.

| Norm | Pflicht (vereinfacht) | Anforderung | Prozessartefakt bzw. Ort |
|---|---|---|---|
| DDG § 5 | Anbieterkennzeichnung, leicht erkennbar und ständig verfügbar | REQ-LEGAL-001, REQ-UX-006 | `apps/web/src/content/legal/impressum.de.md` |
| MStV § 18 Abs. 2 | Verantwortliche/r für redaktionelle Inhalte | REQ-LEGAL-001 | Impressum |
| DSGVO Art. 5 Abs. 2, Art. 30 | Rechenschaft, Verzeichnis der Verarbeitungstätigkeiten | REQ-LEGAL-011 | `docs/06-recht/vvt.md` |
| DSGVO Art. 12–14 | Transparente Information | REQ-LEGAL-002 | `apps/web/src/content/legal/datenschutz.de.md` |
| DSGVO Art. 15–21 | Betroffenenrechte | REQ-ACC-001…003, REQ-ACC-002 | Profil (Export, Löschung), Datenschutzerklärung |
| DSGVO Art. 25 | Datenschutz durch Technik und Voreinstellungen | REQ-PRIV-002, REQ-PRIV-006, REQ-PRIV-008 | Architektur § 8 |
| DSGVO Art. 28 | Auftragsverarbeitung | REQ-LEGAL-012 | `docs/06-recht/auftragsverarbeitung.md` |
| DSGVO Art. 32 | Sicherheit der Verarbeitung, Wiederherstellbarkeit | REQ-LEGAL-011, REQ-AVAIL-003, REQ-SEC-* | `docs/06-recht/toms.md`, `docs/07-betrieb/backup-restore.md` |
| DSGVO Art. 33, 34 | Meldung von Datenpannen | REQ-LEGAL-013 | `docs/06-recht/datenpannen-prozess.md` |
| DSGVO Art. 35 | Datenschutz-Folgenabschätzung | REQ-PRIV-007 | `docs/06-recht/dsfa-schwellwertanalyse.md` |
| LDSG RLP | Landesrecht für öffentliche Stellen (u. a. DSB, Aufsicht LfDI) | REQ-LEGAL-002, REQ-LEGAL-011 | Datenschutzerklärung, VVT |
| TDDDG § 25 | Einwilligung für Speicherung auf Endgeräten, Ausnahme „unbedingt erforderlich“ | REQ-LEGAL-010 | Datenschutzerklärung, `e2e/storage-allowlist.json` |
| DSA Art. 11, 12 | Kontaktstellen für Behörden und Nutzer | REQ-LEGAL-005 | `apps/web/src/content/legal/kontakt.de.md`, `docs/06-recht/dsa-prozesse.md` |
| DSA Art. 14 | Verständliche Nutzungsbedingungen | REQ-LEGAL-003 | `apps/web/src/content/legal/nutzungsbedingungen.de.md`, `community-regeln.de.md` |
| DSA Art. 16 | Melde- und Abhilfeverfahren | REQ-MOD-001, REQ-MOD-002 | `docs/06-recht/dsa-prozesse.md` |
| DSA Art. 17 | Begründung an Betroffene | REQ-LEGAL-006, REQ-MOD-003 | `docs/06-recht/dsa-prozesse.md` |
| DSA Art. 18 | Meldung von Straftatverdacht | REQ-LEGAL-008 | `docs/06-recht/dsa-prozesse.md` |
| DSA Art. 20, 21 | Internes Beschwerdemanagement, außergerichtliche Streitbeilegung | REQ-LEGAL-007 | `docs/06-recht/dsa-prozesse.md` |
| DSA Art. 23 | Maßnahmen gegen missbräuchliche Meldungen und Widersprüche | REQ-LEGAL-007, REQ-MOD-001 | `docs/06-recht/dsa-prozesse.md` |
| LGGBehM RLP mit Landesverordnung [Platzhalter], RL (EU) 2016/2102, Durchführungsbeschluss (EU) 2018/1523 (BITV 2.0 nur als fachliche Orientierung) | Barrierefreiheit, Erklärung, Feedback | REQ-A11Y-001/002, REQ-LEGAL-004 | `apps/web/src/content/legal/barrierefreiheit.de.md` |
| PStTG (DAC7) | Meldung von Anbietern über der Bagatellgrenze | REQ-LEGAL-009 | `docs/06-recht/dac7-konzept.md` |
| BGB §§ 305 ff. | Einbeziehung und Transparenz von Bedingungen | REQ-LEGAL-003 | Nutzungsbedingungen |
| UWG § 7, RFC 8058 | Keine unerwünschte Werbung; einfache Abmeldung | REQ-NOTI-003, REQ-OPS-010 | `docs/07-betrieb/mail-zustellbarkeit.md` |
| RFC 9116 | Kontakt für Sicherheitslücken | REQ-SEC-012 | `/.well-known/security.txt`, `docs/07-betrieb/betriebshandbuch.md` |
| ZAG, GwG | Zahlungsdienste, Geldwäsche | REQ-ARCH-001/002 (Constraint C-07) | erst mit EPIC-09; Zahlungsdienstleister hinter dem PaymentPort (ADR-0006) |

**Nicht anwendbar oder bewusst ausgelassen (mit Begründung):**
- **Barrierefreiheitsstärkungsgesetz (BFSG):** gilt für Wirtschaftsakteure; für die Hochschule als öffentliche Stelle gilt das Landesrecht (LGGBehM RLP).
- **Befreiung kleiner Unternehmen nach DSA Art. 19:** setzt ein Unternehmen voraus; eine öffentliche Stelle ist kein KMU. Wir setzen Art. 20 um (Q-22); das ist der sichere Weg.

**Offene Prüfpunkte (Review v1.3, RV-R-07, RV-R-22):**
- **Anwendbarkeit des DSA:** Der DSA erfasst „Dienste der Informationsgesellschaft“, die in der Regel gegen Entgelt erbracht werden; ob ein kostenloses Angebot einer öffentlichen Stelle darunter fällt, prüft das Justiziariat. Davon hängt ab, ob für Moderation und Beschwerden Art. 6 Abs. 1 lit. c oder lit. e DSGVO die Rechtsgrundlage ist.
- **Anwendbarkeit des PStTG:** Ausnahme nach § 3 PStTG für reine Inseratsplattformen und Einordnung von Tausch; prüft die Steuerabteilung.
- **§ 5 DDG** setzt einen geschäftsmäßigen, in der Regel entgeltlichen digitalen Dienst voraus; Auffangnorm § 18 Abs. 1 MStV.
- **DSFA:** Die Schwellwertanalyse ergibt nach Neubewertung (Kriterien 4 und 7) eine DSFA vor dem Echtbetrieb; Bestätigung durch den DSB offen.
- **Rückverfolgbarkeit von Unternehmern (DSA Art. 30):** entfällt, weil gewerbliche Anbieter ausgeschlossen sind (REQ-LEGAL-003).
- **Verbraucherinformationen für Fernabsatz:** Die Plattform ist nicht Vertragspartei; die Geschäfte schließen Privatpersonen untereinander.

## 4. Grenzen der Übung

- Alle Betreiberangaben sind Platzhalter. Die Go-live-Checkliste (`docs/07-betrieb/go-live-checkliste.md`) verlangt, dass vor einem Echtbetrieb kein `[Platzhalter:` mehr vorkommt.
- Nicht ausgeführt werden: Meldungen an BZSt, Polizei oder Aufsichtsbehörde, Abschluss von AV-Verträgen, Penetrationstest, DSFA (nach der Schwellwertanalyse vor dem Echtbetrieb erforderlich). Diese Schritte stehen in EPIC-12 und in der Go-live-Checkliste.
- Die Widerspruchsfrist beträgt **6 Monate** (DSA Art. 20 Abs. 1). Eine kürzere Frist ist rechtlich nicht zulässig.

## 5. Entscheidungen

Q-22 (Widerspruch im System), Q-23 (Übung mit Platzhaltern, EPIC-13), Q-24 (kein Cookie-Banner), Q-25 (Umfang Englisch), Q-26 (DAC7 nur Auswertung), Q-27 (optionale Compose-Profile), alle vorläufig, im [Entscheidungslog](05-entscheidungen.md).
