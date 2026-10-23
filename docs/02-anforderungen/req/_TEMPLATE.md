---
# Pflichtfelder (geprüft durch scripts/trace.mjs)
id: REQ-AREA-NNN              # stabil, nie umnummerieren; Ersatz über supersedes
title: Kurzer, eindeutiger Titel
type: user-story              # user-story | business-rule | data | api | quality | security | privacy | architecture | operational | discovery
class: functional             # functional | quality | domain | constraint  (Fallstudie FS-M2), passend zum Typ:
                              #   user-story → functional|constraint · business-rule → domain|functional|constraint · data → domain|functional
                              #   quality → quality · security → constraint|quality · privacy → constraint|quality|functional
                              #   architecture → constraint · operational → quality|constraint · api/discovery → functional|constraint
status: draft                 # draft | in-review | approved | implemented | verified | operational | rejected | deprecated | obsolete
owner: team-xyz
risk: medium                  # low | medium | high  (high ⇒ reviewers Pflicht)
release: R1                   # Planungshorizont der MoSCoW-Einstufung
moscow: M                     # M | S | C | W
moscow_reason: [2]            # Pflicht bei M: 1 Release-Ziel · 2 Sicherheits-/Datenschutz-/Rechtsrisiko · 3 Betreibbarkeit · 4 Verpflichtung
kano: basis                   # basis | leistung | begeisterung | n/a (nicht kundenwirksam)
epic: EPIC-NN
source: BG-1                  # Herkunft: Geschäftsziel, Fallstudie (FS-…), Gesetz, Stakeholder
version: 1.0
created: 2026-10-20
last_updated: 2026-10-23
# Optionale Felder
reviewers: [product-owner, security-lead]   # Pflicht bei risk: high; Fachrolle passend: security-lead | architecture-lead | qa-lead (+ qa-lead bei class: quality)
review_due: 2027-04-23        # bei zeitkritischen Standards (ASVS, WCAG, NIST, OWASP-Parameter)
use_cases: [UC-01]
depends_on: [REQ-AREA-NNN]
supersedes: REQ-AREA-NNN      # nur bei Ersatz einer Anforderung
verification: [AT-AREA-NNN]   # AT-… automatisierter Test · MAN-… manueller Nachweis · CTRL-… Kontrolle (siehe nachweise.md)
---

# REQ-AREA-NNN Titel

## Anforderung
User Story („Als … möchte ich …, damit …“) **oder** Regel-/Shall-Satz („Das System muss …“), lösungsneutral formuliert.

## Begründung
Warum gibt es die Anforderung? Bezug zu Geschäftsziel, Constraint oder Risiko.

## Akzeptanzkriterien
Given–When–Then für Verhalten, Entscheidungstabelle für Regeln, Schema/Grenzwerte für Daten.

## Qualitätsmerkmal, Metrik, Messverfahren
Nur bei Qualitätsanforderungen (Fallstudie FS-M3): Merkmal (ISO 25010) · Metrik · Akzeptanzkriterium (Ziel-/Grenzwert) · Messverfahren und -kontext · Verhalten bei Verfehlung.

## Fehler- und Missbrauchsfälle
Pflicht ab Risiko „mittel“ (Guideline Kap. 01): ungültige Eingaben, fehlende Berechtigung, Duplikate, Abhängigkeitsausfall, Rate-Limit, Missbrauch.

## INVEST
Nur bei User Stories: kurze Prüfung I/N/V/E/S/T.

## Nachweis
Welche Nachweis-IDs belegen die Erfüllung, und wo liegen sie?

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung |
