---
id: CTRL-DLQ
type: evidence
status: done
owner: qa-lead
version: 1.0
created: 2026-10-26
last_updated: 2026-10-26
---

# Nachweis CTRL-DLQ: Endgültig fehlgeschlagene Mail-Zustellungen in der Admin-Ansicht

**Anforderung:** [REQ-NOTI-005](../../02-anforderungen/req/REQ-NOTI-005.md). Nach allen Versuchen landet eine nicht zustellbare E-Mail in der Dead-Letter-Queue, und die Administration sieht sie unter „Jobs/Dead Letters“.

## Durchführung

| Punkt | Wert |
|---|---|
| Datum | 2026-10-26 |
| Umgebung | Docker-Beispiel, Compose-Projekt `cmh3` (App 8095, Mailpit 8036), Image aus dem aktuellen Arbeitsstand (u. a. nodemailer 10.0.16) |
| Testskript | `node tests/ops/dlq-test.mjs http://localhost:8095 --project cmh3` |
| Wiederholungsplan der Mail-Queue | 5 Versuche: erster Versuch + 4 Wiederholungen mit 10/20/40/80 s exponentiellem Backoff (`retryLimit: 4`, `retryDelaySeconds: 10`, `retryBackoff: true`), danach Dead-Letter-Queue |

**Ablauf:**
1. Als `admin@hwg-lu.de` anmelden und die Anzahl der Dead Letters merken.
2. Mailpit stoppen (`docker compose stop mailpit`); die SMTP-Verbindung schlägt damit fehl.
3. Passwort-Reset für `lea@studmail.hwg-lu.de` anfordern; das erzeugt einen Job `send-email` mit Vorlage `password_reset`.
4. `GET /api/v1/admin/jobs` alle 10 s abfragen, bis ein neuer Dead Letter mit Vorlage `password_reset` erscheint (Abbruch nach 6 min).
5. Mailpit wieder starten (auch im Fehlerfall).

## Ergebnis

| Prüfung | Ergebnis |
|---|---|
| Neuer Eintrag in „Dead Letters“ | ja: Queue `dead-letter`, Vorlage `password_reset` |
| Zeit bis zum Dead Letter | 302 s nach der Reset-Anfrage |
| App während des Mail-Ausfalls | erreichbar, Admin-Ansicht beantwortete alle Abfragen |
| Gesamtergebnis | **bestanden** (`✔ [CTRL-DLQ] …`) |

**Bewertung der Zeit:** Die Summe der Wartezeiten (10 + 20 + 40 + 80 s = 150 s) plus Polling-Intervall und Job-Timeouts ergibt die gemessenen rund 5 Minuten. Das passt zum Wiederholungsplan.

## Wiederholung

Das Skript ist wiederholbar. Es verändert nur einen Reset-Token für Lea. Für CI ist es wegen der Laufzeit von etwa 5 Minuten nicht im Standardlauf, sondern ein manueller Kontrolllauf vor einem Release.
