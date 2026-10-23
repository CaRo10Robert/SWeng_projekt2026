# ADR-0004: Chat über WebSocket, PostgreSQL als Quelle der Wahrheit, Fan-out hinter einem Port

- **Status:** Proposed
- **Datum:** 2026-10-20 (überarbeitet für ADR-0010)
- **Bezug:** REQ-CHAT-*, REQ-PERF-002, QS-4

## Kontext
Der Chat braucht Echtzeitzustellung (p95 < 2 s) und darf keine Nachricht verlieren oder doppelt anzeigen. Im Docker-Beispiel läuft **eine** App-Instanz (ADR-0010), die Architektur soll aber für mehrere Instanzen tragfähig bleiben.

## Optionen (Transport)
| Option | Pro | Contra |
|---|---|---|
| **A: WebSocket (`@fastify/websocket`)** | Bidirektional, geringe Latenz, im Monolith integriert | Reconnect-Logik selbst bauen |
| B: Server-Sent Events + REST-POST | Einfacher, HTTP-only | Zwei Kanäle, Lesebestätigungen umständlicher |
| C: Socket.IO | Reconnect und Fallbacks eingebaut | Eigenes Protokoll, nicht AsyncAPI-freundlich |
| D: Polling | Trivial | Latenz, Last |

## Optionen (Fan-out zwischen Instanzen)
| Option | Einsatz |
|---|---|
| **In-Process-EventEmitter** | Docker-Beispiel (1 Instanz) |
| **PostgreSQL `LISTEN/NOTIFY`** | Mehrere Instanzen, ohne zusätzliche Infrastruktur |
| Redis Pub/Sub | Erst bei hoher Last |

## Entscheidung
Transport **A**, mit **D (Polling alle 10 s) als Degradationsmodus**. Die Event-Schnittstelle wird in **AsyncAPI 3.0** beschrieben.
Fan-out über einen Port `RealtimeBroker` (`publish(userId, event)`, `subscribe(userId)`). Im Beispiel kommt der In-Process-Adapter zum Einsatz, ein `PgNotifyAdapter` ist der dokumentierte Skalierungspfad.

- Persistenz zuerst (Postgres), danach Publish. Der Broker ist **nicht** die Quelle der Wahrheit.
- Idempotenz: `UNIQUE(conversation_id, client_msg_id)`.
- Reconnect: Der Client lädt per REST `GET /conversations/{id}/messages?after=…` nach.
- Authentifizierung beim WebSocket-Handshake über das Session-Cookie plus Origin-Prüfung.

## Konsequenzen
- (+) Keine zusätzliche Infrastruktur.
- (−) Mit dem In-Process-Adapter sind mehrere Instanzen nicht möglich. Das ist bewusst so und per Port austauschbar.
- Ende-zu-Ende-Verschlüsselung ist nicht vorgesehen (Moderation nach Meldungen, DSA-Konzept). Das wird transparent dokumentiert.
