---
id: OPS-INDEX
type: index
status: in-review
owner: architecture-lead
version: 1.0
created: 2026-10-24
last_updated: 2026-10-24
---

# Betrieb (Übungsaufgabe)

> **Muster im Rahmen einer Übungsaufgabe.** Das Docker-Beispiel läuft lokal und offline (ADR-0010). Die Dokumente beschreiben, wie ein Echtbetrieb aussehen würde, und welche Teile im Beispiel schon nachgestellt sind. Betreiberangaben stehen als `[Platzhalter: …]`.

| Dokument | Inhalt | Anforderung |
|---|---|---|
| [Betriebshandbuch](betriebshandbuch.md) | Komponenten, Start und Stopp, Konfiguration, Profile, regelmäßige Aufgaben | REQ-OPS-011 |
| [Datensicherung und Wiederherstellung](backup-restore.md) | Verfahren, Aufbewahrung, Restore-Übung | REQ-AVAIL-003, REQ-AVAIL-002 |
| [Überwachung und Alarmierung](monitoring-alarmierung.md) | Metriken, Alarmregeln, Eskalation | REQ-OPS-008 |
| [Incident-Prozess](incident-prozess.md) | Schweregrade, Rollen, Kommunikation, Postmortem | REQ-OPS-011 |
| [Wartung und Statusseite](wartung-statusseite.md) | Wartungsmodus, Ankündigungen, Statusseite | REQ-OPS-006, REQ-OPS-007 |
| [TLS und Reverse Proxy](tls-reverse-proxy.md) | Caddy, HSTS, Zertifikate | REQ-OPS-009 |
| [E-Mail-Zustellbarkeit](mail-zustellbarkeit.md) | SPF, DKIM, DMARC, Bounces | REQ-OPS-010 |
| [Update-Prozess](update-prozess.md) | Renovate, Sicherheitsupdates, Release und Rollback | REQ-OPS-012, REQ-OPS-004 |
| [Penetrationstest-Plan](pentest-plan.md) | Umfang, Methodik, Zeitpunkt | REQ-SEC-013 |
| [Go-live-Checkliste](go-live-checkliste.md) | alle Punkte vor einem Echtbetrieb | EPIC-12 |

Rechtliche Prozesse (Datenpannen, DSA, DAC7) stehen unter [docs/06-recht](../06-recht/README.md).
