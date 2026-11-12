# ADR-0021: Farbschema hell/dunkel über umgedeutete Farb-Tokens und Inline-Skript mit CSP-Hash

- **Status:** Accepted (2026-11-12)
- **Datum:** 2026-11-12
- **Bezug:** REQ-UX-008, REQ-A11Y-001, REQ-LEGAL-010, REQ-PRIV-006 (CSP ohne `unsafe-inline`), REQ-UX-001, Guideline Kap. 03 („Design Tokens → Primitive Components“, Accessibility), ADR-0002 (React-SPA, Tailwind), ADR-0016 (Muster der Sprachwahl), Backlog B-66, Entscheidung Q-29

## Kontext
Der Auftraggeber wünscht ein dunkles Farbschema (Q-29, REQ-UX-008). Es soll der Systemeinstellung folgen, im Seitenkopf wählbar sein, die Wahl je Browser behalten und beim Laden nicht kurz das falsche Schema zeigen. Es gilt für **alle** Seiten, Dialoge und serverseitigen Seiten, und der Kontrast muss in beiden Schemata WCAG 2.2 AA erfüllen.

Ausgangslage im Code:
- Tailwind CSS 4 mit `@theme` in `apps/web/src/index.css`. Die Komponenten verwenden rund 300 Farbklassen aus wenigen Paletten (`slate`, `white`, eigene `brand`-Stufen, `red`, `green`, `amber`, `sky`), durchgängig nach der Konvention „helle Fläche + dunkle Schrift“ und „kräftige Farbe + weiße Schrift“.
- Tailwind 4 erzeugt jede Farbklasse als `var(--color-…)`; die Werte sind also zur Laufzeit austauschbare Tokens.
- Die CSP des Servers erlaubt `script-src 'self'` ohne `unsafe-inline` (REQ-PRIV-006, Pentest PT-HDR-01). Ein Inline-Skript wird blockiert.
- Parallel arbeiten weitere Branches an denselben Komponenten (z. B. Bilder im Anzeigenformular); ein Umbau aller Komponenten erzeugt Konflikte.

Zu entscheiden sind (1) die Technik der Farbumschaltung, (2) die Bedienung und (3) das Setzen des Schemas vor dem ersten Rendern unter der CSP.

## Optionen

**(1) Technik der Farbumschaltung**

| Option | Pro | Contra |
|---|---|---|
| A: `dark:`-Varianten an jeder Komponente | Tailwind-Standard, jede Stelle explizit | ~300 Ergänzungen in über 20 Dateien; jede vergessene Stelle ist ein weißer Kasten im dunklen Schema; neue Komponenten müssen daran denken; großer Diff mit Konflikten zu parallelen Branches |
| B: Semantische Tokens (`surface`, `text-muted`, …) und alle Komponenten darauf umstellen | sauberste Begrifflichkeit, Guideline-Ideal „Design Tokens“ | gleicher Umbauaufwand wie A plus Begriffsfindung; am Vorabend der Vorführung zu riskant; Konflikte |
| **C: Vorhandene Palette-Tokens unter `.dark` umdeuten** (jede Stufe bekommt ihren Gegenpart, `white` wird die dunkle Fläche) | eine Stelle (`index.css`), keine Komponente ändert sich, keine Seite kann vergessen werden, neue Komponenten sind automatisch dabei; Paarungen behalten ihre Rolle und damit ihren Kontrast; Kontrast als Matrix automatisch prüfbar | Klassennamen „lügen“ im dunklen Schema (`bg-white` ist dunkel); Ausnahmen brauchen doch `dark:`; die Umdeutung muss für jede benutzte Stufe gepflegt werden |
| D: CSS-Filter (`invert()`) auf der Seite | eine Zeile | Bilder und Logos werden invertiert, falsche Farbtöne, schlechte Lesbarkeit; kein echtes Design |

**(2) Bedienung**

| Option | Pro | Contra |
|---|---|---|
| Zwei Zustände hell/dunkel, „System“ nur als Startwert | einfach | Zurück zu „wie im System“ ist ohne Löschen der Websitedaten nicht möglich; wer abends automatisch dunkel bekommen will, verliert das nach einem Klick dauerhaft |
| Ein Knopf, der System → hell → dunkel durchschaltet | platzsparend | ein Klick ohne sichtbare Wirkung (wenn „hell“ dem System entspricht), Zustand schwer erkennbar |
| **Drei Optionen als beschriftete Gruppe** (wie die Sprachwahl) | Zustand jederzeit sichtbar (`aria-pressed`), jeder Klick hat eine erkennbare Wirkung, „System“ bleibt erreichbar; gleiches Muster wie die Sprachwahl (ADR-0016) | etwa 90 px Breite im Seitenkopf |

**(3) Schema vor dem ersten Rendern unter der CSP**

| Option | Pro | Contra |
|---|---|---|
| Kein Skript, React setzt das Schema | einfach | Aufblitzen des hellen Schemas bei gespeicherter Wahl „dunkel“ |
| `'unsafe-inline'` in `script-src` | einfach | schwächt den XSS-Schutz für die ganze Anwendung; widerspricht REQ-PRIV-006 und dem Pentest-Befund |
| Externe, blockierende Datei (`<script src="/theme.js">`) | keine CSP-Änderung | zusätzliche, das Rendern blockierende Anfrage vor jedem ersten Bild |
| **Inline-Skript, per SHA-256-Hash erlaubt** | kein Aufblitzen, keine zusätzliche Anfrage, CSP bleibt streng | Hash muss zum Skript passen |

