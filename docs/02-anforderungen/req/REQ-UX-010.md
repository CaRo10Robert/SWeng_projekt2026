---
id: REQ-UX-010
title: Website-Hygiene – Icons, Manifest, Metadaten, Seitentitel, saubere Konsole
type: quality
class: quality
status: approved
owner: team-produkt
risk: low
reviewers: [qa-lead]
release: R1
moscow: S
kano: basis
epic: EPIC-13
source: Auftraggeber (2026-11-12, Q-29), REQ-UX-001, REQ-PRIV-008
version: 1.0
created: 2026-11-12
last_updated: 2026-11-12
review_due: 2027-04-23
systems: [campusmarkt-web, campusmarkt-server]
depends_on: [REQ-UX-001, REQ-UX-007, REQ-PRIV-008, REQ-UX-008]
verification: [AT-UX-010, AT-UX-010-2]
---

# REQ-UX-010 Website-Hygiene – Icons, Manifest, Metadaten, Seitentitel, saubere Konsole
## Anforderung
Die Web-App muss die üblichen Grundlagen einer sauberen Website erfüllen: vollständiger Icon-Satz, Web-App-Manifest mit Farben und Icons, Metadaten im Kopf der Seite, keine Indexierung durch Suchmaschinen, ein eigener, sprechender Seitentitel je Seite, ein `lang`-Attribut, das der gewählten Sprache folgt, und keine Fehlermeldungen in der Browserkonsole – ohne externe Ressourcen oder Analysewerkzeuge (ADR-0010).

## Begründung
Diese Punkte fallen Nutzenden sofort auf (fehlendes Symbol im Tab oder auf dem Startbildschirm, Tabs mit identischem Titel) und sind Teil von Barrierefreiheit (Seitentitel: WCAG 2.2 SC 2.4.2, Sprache: SC 3.1.1) und Installierbarkeit (REQ-UX-001). Die Bestandsaufnahme vom 2026-11-12 ergab: nur ein SVG-Icon (Safari und ältere Systeme zeigen kein Symbol), Manifest ohne Rastergrafiken, nur eine `theme-color`, 14 von 26 Routen ohne eigenen Seitentitel (u. a. Anmeldung, Suche, Anzeige, Formular, Nachrichten, Profil, Administration), kein `noindex` im Dokument selbst. `robots.txt` und `X-Robots-Tag` sowie die `lang`-Umschaltung waren vorhanden (REQ-PRIV-008, REQ-UX-007).

## Qualitätsmerkmal, Metrik, Messverfahren
| Feld | Festlegung |
|---|---|
| Qualitätsmerkmal (ISO 25010) | Interaction Capability → Appropriateness Recognizability, Operability; Flexibility → Installability |
| Metrik | (1) Anteil der Prüfpunkte der Checkliste unten, die erfüllt sind; (2) Anzahl der Seiten ohne eigenen Titel; (3) Anzahl der Konsolenfehler und unbehandelten Ausnahmen beim Durchlauf aller Seitentypen |
| Akzeptanzkriterium | (1) **100 %**; (2) **0**; (3) **0** in hellem und dunklem Schema (Netzwerkmeldungen des Browsers zu erwarteten Statuscodes wie 401 für Gäste zählen nicht) |
| Messverfahren | E2E-Test gegen das Docker-Beispiel (AT-UX-010) und Unit-Test des Dokumentkopfs und der Icon-Dateien (AT-UX-010-2) |
| Messkontext | Docker-Beispiel mit Seed-Daten, Chromium/Edge, Gast, Mitglied und Administration |
| Verhalten bei Verfehlung | Fehler im CI; kein Release-Blocker, aber vor der nächsten Vorführung zu beheben |

**Checkliste:**

| Punkt | Festlegung |
|---|---|
| Favicon | `favicon.ico` (16/32/48 px) und `icon.svg`, beide im Kopf verlinkt |
| Apple Touch Icon | `apple-touch-icon.png` 180 × 180 px, randlos und deckend |
| Manifest | Name, Kurzname, Beschreibung, `lang`, `start_url`, `scope`, `id`, `display: standalone`, `theme_color`, `background_color`, Icons SVG, 192 px, 512 px und 512 px `maskable` |
| Farbe der Browserleiste | `theme-color` je Systemschema (hell und dunkel) per `media`, bei ausdrücklicher Wahl des Schemas angepasst (REQ-UX-008) |
| Metadaten | `charset`, `viewport`, `description`, `color-scheme`, `<noscript>`-Hinweis in beiden Sprachen |
| Keine Indexierung | `robots.txt` mit `Disallow: /`, Header `X-Robots-Tag` (REQ-PRIV-008) und zusätzlich `<meta name="robots" content="noindex, nofollow">`, damit auch aus dem Service-Worker-Cache gelieferte Seiten markiert sind |
| Seitentitel | „<Seite> – CampusMarkt HWG LU“ für jede Seite, in der gewählten Sprache; Anzeige und Unterhaltung mit dem Titel der Anzeige; Fehlerseiten mit ihrer Überschrift |
| Sprache | `<html lang>` folgt der gewählten Sprache (REQ-UX-007) |
| Konsole | keine Fehler und keine unbehandelten Ausnahmen; erwartete Ablehnungen (z. B. fehlende Rolle) erzeugen keinen Fehler |
| Externe Ressourcen | keine (keine Schriften, Skripte, Analyse oder Karten von fremden Hosts, ADR-0010, REQ-PRIV-006) |
| Kopfzeile auf schmalen Bildschirmen | kein horizontaler Überlauf bei 360 px, auch für Gäste (REQ-UX-001); volle Navigation erst ab 1280 px, darunter Menü |

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Icon-Grafik geändert, Rastergrafiken veraltet | `node apps/web/scripts/generate-icons.mjs` erzeugt alle Rastergrafiken neu; AT-UX-010-2 prüft Maße und Verweise |
| Neue Seite ohne Titel | `PageHeader` setzt den Titel automatisch; Seiten ohne `PageHeader` rufen `useDocumentTitle` auf; AT-UX-010 prüft alle Seiten |
| Bekannte Route mit unbekannter Ressource | Titel der Fehlerseite (REQ-UX-009) |

## Nachweis
- `AT-UX-010`: E2E-Test – Icon-Satz und Manifest erreichbar, Metadaten und `noindex`, eigener Titel je Seite, `lang` folgt der Sprache, keine Konsolenfehler in beiden Schemata (`e2e/tests/hygiene.spec.ts`).
- `AT-UX-010-2`: Unit-Test – Pflichtangaben im Kopf von `index.html`, keine externen Ressourcen, Icon-Satz mit richtigen Pixelmaßen (`apps/web/src/index-html.test.ts`).
- Der Überlauf bei 360 px für Gastseiten ist Teil von AT-UX-001 (REQ-UX-001).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-11-12 | Erstfassung auf Wunsch des Auftraggebers (Q-29), freigegeben |
