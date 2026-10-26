# ADR-0015: Rechtstexte als versionierte Markdown-Inhalte im Repository

- **Status:** Accepted (vorläufig, Q-23; Bestätigung mit dem Architektur-Review ausstehend)
- **Datum:** 2026-10-24
- **Bezug:** REQ-LEGAL-001…005, REQ-LEGAL-010, REQ-UX-006, REQ-PRIV-001, Backlog B-43; Inhalte in `apps/web/src/content/legal/`, Pflegeprozess in [docs/06-recht/README.md](../../06-recht/README.md)

## Kontext
CampusMarkt braucht Impressum, Datenschutzerklärung, Nutzungsbedingungen, Community-Regeln, eine Erklärung zur Barrierefreiheit und eine Kontaktseite. Diese Seiten müssen:
- ohne Anmeldung erreichbar sein;
- von jeder Seite und aus jeder E-Mail verlinkt sein (REQ-UX-006);
- offline im Docker-Beispiel funktionieren (ADR-0010);
- versioniert sein.

Die Version der Nutzungsbedingungen ist zugleich die Version, der Mitglieder zustimmen. Die Registrierung speichert sie heute als `TERMS_VERSION` aus der Konfiguration (REQ-PRIV-001). Eine Änderung muss eine erneute Zustimmung auslösen (REQ-LEGAL-003).

Heute gibt es zwei Quellen, die auseinanderlaufen können: den Text, den es noch nicht gibt, und die Versionsnummer in der Konfiguration. Die Inhalte sind eine Übungsaufgabe mit Platzhaltern (Q-23). Sie dürfen im Echtbetrieb nicht versehentlich stehen bleiben.

## Optionen
| Option | Pro | Contra |
|---|---|---|
| **A: Markdown-Dateien im Repo, zur Build-Zeit in die SPA gebündelt, im Browser gerendert** | Eine Quelle für App, Server und Doku; Änderungen laufen über Pull Request mit Review und Historie; offline; kein weiterer Dienst | Änderungen brauchen ein neues Image; ein Markdown-Parser im Bundle |
| B: Headless CMS bzw. Admin-Editor in der Datenbank | Juristen können ohne Deployment ändern | Weiterer Dienst bzw. eigener Editor; Versionierung und Freigabe müssten gebaut werden; Texte liegen nicht im Repo und gehen bei `down -v` verloren |
| C: Statische HTML-Seiten im `public`-Ordner | Kein Parser nötig | HTML von Hand, kein gemeinsames Layout und keine Sprachwahl; Version und Text weiter getrennt |
| D: Rendering auf dem Server (Markdown → HTML in Fastify) | Seiten auch ohne JavaScript lesbar | Zweiter Darstellungsweg neben der SPA; das HTML müsste bereinigt werden; Layout doppelt |

## Entscheidung
**Option A.**
1. **Ablage:** `apps/web/src/content/legal/<name>.<sprache>.md`. Die Namen sind `impressum`, `datenschutz`, `nutzungsbedingungen`, `community-regeln`, `barrierefreiheit` und `kontakt`, die Sprachen `de` und `en`. Hilfe/FAQ liegt unter `content/help/`. Jede Datei hat Front Matter mit `title`, `version` (`JJJJ-MM`, bei mehreren Änderungen im Monat `JJJJ-MM-n`) und `last_updated`. **Verbindlich ist die deutsche Fassung**, die englische ist eine Lesehilfe (Q-25, ADR-0016).
2. **Einbindung zur Build-Zeit:** `import.meta.glob(…, { query: '?raw', import: 'default' })` lädt die Dateien. Jede Rechtsseite ist ein eigener, nachgeladener Chunk; Seiten ohne Rechtstext tragen den Parser nicht.
3. **Rendering:** mit `react-markdown` (gebündelt, keine externen Quellen):
   - ohne `rehype-raw`, mit `skipHtml`: HTML im Markdown wird **nicht** gerendert;
   - erzeugt React-Elemente, kein `dangerouslySetInnerHTML`; die CSP (`script-src 'self'`) bleibt unverändert;
   - Links sind nur relativ, `https:` oder `mailto:`; externe Links bekommen `rel="noopener noreferrer"`;
   - Überschriften erhalten Anker, die Seite ein Inhaltsverzeichnis.
