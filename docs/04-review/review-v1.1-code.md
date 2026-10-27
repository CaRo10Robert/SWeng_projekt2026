---
id: REVIEW-CODE-1.1
type: review
status: done
owner: architecture-lead
version: 1.0
created: 2026-10-24
last_updated: 2026-10-24
---

# Code-Review v1.1 (Sprint-1-Umfang, Commit `de07d54`)

## Kurzfazit

Geprüft wurde der Code aus Schritt 6. Dazu gehören die Kontaktfreigabe (REQ-CHAT-010), der `IdentityProviderPort` (ADR-0013), die Registrierungsgrenzen (Q-18), das E2E-Paket, der neue Smoke-Test und der CI-Workflow. Angrenzender Bestandscode wurde mitgeprüft, wo er betroffen ist.

**Kritische Befunde gibt es nicht.** Ohne Befund sind Sicherheit und Datenschutz der neuen Funktion:
- Die Adresse erscheint nur in `ContactShare.counterpartEmail`.
- Die Ereignisse gehen nur an die beiden Teilnehmer.
- Die Moderation sieht keine Adressen.
- Die neue Route ist geschützt durch Anmeldung, Teilnahmeprüfung (404), CSRF und Schema.

Ein Nebenläufigkeitstest gegen den laufenden Stack hat gezeigt, dass parallele Zustimmungen beider Seiten genau einen Austausch und eine Systemnachricht erzeugen.

Die wichtigsten Befunde:
- Die Konversationsliste setzte je Konversation mehrere Abfragen ab (N+1).
- Die Sperrfrist nach eigenem Widerruf fehlte, wenn das Gegenüber noch zustimmte. Damit ließ sich das Gegenüber mit Systemnachrichten fluten.
- In der Transaktion wurden weitere Pool-Verbindungen belegt.
- Das Login-Limit war nicht atomar.

## Prüfgrundlage und Methode

| Gegenstand | Stand |
|---|---|
| Code | `git diff HEAD~1 HEAD` auf `apps`, `packages`, `e2e`, `scripts`, `.github`, `docker` (Commit `de07d54`) |
| Maßstab | [Architektur](../03-architektur/architektur.md) Abschnitte 5.2 und 8, ADR-0004/0013/0014, REQ-CHAT-010, REQ-SEC-005, REQ-A11Y-002, DEV-Guideline (Code-Review) |
| Werkzeuge | Code lesen; `pnpm typecheck`, `pnpm test`, `pnpm lint:deps`, `scripts/trace.mjs`; Nebenläufigkeitstest per Skript gegen den Compose-Stack |
| Prüfer | unabhängiger Reviewer (nicht der Autor des Codes) |

## Befunde

| ID | Schwere | Ort | Befund | Status |
|---|---|---|---|---|
| CR-01 | hoch | `messaging/service.ts` `summarize`, `get` | N+1: je Konversation 5–6 Abfragen, bei 200 Konversationen bis zu ca. 1.200. `GET /conversations/:id` baute die ganze Liste auf. Jede Kontaktaktion löst bei beiden Teilnehmern ein Neuladen aus. | bestätigt |
| CR-02 | mittel | `messaging/domain.ts` | Nach eigenem Widerruf war erneutes Zustimmen sofort möglich, wenn das Gegenüber noch zustimmte. Jeder Wechsel erzeugte eine Systemnachricht, im Test 5 Wechsel = 5 Nachrichten. Das widerspricht REQ-CHAT-010 („frühestens 24 h nach Widerruf“). | bestätigt (Test) |
| CR-03 | mittel | `contactAction` | Blockierung und Kontostatus wurden innerhalb der Transaktion über eigene Pool-Verbindungen gelesen. Ab etwa 10 parallelen Aktionen drohten Pool-Erschöpfung und 500er. | Vermutung, Muster belegt |
| CR-04 | mittel | `identity/service.ts` `login` | Das Limit wurde erst gelesen und nach der Passwortprüfung gezählt. Parallele Fehlversuche umgingen so die Grenze von 5 und kosteten Argon2-Rechenzeit. | bestätigt |
| CR-05 | mittel | `web/api/messaging.ts` | `useConversation` fragte ohne WebSocket nicht regelmäßig ab. Dadurch blieb der Kontaktstatus stehen, nach einem Widerruf blieb die Adresse sichtbar. | bestätigt |
| CR-06 | niedrig | `ContactShare.tsx`, `ui.tsx` | Fokusverlust nach jeder Kontaktaktion (WCAG 2.4.3). | bestätigt |
| CR-07 | niedrig | `ContactShare.tsx` | Folgende Zustände fehlten oder stimmten nicht: Hinweis nach eigenem Widerruf, Knöpfe ohne Kopplung an `canGrant`, stehen gebliebene Fehlermeldung, „Seite neu laden“ bei 409. | bestätigt |
| CR-08 | niedrig | `exportContactConsents` | Eigene Ablehnungen fehlten im eigenen Datenexport (REQ-ACC-003). | bestätigt |
| CR-09 | niedrig | `messaging/domain.ts` | Nach Aufheben einer Blockierung wird die Adresse ohne neue Zustimmung wieder sichtbar. Fachlich ungeklärt. | bestätigt |
| CR-10 | niedrig | `get` | 404 für Konversationen außerhalb der neuesten 200. | bestätigt |
| CR-11 | niedrig | `contactAction` | Wird die Konversation während der Aktion gelöscht, scheitert der Insert am Fremdschlüssel und liefert 500. | Vermutung |
| CR-12 | niedrig | `identity-provider.ts` | `begin()` ungenutzt. Der Adapter ist im Service verdrahtet, nicht in `main.ts` wie in ADR-0013 beschrieben. | bestätigt |
| CR-13 | niedrig | Registrierung | Die Adressgrenze (3 je Stunde) erlaubt gezieltes Verzögern fremder Registrierungen. | bestätigt |
| CR-14 | niedrig | `smoke-test.mjs`, `e2e/` | Mehrere Prüfungen waren zu schwach:<br>• AT-AUTH-008 wartete nur 4 s auf das Ausbleiben der Mail.<br>• AT-DEMO-001 war auf einem wiederverwendeten Stack immer wahr.<br>• Für die Szenarien „Blockierung“ und „Zurückziehen vor Zustimmung“ aus REQ-CHAT-010 fehlte ein Nachweis.<br>• Browser-Kontexte wurden nicht geschlossen.<br>• Eine Konversation mit gelöschter Anzeige diente als Prüfseite. | bestätigt |
| CR-15 | niedrig | `e2e/package.json` | Ohne Skript `typecheck` prüfte CI die E2E-Quellen nicht. | bestätigt |

