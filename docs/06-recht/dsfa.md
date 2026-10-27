---
id: DSFA-CAMPUSMARKT
type: dpia
status: approved
owner: product-owner
version: 1.1
created: 2026-10-25
last_updated: 2026-10-26
review_due: 2027-10-25
---

# Datenschutz-Folgenabschätzung CampusMarkt HWG LU (Übung)

> **Muster im Rahmen einer Übungsaufgabe – fiktive Angaben, nicht rechtsverbindlich (Entscheidung Q-28).** Diese DSFA ist eine Hausaufgabe. Sie folgt dem Aufbau nach Art. 35 Abs. 7 DSGVO. Personen, Stellungnahmen und Termine sind erfunden; die Bewertung bezieht sich auf die tatsächliche Architektur des Docker-Beispiels. Sie wird nie im Echtbetrieb genutzt. Anforderung: REQ-PRIV-007; Anlass: [Schwellwertanalyse](dsfa-schwellwertanalyse.md) (Kriterien 4 und 7 erfüllt).

| Feld | Angabe |
|---|---|
| Verantwortlicher | Hochschule für Wirtschaft und Gesellschaft Ludwigshafen (HWG LU), vertreten durch die Präsidentin Prof. Dr. Erika Mustermann (fiktiv) |
| Durchgeführt von | Projektteam CampusMarkt mit der Stabsstelle Digitale Dienste (fiktiv) |
| Beteiligt | Datenschutzbeauftragte Paula Prüfer (fiktiv); Studierendenvertretung, AStA-Referat Digitales (fiktiv, angehört nach Art. 35 Abs. 9) |
| Grundlage | [VVT](vvt.md) V-1 … V-13, [TOMs](toms.md), [Architektur](../03-architektur/architektur.md), Anforderungskatalog |
| Stand | 2026-10-25 |

## 1. Systematische Beschreibung der Verarbeitung (Art. 35 Abs. 7 lit. a)

**Zweck:** CampusMarkt ist eine Tausch- und Verkaufsplattform nur für Hochschulangehörige. Mitglieder stellen Anzeigen ein, schreiben sich im Chat, verabreden die Übergabe auf dem Campus und markieren Reservierung und Abgabe. Die Hochschule moderiert gemeldete Inhalte nach dem DSA.

**Verarbeitungen** (Einzelheiten im VVT):

| Nr. | Verarbeitung | Daten | Betroffene | Rechtsgrundlage (Übungsannahme Q-28) |
|---|---|---|---|---|
| V-1, V-2 | Konto, Anmeldung | Hochschuladresse, Passwort-Hash, Anzeigename, Rolle, Sitzungen, pseudonymisierte Zähler | Studierende, Beschäftigte | Art. 6 Abs. 1 lit. e DSGVO i. V. m. § 2 HochSchG RLP (Übungswert) |
| V-3 | Anzeigen und Bilder | Texte, Preise, Fotos ohne Metadaten | Mitglieder | lit. e |
| V-4, V-5 | Chat, Kontaktfreigabe | Nachrichten, auf Wunsch E-Mail-Adresse | Mitglieder | lit. e; Kontaktfreigabe lit. a |
| V-6, V-7 | Meldungen, Moderation, Widerspruch, Audit-Log | Meldung, Inhalt, Entscheidung, Begründung | Meldende, Betroffene, Moderation | lit. c i. V. m. DSA |
| V-8 | E-Mail-Benachrichtigungen | Adresse, Art der Mail | Mitglieder | lit. e |
| V-9, V-10 | Protokolle, Metriken, Datensicherung | Request-Log ohne IP, Backups | alle | lit. e, Art. 32 |
| V-11, V-13 | Deals, DAC7-Auswertung | Abschlüsse, Preise; bei Schwelle Steuerdaten | Anbieter | lit. c i. V. m. PStTG |
| V-12 | Kontaktstelle | Anfragen | Anfragende | lit. e, c |

**Umfang (Übungswerte):** ca. 5.000 potenzielle Nutzer, erwartet 1.500 aktive Konten, 400 Anzeigen und 3.000 Nachrichten je Monat, 20 Meldungen je Monat.

**Datenfluss:** Browser → (Reverse Proxy, TLS) → Anwendung → PostgreSQL und Bildspeicher im Rechenzentrum der Hochschule; E-Mails über MusterMail GmbH (fiktiv, Auftragsverarbeiter); Datensicherungen verschlüsselt bei der Musterspeicher GmbH (fiktiv). Keine Drittlandübermittlung, keine Drittanbieter-Ressourcen, kein Tracking.

## 2. Notwendigkeit und Verhältnismäßigkeit (lit. b)

