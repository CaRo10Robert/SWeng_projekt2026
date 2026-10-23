---
id: REV-001
type: review
status: open
owner: team-architektur
version: 0.1
created: 2026-10-20
---

# Review des Entwurfs v0.1

**Gegenstand:** Analyse, Use Cases, Anforderungen, Backlog, Architektur und ADRs (Stand 2026-10-20)
**Prüfmaßstab:** DEV Guideline (Kap. 01, 02, 05–08, 12, 14), Anforderungsqualität nach IEEE 29148, Machbarkeit im Semester
**Prüfer:** Claude (Selbstreview, KI-Entwurf). Laut Guideline Kap. 12 und 13 muss ein Mensch alles im Bereich *Explanation* (ADRs, Begründungen) prüfen und verantworten.

Schweregrade: 🔴 muss vor dem Baseline-Stand geklärt werden · 🟠 sollte geklärt werden · 🟢 Hinweis

## 1. Gesamturteil

Der Entwurf deckt die Aufgabenstellung vollständig ab: Kleinanzeigen-Konzept, Wettbewerbsanalyse, Use Cases, Requirements, Architektur, Bezahlung als Erweiterung, Domain-Whitelist, E-Mail und Chat. Er ist methodisch guideline-konform (arc42, C4, ADRs, MoSCoW, SLI/SLO, Traceability). **Die größten Schwächen sind nicht technisch, sondern liegen im Umfang und in der Organisation:** Der Entwurf ist für ein Semesterprojekt eher zu groß. Außerdem sind Betreiberrolle, Hosting und Teamfähigkeiten ungeklärt, und davon hängen mehrere Entscheidungen ab.

## 2. Befunde

### Fachlich (F)

