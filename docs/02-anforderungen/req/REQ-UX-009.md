---
id: REQ-UX-009
title: Vollständige Fehlerseiten für alle Fehlerarten
type: user-story
class: functional
status: implemented
owner: team-plattform
risk: medium
release: R1
moscow: S
kano: basis
epic: EPIC-13
source: Auftraggeber (2026-11-12, Q-29), REQ-UX-003, Guideline Kap. 03 „Resilience on the frontend“
version: 1.1
created: 2026-11-12
last_updated: 2026-11-12
review_due: 2027-04-23
systems: [campusmarkt-web, campusmarkt-server]
depends_on: [REQ-UX-003, REQ-UX-006, REQ-UX-007, REQ-A11Y-001]
verification: [AT-UX-009, AT-UX-009-2, AT-UX-009-3, AT-UX-009-4]
---

# REQ-UX-009 Vollständige Fehlerseiten für alle Fehlerarten
## Anforderung
Als Besucher oder Mitglied möchte ich bei jedem Fehler – fehlende Berechtigung, unbekannte Anzeige, zu viele Anfragen, Serverfehler, Wartung oder fehlende Verbindung – eine verständliche Seite im gewohnten Aufbau sehen, die mir sagt, was passiert ist und wie es weitergeht, damit ich nicht auf einer leeren oder irreführenden Seite festhänge.

## Begründung
REQ-UX-003 legt die HTTP-Statuscodes und die Seiten für 404, 500 und 503 fest. Im Prototyp fehlten weitere Fälle: Wer ohne Rolle `/admin` aufrief, landete still auf der Startseite; eine unbekannte Anzeige zeigte nur einen Hinweiskasten; ein 429 ergab eine allgemeine Meldung ohne Wartezeit; ein Fehler außerhalb des Routers ließ die Seite leer. Die Guideline (Kap. 03) verlangt Error Boundaries und die Unterscheidung „kein Netz“ gegenüber „Serverfehler“. Diese Anforderung **ergänzt** REQ-UX-003 (keine Doppelung): REQ-UX-003 bleibt für Statuscodes und die Grundseiten maßgeblich, hier stehen die zusätzlichen Fälle und der einheitliche Aufbau.

## Akzeptanzkriterien
**Gemeinsamer Aufbau jeder Fehlerseite:** Fehlercode (außer offline), Überschrift erster Ordnung mit Fokus (Screenreader sagen den Fehler an), verständlicher Text ohne Interna, Seitentitel „<Überschrift> – CampusMarkt HWG LU“, Wege zurück (Startseite immer; „Zurück“, wenn es einen Verlauf gibt; „Erneut versuchen“, wo ein neuer Versuch helfen kann), Links zu Hilfe, Kontakt und Systemstatus. Seitenkopf und Seitenfuß bleiben erhalten (REQ-UX-006). Beide Sprachen (REQ-UX-007), beide Farbschemata (REQ-UX-008).

**Entscheidungstabelle – Fehler → Fehlerseite:**

| Auslöser | Fehlerseite | Code | „Erneut versuchen“ | Zusätzlich |
|---|---|---|---|---|
| Unbekannte Adresse (REQ-UX-003) | Seite nicht gefunden | 404 | nein | Suche für Mitglieder |
| Unbekannte oder gelöschte Anzeige, auch beim Bearbeiten | Anzeige nicht gefunden | 404 | nein | – |
| Unbekannte Unterhaltung oder fremde Unterhaltung | Unterhaltung nicht gefunden | 404 | nein | – |
| Seite für Moderation oder Administration ohne passende Rolle; fremde Anzeige bearbeiten | Kein Zugriff | 403 | nein | keine Weiterleitung, Adresse bleibt stehen |
| Sitzung abgelaufen (401 beim Laden) | Bitte melde dich an | 401 | nein | Link zur Anmeldung mit Rücksprung |
| Rate-Limit (429) | Zu viele Anfragen | 429 | ja | Wartezeit aus `Retry-After` (Sekunden oder HTTP-Datum) |
| Wartung (503 `maintenance`, REQ-OPS-006) | Wartungsarbeiten | 503 | ja | voraussichtliche Rückkehr aus `Retry-After` |
| Netzwerkfehler bzw. Gerät offline | Keine Verbindung | – | ja | Hinweis im Seitenkopf, solange offline |
| Sonstiger Fehler beim Laden oder Rendern (500 u. a.) | Etwas ist schiefgelaufen | Status der Antwort, sonst 500 | ja | Request-ID zum Melden (REQ-UX-003) |
| Fehler außerhalb des Routers (Layout, Provider) | Minimalseite „Etwas ist schiefgelaufen“ | – | „Seite neu laden“ | ohne Router-Abhängigkeit |

