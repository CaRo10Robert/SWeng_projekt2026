---
id: REQ-LEGAL-001
title: Impressum
type: business-rule
class: constraint
status: approved
owner: team-produkt
risk: medium
release: R1
moscow: M
moscow_reason: [2]
kano: basis
epic: EPIC-13
source: DDG § 5, MStV § 18 Abs. 2, Q-23
use_cases: [UC-08]
version: 1.0
created: 2026-10-24
last_updated: 2026-10-24
verification: [AT-LEGAL-001, CTRL-DOC-LEGAL-TEXTE]
---

# REQ-LEGAL-001 Impressum
## Anforderung
Das System muss ein Impressum mit den Pflichtangaben des Betreibers bereitstellen, das ohne Anmeldung von jeder Seite aus leicht erkennbar, unmittelbar erreichbar und ständig verfügbar ist.

> Übungsaufgabe: Inhalte mit Betreiberbezug stehen als Platzhalter `[Platzhalter: …]` (Q-23). Kein Rechtsrat; im Echtbetrieb prüft die/der Datenschutzbeauftragte bzw. das Justiziariat der Hochschule.

## Begründung
Telemedien mit redaktionellen Inhalten brauchen eine Anbieterkennzeichnung (DDG § 5, für journalistisch-redaktionelle Inhalte zusätzlich MStV § 18 Abs. 2). Fehlende Angaben sind abmahn- und bußgeldbewehrt und wirken unprofessionell.

## Akzeptanzkriterien
| Pflichtangabe (Muster: Hochschule als öffentliche Stelle) | Inhalt im Beispiel |
|---|---|
| Name und Rechtsform | `[Platzhalter: Name der Hochschule], Körperschaft des öffentlichen Rechts` |
| Anschrift | `[Platzhalter: Anschrift der Hochschule]` |
| Vertretungsberechtigte Person | `[Platzhalter: Präsident/in der Hochschule]` |
| Schnelle elektronische Kontaktaufnahme | E-Mail `[Platzhalter: kontakt@hwg-lu.example]` und Telefon `[Platzhalter: Telefonnummer]` |
| Zuständige Aufsichtsbehörde | `[Platzhalter: zuständiges Landesministerium]` |
| Umsatzsteuer-Identifikationsnummer (falls vorhanden) | `[Platzhalter: USt-IdNr.]` |
| Inhaltlich Verantwortliche/r | `[Platzhalter: Name, Anschrift]` |
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
| Platzhalter im Echtbetrieb übersehen | Go-live-Checkliste prüft, dass kein `[Platzhalter:` mehr vorkommt (`docs/07-betrieb/go-live-checkliste.md`) |

## Nachweis
- `AT-LEGAL-001`: E2E-Test – Impressum ohne Anmeldung aus dem Seitenfuß erreichbar, HTTP 200 bei Direktaufruf, alle Pflichtabschnitte und der Muster-Hinweis sichtbar.
- `CTRL-DOC-LEGAL-TEXTE`: Kontrolle der Rechtstexte unter `apps/web/src/content/legal/` – alle Pflichtabschnitte vorhanden, jede Betreiberangabe als `[Platzhalter: …]` markiert, Version und Datum im Front Matter, Review protokolliert.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-24 | Erstfassung aus dem Abgleich Recht, Auftritt und Betrieb ([06-abgleich-recht-betrieb.md](../06-abgleich-recht-betrieb.md)); als Übung mit Platzhaltern freigegeben (Q-23) |
