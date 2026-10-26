# ADR-0010: Auslieferung als lokales Docker-Beispiel, kein öffentliches Hosting

- **Status:** Accepted (Vorgabe des Auftraggebers, 2026-10-20)
- **Datum:** 2026-10-20
- **Bezug:** REQ-ARCH-005, REQ-DEMO-001, Review Q-3 / O-1 / A-1; wirkt auf ADR-0002, 0004, 0005, 0007
- **Erweitert durch:** [ADR-0017](0017-optionale-betriebsprofile.md) (optionale Profile `proxy` und `monitoring`; der Standardstart mit `app`, `db` und `mailpit` bleibt unverändert). Betreiberpflichten werden seit Q-23 als Übung mit Platzhaltern umgesetzt (EPIC-13), ohne Echtbetrieb.

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
- (+) Nach dem Image-Build startet `docker compose up` bis zum Login mit Demo-Konto in ≤ 3 min, ohne externe Konten oder Schlüssel (REQ-OPS-003, QS-9). Das System läuft offline.
- (+) Alle Use Cases inkl. Registrierung mit `@studmail.hwg-lu.de` sind vorführbar, die Verifikationsmail erscheint in Mailpit.
- (−) Verfügbarkeits-SLOs, RTO/RPO, Monitoring-Alarme und SPF/DKIM sind für das Beispiel **nicht anwendbar** und werden explizit als N/A markiert (Guideline: N/A nicht stillschweigend weglassen).
- (−) Skalierungsaspekte (mehrere Instanzen) werden nur konzeptionell gezeigt, nicht betrieben.
- **Q-11 beantwortet** ([ADR-0011](0011-mvp-umsetzung.md), [Entscheidungslog](../../02-anforderungen/05-entscheidungen.md)): ein Docker-Setup mit drei Diensten (Option B).
- *Nachtrag 2026-10-26 (REQ-SEC-008, REQ-SEC-010):* Das Runtime-Image enthält weder npm, npx, corepack noch yarn; der Prozess braucht sie nicht, und der Image-Scan meldet damit keine Befunde dieser Werkzeuge. Das Image wird zusätzlich für `linux/arm64` gebaut und in CI unter Emulation gestartet (REQ-PORT-002).
