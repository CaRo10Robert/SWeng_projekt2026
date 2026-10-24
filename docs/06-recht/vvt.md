---
id: LEGAL-VVT
type: privacy
status: in-review
owner: product-owner
version: 1.0
created: 2026-10-24
last_updated: 2026-10-24
---

# Verzeichnis der Verarbeitungstätigkeiten (Art. 30 DSGVO)

> **Muster im Rahmen einer Übungsaufgabe – keine rechtsverbindlichen Angaben; vom Datenschutzbeauftragten der Hochschule zu prüfen.** Anforderung: REQ-LEGAL-011.

## Allgemeine Angaben

| Feld | Angabe |
|---|---|
| Verantwortlicher | [Platzhalter: Name der Hochschule], [Platzhalter: Anschrift], vertreten durch [Platzhalter: Präsidentin/Präsident] |
| Datenschutzbeauftragte/r | [Platzhalter: Name, E-Mail] |
| Verfahren | CampusMarkt HWG LU – Tausch- und Verkaufsplattform für Hochschulangehörige |
| Fachlich zuständig | [Platzhalter: Organisationseinheit] |
| Technisch zuständig | [Platzhalter: Rechenzentrum bzw. Betriebsteam] |
| Allgemeine Beschreibung der TOMs | siehe [TOMs](toms.md) |
| Drittlandübermittlung | keine |
| Stand | 2026-10-24 |

Rechtsgrundlagen-Kürzel: **e** = Art. 6 Abs. 1 lit. e DSGVO i. V. m. [Platzhalter: Landesdatenschutzgesetz RLP und Hochschulgesetz, genaue Norm prüfen]; **c** = Art. 6 Abs. 1 lit. c DSGVO (rechtliche Pflicht); **a** = Art. 6 Abs. 1 lit. a DSGVO (Einwilligung).

## Verarbeitungstätigkeiten

