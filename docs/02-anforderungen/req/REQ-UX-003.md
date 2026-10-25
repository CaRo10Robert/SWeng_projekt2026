---
id: REQ-UX-003
title: Fehlerseiten und korrekte HTTP-Statuscodes
type: user-story
class: functional
status: verified
owner: team-plattform
risk: medium
release: R1
moscow: M
moscow_reason: [3]
kano: basis
epic: EPIC-13
source: BG-2, Guideline Kap. 05
depends_on: [REQ-UX-006]
version: 1.2
created: 2026-10-24
last_updated: 2026-10-25
verification: [AT-UX-003, AT-UX-003-2]
---

# REQ-UX-003 Fehlerseiten und korrekte HTTP-Statuscodes
## Anforderung
Als Besucher möchte ich bei einer unbekannten Adresse, einem Serverfehler oder einer Wartung eine verständliche Seite mit Weg zurück sehen, damit ich nicht festhänge. Clients und Werkzeuge müssen am HTTP-Statuscode erkennen, was passiert ist.

## Begründung
Ein SPA-Fallback mit Status 200 für jede Adresse verschleiert Fehler (Monitoring, Suchmaschinen, Linkprüfer). Fehlerseiten sind ein Basismerkmal eines professionellen Auftritts.

## Akzeptanzkriterien
| Situation | Statuscode | Inhalt |
|---|---|---|
| Unbekannte Seite | 404 | „Seite nicht gefunden“, Suche (für Mitglieder), Links zu Startseite und Hilfe, Seitenfuß mit Rechtslinks |
| Unbekannter API-Pfad | 404 | JSON `{ code: "not_found" }` |
| Unerwarteter Serverfehler | 500 | „Etwas ist schiefgelaufen“ mit Fehlerkennung (Request-ID), ohne Stacktrace oder interne Details |
| Wartungsmodus (REQ-OPS-006) | 503 mit `Retry-After` | Wartungsseite mit voraussichtlichem Ende |
| Bekannte Route der SPA | 200 | Seite |

```gherkin
Szenario: Unbekannte Adresse
  Wenn ich /gibt-es-nicht aufrufe
  Dann antwortet der Server mit 404
  Und ich sehe "Seite nicht gefunden" mit Links zur Startseite und zur Hilfe
```

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Pfad mit Sonderzeichen oder sehr lang | 404 bzw. 414, kein Reflektieren des Pfads ohne Escaping |
| Fehler im Fehlerbehandler | statische Minimalseite, Status 500 |
| Interne Details in der Antwort | nie; Details nur im Log unter der Request-ID |

## INVEST
I: unabhängig · N: Gestaltung verhandelbar · V: Orientierung, Betreibbarkeit · E: klein · S: wenige Tage · T: Statuscodes per HTTP-Test.

## Nachweis
- `AT-UX-003`: Smoke- oder E2E-Test – unbekannte Seite ergibt 404 mit Seite „Seite nicht gefunden“ und Links; unbekannter API-Pfad ergibt JSON-404.
- `AT-UX-003-2`: Unit-Test – Fehlerbehandler liefert bei unerwartetem Fehler 500 mit Request-ID ohne Stacktrace.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-24 | Erstfassung aus dem Abgleich Recht, Auftritt und Betrieb ([06-abgleich-recht-betrieb.md](../06-abgleich-recht-betrieb.md)); als Übung mit Platzhaltern freigegeben (Q-23) |
| 1.1 | 2026-10-25 | Review v1.3 (RV-R-11, RV-A-20): Status nach Umsetzung; HEAD wird wie GET behandelt |
| 1.2 | 2026-10-25 | Verifiziert im finalen Lauf gegen das Docker-Beispiel (AT-UX-003, AT-UX-003-2 bestanden bzw. ausgeführt); Status → verified |