4. **Front Matter:** wird von einem kleinen eigenen Parser gelesen, der nur `schlüssel: wert` versteht und durch Unit-Tests abgedeckt ist. `gray-matter` ist für Node gebaut und braucht im Browser Polyfills.
5. **Eine Quelle für die Version:**
   - Ein Vite-Plugin schreibt beim Build `dist/legal-manifest.json` mit Name, Sprache, Version, `last_updated` und SHA-256 je Datei.
   - Der Server liest das Manifest beim Start. `termsVersion` ist die Version von `nutzungsbedingungen.de` (bisher `TERMS_VERSION`); die Umgebungsvariable bleibt nur als Override für Tests.
   - Fehlt das Manifest, etwa in der Entwicklung ohne Build, liest der Server die Datei direkt aus dem Repo-Pfad.
   - Ein Unit-Test stellt sicher, dass Manifest und Datei übereinstimmen.
6. **Erneute Zustimmung:** Weicht die gespeicherte Zustimmung eines Mitglieds von `termsVersion` ab, verlangt die App beim nächsten Login bzw. nächsten Request die Zustimmung zur neuen Fassung, bevor schreibende Aktionen möglich sind (REQ-LEGAL-003). Die Zustimmung wird wie bisher in `identity.consent` mit Version gespeichert.
7. **Platzhalter:** Betreiberdaten stehen als `[Platzhalter: …]` im Text. *Nachtrag 2026-10-25 (Q-28):* Sie sind durch erkennbar fiktive Übungswerte ersetzt; der Zähler bleibt für den Fall, dass wieder Platzhalter eingefügt werden. Jede Rechtsseite zeigt oben den Hinweis „Muster im Rahmen einer Übungsaufgabe“, gesteuert über das Front-Matter-Feld `sample: true`. Für einen Echtbetrieb gilt `LEGAL_STRICT=true`: Der Server startet dann nicht, solange das Manifest Platzhalter oder `sample: true` meldet. Das Manifest zählt dafür die Platzhalter je Datei; die Go-live-Checkliste verweist darauf ([docs/07-betrieb/go-live-checkliste.md](../../07-betrieb/go-live-checkliste.md)).
8. **Doku:** `docs/06-recht/` verlinkt auf die Dateien in `apps/web/src/content/legal/` und führt keine Kopien.
9. **Routen:** `/impressum`, `/datenschutz`, `/nutzungsbedingungen`, `/community-regeln`, `/barrierefreiheit`, `/kontakt` und `/hilfe` sind öffentliche SPA-Routen. Der Server kennt sie als gültige Pfade und liefert für sie die SPA mit Status 200, für unbekannte Pfade 404 (siehe architektur.md §8.10).

## Konsequenzen
- (+) Text und Version können nicht mehr auseinanderlaufen. Jede Änderung ist im Git nachvollziehbar und läuft durch Review (Vier-Augen, Pflegeprozess in `docs/06-recht/README.md`).
- (+) Keine neue Laufzeitkomponente, offline lauffähig, CSP unverändert.
- (+) Platzhalter können im Echtbetrieb nicht unbemerkt live gehen.
- (−) Eine Textänderung braucht einen Build und ein Deployment. Für Rechtstexte ist das gewollt (Freigabe), für schnelle Hinweise gibt es die Ankündigung (REQ-OPS-006).
- (−) Ohne JavaScript sind die Rechtsseiten nicht lesbar. Das gilt für die ganze SPA; ein Fallback ist nicht vorgesehen. Risiko gering, weil die Zielgruppe die App ohnehin mit JavaScript nutzt; im Echtbetrieb neu bewerten.
- (−) `react-markdown` vergrößert die Chunks der Rechtsseiten (etwa 40–50 KB gzip), nicht das Haupt-Bundle.
- Umsetzung: Backlog B-43.
- *Nachtrag 2026-10-26 (Befund T-1 aus MAN-ARCH-004):* Ob ein Rechtstext ein Muster ist, ergibt sich **nur** aus `sample: true` im Front Matter (gesetzt in allen Rechtstexten de/en); die frühere Erkennung am Hinweistext ist aus `content.ts`, `legal-manifest.mjs` und `platform/legal.ts` entfernt. Eine Umformulierung des Hinweises kann Muster-Badge und `LEGAL_STRICT` damit nicht mehr aushebeln.
