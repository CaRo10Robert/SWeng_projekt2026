---
id: LEGAL-VVT
type: privacy
status: in-review
owner: product-owner
version: 1.1
created: 2026-10-24
last_updated: 2026-10-25
---

# Verzeichnis der Verarbeitungstätigkeiten (Art. 30 DSGVO)

> **Muster im Rahmen einer Übungsaufgabe – fiktive Angaben, nicht rechtsverbindlich (Q-28).** Anforderung: REQ-LEGAL-011.

## Allgemeine Angaben

| Feld | Angabe |
|---|---|
| Verantwortlicher | Hochschule für Wirtschaft und Gesellschaft Ludwigshafen (HWG LU), Musterstraße 1, 67059 Ludwigshafen am Rhein (fiktiv), vertreten durch die Präsidentin Prof. Dr. Erika Mustermann (fiktiv) |
| Datenschutzbeauftragte/r | Paula Prüfer (fiktiv), datenschutz@hwg-lu.example, Vertretung: Jonas Vertreter (fiktiv) |
| Verfahren | CampusMarkt HWG LU – Tausch- und Verkaufsplattform für Hochschulangehörige |
| Fachlich zuständig | Stabsstelle Digitale Dienste |
| Technisch zuständig | Rechenzentrum der Hochschule, Team Plattformbetrieb (fiktiv) |
| Allgemeine Beschreibung der TOMs | siehe [TOMs](toms.md) |
| Drittlandübermittlung | keine |
| Stand | 2026-10-24 |

Rechtsgrundlagen-Kürzel: **e** = Art. 6 Abs. 1 lit. e DSGVO i. V. m. dem Landesdatenschutzgesetz RLP und § 2 HochSchG RLP (Übungswert, Q-28); **c** = Art. 6 Abs. 1 lit. c DSGVO (rechtliche Pflicht); **a** = Art. 6 Abs. 1 lit. a DSGVO (Einwilligung).

## Verarbeitungstätigkeiten