| ID | | Befund | Vorschlag |
|---|---|---|---|
| F-1 | 🔴 | **Kritische Masse** ist das größte Produktrisiko (ca. 4.200 Studierende plus Beschäftigte). Es gibt nur wenige Anforderungen, die gezielt darauf einzahlen | Gesuche und „Verschenken“ prominent machen, Launch zum Semesterstart, AStA-Kooperation. Ggf. EPIC-10 (weitere Hochschulen) früher einplanen |
| F-2 | 🟠 | **Gäste sehen nichts** (UC-13: Vorbedingung angemeldet). Das schützt die Privatsphäre, verhindert aber, dass Neugierige erst stöbern und sich dann registrieren. Zudem widerspricht es teilweise REQ-LST-009 (Teilen-Link mit Vorschau) | Entscheidung Q-1 |
| F-3 | 🟠 | **WG-Zimmer, Dienstleistungen (Nachhilfe) und Leihen** sind für Studierende hochrelevant, aber nicht im Scope. WG-Zimmer bringen eigene rechtliche Fragen mit (Mietrecht, Diskriminierungsschutz) | Entscheidung Q-9. Vorschlag: „Leihen“ als Preistyp in R2, Wohnen bleibt Won't |
| F-4 | 🟠 | **Plus-Adressierung** (BR-01 #6): Ob die Hochschul-Mailserver `+`-Suffixe unterstützen, ist unbekannt. Die Normalisierung könnte echte, unterschiedliche Postfächer zusammenfassen oder Doppelkonten zulassen | Mit dem RZ klären. Bis dahin `+` im lokalen Teil **ablehnen** (sicherere Variante) |
| F-5 | 🟠 | **Funktionspostfächer** (`asta@`, `info@`) mit `@hwg-lu.de` können sich registrieren. Dann teilen sich mehrere Personen ein Konto | Q-2. Optionen: zulassen und als „Organisation“ kennzeichnen, oder sperren |
| F-6 | 🟢 | **Minderjährige Studierende** (Frühstudium, unter 18) können Verträge nur eingeschränkt schließen | In den AGB regeln, technisch keine Maßnahme im MVP |
| F-7 | 🟢 | Bewertungen (REQ-MOD-006) sind nur mit dem Status `abgegeben` verknüpft, der Anbieter kann das aber einseitig setzen | In R2 die Bestätigung durch den Käufer verlangen (z. B. per QR-Code bei der Übergabe, Backlog) |

### Architektur (A)

| ID | | Befund | Vorschlag |
|---|---|---|---|
| A-1 | 🔴 | **Komplexität vs. Teamkapazität.** Outbox, Worker, Redis, S3, WebSocket-Fan-out, OTel und Grafana sind „lehrbuchrichtig“, aber zusammen viel Infrastruktur für ein Semester | **Zwei Profile** definieren: *MVP-Light*: 1 API-Instanz (Redis Pub/Sub kann bleiben, wird aber nicht gebraucht), Sentry oder Grafana Cloud Free statt eigenem Grafana-Stack, Managed Postgres. *Ziel-Architektur*: wie dokumentiert. Die Modulgrenzen und die Outbox bleiben in **beiden** Profilen, denn sie sind billig und tragen ADR-0006 |
| A-2 | 🔴 | **Tech-Stack hängt von den Teamfähigkeiten ab** (Q-8). Wenn das Team primär Java kann, ist Spring Boot + Spring Modulith die bessere Wahl (Guideline: „Team's existing expertise beats …“) | Q-8 beantworten, dann ADR-0002 auf *Accepted* setzen oder ersetzen |
| A-3 | 🟠 | **Hochschul-SSO (Shibboleth, DFN-AAI)** wäre die stärkste Verifikation und würde Passwort-Handling, Re-Verifikation und Exmatrikulationsproblem (Risiko R-3) auf einen Schlag lösen. Es ersetzt aber die geforderte E-Mail-Registrierung | Beim RZ anfragen, ob ein SAML-SP-Eintrag für ein Studienprojekt möglich ist. Falls ja: als Option neben E-Mail in R2 |
| A-4 | 🟠 | **Chat-Moderation vs. Vertraulichkeit:** Moderatoren sehen gemeldete Nachrichten ± 5. Das ist begründbar (DSA), muss aber in der Datenschutzerklärung stehen und ggf. in einer DSFA bewertet werden | Mit dem DSB der Hochschule abstimmen (REQ-PRIV-007) |
| A-5 | 🟢 | **Deal-Konzept im MVP:** Ohne Bezahlung ist „Deal“ fachlich nur eine Reservierung. Es besteht die Gefahr der Über-Modellierung | Minimal halten: `Deal` = (Konversation, Preis, Status), drei Events. Mehr erst mit EPIC-09 |
| A-6 | 🟢 | Die C4-Diagramme sind als Mermaid-Flowcharts umgesetzt (robuster als die experimentelle Mermaid-C4-Syntax). Level und Typ stehen in jedem Knoten | Beibehalten. Bei Bedarf später Structurizr DSL |

### Guideline-Konformität und Dokumentation (D)

| ID | | Befund | Vorschlag |
|---|---|---|---|
| D-1 | 🟠 | **PlantUML für Use-Case-Diagramme:** Die Guideline erlaubt PlantUML, aber GitHub und VS Code rendern es nicht ohne Erweiterung. Mermaid hat keine UML-Use-Case-Notation | Optionen: (a) PlantUML lassen und in CI SVGs rendern (empfohlen, lehrbuchkonform), (b) Mermaid-Flowchart als Näherung (nicht lehrbuchkonform) |
| D-2 | 🟠 | **Front Matter pro Anforderung** wird noch nicht umgesetzt (Sammelkatalog). Vorläufige Abweichung, im Katalog dokumentiert | Nach Freigabe eine Datei pro REQ erzeugen (skriptbar) und CI-Checks für eindeutige IDs und gültige Referenzen einrichten |
| D-3 | 🟠 | **Owner und Reviewer** sind Platzhalter (`team-produkt`, `team-architektur`). Die Guideline verlangt benannte Owner, für High-Risk-Anforderungen benannte Reviewer | Rollen im Team verteilen (PO, Architektur, QA, Security) |
| D-4 | 🟠 | **Noch fehlende Guideline-Artefakte:** SLO-Dateien nach Template, Threat Model (STRIDE), Teststrategie (Kap. 09), CI/CD-Design (Kap. 10), Runbooks, DoR/DoD für das Team | Als EPIC-00 (R0) einplanen. Gehört in den nächsten Iterationsschritt |
| D-5 | 🟢 | Fakten aus der Wettbewerbsanalyse (Gebühren, Urteile) ändern sich schnell. Mit \* markierte Angaben sind Annahmen | Vor der Abgabe noch einmal prüfen. Umfrage unter Studierenden für die Gewichtung (Q-6) |

### Rechtlich und organisatorisch (O)

| ID | | Befund | Vorschlag |
|---|---|---|---|
| O-1 | 🔴 | **Wer ist Betreiber?** Davon hängen Impressum (DDG), DSGVO-Verantwortlicher, DSA-Pflichten, AV-Verträge und der Betrieb nach Projektende ab (Q-3) | Mit Betreuer/in klären: Hochschule als Betreiber (RZ-Hosting), Studierendenschaft (AStA) oder reine Demo-Instanz ohne echten Betrieb |
| O-2 | 🟠 | **Zustellbarkeit an `@studmail.hwg-lu.de`** ist unbekannt (Risiko R-2), aber geschäftskritisch | Spike in R0: Testmails von der Kandidaten-Absenderdomain an echte Postfächer des Teams |
| O-3 | 🟢 | Rechtliche Pflichten der Bezahlfunktion (ZAG, DAC7, Verbraucherrecht) sind im Backlog als Spike erfasst, nicht im MVP | ok |

## 3. Offene Fragen an das Team

| ID | Frage | Betrifft |
|---|---|---|
| Q-1 | Dürfen Gäste Anzeigen sehen (komplett, nur Vorschau oder gar nicht)? | F-2, UC-13, REQ-LST-009 |
| Q-2 | Funktionspostfächer zulassen? Gibt es weitere Hochschuldomains (z. B. für Lehrbeauftragte, Alumni)? | F-5, BR-01 |
| Q-3 | Betreiber und Hosting: Hochschul-RZ, EU-Cloud oder nur Demo? | O-1, §7 |
| Q-4 | Eskalationsweg bei strafbaren Inhalten (wer an der Hochschule)? | UC-32 |
| Q-5 | Zeitplan: Abgabetermine, Sprintlänge, Teamgröße? | Backlog §2 |
| Q-6 | Machen wir eine kurze Umfrage zur Validierung (Bedarf, Gewichtung)? | Wettbewerbsanalyse §3 |
| Q-7 | Aufbewahrung von Chats: 12 Monate nach der letzten Nachricht ok? | §8.4 |
| Q-8 | Welche Sprachen und Frameworks beherrscht das Team (TypeScript/React vs. Java/Spring)? | A-2, ADR-0002 |
| Q-9 | WG-Zimmer, Dienstleistungen, Leihen: im Scope? | F-3 |
| Q-10 | Produktname (Arbeitstitel „CampusMarkt“)? | – |

## 4. Entscheidungslog (nach Review)

| Datum | Frage / Befund | Entscheidung | Auswirkung |
|---|---|---|---|
| 2026-10-20 | Q-3 Betreiber/Hosting | **Kein öffentliches Hosting, nur ein Docker-Beispiel** (Auftraggeber) | ADR-0010 (Accepted). ADR-0002/0004/0005/0007 angepasst: kein Redis, kein S3, React-SPA in Fastify, pg-boss. Architektur v0.2, Anforderungen v0.2 |
| 2026-10-20 | O-1 Betreiberrolle | **Erledigt** für das Projekt, ins Backlog EPIC-12 verschoben | REQ-PRIV-005/007, REQ-NOTI-004, REQ-AVAIL-* sind N/A (Beispiel) |
| 2026-10-20 | O-2 Zustellbarkeit | **Erledigt** (Mailpit), → EPIC-12 | Risiko R-2 entfällt |
| 2026-10-20 | A-1 Komplexität | **Weitgehend gelöst:** 3 Compose-Services statt 7, ein Anwendungs-Image | Neues Risiko R-6: Lauffähigkeit auf Prüfrechnern |
| 2026-10-20 | **Neu Q-11** | Ist „ein Docker-Container“ wörtlich gemeint? Vorschlag: 1 eigenes Image + Postgres + Mailpit als Compose. Wörtlich 1 Container hieße eingebettete DB (SQLite) und damit Verlust der Postgres-Volltextsuche sowie eine Guideline-Ausnahme | offen |

## 5. Empfohlene nächste Iteration

1. Q-11, Q-5 und Q-8 beantworten (Q-3 ist erledigt), weil sie Umfang und Stack bestimmen. Danach ADR-0001 bis 0003 auf *Accepted* setzen.
2. Q-1, Q-2 und Q-9 beantworten, dann Use Cases und Anforderungen anpassen und Version 0.2 erstellen.
3. A-1 entscheiden (MVP-Light vs. Zielprofil).
4. EPIC-00 ausarbeiten: Teststrategie, CI/CD-Pipeline, Threat Model, SLO-Dateien, DoR/DoD.
5. Anforderungen in Einzeldateien mit Front Matter überführen (D-2) und das Repo initialisieren (Git, Monorepo-Skelett).