**Formulare und Aktionen:** Ein 429 bei einer Aktion zeigt die Meldung am Formular mit Wartezeit („Zu viele Anfragen. Bitte versuche es in 30 Sekunden erneut.“); ein eigener Fehlercode mit 429 (z. B. `contact_request_limit`) behält seinen Text.

**Statuscodes des Servers (ergänzt REQ-UX-003):**

| Anfrage | Antwort |
|---|---|
| `GET` einer unbekannten Seite ohne Dateiendung | 404 mit SPA (unverändert) |
| `GET` einer fehlenden Datei mit Endung und `Accept: text/html` (z. B. alter Link auf `/seite.html`) | **404 mit SPA** (bisher JSON) |
| `GET` einer fehlenden Datei ohne HTML-Erwartung (Bild, Skript, Werkzeug) | 404 JSON (unverändert) |
| `/api`, `/api/…`, `/health…`, `/metrics…` | immer JSON, nie die SPA (`/api` ohne Schrägstrich bisher SPA) |
| Bekannte Route mit unbekannter Ressource (z. B. `/listings/<unbekannte ID>`) | 200 mit SPA, die „Anzeige nicht gefunden“ zeigt (bewusst, siehe unten) |

```gherkin
Szenario: Mitglied ohne Rolle öffnet die Administration
  Angenommen ich bin als Mitglied ohne Administrationsrolle angemeldet
  Wenn ich /admin aufrufe
  Dann sehe ich "Kein Zugriff" mit "Fehlercode 403"
  Und die Adresse bleibt /admin
  Und es gibt einen Link "Zur Startseite"
```

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Fehler in der Fehlerseite selbst bzw. außerhalb des Routers | Rückfallebene ohne Router (`AppErrorBoundary`), Neuladen und einfache Links |
| Interne Details in Fehlermeldungen | nie; Text aus dem Sprachkatalog, Details nur im Log unter der Request-ID (REQ-UX-003) |
| `Retry-After` fehlt, ist ungültig oder liegt in der Vergangenheit | allgemeiner Hinweis „Bitte warte einen Moment …“ |
| Automatische Wiederholungen bei 429 oder Wartung | keine (TanStack Query wiederholt nur Netz- und Serverfehler außer Wartung), damit das Rate-Limit nicht weiter belastet wird |
| Erraten fremder Anzeigen- oder Unterhaltungs-IDs | gleiche 404-Seite für „gibt es nicht“ und „nicht berechtigt“ bei Unterhaltungen (keine Auskunft über Existenz, REQ-CHAT-001) |
| Statuscode bei bekannter Route mit unbekannter Ressource | bleibt 200 („Soft 404“), weil der Server die Ressource beim Ausliefern der SPA nicht prüft (keine Kopplung der Auslieferung an Fachmodule, REQ-ARCH-001). Kein Schaden: Alles ist `noindex` (REQ-PRIV-008); die API selbst liefert 404 |
| Rollenprüfung im Browser umgangen | ohne Wirkung; die API prüft jede Rolle selbst und antwortet 403 |

## INVEST
I: setzt auf REQ-UX-003 auf · N: Texte und Aufbau verhandelbar · V: Orientierung, weniger Supportanfragen · E: mittel · S: zwei Tage · T: Komponenten-, Unit- und E2E-Test.

## Nachweis
- `AT-UX-009`: Komponententest – Entscheidungstabelle Fehler → Fehlerseite und gemeinsamer Aufbau jeder Fehlerseite (`apps/web/src/components/ErrorPages.test.tsx`).
- `AT-UX-009-2`: Unit-Test – API-Client bei 429: `Retry-After` als Sekunden oder HTTP-Datum, Meldung mit Wartezeit (`apps/web/src/api/client.test.ts`).
- `AT-UX-009-3`: Unit-Test – Statuscodes für unbekannte Pfade je nach Anfrage (`apps/server/src/platform/http/server.test.ts`).
- `AT-UX-009-4`: E2E-Test – 403, 404 für Anzeige und Unterhaltung, 429 mit Wartezeit, Offline-Hinweis und Offline-Seite, englische 404 im dunklen Schema, axe-core (`e2e/tests/errors.spec.ts`).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-11-12 | Erstfassung auf Wunsch des Auftraggebers (Q-29), freigegeben, ergänzt REQ-UX-003 |
| 1.1 | 2026-11-12 | Umgesetzt (B-67); Status → implemented |
