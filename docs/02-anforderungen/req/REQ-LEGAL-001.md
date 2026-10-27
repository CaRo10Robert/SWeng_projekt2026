---
id: REQ-LEGAL-001
title: Impressum
type: business-rule
class: constraint
status: verified
owner: team-produkt
risk: medium
release: R1
moscow: M
moscow_reason: [2]
kano: basis
epic: EPIC-13
source: DDG § 5, MStV § 18 Abs. 2, Q-23
use_cases: [UC-08]
version: 1.4
created: 2026-10-24
last_updated: 2026-10-26
verification: [AT-LEGAL-001, CTRL-DOC-LEGAL-TEXTE]
---

# REQ-LEGAL-001 Impressum
## Anforderung
Das System muss ein Impressum mit den Pflichtangaben des Betreibers bereitstellen, das ohne Anmeldung von jeder Seite aus leicht erkennbar, unmittelbar erreichbar und ständig verfügbar ist.

> Übungsaufgabe: Betreiberangaben sind fiktive Übungswerte (z. B. Musternamen, Anschriften mit „(fiktiv)“, Domains `.example`); offene Rechtsfragen sind als Übungsannahmen festgelegt (Q-23, Q-28). Kein Rechtsrat, keine Nutzung im Echtbetrieb.

## Begründung
Digitale Dienste brauchen eine Anbieterkennzeichnung. § 5 DDG gilt für geschäftsmäßige, in der Regel gegen Entgelt angebotene digitale Dienste; Übungsannahme (Q-28): § 5 DDG wird auch für das kostenlose Angebot der Hochschule angewendet. Als Auffangnorm gilt § 18 Abs. 1 MStV (Name und Anschrift auch bei nicht geschäftsmäßigen Angeboten), für journalistisch-redaktionelle Inhalte zusätzlich § 18 Abs. 2 MStV. Der Begriff „Telemedien“ ist im Bundesrecht durch „digitale Dienste“ (DDG) ersetzt. Fehlende Angaben sind abmahn- und bußgeldbewehrt und wirken unprofessionell.

## Akzeptanzkriterien
| Pflichtangabe (Muster: Hochschule als öffentliche Stelle) | Inhalt im Beispiel |
|---|---|
| Name und Rechtsform | Hochschule für Wirtschaft und Gesellschaft Ludwigshafen (HWG LU), Körperschaft des öffentlichen Rechts |
| Anschrift | Musterstraße 1, 67059 Ludwigshafen am Rhein (fiktiv) |
| Vertretungsberechtigte Person | Präsidentin Prof. Dr. Erika Mustermann (fiktiv) |
| Schnelle elektronische Kontaktaufnahme | E-Mail `campusmarkt@hwg-lu.example` und Telefon +49 621 555-0100 (fiktiv) |
| Zuständige Aufsichtsbehörde | Musterministerium für Wissenschaft Rheinland-Pfalz, Mainz (fiktiv) |
| Umsatzsteuer-Identifikationsnummer (falls vorhanden) | DE000000000 (fiktiv) |
| Inhaltlich Verantwortliche/r | Dr. Anna Beispiel (fiktiv), Stabsstelle Digitale Dienste, Anschrift wie oben |
| Hinweis Übung | Banner „Muster im Rahmen einer Übungsaufgabe – keine rechtsverbindlichen Angaben“ |

```gherkin
Szenario: Impressum ohne Anmeldung
  Angenommen ich bin nicht angemeldet und auf der Anmeldeseite
  Wenn ich im Seitenfuß "Impressum" wähle
  Dann sehe ich die Seite "Impressum" mit allen Pflichtangaben der Tabelle
  Und den Hinweis "Muster im Rahmen einer Übungsaufgabe"
  Und die Seite antwortet mit HTTP 200 auch bei direktem Aufruf der Adresse /impressum
```

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Wartungsmodus aktiv (REQ-OPS-006) | Impressum bleibt erreichbar (Ausnahme von der Wartungsseite) |
| JavaScript deaktiviert oder SPA-Fehler | Fehlerseiten verlinken das Impressum (REQ-UX-003); die Inhaltsquelle liegt als Markdown im Repository |
| Fiktive Übungswerte im Echtbetrieb übersehen | `LEGAL_STRICT=true` verweigert den Start, solange Rechtstexte als Muster gekennzeichnet sind; Go-live-Checkliste (`docs/07-betrieb/go-live-checkliste.md`) |

## Nachweis
- `AT-LEGAL-001`: E2E-Test – Impressum ohne Anmeldung aus dem Seitenfuß erreichbar, HTTP 200 bei Direktaufruf, alle Pflichtabschnitte und der Muster-Hinweis sichtbar.
- `CTRL-DOC-LEGAL-TEXTE`: Kontrolle der Rechtstexte unter `apps/web/src/content/legal/` – alle Pflichtabschnitte vorhanden, jede Betreiberangabe als fiktiver Übungswert erkennbar (Muster-Hinweis, „(fiktiv)“, Domain `.example`, Q-28), Version und Datum im Front Matter, Review protokolliert – Protokoll [CTRL-DOC-LEGAL-TEXTE](../../05-umsetzung/nachweise/CTRL-DOC-LEGAL-TEXTE.md).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-24 | Erstfassung aus dem Abgleich Recht, Auftritt und Betrieb ([06-abgleich-recht-betrieb.md](../06-abgleich-recht-betrieb.md)); als Übung mit Platzhaltern freigegeben (Q-23) |
| 1.1 | 2026-10-25 | Review v1.3 (RV-R-22): Anwendbarkeit § 5 DDG als offener Prüfpunkt, § 18 Abs. 1 MStV als Auffangnorm, Begriff digitale Dienste; Status nach Umsetzung |
| 1.2 | 2026-10-25 | Verifiziert im finalen Lauf gegen das Docker-Beispiel (AT-LEGAL-001, CTRL-DOC-LEGAL-TEXTE bestanden bzw. ausgeführt); Status → verified |
| 1.3 | 2026-10-25 | Q-28: Platzhalter durch fiktive Übungswerte und offene Prüfpunkte durch Übungsannahmen ersetzt |
| 1.4 | 2026-10-26 | Guideline-Review: GL-07 Kontrollprotokoll verlinkt |