| Nr. | Tätigkeit | Zweck | Betroffene | Datenkategorien | Rechtsgrundlage | Empfänger | Löschfrist | Bezug |
|---|---|---|---|---|---|---|---|---|
| V-1 | Registrierung und Kontoverwaltung | Zugang nur für Hochschulangehörige, Kontoführung | Studierende, Beschäftigte | E-Mail (Hochschule), Passwort-Hash (Argon2id), Anzeigename, Studiengang (optional), Übergabeorte (optional), Nutzertyp, Rolle, Status, Einwilligungen (Version, Zeit) | e; Einwilligungsnachweis Art. 7 Abs. 1 | intern; Auftragsverarbeiter Hosting | Konto 14 Tage nach Löschantrag; unbestätigt 7 Tage; Einwilligungen 3 Jahre ohne Profilbezug | REQ-AUTH-*, REQ-ACC-*, REQ-PRIV-001/003 |
| V-2 | Anmeldung und Sitzungen | Authentifizierung, Schutz vor Missbrauch | Mitglieder | Sitzungsschlüssel (Hash), Zeitpunkte, Fehlversuchszähler mit pseudonymisierter IP | e; Art. 32 | intern | Sitzung bis Abmeldung, max. 30 Tage; Zähler 7 Tage | REQ-SEC-004/005, ADR-0014 |
| V-3 | Anzeigen und Bilder | Veröffentlichung von Angeboten und Gesuchen für Mitglieder | Mitglieder | Anzeigentexte, Preis, Kategorie, Übergabeorte, Fotos (neu kodiert, ohne EXIF/GPS) | e | andere Mitglieder | sofort bei Löschung; 30 Tage nach Abgabe; 90 Tage nach Ablauf; nicht zugeordnete Bilder 24 h | REQ-LST-*, REQ-SEC-007 |
| V-4 | Nachrichten (Chat) | Kommunikation zur Übergabe | Mitglieder | Nachrichtentexte, Zeitpunkte, Lesestatus | e | Gegenüber; Moderation nur gemeldeter Ausschnitt | 12 Monate nach letzter Nachricht; eigene Texte mit dem Konto | REQ-CHAT-*, REQ-PRIV-004, Q-7 |
| V-5 | Kontaktfreigabe | Austausch der Hochschul-E-Mail nach beidseitiger Zustimmung | Mitglieder | Zustand (zugestimmt, zurückgezogen, abgelehnt), Zeitpunkte, Anzahl Anfragen | a | Gegenüber (nur Adresse, nur bei beidseitiger Zustimmung) | mit Konversation bzw. Konto | REQ-CHAT-010 |
| V-6 | Meldungen, Moderation, Widerspruch | Melde- und Abhilfeverfahren, Begründung, internes Beschwerdemanagement | Meldende, Betroffene | Meldung (Grund, Text), betroffener Inhalt, Entscheidung, Begründung, Widerspruch, Kennzeichen Straftatverdacht | c (DSA Art. 16, 17, 18, 20) | Moderation; bei Art. 18 Strafverfolgungsbehörden | 12 Monate nach Abschluss | REQ-MOD-*, REQ-LEGAL-006…008 |
| V-7 | Audit-Log | Nachvollziehbarkeit von Verwaltungsaktionen | Moderation, Administration, Betroffene | handelnde Person, Aktion, Ziel, Zeit, Begründung | c, e | Administration | 24 Monate | REQ-MOD-003 |
| V-8 | E-Mail-Benachrichtigungen | Kontomails, Hinweise auf Nachrichten und Abläufe, Begründungen | Mitglieder | E-Mail-Adresse, Art der Mail (ohne Nachrichteninhalt) | e | Auftragsverarbeiter E-Mail-Versand | Versandprotokoll [Platzhalter: Frist] | REQ-NOTI-* |
| V-9 | Protokolle, Metriken, Rate-Limits | Betrieb, Fehlersuche, Sicherheit | alle Nutzenden | Zeit, Pfad, Status, Dauer, Korrelations-ID; IP nur als HMAC-Pseudonym mit täglich wechselndem Schlüssel | e; Art. 32 | Betriebsteam | Protokolle [Platzhalter: 14 Tage]; Zähler 7 Tage | REQ-OPS-002, REQ-PRIV-002, ADR-0014 |
| V-10 | Datensicherung | Wiederherstellung nach Störungen | alle | vollständige Kopie von Datenbank und Bildern | Art. 32 | Betriebsteam; ggf. Auftragsverarbeiter Speicher | 30 Tage rollierend | REQ-AVAIL-003, [Backup](../07-betrieb/backup-restore.md) |
| V-11 | Steuermeldung DAC7 | Erfüllung des PStTG | Verkäufer über Schwelle | Identität, Anschrift, Geburtsdatum, Steuer-ID, Anzahl und Summe der Verkäufe je Quartal | c (PStTG) | Bundeszentralamt für Steuern | 10 Jahre nach Meldezeitraum | REQ-LEGAL-009, [DAC7-Konzept](dac7-konzept.md) |
| V-12 | Anfragen an die Kontaktstelle | Beantwortung von Anfragen, Meldungen ohne Konto, Behördenanfragen | Anfragende | Name, E-Mail, Inhalt der Anfrage | e, c | zuständige Stelle der Hochschule | [Platzhalter: z. B. 12 Monate nach Abschluss] | REQ-LEGAL-005 |

## Besondere Kategorien und Minderjährige

Besondere Kategorien (Art. 9 DSGVO) werden nicht gezielt erhoben. In Freitexten (Anzeige, Chat) können sie vorkommen; sie werden nicht ausgewertet. Mitglieder sind Hochschulangehörige; minderjährige Studierende sind möglich, werden aber nicht gesondert behandelt [Platzhalter: mit DSB klären].

## Pflege

Das Verzeichnis wird im selben Pull Request angepasst, der eine neue Verarbeitung einführt (Definition of Done, [Pflegeprozess](README.md#pflegeprozess-für-rechtstexte)).