## Positiv

- Die Sperre auf die Konversationszeile serialisiert Aktionen beider Seiten korrekt.
- Die Regeln liegen als reine Funktionen in `domain.ts` und sind tabellarisch getestet.
- Anmeldung ohne Zeitunterschied bei unbekannter Adresse. `not_verified` und `account_suspended` erscheinen erst bei korrektem Passwort, sodass sich keine Konten erkennen lassen.
- Der CI-Workflow lief beim ersten Versuch grün: Prüfungen, Diagramme, Compose mit E2E und Smoke-Test.

## Behebung (2026-10-24)

| Befund | Status | Behebung |
|---|---|---|
| CR-01 | behoben | Die Liste lädt Deals, Zustimmungen, aktive Konten und freigegebene Adressen gesammelt (`= ANY($ids)`). Damit braucht eine Liste unabhängig von der Anzahl der Konversationen eine feste Zahl von Abfragen. Die Blockierung kommt aus der bereits geladenen Menge. `get` ist eine Einzelabfrage. |
| CR-02 | behoben | Nach eigenem Widerruf gilt die Sperrfrist immer, und erneutes Zustimmen zählt als Anfrage (`isOwnRequest`). Zusätzlich gilt eine Obergrenze von 20 Kontaktaktionen je Nutzer und Stunde. Nachweis: Unit-Test sowie AT-CHAT-010, das erneute Zustimmen liefert 429. REQ-CHAT-010 v2.2. |
| CR-03 | behoben | Blockierung und Kontostatus werden vor der Transaktion gelesen. In der Transaktion laufen nur noch die Sperre und die Zeilen der Kontaktfreigabe. |
| CR-04 | behoben | Der Zähler wird zuerst atomar erhöht (`hit`) und bei Erfolg zurückgesetzt. Das ungenutzte `peek` wurde aus Port und Adapter entfernt. |
| CR-05 | behoben | `useConversation` mit `refetchInterval` wie die übrigen Abfragen. |
| CR-06 | behoben | Der Knopf im Zustand `busy` bleibt fokussierbar (`aria-disabled`). Nach der Aktion geht der Fokus auf die Statuszeile. Der Tastaturtest prüft, dass der Fokus nicht auf `body` fällt. |
| CR-07 | behoben | Hinweis zur Sperrfrist auch nach Widerruf; Knöpfe an `canGrant` gekoppelt; `reset()` bei Zustandswechsel; bei Fehlern wird die Konversation neu geladen. |
| CR-08 | behoben | Der Export enthält eigene Zustimmungen (`kind: own`) und selbst abgelehnte Anfragen (`kind: declined_by_me`). |
| CR-09 | entschieden | Q-21 (vorläufig): Frühere Zustimmungen gelten nach Aufheben der Blockierung wieder; jede Seite kann widerrufen. In REQ-CHAT-010 dokumentiert. |
| CR-10 | behoben | mit CR-01 |
| CR-11 | behoben | Die Sperre auf die Konversation liefert bei fehlender Zeile 404. |
| CR-12 | dokumentiert | Stand in ADR-0013, Punkt 7: Die Verdrahtung wandert mit dem ersten SSO-Adapter nach Spike S-01 nach `main.ts`. |
| CR-13 | akzeptiert | Restrisiko in Q-18 benannt. |
| CR-14 | behoben | AT-AUTH-008 wartet 15 s. AT-DEMO-001 prüft gezielt die Seed-Meldung („Vorkasse“) und den Wortfilter-Fall. Neuer Nachweis AT-CHAT-010-4 für Zurückziehen vor Zustimmung und Blockierung. Die E2E-Tests schließen ihre Kontexte und wählen eine Konversation mit vorhandener Anzeige. |
| CR-15 | behoben | `e2e` hat ein Skript `typecheck`, `turbo typecheck` prüft es mit. |
