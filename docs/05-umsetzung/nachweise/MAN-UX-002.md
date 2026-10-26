---
id: MAN-UX-002
type: evidence
requirement: REQ-UX-002
status: done
owner: qa-lead
date: 2026-10-25
---

# MAN-UX-002 Review der Textauslagerung

## Ziel

Nachweis nach [REQ-UX-002](../../02-anforderungen/req/REQ-UX-002.md):
1. Alle sichtbaren Texte liegen auf Deutsch vor.
2. Kein sichtbarer Text stammt aus einem Literal im Code statt aus einer Sprachressource.
3. Datums- und Zahlenformate folgen der eingestellten Sprache.

## Gegenstand

- Web-Oberfläche `apps/web/src` mit 37 Quelldateien, Sprachressourcen `apps/web/src/i18n/de.json` und `en.json` (react-intl, [ADR-0016](../../03-architektur/decisions/0016-internationalisierung.md)).
- Rechtstexte und FAQ in `apps/web/src/content/**`.
- Server-Fehlertexte (`Problem.title`/`code`).
- E-Mail-Vorlagen in `apps/server/src/modules/notifications/templates.ts` (`TEXTS.de`, `TEXTS.en`).
- Stand: Commit `37ac306`.

## Vorgehen

1. `node scripts/check-i18n.mjs`. Das Skript prüft gleiche Schlüssel in de/en, unbekannte und ungenutzte Schlüssel, ICU-Syntax und gleiche Platzhalter sowie englische Lesefassungen.
2. Suche nach Textliteralen in TSX und TS außerhalb von `i18n/` und `content/`:
   - Text zwischen JSX-Tags mit Umlauten;
   - die Attribute `label`, `title`, `placeholder`, `aria-label`, `alt` mit Wörtern;
   - Zeichenketten mit Umlauten in `'…'`, `"…"` und `` `…` ``.
3. Fehlercodes des Servers mit den Schlüsseln `apiError.<code>` abgeglichen.
4. E-Mail-Vorlagen und Systemnachrichten des Servers durchgesehen.
5. Formatierung: `lib/format.ts` gelesen (Intl je Sprache `de-DE`/`en-GB`). Der E2E-Test AT-UX-007 prüft englisches Datumsformat und Mail.

## Ergebnis gegen das Akzeptanzkriterium

| Kriterium | Messung | Ergebnis |
|---|---|---|
| (1) 100 % der sichtbaren Texte auf Deutsch | `check-i18n`: 605 Schlüssel in `de.json`, alle mit Wert; Standardsprache Deutsch | erfüllt |
| (2) 0 sichtbare Texte aus Literalen | Literalsuche: 2 Treffer, keiner davon ein übersetzbarer Text (siehe unten) | erfüllt |
| Datums- und Zahlenformate folgen der Sprache | `Intl.DateTimeFormat`/`NumberFormat` mit Sprache aus dem Kontext; E2E AT-UX-007 (englisches Datumsformat im Profil) | erfüllt |
| Fehlermeldungen | 40 Fehlercodes im Server, 51 Schlüssel `apiError.*` (mehr als genug); Fallback auf den Servertext bei unbekanntem Code | erfüllt |
| E-Mails | alle 11 Vorlagen in `TEXTS.de` und `TEXTS.en`, Auswahl nach `user.locale` | erfüllt |
| Pseudo-Sprache (Messverfahren 2) | Es gibt keine Pseudo-Sprache. Ersatzweise belegt die vollständige englische Fassung (Stichprobe ohne deutsche Reste im E2E-Test AT-UX-007), dass alle Texte austauschbar sind. | erfüllt mit Ersatznachweis |

**Treffer der Literalsuche:**

| Fundstelle | Literal | Bewertung |
|---|---|---|
| `components/Dialog.tsx:39` | `✕` mit `aria-hidden`; die Beschriftung kommt aus `t('dialog.close')` | kein Text, ok |
| `routes/listing-form.tsx:230` | `label="ISBN"` | Fachbegriff, in allen Sprachen gleich; ok, optional auslagern |

## Befunde

| ID | Schwere | Befund | Vorschlag |
|---|---|---|---|
| T-1 | mittel | Die Erkennung „Muster/Übung“ der Rechtstexte hängt am **deutschen Hinweistext**. Betroffen sind drei Stellen: `apps/web/src/lib/content.ts:84`, `apps/web/scripts/legal-manifest.mjs:36` und `apps/server/src/platform/legal.ts:56`, jeweils über `/Muster im Rahmen einer Übungsaufgabe/`. Wird der Hinweis umformuliert, verschwinden Muster-Badge und Startwarnung still, und `LEGAL_STRICT` greift nicht mehr. Der aktuelle Auftrag (Q-28, „Übungsaufgabe – fiktive Angaben …“) formuliert ihn gerade um. | Nur das Front-Matter-Feld `sample: true` auswerten und in allen Rechtstexten (de/en) setzen. `check-i18n` oder ein Unit-Test prüft, dass jede Datei `sample` gesetzt hat. |
| T-2 | niedrig | Der Server speichert Systemnachrichten im Chat als **deutschen Fließtext** (`messaging/service.ts:269`, `:409`). Der Client übersetzt sie über eine Tabelle mit den genauen deutschen Sätzen (`routes/messages.tsx:26-32`). Jede Textänderung im Server bricht die Übersetzung, und alte Nachrichten bleiben deutsch. | Systemnachrichten mit einem Code speichern (z. B. `body = 'system:reserved'` oder Spalte `system_code`); der Client übersetzt nur den Code. |
| T-3 | niedrig | `Problem.title` des Servers ist deutsch. Die Oberfläche zeigt auf Deutsch den Servertext, auf Englisch die Übersetzung über den Code. Das ist für die Oberfläche unkritisch, API-Nutzer bekommen aber immer Deutsch. | Für API-Nutzer `Accept-Language` auswerten; kein Handlungsbedarf für R1. |

## Ergebnis

**MAN-UX-002 ist erfüllt.** Alle sichtbaren Texte der Oberfläche stammen aus den Sprachressourcen. Die englische Fassung ist vollständig, und die Formate folgen der Sprache. T-1 sollte vor der Umformulierung der Muster-Hinweise behoben werden, weil sonst eine Kennzeichnungspflicht der Übung still ausfällt.

## Folgeaufgaben

- T-1: Muster-Erkennung auf `sample: true` umstellen (Code: `content.ts`, `legal-manifest.mjs`, `legal.ts`; Inhalte: Front Matter)
- T-2: Systemnachrichten als Code speichern (Backlog, R2)
