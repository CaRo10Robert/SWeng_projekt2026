# ADR-0022: Release-Pipeline – Git-Tag, geprüftes Image in der Registry, Zielsystem holt ab

- **Status:** Accepted (2026-11-12)
- **Datum:** 2026-11-12
- **Bezug:** REQ-OPS-013, REQ-OPS-004 (erweitert), REQ-OPS-001, REQ-OPS-005, ADR-0010 (unverändert gültig), Guideline Kap. 10 („build once, promote“, Release-Gate)

## Kontext
Bisher endet die CI mit einem Image-Archiv als Artefakt (REQ-OPS-004). Ausgeliefert wird von Hand. Für die Vorführung des Prototyps und als Muster für weitere Projekte soll ein Release ohne Handarbeit vom Git-Tag bis zur laufenden Installation gelangen, mit Rückweg bei Fehlern.

Rahmenbedingungen:
- GitHub im kostenlosen Tarif. Das Repository ist öffentlich; Actions, das Paket-Register (ghcr.io) und Regeln zum Schutz von Branches und Tags sind für öffentliche Repos kostenlos. Ein Schutz von `main` ist noch nicht eingerichtet; die Prüfung „Commit liegt auf `main`“ macht die Pipeline deshalb selbst (unabhängig davon, ob später ein Ruleset dazukommt).
- Das Zielsystem (ein Heimserver mit Docker Compose) ist aus dem Internet nicht für Steuerbefehle erreichbar und soll es auch nicht werden.
- ADR-0010 gilt weiter: Abgabe ist das lokale Docker-Beispiel; die Registry ist eine zusätzliche, optionale Quelle (REQ-OPS-004).

## Optionen
| Option | Pro | Contra |
|---|---|---|
| **A: Tag → CI prüft → Image nach ghcr.io → Zielsystem holt ab (Pull)** | Pipeline braucht keinen Zugang zum Zielsystem; dasselbe geprüfte Image überall; Provenance und SBOM zum Release; kostenlos | Zielsystem braucht einen Abhol-Dienst mit Sicherung und Rückweg |
| B: CI meldet sich per SSH oder Webhook beim Zielsystem (Push) | Sofortige Auslieferung | Zugangsdaten mit Schreibrecht in GitHub; Zielsystem muss von außen erreichbar sein |
| C: Zielsystem baut selbst aus dem Tag | Keine Registry | Ungeprüftes zweites Build-Ergebnis („build once“ verletzt); Build-Werkzeuge auf dem Server |
| D: Watchtower o. Ä. | Fertiges Werkzeug | Seit 2025 archiviert; keine Datensicherung vor dem Wechsel, kein Rückweg mit Daten |

## Entscheidung
**Option A.**

1. **Version an einer Stelle:** alle `package.json` tragen dieselbe SemVer-Version; `tests/ops/release-check.mjs` prüft das in jedem CI-Lauf. Server: `apps/server/src/platform/version.ts` → OpenAPI und `/health/live`.
2. **Auslöser:** Tag `vX.Y.Z`. Die CI läuft für den Tag vollständig; der Job `release` hängt per `needs` von allen Jobs ab und prüft zusätzlich Tag = Version, Commit auf `main` und den Changelog-Abschnitt.
3. **Build once, promote:** Der Job `release` lädt das im Job `compose` gebaute und mit E2E-, Smoke- und Restore-Tests geprüfte Image-Archiv und überträgt es unverändert nach `ghcr.io/caro10robert/campusmarkt:X.Y.Z`. Dazu Build-Provenance in der Registry und ein GitHub-Release mit Changelog, Image-Archiv und SBOM. Das Image trägt `org.opencontainers.image.source` und ist damit mit dem Repository verknüpft.
4. **Auslieferung (Pull):** Das Zielsystem führt das Image mit festem Versions-Tag in seiner Compose-Datei und kennzeichnet den Dienst mit dem Label `caroai.release=auto`. Ein Abhol-Dienst fragt die Registry nach dem Zeitplan des Betreibers (in der Vorführumgebung nachts um 01:30, vor der nächtlichen Sicherung) und auf Anstoß von Hand. Bei einer neuen Version:
   1. Image laden.
   2. Den ganzen Stack (App und Datenbank) stoppen und alle Volumes sichern.
   3. Den Tag tauschen und starten.
   4. Prüfen: Container gesund, App-Prüfung (Label `caroai.release.health`), Smoke-Test des Zielsystems.
   5. Bei Fehlschlag automatisch zurück: alter Tag und Daten von vor dem Wechsel.
   6. Bei Erfolg eine Kopie des Image als Archiv sichern.

   Die Migrationen laufen beim Start der App (REQ-OPS-005); die Datensicherung vorher macht sie umkehrbar.

## Konsequenzen
- Ein neues Projekt braucht für die Auslieferung nur diesen Vertrag: Dockerfile mit Healthcheck, Version in `package.json`, Tag `vX.Y.Z`, Image auf ghcr.io; auf dem Zielsystem eine Compose-Datei mit festem Tag und den zwei Labels.
- Ein Release ist nachvollziehbar: Tag → CI-Lauf → Image-Digest mit Provenance → Eintrag in der Update-Historie des Zielsystems.
- Das öffentliche Paket ist für jeden abrufbar; es enthält nur, was auch im öffentlichen Repository steht. Für ein privates Paket bräuchte das Zielsystem einen Lese-Token (`read:packages`).
- Grenzen: Solange kein Ruleset `main` und die Tags `v*` schützt, kann ein Release-Commit auch ohne Pull Request auf `main` landen; die Release-Prüfung verhindert nur Tags außerhalb von `main`. Das Zielsystem prüft die Provenance beim Abholen noch nicht (Ausnahme EX-05). Majors spielt der Abhol-Dienst ebenfalls ein (eigene Releases); Inkompatibilitäten fängt der Rückweg ab, nicht die Pipeline.
