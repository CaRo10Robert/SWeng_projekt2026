---
id: CASE-GAP
type: analysis
status: in-review
owner: team-produkt
version: 1.1
created: 2026-10-23
last_updated: 2026-10-23
source: "MWI131 Software Engineering, Kap. 2 „Requirements und iterative Entwicklung“ (P. Weber, 2026)"
---

# Abgleich mit der Fallstudie (MWI131, Kapitel 2)

Dieses Dokument extrahiert die Anforderungen der Fallstudie aus der Vorlesung, gleicht sie mit unserem Anforderungsstand v0.2 ab und hält pro Abweichung fest, wie wir damit umgehen. Einfache Punkte sind direkt übernommen (Spalte „Umsetzung“). Punkte mit Tragweite sind als offene Entscheidung markiert.

## 1. Extrahierte Anforderungen der Fallstudie

### 1.1 Inhaltliche Constraints (Folie 2)

| ID | Vorgabe der Fallstudie | Art |
|---|---|---|
| FS-C1 | **Datenschutz:** Kontaktdaten von Käufern und Verkäufern werden erst nach **beidseitiger Zustimmung** sichtbar gemacht. | Constraint (Privacy) |
| FS-C2 | **Accessibility:** Das Angebotsformular und zentrale Nutzerfunktionen sind **vollständig per Tastatur bedienbar** und barrierearm nutzbar. | Constraint (Usability) |
| FS-C3 | **Security:** Die Anmeldung erfolgt über die **Hochschulkennung**. | Constraint (Security) |
| FS-C4 | **Security:** Angebote dürfen **ausschließlich von verifizierten Nutzern** erstellt werden. | Constraint (Security) |
| FS-C5 | Constraints werden in **überprüfbare Anforderungen** überführt (Operationalisierung) und sind über Anforderung, Design, Umsetzung und Test **nachvollziehbar und messbar**. Die Technologiewahl berücksichtigt sie. | Methodik |

### 1.2 Methodische Vorgaben (Folien 3–27)

| ID | Vorgabe | Folie |
|---|---|---|
| FS-M1 | Iteratives Vorgehensmodell (z. B. Scrum) mit Rollen, Aktivitäten und Artefakten; Tailoring erlaubt | 3–8 |
| FS-M2 | Anforderungen schriftlich fixiert, getrennt in funktional, nichtfunktional und Domänenanforderungen; funktionale Anforderungen **vollständig und konsistent** | 11 |
| FS-M3 | Qualitätsanforderungen mit **Qualitätsmerkmal, Metrik, Akzeptanzkriterium** sowie eindeutigem **Messverfahren und -kontext** | 12 |
| FS-M4 | **Kano-Modell** zur Kategorisierung und Priorisierung (Basis-, Leistungs-, Begeisterungsmerkmale) | 13 |
| FS-M5 | Anforderungen in vorstrukturierten Formularen statt Prosa, ergänzend grafisch; **keine technischen Lösungsideen in der Spezifikation** | 14–15 |
| FS-M6 | Anforderungsquellen: Projekteigner, Team, Fachanwender, Stakeholder, technische Beschränkungen, Wettbewerber, Recht | 15 |
| FS-M7 | **Validierung**: Verfeinern und Ausdünnen; Ziele Verifizierbarkeit, Verständlichkeit, Anpassungsfähigkeit, Widerspruchsfreiheit | 16 |
| FS-M8 | User Stories nach **INVEST** validiert, mit **Akzeptanzkriterien** (von außen beobachtbar, eindeutig, testbar) | 17–18 |
| FS-M9 | **Definition of Done** als prüfbare Checkliste, zu Projektstart vereinbart, regelmäßig aktualisiert | 19 |
| FS-M10 | Abwägung User Story vs. Use Case nach Komplexität und Detailgrad | 20 |
| FS-M11 | Use-Case-Dokument mit **Name, Beschreibung, Akteure, Normalablauf, Alternativabläufe, Vorbedingungen, Nachbedingungen** | 21–22 |
| FS-M12 | **Backlog** priorisiert nach Wert (Kano), Risiko (ggf. Spike), Abhängigkeiten, Aufwand; Priorisierung z. B. **Value-vs.-Effort oder WSJF**; regelmäßig verfeinert | 23 |
| FS-M13 | **Aufwandsschätzung** mit etablierten Verfahren (Bottom-up/Top-down, parametrisch, Analogie, Experten), regelmäßig aktualisiert | 24–25 |
| FS-M14 | **Nachverfolgbarkeit**: Warum gibt es die Anforderung, Bearbeitungsstand (Platzhalter → konkretisiert → Design → Umsetzung → Test → Freigabe), Rückverfolgung Code → Anforderung über **dieselbe ID** in Issue-Tracking, Versionsverwaltung und CI; aggregierte Stände (z. B. % freigegeben) | 26 |
| FS-M15 | **Change-Management** für Anforderungsänderungen (vollständiger Änderungsprozess, feste Termine, Feature Freeze) | 27 |

