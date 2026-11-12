---
id: REQ-OPS-013
title: Automatische Auslieferung eines Releases mit Rückweg
type: operational
class: quality
status: implemented
owner: team-plattform
risk: medium
reviewers: [qa-lead]
release: R1
moscow: S
kano: n/a
epic: EPIC-00
source: Guideline Kap. 10, Vorführung des Prototyps am 2026-11-13
depends_on: [REQ-OPS-004, REQ-OPS-001, REQ-OPS-005]
version: 1.0
created: 2026-11-12
last_updated: 2026-11-12
verification: [AT-OPS-013, AT-OPS-013-2]
---

# REQ-OPS-013 Automatische Auslieferung eines Releases mit Rückweg
## Anforderung
Ein Release muss ohne Handarbeit vom Git-Tag bis zur laufenden Installation gelangen:

1. **Auslöser:** Ein Tag `vX.Y.Z` auf einem Commit von `main`. Die Version steht an genau einer Stelle (alle `package.json`), Tag, Image-Tag, OpenAPI und `/health/live` leiten sich daraus ab.
2. **Prüfung vor der Auslieferung:** Alle CI-Jobs (Typen, Unit- und Integrationstests, E2E, Smoke, Restore, Sicherheitsscans, Multi-Arch) müssen für diesen Commit grün sein; zusätzlich Tag = Version, Commit liegt auf `main`, der Changelog hat einen Abschnitt für die Version.
3. **Build once, promote:** Das in CI gebaute und geprüfte Image geht unverändert in die Registry (`ghcr.io/caro10robert/campusmarkt:X.Y.Z`) mit Build-Provenance; dazu ein GitHub-Release mit Changelog, Image-Archiv und SBOM.
4. **Einspielen:** Das Zielsystem holt neue Versionen selbst ab (Pull, ADR-0022). Vor dem Wechsel sichert es Daten und Konfiguration, danach prüft es Gesundheit und Funktion; schlägt eine Prüfung fehl, kehrt es automatisch zur alten Version mit den alten Daten zurück.

## Begründung
Manuelle Auslieferung ist fehleranfällig und nicht nachvollziehbar. Die Guideline (Kap. 10) verlangt „build once, promote“ und ein automatisches Release-Gate. Die Vorführung zeigt den Weg vom Commit bis zur laufenden Installation.

## Qualitätsmerkmal, Metrik, Messverfahren
| Merkmal (ISO/IEC 25010) | Metrik | Zielwert | Messverfahren |
|---|---|---|---|
| Zuverlässigkeit – Wiederherstellbarkeit | Zeit von fehlgeschlagener Prüfung bis zur wieder laufenden alten Version | ≤ 10 min | Update-Historie des Zielsystems (Zeitstempel „rolled_back“) |
| Wartbarkeit – Änderbarkeit | Zeit vom Ende der grünen CI bis zur laufenden neuen Version | ≤ 15 min | Zeitstempel des Jobs `release` und der Update-Historie |
| Wartbarkeit – Änderbarkeit | Releases ohne Handarbeit nach dem Tag | 100 % | Update-Historie: jedes Release mit Status „updated“ oder „rolled_back“ ohne manuellen Eingriff |

## Akzeptanzkriterien
```gherkin
Szenario: Release ausliefern
  Angenommen main enthält Version 0.5.0 mit Changelog-Abschnitt
  Wenn der Tag v0.5.0 gepusht wird und alle CI-Jobs grün sind
  Dann liegt ghcr.io/caro10robert/campusmarkt:0.5.0 mit Provenance in der Registry
  Und es gibt ein GitHub-Release v0.5.0 mit Image-Archiv und SBOM
  Und das Zielsystem läuft binnen 15 Minuten mit 0.5.0 und /health/live meldet "0.5.0"

Szenario: Falscher Tag
  Angenommen package.json enthält 0.5.0
  Wenn der Tag v0.6.0 gepusht wird
  Dann bricht der Job release ab und es wird kein Image veröffentlicht

Szenario: Fehlerhaftes Release
  Angenommen die neue Version wird nach dem Start nicht gesund
  Dann läuft die Installation wieder mit der alten Version und den Daten von vor dem Wechsel
```

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Tag auf einem Commit außerhalb von `main` | Release-Prüfung bricht ab, nichts wird veröffentlicht |
| Ein CI-Job ist rot | der Job `release` startet nicht (`needs`) |
| Migration der neuen Version scheitert | App wird nicht gesund → Rückweg mit Datenbank-Sicherung von vor dem Wechsel |
| Registry nicht erreichbar | Zielsystem bleibt auf der alten Version und versucht es beim nächsten Lauf erneut |
| Zugangsdaten | die Pipeline hat keinen Zugang zum Zielsystem; das Zielsystem braucht für ein öffentliches Paket keinen Token |

## Nachweis
- `AT-OPS-013`: Release-Prüfung (`tests/ops/release-check.mjs`) – in jedem CI-Lauf dieselbe SemVer-Version in allen `package.json`; im Job `release` zusätzlich Tag = Version, Commit auf `main`, Changelog-Abschnitt.
- `AT-OPS-013-2`: Unit-Test (`server.test.ts`) – `/health/live` und OpenAPI nennen die Version aus `package.json`.
- Einspielen und Rückweg auf dem Zielsystem prüft dessen Betreiber mit eigenen Tests (CaRoNexus: `caroai_update.py`, Tests T-REL-03); siehe [Update-Prozess](../../07-betrieb/update-prozess.md#release-und-auslieferung).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-11-12 | Erstfassung mit Release-Job in CI und Pull-Auslieferung (ADR-0022) |
