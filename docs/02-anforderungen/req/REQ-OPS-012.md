---
id: REQ-OPS-012
title: Automatisierte Aktualisierung von Abhängigkeiten
type: operational
class: constraint
status: implemented
owner: team-plattform
risk: low
release: R1
moscow: S
kano: n/a
epic: EPIC-13
source: Guideline Kap. 09, OWASP A06
depends_on: [REQ-OPS-004]
version: 1.1
created: 2026-10-24
last_updated: 2026-10-25
verification: [CTRL-RENOVATE]
---

# REQ-OPS-012 Automatisierte Aktualisierung von Abhängigkeiten
## Anforderung
Abhängigkeiten (npm-Pakete, Basis-Images, GitHub Actions) müssen automatisiert auf neue Versionen geprüft und als Pull Request mit grüner CI vorgeschlagen werden; Sicherheitsupdates sofort, sonst gebündelt wöchentlich.

## Begründung
Veraltete Komponenten mit bekannten Schwachstellen (OWASP A06) sind ein häufiger Angriffsweg; manuelle Pflege wird vergessen.

## Akzeptanzkriterien
- `renovate.json` im Repository: Zeitplan wöchentlich, Gruppierung (z. B. React, Fastify, Test-Werkzeuge), Sicherheitsupdates ohne Zeitplan, Lockfile-Pflege, Basis-Images per Digest, automatisches Mergen nur für Patch-Updates von Entwicklungsabhängigkeiten nach grüner CI.
- Ablauf im Update-Prozess beschrieben (`docs/07-betrieb/update-prozess.md`).

## Fehler- und Missbrauchsfälle
N/A – Risiko niedrig; jede Aktualisierung durchläuft die CI.

## Nachweis
- `CTRL-RENOVATE`: CI-Kontrolle – `renovate-config-validator` prüft `renovate.json`.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-24 | Erstfassung aus dem Abgleich Recht, Auftritt und Betrieb ([06-abgleich-recht-betrieb.md](../06-abgleich-recht-betrieb.md)); als Übung mit Platzhaltern freigegeben (Q-23) |
| 1.1 | 2026-10-25 | Review v1.3 (RV-R-11, RV-A-16): Status nach Umsetzung; Automerge für Dev-Patches, zentrale Tool-Versionen in CI per Regex-Manager |