| Prüfpunkt | Bewertung |
|---|---|
| Legitimer Zweck | Förderung von Nachhaltigkeit und Campusleben; Zugang nur für Hochschulangehörige senkt Betrug (Geschäftsziele BG-1 … BG-4) |
| Erforderlichkeit | Ohne Konto keine Zugangsbeschränkung; ohne Chat keine Verabredung; ohne Moderation keine DSA-Pflichten erfüllbar |
| Datenminimierung | keine Klarnamenpflicht (Anzeigename), E-Mail-Adresse nur nach beidseitiger Zustimmung sichtbar, Bilder ohne EXIF, Logs ohne IP, Beweissicherung nur als pseudonymisierte Kopie |
| Speicherbegrenzung | Löschfristen je Kategorie (REQ-PRIV-003), Datensicherungen höchstens 28 Tage, Löschjournal sorgt dafür, dass Löschungen nach einer Wiederherstellung erhalten bleiben |
| Transparenz | Datenschutzerklärung (12 Abschnitte), Hinweis bei neuer Fassung, Begründung jeder Moderationsentscheidung |
| Betroffenenrechte | Export, Berichtigung im Profil, Konto löschen mit 14 Tagen Bedenkzeit, Widerspruch gegen Moderation (6 Monate) |
| Zweckbindung | keine Weitergabe an andere Stellen der Hochschule (z. B. Prüfungsamt); keine Auswertung für andere Zwecke |

Ergebnis: Die Verarbeitung ist für den Zweck erforderlich und angemessen.

## 3. Risikobewertung (lit. c)

**Risikoquellen:** externe Angreifer (Kontoübernahme, Datendiebstahl), böswillige Mitglieder (Belästigung, Betrug, Missbrauch der Meldefunktion), Beschäftigte mit Sonderrechten (Moderation, Administration), technische Fehler (Restore, Löschlauf), Dienstleister.

**Bewertungsmaßstab:** Matrix aus dem [Datenpannen-Prozess](datenpannen-prozess.md): Eintrittswahrscheinlichkeit (gering, mittel, hoch) × Schwere (gering, mittel, hoch). „Brutto“ ohne, „Netto“ mit den umgesetzten Maßnahmen.

| Nr. | Szenario | Schutzziel | Brutto (W × S) | Maßnahmen | Netto (W × S) |
|---|---|---|---|---|---|
| R-1 | **Kontoübernahme** durch geleakte oder erratene Passwörter; Angreifer liest Chats und schreibt im Namen des Mitglieds | Vertraulichkeit, Integrität | hoch × mittel → **hoch** | Argon2id, Leak-Liste und Mindestlänge (REQ-SEC-002/003), Rate-Limit 5 Fehlversuche je Konto und IP (REQ-SEC-005), sichere Sitzungs-Cookies, Abmeldung aller Sitzungen bei Passwortwechsel; später Hochschul-SSO (ADR-0013) | gering × mittel → Risiko |
| R-2 | **Offenlegung von Chats** durch Fehler in der Autorisierung oder durch Einsicht der Moderation | Vertraulichkeit | mittel × hoch → **hoch** | Prüfung je Ressource, Fremde erhalten 404 (REQ-SEC-006), Moderation sieht nur gemeldete Nachricht ± 5 (REQ-PRIV-004), Originaltexte nur im Widerspruch mit Audit-Eintrag, Tests AT-SEC-006 und AT-CHAT-* | gering × hoch → Risiko |
| R-3 | **Profilbildung über Anzeigen**: Rückschluss auf Lebensumstände (Umzug, finanzielle Lage) aus der Anzeigenhistorie | Vertraulichkeit, Nichtverkettung | mittel × mittel → Risiko | Anzeigename statt Klarname, keine öffentliche Anzeigenhistorie, Löschung abgegebener Anzeigen nach 30 Tagen, nur Mitglieder sehen Inhalte, keine Indexierung (REQ-PRIV-008) | gering × gering → kein Risiko |
| R-4 | **Missbrauch der Moderation** (Einsicht ohne Anlass, willkürliche Sperre, Abhängigkeit der Studierenden von der Hochschule) | Vertraulichkeit, Intervenierbarkeit | mittel × hoch → **hoch** | Rollenkonzept, Begründungspflicht mit Regel (REQ-LEGAL-006), unveränderliches Audit-Log, Widerspruch nach Vier-Augen-Prinzip (REQ-LEGAL-007), Zweckbindung, Vertraulichkeitsverpflichtung | gering × mittel → Risiko |
| R-5 | **Datenleck aus der Datensicherung** (Archiv im falschen Speicher, unverschlüsselt) | Vertraulichkeit | mittel × hoch → **hoch** | Verschlüsselung vor dem Verlassen des Servers (age, Schlüssel getrennt), Auftragsverarbeiter in Deutschland, Aufbewahrung höchstens 28 Tage, Zugriff nur Betrieb (ADR-0018, TOMs) | gering × hoch → Risiko |
| R-6 | **Fehlerhafte Löschung oder Wiederherstellung**: gelöschte Daten kommen nach einem Restore zurück oder Daten gehen verloren | Intervenierbarkeit, Verfügbarkeit | mittel × mittel → Risiko | Löschjournal außerhalb der Datenbank, das nach dem Restore erneut abgespielt wird; Restore in temporäre Datenbank mit Rückfall; Restore-Test in CI (AT-AVAIL-003) | gering × gering → kein Risiko |
| R-7 | **Rückrechnung von Pseudonymen**: IP-Adressen aus Rate-Limit-Schlüsseln werden durch Durchprobieren bestimmt | Vertraulichkeit, Nichtverkettung | mittel × gering → Risiko | HMAC-SHA256 mit zufälligem, täglich rotiertem Schlüssel; Vorgänger nach 1 h gelöscht (ADR-0014); Request-Log ohne IP | gering × gering → kein Risiko |
| R-8 | **Belästigung über Kontaktdaten** nach der Kontaktfreigabe | Vertraulichkeit | mittel × mittel → Risiko | Freigabe nur beidseitig, jederzeit widerrufbar, Sperrfrist nach Widerruf, Blockieren blendet Adressen aus (REQ-CHAT-010) | gering × mittel → Risiko |
| R-9 | **Fehlerhafte DAC7-Meldung** (falsche Person, zu viele Daten) | Richtigkeit, Datenminimierung | gering × mittel → Risiko | Auswertung nur aus abgeschlossenen Deals, nur Administration, JSON ohne E-Mail, Audit-Log; Erhebung der Steuerdaten erst bei Erreichen der Schwelle | gering × gering → kein Risiko |