### 1.3 Aufgabe II (Folie 28)

| ID | Aufgabe |
|---|---|
| FS-A | Prozesse und Prozessschritte festlegen, die prototypisch bearbeitet werden, und was **out of scope** ist |
| FS-B | Constraints definieren, in Anforderungen überführen und **Prüfbarkeit** festlegen |
| FS-C | Anforderungen für die Schwerpunkte erfassen, **validieren** und daraus einen **Backlog** aufbauen |

## 2. Abgleich und Abweichungen

Legende Status: ✅ bereits erfüllt · 🟡 teilweise erfüllt · ❌ fehlt · ⚠️ inhaltlicher Widerspruch

| # | Fallstudie | Stand v0.2 | Status | Umsetzung |
|---|---|---|---|---|
| A-1 | FS-C1 Kontaktdaten erst nach beidseitiger Zustimmung | Kontaktdaten werden **nie** gezeigt, Kommunikation nur im Chat (REQ-CHAT-001, REQ-PRIV-002) | ⚠️ | **Übernommen.** Neue Anforderung REQ-CHAT-010 und Use Case UC-25 „Kontaktdaten freigeben“: Beide Teilnehmer einer Konversation stimmen zu, erst dann sieht jeder die Hochschul-E-Mail-Adresse des anderen. Zustimmung ist widerrufbar. REQ-PRIV-002 und REQ-CHAT-001 werden angepasst (Version 2). |
| A-2 | FS-C2 Tastaturbedienbarkeit | WCAG 2.2 AA als Must (REQ-A11Y-001), aber ohne Metrik und ohne Test | 🟡 | **Übernommen.** Neue Anforderung REQ-A11Y-002 mit Metrik: Kernabläufe (Anmelden, Suchen, Anzeige erstellen inkl. Bild, Nachricht senden, Melden, Kontaktfreigabe) automatisiert **nur per Tastatur** durchlaufbar; axe-core: 0 Verstöße der Stufen `serious`/`critical` auf den Kernseiten. |
| A-3 | FS-C3 Anmeldung über die Hochschulkennung | Anmeldung mit verifizierter **Hochschul-E-Mail-Adresse** und eigenem Passwort (ADR-0003). SSO über Shibboleth/DFN-AAI im Backlog (INST-04, OPS-08) | ⚠️ | **Dokumentierte Abweichung** nach vorläufiger Entscheidung Q-12 (Option C, [Entscheidungslog](05-entscheidungen.md), ADR-0013): Die Hochschulkennung wird durch die verifizierte Hochschuladresse repräsentiert; die Anmeldung ist austauschbar gekapselt (REQ-AUTH-009, Must). **Mit Dozent/in abzustimmen** (Spike S-01). |
| A-4 | FS-C4 Angebote nur von verifizierten Nutzern | Implizit erfüllt (nur verifizierte Konten können sich anmelden), aber nicht als prüfbare Anforderung formuliert | 🟡 | **Übernommen.** Neue Anforderung REQ-SEC-011 mit Abuse Cases (unverifiziert, gesperrt, Löschung beantragt, abgelaufene Sitzung) und automatisiertem Test. |
| A-5 | FS-C5 Constraints messbar und nachvollziehbar | Constraints verstreut, ohne durchgängige Kette bis zum Test | 🟡 | **Übernommen.** Constraint-Tabelle mit Operationalisierung und Prüfverfahren in [02-anforderungen.md §3](02-anforderungen.md#3-constraints-und-ihre-operationalisierung). Nachweis-IDs (`AT-…`) verknüpfen Anforderung und Test, ein Skript prüft die Kette automatisch. |
| A-6 | FS-M1 Vorgehensmodell mit Rollen und Artefakten | Sprint-Plan im Backlog, aber Rollen, Events und Artefakte nicht beschrieben | ❌ | **Übernommen.** [04-vorgehen.md](04-vorgehen.md): Scrum mit Tailoring für das Studienprojekt. |
| A-7 | FS-M2 Domänenanforderungen als eigene Klasse | Nur funktional/nichtfunktional | 🟡 | **Übernommen.** Feld `class: functional | quality | domain | constraint` im Front Matter. Domänenanforderungen sind z. B. Whitelist, Campus-Standorte, Nutzertypen. |
| A-8 | FS-M3 Merkmal, Metrik, Akzeptanzkriterium, Messverfahren | SLI/SLO-Tabelle vorhanden, für Sicherheit, Usability und Wartbarkeit fehlen Metrik und Messverfahren oft | 🟡 | **Übernommen.** Jede Anforderung der Klasse `quality` hat die Abschnitte Qualitätsmerkmal (ISO 25010), Metrik, Akzeptanzkriterium und Messverfahren und -kontext; `trace.mjs` erzwingt das. Sicherheitskontrollen ohne Metrik sind als `constraint` mit Prüfkriterien geführt (Review v0.2, R-03). |
| A-9 | FS-M4 Kano-Kategorien | Fehlen | ❌ | **Übernommen.** Feld `kano` im Front Matter und Spalte im Backlog. Constraints sind als „Basis“ eingestuft, wenn ihr Fehlen Vertrauen zerstört. |
| A-10 | FS-M5 Keine Lösungsideen in der Spezifikation | Mehrere Anforderungen schreiben Technik vor (z. B. „transaktional eingereihter Job“, „signierte URLs“) | ⚠️ | **Übernommen.** Technik wandert in ADRs. Ausnahmen sind ausdrücklich als Constraint markiert, wenn die Technik selbst die Anforderung ist (z. B. Argon2id als Sicherheitskontrolle nach Guideline). |
| A-11 | FS-M7 Validierung | Review v0.1 vorhanden, aber ohne festgelegte Kriterien | 🟡 | **Übernommen.** Requirements-Review mit Checkliste (IEEE 29148 / Guideline-Qualitätscheckliste, INVEST) in [docs/04-review/review-v0.2-anforderungen.md](../04-review/review-v0.2-anforderungen.md). |
| A-12 | FS-M8 INVEST und Akzeptanzkriterien | Akzeptanzkriterien nur für REQ-AUTH-002 und REQ-CHAT-001 | ❌ | **Übernommen.** Jede User Story hat Akzeptanzkriterien (Given–When–Then für Verhalten) und eine INVEST-Prüfung. |
| A-13 | FS-M9 Definition of Done | Fehlt | ❌ | **Übernommen.** DoD (und risikobasierte Definition of Ready) aus der Guideline, für das Projekt zugeschnitten, mit N/A-Markierungen: [04-vorgehen.md §4](04-vorgehen.md). |
| A-14 | FS-M11 Use-Case-Aufbau | Cockburn „fully dressed“ deckt die Felder ab, aber ohne „Beschreibung“. UC-05 und UC-07 nur in Kurzform | 🟡 | **Übernommen.** Feld „Beschreibung (Zweck/Nutzen)“ ergänzt, Zuordnung der Begriffe Cockburn ↔ Vorlesung dokumentiert. UC-05, UC-07 und das neue UC-25 vollständig ausformuliert. |
| A-15 | FS-M12 Backlog mit Wert, Risiko, Abhängigkeiten, Aufwand, WSJF | Epics und MoSCoW, keine Kennzahlen pro Eintrag | ❌ | **Übernommen.** Product Backlog mit Story Points, Kano, Risiko, Abhängigkeiten und WSJF in [03-backlog.md](03-backlog.md). |
| A-16 | FS-M13 Aufwandsschätzung | Fehlt | ❌ | **Übernommen.** Planning Poker (Fibonacci-Story-Points) mit Referenz-Story, Abgleich gegen Velocity; Erstschätzung als Experten-/Analogieschätzung gekennzeichnet. |
| A-17 | FS-M14 Nachverfolgbarkeit | IDs vorhanden, aber Status nur im Umsetzungsdokument; keine Code- und Commit-Verknüpfung | 🟡 | **Übernommen.** Status pro Anforderung im Front Matter (Lebenszyklus der Guideline mit Zuordnung zum Stufenmodell der Vorlesung), REQ-ID im Commit-Footer (`Refs:`), Prüf- und Berichtsskript `scripts/trace.mjs` (u. a. % verifiziert). |
| A-18 | FS-M15 Change-Management | Nur Regel „IDs nie umnummerieren, sondern ersetzen“ | 🟡 | **Übernommen.** Änderungsprozess mit Change Request, Entscheidungsgremium, Termin (Sprint-Grenze) und Feature Freeze vor der Abgabe: [04-vorgehen.md §6](04-vorgehen.md). |
| A-19 | FS-A Scope | MoSCoW „Won't“ vorhanden, aber keine Prozesssicht | 🟡 | **Übernommen.** Prozesse und Prozessschritte in/out of scope: [02-anforderungen.md §2](02-anforderungen.md#2-scope-prozesse-im-und-außerhalb-des-prototyps). |
| A-20 | FS-M2 Konsistenz | Widersprüche zwischen Use Cases, Anforderungen und Umsetzung (z. B. Löschfrist abgegebener Anzeigen 7 vs. 30 Tage, Export per Mail-Link vs. Download) | ⚠️ | **Übernommen.** Wird im Requirements-Review (A-11) erfasst und korrigiert. |

## 3. Offene Entscheidung

### Q-12: Was heißt „Anmeldung über die Hochschulkennung“?

| Option | Beschreibung | Bewertung |
|---|---|---|
| **A: Hochschul-E-Mail als Kennung** (Stand MVP) | Die Hochschuladresse wird per Link verifiziert; die Anmeldung erfolgt mit dieser Adresse und eigenem Passwort. | Erfüllt FS-C4 und die Zugangsbeschränkung vollständig, läuft offline. Die Hochschulkennung wird aber **nicht** zur Anmeldung genutzt, sondern nur zur Verifikation. |
| B: SSO mit der Hochschulkennung (OIDC/SAML, Shibboleth/DFN-AAI) | Anmeldung beim Identity Provider der Hochschule, kein Passwort bei uns. | Erfüllt FS-C3 wörtlich. Braucht die Kooperation des Rechenzentrums und widerspricht im Docker-Beispiel der Offline-Vorgabe (ADR-0010), außer mit einem simulierten IdP als zusätzlichem Container. |
| C: A im MVP, B als Erweiterung hinter einem Port | Die Anmeldung läuft über eine Schnittstelle `IdentityProviderPort`; der Adapter „Hochschul-E-Mail + Passwort“ ist der Standard, ein OIDC-Adapter wird nachgerüstet. | **Empfehlung.** Keine Umbaukosten später, das Beispiel bleibt offline lauffähig. |

**Bis zur Entscheidung durch Dozent/in bzw. Product Owner gilt Option C** (REQ-AUTH-009, Status `draft`). Die Entscheidung wird als ADR festgehalten.

## 4. Stand nach dem Requirements-Review v0.2

Das [Requirements-Review v0.2](../04-review/review-v0.2-anforderungen.md) hat 32 Befunde ergeben (2 kritisch, 9 hoch); die Behebung ist dort je Befund dokumentiert. Offene fachliche Fragen wurden im [Entscheidungslog](05-entscheidungen.md) vorläufig entschieden (Q-1 … Q-19) und sind vom Product Owner bzw. Dozent/in zu bestätigen.

## 5. Quellen der Anforderungen (FS-M6)

| Quelle | Beispiele im Projekt |
|---|---|
| Projekteigner / Auftraggeber | Vorgabe kein Hosting, nur Docker-Beispiel (ADR-0010); Bezahlung später |
| Lehrveranstaltung (Fallstudie) | FS-C1 … FS-C5, methodische Vorgaben FS-M1 … FS-M15 |
| Fachanwender (Studierende, Beschäftigte) | Personas, Use Cases, Kategorie „Bücher & Skripte“ |
| Entwicklungsteam | Wartbarkeit, Modulgrenzen, Testbarkeit |
| Technische Beschränkungen | Offline-Betrieb, Docker Compose, Hochschul-Domains |
| Wettbewerber | [Reverse Engineering Kleinanzeigen](../01-analyse/01-reverse-engineering-kleinanzeigen.md), [Wettbewerbsanalyse](../01-analyse/02-wettbewerbsanalyse.md) |
| Rechtliche Rahmenbedingungen | DSGVO, DSA, BITV 2.0 / WCAG 2.2, TDDDG, ZAG |