| Nr. | Tätigkeit | Zweck | Betroffene | Datenkategorien | Rechtsgrundlage | Empfänger | Löschfrist | Bezug |
|---|---|---|---|---|---|---|---|---|
| V-1 | Registrierung und Kontoverwaltung | Zugang nur für Hochschulangehörige, Kontoführung | Studierende, Beschäftigte | E-Mail (Hochschule), Passwort-Hash (Argon2id), Anzeigename, Studiengang (optional), Übergabeorte (optional), Nutzertyp, Rolle, Status, Sprache, Zustimmung zu den Nutzungsbedingungen und Kenntnisnahme der Datenschutzerklärung (Version, Zeit; keine Einwilligung) | e; Nachweis c i. V. m. Art. 5 Abs. 2 | intern; Auftragsverarbeiter Hosting | Konto 14 Tage nach Löschantrag; unbestätigt 7 Tage; Zustimmungsnachweise 3 Jahre ohne Profilbezug | REQ-AUTH-*, REQ-ACC-*, REQ-PRIV-001/003 |
| V-2 | Anmeldung und Sitzungen | Authentifizierung, Schutz vor Missbrauch | Mitglieder | Sitzungsschlüssel (Hash), Zeitpunkte, Fehlversuchszähler mit pseudonymisierter IP und E-Mail-Adresse (HMAC, ADR-0014) | e; Art. 32 | intern | Sitzung bis Abmeldung, max. 30 Tage; Zähler höchstens 7 Tage (im Beispiel 1 Tag) | REQ-SEC-004/005, ADR-0014 |
| V-3 | Anzeigen und Bilder | Veröffentlichung von Angeboten und Gesuchen für Mitglieder | Mitglieder | Anzeigentexte, Preis, Kategorie, Übergabeorte, Fotos (neu kodiert, ohne EXIF/GPS) | e | andere Mitglieder | sofort bei Löschung; 30 Tage nach Abgabe; 90 Tage nach Ablauf; nicht zugeordnete Bilder 24 h | REQ-LST-*, REQ-SEC-007 |
| V-4 | Nachrichten (Chat) | Kommunikation zur Übergabe | Mitglieder | Nachrichtentexte, Zeitpunkte, Lesestatus | e | Gegenüber; Moderation nur gemeldeter Ausschnitt | 12 Monate nach letzter Nachricht; eigene Texte mit dem Konto | REQ-CHAT-*, REQ-PRIV-004, Q-7 |
| V-5 | Kontaktfreigabe | Austausch der Hochschul-E-Mail nach beidseitiger Zustimmung | Mitglieder | Zustand (zugestimmt, zurückgezogen, abgelehnt), Zeitpunkte, Anzahl Anfragen | a | Gegenüber (nur Adresse, nur bei beidseitiger Zustimmung) | mit Konversation bzw. Konto | REQ-CHAT-010 |
| V-6 | Meldungen, Moderation, Widerspruch | Melde- und Abhilfeverfahren, Begründung, internes Beschwerdemanagement | Meldende, Betroffene | Meldung (Grund, Text), betroffener Inhalt, Entscheidung, Begründung, Regel, Rechtsgrundlage, Mitteilungen im Konto, Widerspruch, Einmal-Links (Hash), Originaltexte entfernter Nachrichten, Kennzeichen Straftatverdacht, Beweissicherung als pseudonymisierte Kopie (Inhalt mit ± 5 Nachrichten Kontext) | c (DSA Art. 16, 17, 18, 20; Übungsannahme Q-28: DSA anwendbar) | Moderation (Originaltext nur im Widerspruch, protokolliert); bei Art. 18 Strafverfolgungsbehörden | 12 Monate nach Abschluss; Originaltexte 6 Monate (nicht bei offenem Widerspruch); Einmal-Links bis Fristende (6 Monate); Beweissicherung bis Freigabe, höchstens 6 Monate | REQ-MOD-*, REQ-LEGAL-006…008 |
| V-7 | Audit-Log | Nachvollziehbarkeit von Verwaltungsaktionen | Moderation, Administration, Betroffene | handelnde Person, Aktion, Ziel, Zeit, Begründung | c, e | Administration | 24 Monate | REQ-MOD-003 |
| V-8 | E-Mail-Benachrichtigungen | Kontomails, Hinweise auf Nachrichten und Abläufe, Begründungen | Mitglieder | E-Mail-Adresse, Art der Mail (ohne Nachrichteninhalt) | e | Auftragsverarbeiter E-Mail-Versand | Versandprotokoll 30 Tage (Übungsannahme Q-28) | REQ-NOTI-* |
| V-9 | Protokolle, Metriken, Rate-Limits | Betrieb, Fehlersuche, Sicherheit | alle Nutzenden | Request-Log: Zeit, Methode, Route ohne Query, Status, Dauer, Request-ID – keine IP-Adresse, kein Port, keine Tokens; Rate-Limit-Zähler mit IP und E-Mail nur als HMAC-Pseudonym (Schlüssel täglich neu, Vorgänger nach 1 h gelöscht) | e; Art. 32 | Betriebsteam | Protokolle 14 Tage (Übungsannahme Q-28); Zähler höchstens 7 Tage (im Beispiel 1 Tag); Schlüssel 25 h | REQ-OPS-002, REQ-PRIV-002, ADR-0014 |
| V-10 | Datensicherung | Wiederherstellung nach Störungen | alle | vollständige Kopie von Datenbank und Bildern; Löschjournal (nur Art, ID, Zeitpunkt einer Löschung) | e i. V. m. Art. 32; Löschjournal c i. V. m. Art. 17 | Betriebsteam; ggf. Auftragsverarbeiter Speicher | Sicherungen höchstens 28 Tage rollierend (7 Tage täglich, danach wöchentlich, auch die neueste); Löschjournal 35 Tage | REQ-AVAIL-003, [Backup](../07-betrieb/backup-restore.md) |
| V-11 | Steuermeldung DAC7 | Erfüllung des PStTG | Verkäufer über Schwelle | Identität, Anschrift, Geburtsdatum, Steuer-ID, Anzahl und Summe der Verkäufe je Quartal | c (PStTG; Übungsannahme Q-28: Meldepflicht besteht, § 3 greift nicht) | Bundeszentralamt für Steuern | 10 Jahre nach Meldezeitraum (§ 22 PStTG, Übungswert) | REQ-LEGAL-009, [DAC7-Konzept](dac7-konzept.md) |
| V-12 | Anfragen an die Kontaktstelle | Beantwortung von Anfragen, Meldungen ohne Konto, Behördenanfragen | Anfragende | Name, E-Mail, Inhalt der Anfrage | e, c | zuständige Stelle der Hochschule | 12 Monate nach Abschluss der Anfrage (Übungsannahme Q-28) | REQ-LEGAL-005 |
| V-13 | Reservierung und Abgabe (Deals) | Reservierung bzw. Abgabe an genau eine Person, Grundlage der DAC7-Auswertung | Anbieter, Interessenten | Anzeige, beide Konten, vereinbarter Preis, Zeitpunkte, Status | e | beide Beteiligten; Administration (DAC7-Auswertung) | mit der Konversation bzw. dem Konto; DAC7-relevante Angaben im Echtbetrieb vor Löschung sichern (offener Punkt) | REQ-CHAT-011, REQ-LEGAL-009 |

## Besondere Kategorien und Minderjährige

Besondere Kategorien (Art. 9 DSGVO) werden nicht gezielt erhoben. In Freitexten (Anzeige, Chat) können sie vorkommen; sie werden nicht ausgewertet. Mitglieder sind Hochschulangehörige; minderjährige Studierende sind möglich, werden aber nicht gesondert behandelt (Übungsannahme Q-28: kein besonderer Schutzbedarf, weil Volljährigkeit der Studierenden die Regel ist und keine altersbezogenen Inhalte angeboten werden).

## Pflege

Das Verzeichnis wird im selben Pull Request angepasst, der eine neue Verarbeitung einführt (Definition of Done, [Pflegeprozess](README.md#pflegeprozess-für-rechtstexte)).
