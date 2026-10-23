---
id: REQ-AUTH-001
title: Registrierung nur mit Hochschul-Domain (BR-01)
type: business-rule
class: domain
status: implemented
owner: team-identity
risk: high
reviewers: [product-owner, security-lead]
release: R1
moscow: M
kano: basis
epic: EPIC-01
source: BG-1
use_cases: [UC-01]
version: 1.1
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-AUTH-001, AT-AUTH-001-2]
---

# REQ-AUTH-001 Registrierung nur mit Hochschul-Domain (BR-01)

## Anforderung
Das System muss eine Registrierung nur mit E-Mail-Adressen zulassen, deren Domain **exakt** auf der Whitelist steht und deren Whitelist-Eintrag aktiv ist (Geschäftsregel BR-01). Die Whitelist ist Daten, nicht Code (REQ-ARCH-003).

## Begründung
Kernversprechen der Plattform: ein Marktplatz ausschließlich für Angehörige der HWG LU (BG-1). Startwerte der Whitelist: `hwg-lu.de` (Beschäftigte), `studmail.hwg-lu.de` (Studierende).

## Akzeptanzkriterien
Normalisierung vor der Prüfung: Leerzeichen trimmen, Domain in Kleinbuchstaben. Der lokale Teil bleibt unverändert, `+`-Suffixe werden für die Eindeutigkeit entfernt.

| # | Eingabe | Domain exakt auf Whitelist? | Eintrag aktiv? | Ergebnis |
|---|---|---|---|---|
| 1 | `max.muster@studmail.hwg-lu.de` | ja | ja | ✅ zulassen, Typ Studierende |
| 2 | `M.Muster@HWG-LU.DE` | ja (nach Normalisierung) | ja | ✅ zulassen, Typ Beschäftigte |
| 3 | `max@mail.hwg-lu.de` | nein (Subdomain ≠ Eintrag) | – | ❌ ablehnen |
| 4 | `max@hwg-lu.de.evil.com` | nein | – | ❌ ablehnen |
| 5 | `max@uni-mannheim.de` | nein | – | ❌ ablehnen (Backlog EPIC-10) |
| 6 | `max+test@studmail.hwg-lu.de` | ja | ja | ✅ zulassen, Eindeutigkeit auf `max@studmail.hwg-lu.de` |
| 7 | beliebige Adresse einer Domain mit Status `deaktiviert` | ja | nein | ❌ ablehnen |
| 8 | syntaktisch ungültige Adresse (kein/mehrere `@`, leerer lokaler Teil) | – | – | ❌ ablehnen als „ungültiges Format“ |

Ablehnungen nennen den Grund („Registrierung nur mit einer E-Mail-Adresse der HWG LU möglich“); sie verraten nichts über bestehende Konten (REQ-AUTH-004).

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Suffix-/Subdomain-Tricks (`hwg-lu.de.evil.com`, `x.hwg-lu.de`) | abgelehnt (Zeilen 3, 4) |
| Groß-/Kleinschreibung, Leerzeichen | normalisiert (Zeile 2) |
| Mehrfachkonten über `+`-Aliasse | verhindert durch kanonische Adresse (Zeile 6) |
| Massenregistrierung | Rate-Limit (REQ-SEC-005) |

## Nachweis
- `AT-AUTH-001`: Unit-Test der Entscheidungstabelle, jede Zeile ein Testfall (Grundlage: `apps/server/src/modules/identity/domain.test.ts`, „BR-01 Domain-Prüfung“).
- `AT-AUTH-001-2`: Smoke-Test – Registrierung mit `x@hwg-lu.de.evil.com` wird mit `domain_not_allowed` abgelehnt (QS-1).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei, Zeile 8 (Formatfehler) aus der Umsetzung ergänzt |
