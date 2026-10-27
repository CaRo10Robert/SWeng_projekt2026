---
id: MAN-LEGAL-013
type: evidence
requirement: REQ-LEGAL-013
status: done
owner: security-lead
date: 2026-10-26
---

# MAN-LEGAL-013 Tabletop-Übung Datenpanne „Datensicherung auf öffentlicher Freigabe“

> **Übungsaufgabe:** Szenario, Personen, Zahlen und Aktenzeichen sind frei erfunden (Q-28). Es gab keinen echten Vorfall und keine echte Meldung an eine Behörde.

## Ziel

Nachweis für REQ-LEGAL-013: Der [Datenpannen-Prozess](../../06-recht/datenpannen-prozess.md) wird an einem realistischen Szenario durchgespielt, von der Kenntnis bis zur Meldung binnen 72 h. Geprüft werden Rollen, Fristen, Risikomatrix, Vorlagen und die Verknüpfung mit dem Incident-Prozess.

## Umgebung und Teilnehmende (fiktiv)

| Rolle laut Prozess | Person (fiktiv) |
|---|---|
| Betrieb / `security-lead` (Moderation der Übung) | Lena Betrieb |
| Datenschutzbeauftragte | Paula Prüfer |
| Hochschulleitung (Verantwortlicher) | Präsidentin Prof. Dr. Erika Mustermann |
| Pressestelle | Tom Presse |
| Beobachtung und Protokoll | Fork H1 |

Format: Planspiel am Tisch, 60 min, Uhrzeiten des Szenarios simuliert.

## Szenario

Ein Teammitglied hat für einen Test die Datensicherung `backups/20261020T020000Z/` (unverschlüsselt: `db.dump`, `uploads.tar.gz`) auf eine Cloud-Freigabe kopiert und dabei versehentlich „Jeder mit dem Link“ gewählt. Den Link hat es in einem öffentlichen Ticket des Hochschul-Forums gepostet. Eine Studentin meldet am Montag, 19.10.2026, 09:10 Uhr per Mail an die Kontaktstelle: „Unter dem Link liegt eine Datenbank von CampusMarkt.“

## Ablauf mit Zeitleiste (simuliert)

| Zeit | Schritt (Prozess) | Wer | Entscheidung / Ergebnis |
|---|---|---|---|
| Mo 09:10 | **Erfassen**: Mail an die Kontaktstelle | Kontaktstelle → Lena Betrieb | Vorfallprotokoll DP-2026-001 angelegt, Zeitpunkt der Kenntnis = Mo 09:10 (Beginn der 72-h-Frist) |
| Mo 09:25 | **Sofortmaßnahmen** | Lena Betrieb | Freigabe gelöscht, Ticket-Beitrag vom Forum-Admin entfernt; Zugriffsprotokoll der Freigabe gesichert: 3 Downloads von unbekannten IP-Adressen seit Fr 16:40 |
| Mo 09:40 | Übergang aus dem Incident-Prozess | Lena Betrieb | Als SEV-1 mit Datenbezug eingestuft → Datenpannen-Prozess; DSB informiert |
| Mo 11:00 | **Bewerten** (≤ 24 h) | Lena Betrieb, Paula Prüfer | Betroffene Daten: rund 1.850 Konten (E-Mail, Anzeigename, Passwort-Hash Argon2id), rund 3.400 Anzeigen mit Bildern, rund 12.000 Chatnachrichten, Moderationsfälle. Matrix: Wahrscheinlichkeit **hoch** (3 Downloads), Schwere **hoch** (vollständige Chats, Hashes) → **hohes Risiko → melden und benachrichtigen** |
| Mo 14:00 | Technische Folgemaßnahmen | Lena Betrieb | Alle Sitzungen beendet, Passwortwechsel für alle Konten erzwungen *(siehe Befund T-2)*; Abmelde-Geheimnis und IP-Pepper neu erzeugt |
| Di 10:00 | **Entscheidung** Meldung und Benachrichtigung | Prof. Dr. Erika Mustermann | freigegeben |
| Di 14:00 | **Meldung an die Aufsicht** (LfDI RLP, Online-Formular, Übungsannahme) | Paula Prüfer im Auftrag | Meldung nach Art. 33 abgegeben, **T0 + 28 h 50 min** (Frist 72 h eingehalten); Aktenzeichen fiktiv: LfDI-2026-0815 |
| Di 16:00 | **Benachrichtigung Betroffener** (Art. 34) | Hochschulleitung, Text Pressestelle | Mail an alle Konten nach Vorlage; Hinweis auf der Startseite (Ankündigungsbanner) |
| Di 16:30 | Pressestelle | Tom Presse | Kurzstatement vorbereitet, nur auf Anfrage |
| bis 02.11. | **Nachbereitung** | Team | Postmortem, Backlog-Einträge, TOMs angepasst |

