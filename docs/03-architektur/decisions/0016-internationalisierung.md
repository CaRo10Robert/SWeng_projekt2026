# ADR-0016: Internationalisierung mit react-intl (ICU MessageFormat)

- **Status:** Accepted (vorläufig, Q-25; Bestätigung mit dem Architektur-Review ausstehend)
- **Datum:** 2026-10-24
- **Bezug:** REQ-UX-007, REQ-UX-002, REQ-A11Y-001, REQ-LEGAL-002, REQ-LEGAL-010, Guideline Kap. 03 (BCP 47 + ICU MessageFormat), Backlog B-51

## Kontext
REQ-UX-002 verlangt eine deutsche Oberfläche, die übersetzbar vorbereitet ist. Heute stehen die Texte direkt in den React-Komponenten und den E-Mail-Vorlagen. REQ-UX-007 ergänzt eine vollständige englische Oberfläche für internationale Studierende. Bei Rechtstexten ist die englische Fassung nur eine Lesehilfe (Q-25).

Die Guideline nennt für i18n **BCP-47-Sprachcodes und ICU MessageFormat**, damit Plural- und Auswahlregeln nicht selbst erfunden werden. Die Lösung muss gebündelt und offline laufen und zu React 19 und Vite passen.

Eine gespeicherte Sprachwahl im Browser ist eine Speicherung auf dem Endgerät (TDDDG § 25). Sie ist nur zulässig, wenn sie unbedingt erforderlich ist oder eine Einwilligung vorliegt (REQ-LEGAL-010, Q-24).

## Optionen
| Option | Pro | Contra |
|---|---|---|
| **A: react-intl (FormatJS)** | ICU MessageFormat nativ, `Intl`-basierte Formatierung von Datum, Zahl und Währung, React-19-kompatibel, verbreitet, Parser für CI-Prüfungen verfügbar (`@formatjs/icu-messageformat-parser`) | Etwas größer als eine Eigenbau-Lösung; ICU-Syntax muss gelernt werden |
| B: i18next + react-i18next | Sehr verbreitet, viele Plugins | Eigenes Format; ICU nur über ein Zusatz-Plugin (`i18next-icu`), dann zwei Konzepte nebeneinander |
| C: Lingui | ICU, kleine Laufzeit, Extraktion | Braucht einen Compile-Schritt bzw. ein Makro im Build; mehr Build-Komplexität für ein kleines Team |
| D: Eigene Lösung (Objekt mit Schlüsseln, `Intl.PluralRules`) | Keine Abhängigkeit | Plural- und Auswahlregeln selbst gebaut; genau das Muster, vor dem die Guideline warnt |

## Entscheidung
**Option A: react-intl.**
1. **Sprachen:** BCP-47-Codes `de` (Quellsprache, Standard) und `en`. Kataloge liegen in `apps/web/src/i18n/messages/de.json` und `en.json`, mit flachen Schlüsseln nach dem Muster `bereich.seite.element` (z. B. `listing.form.title.label`) und Texten in ICU-Syntax.
2. **Sprachermittlung, in dieser Reihenfolge:**
   1. angemeldet: die Konto-Einstellung `locale`, gespeichert in `identity.user` und änderbar per `PATCH /me` (Vertrag in `packages/contracts`);
   2. Gast mit ausdrücklicher Wahl über den Sprachschalter: Schlüssel `cm_locale` im `localStorage`. Er wird **nur nach Klick** gesetzt, nie automatisch. Das ist eine vom Nutzer ausdrücklich gewünschte Funktion und damit unbedingt erforderlich nach TDDDG § 25 Abs. 2 Nr. 2; Datenschutzerklärung und REQ-LEGAL-002 führen den Eintrag auf;
   3. sonst `navigator.languages`: `en*` → `en`, alles andere → `de`.
3. **Barrierefreiheit:** `<html lang>` folgt der gewählten Sprache (WCAG 3.1.1). Fremdsprachige Textstellen bekommen `lang` (WCAG 3.1.2). Der Sprachschalter ist ein beschrifteter Button, in seiner eigenen Sprache benannt („English“, „Deutsch“).
4. **Formatierung:** Datum, Zahlen und Preise über `Intl` bzw. `FormattedNumber`/`FormattedDate`. Währung bleibt EUR, nur das Format folgt der Sprache.
5. **Fehlermeldungen:** Die API liefert weiter Problem Details mit einem stabilen `code`. Die Web-App übersetzt nach `code`; der deutsche `title` des Servers dient nur als Rückfall. Der Vertrag ändert sich dadurch nicht.
6. **E-Mails:** in der Konto-Sprache. Die Vorlagen in `notifications` bekommen je Sprache einen Text mit denselben Parametern. Mails, die vor der Kontoanlage verschickt werden (Bestätigung), gehen in der Sprache, die bei der Registrierung gewählt war.
7. **Rechtstexte:** Englische Fassungen nach ADR-0015 (`<name>.en.md`) zeigen oben den Hinweis „The German version is legally binding.“ Fehlt eine englische Fassung, erscheint die deutsche mit Hinweis.
8. **Qualitätssicherung:**
   - `scripts/check-i18n.mjs` läuft in CI und prüft, dass beide Kataloge dieselben Schlüssel haben, dass jeder Text gültige ICU-Syntax hat und dass dieselben Platzhalter vorkommen.
   - Ein ESLint-Hinweis bzw. Review prüft auf neue fest verdrahtete Texte in JSX.
   - Die E2E-Tests laufen weiter auf Deutsch; zusätzlich gibt es einen Smoke-Durchlauf auf Englisch (Kernseiten ohne fehlende Schlüssel, axe-core).
9. **Laden der Kataloge:** Der deutsche Katalog ist im Haupt-Bundle, der englische wird beim ersten Wechsel nachgeladen.

## Konsequenzen
- (+) Normgerechte Plural-, Auswahl- und Formatierungsregeln. Eine weitere Sprache ist nur ein weiterer Katalog.
- (+) Die Prüfung in CI verhindert stille Lücken in der Übersetzung (Risiko R-12).
- (+) Keine Einwilligung nötig: Gespeichert wird nur auf ausdrücklichen Wunsch, und die Speicherung ist dokumentiert.
- (−) Alle bestehenden Texte müssen einmalig in den Katalog überführt werden. Das ist der größte Aufwand in B-51.
- (−) Die Bundle-Größe wächst um etwa 15–20 KB gzip (react-intl) plus den deutschen Katalog.
- (−) Testselektoren, die auf deutsche Texte zielen, bleiben auf die deutsche Oberfläche festgelegt. Neue Tests sollen Rollen und Labels aus dem Katalog verwenden.
- Umsetzung: Backlog B-51.
