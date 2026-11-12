---
id: REQ-UX-008
title: Dunkles Farbschema nach Systemeinstellung, wählbar im Seitenkopf
type: user-story
class: functional
status: verified
owner: team-produkt
risk: medium
release: R1
moscow: S
kano: leistung
epic: EPIC-13
source: Auftraggeber (2026-11-12, Q-29), BG-2
version: 1.2
created: 2026-11-12
last_updated: 2026-11-12
review_due: 2027-04-23
systems: [campusmarkt-web, campusmarkt-server]
depends_on: [REQ-A11Y-001, REQ-LEGAL-010]
verification: [AT-UX-008, AT-UX-008-2, AT-UX-008-3, AT-UX-008-4]
---

# REQ-UX-008 Dunkles Farbschema nach Systemeinstellung, wählbar im Seitenkopf
## Anforderung
Als Mitglied oder Gast möchte ich CampusMarkt in einem dunklen Farbschema nutzen, das sich nach der Einstellung meines Geräts richtet und das ich im Seitenkopf auch ausdrücklich auf hell oder dunkel festlegen kann, damit die Seite abends und bei Blendempfindlichkeit angenehm lesbar ist und zu meinen anderen Apps passt.

## Begründung
Studierende nutzen den Marktplatz oft abends und auf dem Smartphone (BG-2); dunkle Oberflächen sind dort die Erwartung, und Betriebssysteme stellen die Einstellung bereit. Der Wunsch kam vom Auftraggeber für die Vorführung des Prototyps (Q-29). Das dunkle Schema darf die Barrierefreiheit nicht verschlechtern (REQ-A11Y-001) und keine Speicherung ohne ausdrücklichen Wunsch auslösen (REQ-LEGAL-010).

## Akzeptanzkriterien
**Entscheidungstabelle – wirksames Schema:**

| Wahl im Seitenkopf (gespeichert) | Systemeinstellung | Wirksames Schema | Speicherung auf dem Gerät |
|---|---|---|---|
| keine („Wie im System“, Voreinstellung) | hell | hell | keine |
| keine („Wie im System“, Voreinstellung) | dunkel | dunkel | keine |
| „Hell“ | beliebig | hell | `cm_theme` = `light` |
| „Dunkel“ | beliebig | dunkel | `cm_theme` = `dark` |

- Der Schalter steht im Seitenkopf jeder Seite neben der Sprachwahl: eine beschriftete Gruppe mit drei Schaltflächen („Wie im System“, „Hell“, „Dunkel“), per Tastatur bedienbar, die aktive als gedrückt markiert (`aria-pressed`), jede mit Text für Screenreader und Tooltip; Beschriftungen auf Deutsch und Englisch.
- „Wie im System“ folgt einer Änderung der Systemeinstellung sofort, ohne Neuladen. Eine Wahl in einem anderen Tab wird übernommen.
- Kein Aufblitzen des falschen Schemas beim Laden: Das Schema steht fest, bevor der erste Inhalt erscheint.
- Formularelemente, Auswahllisten und Scrollleisten folgen dem Schema (`color-scheme`); die Farbe der Browserleiste (`theme-color`) ebenfalls.
- Alle Seiten (Start, Suche, Anzeige, Formular, Nachrichten, Profil, Moderation, Administration, Rechts- und Hilfeseiten, Dialoge, Fehlerseiten, Seitenfuß) sowie die serverseitigen Seiten (Wartung, Abmeldung) sind in beiden Schemata vollständig lesbar. Die erzeugten Platzhalterbilder der Anzeigen bleiben unverändert.
- Kontrast in beiden Schemata nach WCAG 2.2 AA: Text ≥ 4,5:1 (SC 1.4.3), Rahmen von Eingabefeldern und Fokusrahmen ≥ 3:1 (SC 1.4.11).
- Die Content Security Policy bleibt ohne `unsafe-inline`; nötige Inline-Skripte werden einzeln per Hash erlaubt.

```gherkin
Szenario: Dunkles Schema ausdrücklich wählen
  Angenommen mein Gerät ist auf helles Design eingestellt
  Und ich bin auf der Hilfeseite
  Wenn ich im Seitenkopf "Dunkel" wähle
  Dann erscheint die Seite im dunklen Schema
  Und nach dem Neuladen bleibt das dunkle Schema, ohne dass kurz das helle erscheint
  Wenn ich "Wie im System" wähle
  Dann erscheint die Seite wieder hell und auf dem Gerät ist nichts mehr gespeichert
```

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| `localStorage` gesperrt (privater Modus, Richtlinie) | Systemeinstellung gilt; eine Wahl wirkt bis zum Neuladen; kein Fehler |
| Ungültiger Wert in `cm_theme` (z. B. manuell verändert) | wird ignoriert, Systemeinstellung gilt |
| Browser ohne `prefers-color-scheme` bzw. ohne `matchMedia` | helles Schema |
| JavaScript abgeschaltet | Die SPA braucht JavaScript; der Hinweis `<noscript>` erscheint im Schema des Browsers |
| Inline-Skript wird geändert, Hash passt nicht | Der Server berechnet den Hash beim Start aus der ausgelieferten `index.html`; ein Test prüft, dass die Startseite genau ein Inline-Skript hat (AT-UX-008-4) |
| Neue Farbstufe in einer Komponente ohne dunklen Gegenpart | Kontrastmatrix (AT-UX-008-2) und axe-Prüfung im dunklen Schema (AT-UX-008-3) schlagen fehl |
| Geteiltes Gerät | Die Wahl gilt je Browser, nicht je Konto; sie verrät nichts über die Person und verlässt das Gerät nicht |

## INVEST
I: unabhängig von Fachfunktionen · N: Bedienform des Schalters verhandelbar (ADR-0021) · V: Lesbarkeit, Erwartung der Zielgruppe · E: mittel · S: zwei Tage · T: Komponenten-, Unit- und E2E-Test.

## Nachweis
- `AT-UX-008`: Komponententest – Entscheidungstabelle, Voreinstellung aus der Systemeinstellung, Speicherung nur nach ausdrücklicher Wahl, gesperrter Speicher, Farbe der Browserleiste, Wahl aus anderem Tab (`apps/web/src/components/ThemeSwitch.test.tsx`).
- `AT-UX-008-2`: Unit-Test – Kontrastmatrix aller Farbpaarungen der Komponenten in beiden Schemata (`apps/web/src/theme-contrast.test.ts`).
- `AT-UX-008-3`: E2E-Test – kein Aufblitzen, keine CSP-Verletzung, Wahl per Tastatur bleibt nach Neuladen, axe-core im dunklen Schema auf allen Seitentypen (`e2e/tests/theme.spec.ts`).
- `AT-UX-008-4`: Unit-Test – CSP erlaubt das Inline-Skript per Hash, ohne `unsafe-inline` (`apps/server/src/platform/http/server.test.ts`).
- Ergänzend: Sichtprüfung aller Seitentypen in beiden Schemata bei 1400 px und 390 px (Screenshots vom 2026-11-12, nicht im Repository).
- Entscheidung zur Umsetzung: [ADR-0021](../../03-architektur/decisions/0021-farbschema-hell-dunkel.md).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-11-12 | Erstfassung auf Wunsch des Auftraggebers (Q-29), freigegeben |
| 1.1 | 2026-11-12 | Umgesetzt (B-66); Status → implemented |
| 1.2 | 2026-11-12 | Verifiziert gegen das Docker-Beispiel: lokal (Edge) und im CI-Lauf 43304771207 (AT-UX-008 bis AT-UX-008-4 bestanden); Status → verified |