## Ausgefülltes Meldeformular (fiktiv, Art. 33 Abs. 3)

| Feld | Inhalt |
|---|---|
| Verantwortlicher, Kontakt DSB | HWG LU, Präsidentin Prof. Dr. Erika Mustermann; DSB Paula Prüfer, datenschutz@hwg-lu.example (fiktiv) |
| Zeitpunkt der Verletzung / der Kenntnis | Fr 16.10.2026, 16:40 (Freigabe erstellt) / Mo 19.10.2026, 09:10 |
| Art der Verletzung | Vertraulichkeit (unbefugte Offenlegung einer Datensicherung) |
| Kategorien und ungefähre Zahl der Betroffenen | ca. 1.850 Studierende und Beschäftigte |
| Kategorien und ungefähre Zahl der Datensätze | ca. 1.850 Konten (E-Mail, Name, Passwort-Hash), 3.400 Anzeigen mit Bildern, 12.000 Chatnachrichten, 40 Moderationsfälle |
| Wahrscheinliche Folgen | Phishing an Hochschuladressen, Offenlegung privater Absprachen, Offline-Angriffe auf Passwort-Hashes (durch Argon2id stark erschwert) |
| Ergriffene und geplante Maßnahmen | Freigabe gelöscht, Sitzungen beendet, Passwortwechsel erzwungen, Geheimnisse rotiert; Sicherungen künftig verschlüsselt, Freigaben auf Sicherungsordner technisch gesperrt |
| Benachrichtigung der Betroffenen | ja, Di 20.10.2026, 16:00, per E-Mail |

## Ergebnis gegen das Akzeptanzkriterium

| Kriterium aus REQ-LEGAL-013 | Ergebnis |
|---|---|
| Rollen inkl. DSB und Hochschulleitung mit Erreichbarkeit | vorhanden und im Szenario tragfähig |
| Ablauf mit Fristen (Bewertung ≤ 24 h, Meldung ≤ 72 h) | eingehalten: Bewertung nach 1 h 50 min, Meldung nach 28 h 50 min |
| Risikomatrix | angewendet, eindeutiges Ergebnis |
| Vorlagen Meldung, Dokumentation, Benachrichtigung | genutzt; Lücken siehe T-3, T-4 |
| Verknüpfung mit dem Störungsprozess | vorhanden (Übergang bei SEV-1 mit Datenbezug) |
| Übung protokolliert | **bestanden** (dieses Dokument) |

## Lessons learned und Befunde

| Nr. | Befund | Vorschlag |
|---|---|---|
| T-1 | Sicherungen sind im Beispiel unverschlüsselt (ADR-0018 sieht Verschlüsselung nur im Echtbetrieb vor). Das war die eigentliche Ursache der Schwere. | Verschlüsselung der Sicherungen (z. B. `age`) auch im Beispiel als Option; TOMs ergänzen |
| T-2 | Es gibt keine Admin-Funktion, mit der man alle Sitzungen beenden und einen Passwortwechsel für alle Konten erzwingen kann. In der Übung blieb das eine Annahme. | Backlog: Notfallfunktion „alle Sitzungen beenden / Passwortwechsel erzwingen“ mit Audit-Log |
| T-3 | Für Teilmeldungen (Art. 33 Abs. 4, Meldung in Schritten) gibt es keine eigene Vorlage. | Feld „Teilmeldung / Nachtrag Nr.“ in der Meldevorlage |
| T-4 | Die Vorlage für die Benachrichtigung siezt, die App duzt. | Ton der Vorlage an die Oberfläche angleichen (Duzen) |
| T-5 | Für die Gruppe „alle Konten“ fehlt ein Weg, die Betroffenen per Mail zu benachrichtigen (Rundmail). | Rundmail-Funktion für Administratoren oder dokumentierter Export der Adressen |
| T-6 | Nicht geregelt: wer Zugriff auf Sicherungen hat und ob Kopien außerhalb des Servers erlaubt sind. | Regel im Betriebshandbuch und in den TOMs: Sicherungen nur auf dem Sicherungsziel, keine Kopien auf Freigaben |

## Folgeaufgaben

- T-1, T-6: TOMs und `backup-restore.md`.
- T-2, T-5: Backlog-Einträge (Echtbetrieb).
- T-3, T-4: Vorlagen in `datenpannen-prozess.md` anpassen.
- Nächste Übung: in einem Jahr, Szenario „Kontoübernahme durch Credential Stuffing“.
