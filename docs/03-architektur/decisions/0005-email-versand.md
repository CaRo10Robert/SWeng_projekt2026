# ADR-0005: E-Mail-Versand über transaktional eingereihte Jobs (pg-boss) und einen austauschbaren MailPort

- **Status:** Proposed
- **Datum:** 2026-10-20 (überarbeitet für ADR-0010)
- **Bezug:** REQ-NOTI-*, REQ-PERF-004, QS-3

## Kontext
Ohne Verifikationsmail ist keine Registrierung möglich. Wenn eine Mail direkt im Request versendet wird, koppelt das die Latenz an den Mailserver und kann Mails verlieren (Mail versendet, Transaktion zurückgerollt oder umgekehrt). Im Docker-Beispiel gibt es keinen echten Mailprovider. Alle Mails sollen sichtbar in **Mailpit** landen (ADR-0010).

## Entscheidung
1. **Transaktionales Enqueue (Outbox-Muster):** Das Fachmodul legt den Job `send-email` mit **pg-boss in derselben DB-Transaktion** an wie die Fachänderung. Damit entfällt ein separates Outbox-Relay. pg-boss ist selbst die Outbox.
2. Der Worker (gleicher Prozess, eigener Concurrency-Pool, Bulkhead) rendert das Template und sendet über den **`MailPort`**:
   - `SmtpMailAdapter` (Nodemailer) → im Beispiel `mailpit:1025`. Ein echter SMTP-Server lässt sich allein per Umgebungsvariablen konfigurieren (Twelve-Factor).
3. Retry: max. 5 Versuche, exponentieller Backoff (pg-boss `retryBackoff`), Timeout 10 s. Danach Dead-Letter-Queue, sichtbar im Admin-Bereich und im Log.
4. Zeitgesteuertes (Ablauf-Erinnerung, Re-Verifikation, Löschfristen, gebündelte Chat-Benachrichtigung nach 15 min) läuft über pg-boss-Schedules bzw. verzögerte Jobs.

## Alternativen
- Direkter Versand im Request → verworfen (Kopplung, Mailverlust).
- BullMQ + Redis → verworfen für das Beispiel (zusätzlicher Container ohne Mehrwert). Bei Produktivbetrieb und hoher Last neu bewerten.

## Konsequenzen
- At-least-once-Versand. Doppelte Mails werden über den Job-Schlüssel (`singletonKey` = Event-ID) vermieden.
- SPF, DKIM, DMARC, Bounce-Webhooks und Zustellbarkeit an Hochschul-Postfächer sind **N/A für das Beispiel** und ins Backlog verschoben (EPIC-12).