## Entscheidung
1. **Option C: Umdeutung der Palette-Tokens.** In `index.css` steht unter `:root.dark` für jede in den Komponenten benutzte Stufe ein dunkler Gegenpart (Rolle bleibt: `slate-50` Seitenhintergrund, `white` Fläche, `slate-900` Haupttext, `brand-700` Link und Primärfläche mit dunkler Schrift, Statusfarben 50/100 als getönte Fläche, 700 als Text/Rahmen, 900/950 als Text auf getönter Fläche). `@custom-variant dark` bindet `dark:` an dieselbe Klasse, damit echte Ausnahmen möglich bleiben. `color-scheme` folgt dem Schema (Formularelemente, Scrollleisten). Bedeutung der Klassen im dunklen Schema ist im Kopf von `index.css` dokumentiert.
2. **Drei Optionen im Seitenkopf** („Wie im System“, „Hell“, „Dunkel“) als `role="group"` mit `aria-pressed`, Symbolen, Text für Screenreader und Tooltip, direkt neben der Sprachwahl. Voreinstellung „Wie im System“; sie folgt Änderungen der Systemeinstellung sofort.
3. **Speicherung nur auf ausdrücklichen Wunsch:** Schlüssel `cm_theme` (`light`/`dark`) im `localStorage`, gesetzt erst nach Klick auf „Hell“ oder „Dunkel“, gelöscht durch „Wie im System“; Zugriff in `try/catch`. Wie `cm_locale` (ADR-0016) unbedingt erforderlich nach TDDDG § 25 Abs. 2 Nr. 2, eingetragen in die Allowlist (`e2e/storage-allowlist.json`, REQ-LEGAL-010) und die Datenschutzerklärung (Fassung 2026-11-12). Der Wert verlässt das Gerät nicht und wird nicht im Konto gespeichert (kein Mehrwert gegenüber der Systemeinstellung, keine Kontodaten).
4. **Inline-Skript mit CSP-Hash:** Ein kurzes Skript im `<head>` von `index.html` liest `cm_theme` und `prefers-color-scheme` und setzt die Klasse `dark` sowie `color-scheme`, bevor der erste Inhalt erscheint. Der Server berechnet beim Start den SHA-256-Hash jedes Inline-Skripts der ausgelieferten `index.html` und nimmt ihn in `script-src` auf (`inlineScriptHashes` in `platform/http/server.ts`). So passt der Hash immer zum Build; `unsafe-inline` bleibt ausgeschlossen. Ein Test prüft, dass die Startseite genau dieses eine Inline-Skript hat.
5. **Browserleiste und Manifest:** zwei `<meta name="theme-color">` mit `media` für helles und dunkles System; bei ausdrücklicher Wahl setzt die App beide auf die Farbe des gewählten Schemas. Das Web-App-Manifest kennt nur eine `theme_color` und bleibt beim Markenblau.
6. **Serverseitige Seiten** (Wartung, Abmeldung) folgen dem System per `@media (prefers-color-scheme: dark)` in ihrem gehashten `<style>`-Block.
7. **Qualitätssicherung:** Kontrastmatrix aller Paarungen der Komponenten in beiden Schemata als Unit-Test (Tailwind-Palette in oklch und eigene Tokens werden gelesen und umgerechnet; AT-UX-008-2), axe-core im dunklen Schema auf allen Seitentypen (AT-UX-008-3).

## Konsequenzen
- (+) Alle Seiten haben ab sofort und künftig ein dunkles Schema, ohne dass Komponenten angepasst werden; der Diff bleibt klein und kollidiert kaum mit parallelen Branches.
- (+) Kontrast ist für beide Schemata automatisch belegt. Die Matrix fand nebenbei einen bestehenden Mangel im hellen Schema: Rahmen von Eingabefeldern (`slate-400`, 2,6:1) erfüllten SC 1.4.11 nicht; sie verwenden jetzt `slate-500` (4,8:1).
- (+) Die CSP bleibt streng; der Hash entsteht automatisch.
- (−) Klassennamen beschreiben im dunklen Schema die Rolle, nicht die Farbe (`bg-white` ist dort dunkel). Wer eine Farbe unabhängig vom Schema braucht, muss `dark:` verwenden; das ist im Kopf von `index.css` erklärt.
- (−) Wird eine bisher unbenutzte Palettenstufe eingeführt, braucht sie einen dunklen Gegenpart in `index.css`; die Kontrastmatrix und der axe-Test im dunklen Schema decken das Vergessen auf, sofern die Paarung dort aufgeführt bzw. sichtbar ist.
- (−) Die Wahl gilt je Browser, nicht je Konto.
- Folgearbeit (optional, R2): semantische Tokens (Option B) schrittweise einführen, wenn Komponenten ohnehin überarbeitet werden; Option C bleibt dabei als Übergang gültig.
- Umsetzung: Backlog B-66.