## 4. Abhilfemaßnahmen (lit. d)

Alle Maßnahmen der Tabelle sind im Docker-Beispiel umgesetzt und durch Tests belegt, mit zwei Ausnahmen, die nur im Echtbetrieb greifen:
- Verschlüsselung der Datensicherungen (R-5): als Verfahren beschrieben ([Datensicherung](../07-betrieb/backup-restore.md)), im Beispiel nicht nötig, weil die Sicherungen den Rechner nicht verlassen.
- Hochschul-SSO (R-1): vorbereitet über den IdentityProviderPort (ADR-0013), Anbindung nach Spike S-01.

Zusätzliche Maßnahmen aus dieser DSFA (Übungswerte):

| Nr. | Maßnahme | Zuständig | Termin (fiktiv) |
|---|---|---|---|
| M-1 | Schulung der Moderation zu Begründungen, Zweckbindung und Vertraulichkeit vor dem Start | Moderationsleitung Max Moderato (fiktiv) | vor Go-live |
| M-2 | Jährliche Auswertung des Audit-Logs auf auffällige Zugriffe der Moderation | DSB | jährlich im März |
| M-3 | Penetrationstest nach ASVS L2 ([Plan](../07-betrieb/pentest-plan.md)) | Stabsstelle Digitale Dienste | KW 10/2027 |
| M-4 | Erneute DSFA bei Bezahlfunktion, Bewertungen oder weiteren Hochschulen | Product Owner | bei Änderung |

## 5. Restrisiko und Ergebnis

Nach den Maßnahmen verbleibt kein hohes Risiko. Die Szenarien R-1, R-2, R-4, R-5 und R-8 bleiben als „Risiko“ bestehen und sind durch die Maßnahmen auf ein vertretbares Maß gesenkt. Eine vorherige Konsultation der Aufsichtsbehörde nach Art. 36 DSGVO ist nicht erforderlich.

## 6. Stellungnahme der Datenschutzbeauftragten (fiktiv)

> Die DSFA ist vollständig und nachvollziehbar. Die Datenminimierung im Chat (Kontaktfreigabe, begrenzte Einsicht der Moderation) und das Vier-Augen-Prinzip beim Widerspruch halte ich für besonders wirksam. Ich empfehle, M-1 verbindlich vor dem Start umzusetzen und die Moderationsrechte jährlich zu überprüfen (M-2). Gegen den Start bestehen aus datenschutzrechtlicher Sicht keine Bedenken.
>
> — Paula Prüfer (fiktiv), Datenschutzbeauftragte, 2026-10-25

## 7. Entscheidung des Verantwortlichen (fiktiv)

Die Verarbeitung wird mit den genannten Maßnahmen freigegeben. — Prof. Dr. Erika Mustermann (fiktiv), Präsidentin, 2026-10-25

## 8. Überprüfung

Nächste Überprüfung: 2027-10-25 (jährlich) oder früher bei einer der Änderungen aus M-4 bzw. dem Abschnitt „Neu bewerten, wenn …“ der [Schwellwertanalyse](dsfa-schwellwertanalyse.md).
