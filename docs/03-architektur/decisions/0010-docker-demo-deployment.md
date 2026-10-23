# ADR-0010: Auslieferung als lokales Docker-Beispiel, kein öffentliches Hosting

- **Status:** Accepted (Vorgabe des Auftraggebers, 2026-10-20)
- **Datum:** 2026-10-20
- **Bezug:** REQ-ARCH-005, REQ-DEMO-001, Review Q-3 / O-1 / A-1; wirkt auf ADR-0002, 0004, 0005, 0007

## Kontext
Die Plattform wird **nicht öffentlich betrieben**. Das Ergebnis des Projekts ist ein lauffähiges Beispiel als Docker-Image bzw. Docker-Compose-Setup, das Prüfer/innen und Team lokal starten. Damit entfallen Betreiberpflichten (Impressum, DSA-Prozesse im Echtbetrieb, AV-Verträge, Zustellbarkeit echter E-Mails) für das Projekt. Die fachlichen Anforderungen dazu bleiben als Konzept erhalten (EPIC-12 „Produktivbetrieb“).

Der Entwurf v0.1 sah sieben Container vor (web, api, worker, postgres, redis, minio, mail). Für ein lokales Beispiel ist das unnötig komplex (Review A-1).

## Optionen
| Option | Pro | Contra |
|---|---|---|
| A: Wie v0.1 (7 Container) | Nah an einer Produktivarchitektur | Hoher Aufwand, langsamer Start, viel Infrastruktur ohne Nutzen im Demo-Betrieb |
| **B: 1 Anwendungs-Image + PostgreSQL + Mailpit** (Compose mit 3 Services) | Ein selbst gebautes Image, Postgres bleibt (Dev/Prod-Parität, Guideline Kap. 05), E-Mails sind in der Mailpit-Oberfläche sichtbar | Keine horizontale Skalierung im Beispiel (bewusst, siehe Ports) |
| C: Wirklich nur 1 Container (App + eingebettete DB, z. B. SQLite) | Minimal | Bricht die Dev/Prod-Parität (Guideline), Postgres-Volltextsuche (ADR-0008) entfällt, E-Mails nicht einsehbar |

## Entscheidung
**Option B.**

```text
docker compose up
 ├─ app      Image "campusmarkt" (Node.js): REST-API, WebSocket, React-SPA (statisch), Job-Worker, Scheduler
 ├─ db       postgres:17, Volume pgdata
 └─ mailpit  fängt alle E-Mails ab, Web-UI http://localhost:8025
Volumes: pgdata, uploads
```

Folgen für andere Entscheidungen (die ADRs sind noch *Proposed* und wurden direkt angepasst):
- **Kein Redis:** Job-Queue über **pg-boss** (Postgres), Sessions und Rate-Limits in Postgres bzw. im Speicher, Chat-Fan-out im Prozess (ADR-0004, 0005).
- **Kein MinIO/S3:** Bilder liegen auf dem Volume `uploads` hinter einem `StoragePort`. Ein S3-Adapter bleibt möglich (ADR-0007).
- **Keine eigene Web-App neben der API:** React-SPA (Vite), ausgeliefert durch Fastify (ADR-0002).
- **Jede wegfallende Infrastruktur steckt hinter einem Port.** Ein späterer Produktivbetrieb tauscht Adapter aus, nicht Fachlogik.

## Konsequenzen
- (+) `docker compose up` startet alles in < 1 Minute, ohne externe Konten oder Schlüssel. Das System läuft offline.
- (+) Alle Use Cases inkl. Registrierung mit `@studmail.hwg-lu.de` sind vorführbar, die Verifikationsmail erscheint in Mailpit.
- (−) Verfügbarkeits-SLOs, RTO/RPO, Monitoring-Alarme und SPF/DKIM sind für das Beispiel **nicht anwendbar** und werden explizit als N/A markiert (Guideline: N/A nicht stillschweigend weglassen).
- (−) Skalierungsaspekte (mehrere Instanzen) werden nur konzeptionell gezeigt, nicht betrieben.
- **Offene Bestätigung (Q-11):** Ist „ein Docker-Container“ wörtlich gemeint (dann Option C mit dokumentierter Guideline-Ausnahme) oder als „ein Docker-Setup“?
