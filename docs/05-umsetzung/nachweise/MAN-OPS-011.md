---
id: MAN-OPS-011
type: evidence
requirement: REQ-OPS-011
status: done
owner: ops-lead
date: 2026-10-26
---

# MAN-OPS-011 Störungsübung „Datenbank nicht erreichbar“

## Ziel

Nachweis für REQ-OPS-011: Eine Störung lässt sich strikt nach [Betriebshandbuch](../../07-betrieb/betriebshandbuch.md) und [Incident-Prozess](../../07-betrieb/incident-prozess.md) erkennen, einstufen, kommunizieren und beheben. Lücken im Handbuch werden dabei sichtbar.

## Umgebung

Stack `cmh1` mit Profil `monitoring` wie in [MAN-OPS-008](MAN-OPS-008.md). Rollen (fiktiv, eine Person): Incident-Leitung und Technik. Kommunikation wurde mitgeprüft, aber nicht besetzt.

## Ablauf

| Zeit (UTC) | Schritt (Prozess) | Beobachtung |
|---|---|---|
| 07:27:29 | Störung: `docker compose -p cmh1 stop db` | – |
| 07:27:30 | – | App-Prozess beendet sich mit `Unhandled 'error' event` auf `BoundPool` (`terminating connection due to administrator command`), Docker startet ihn neu (`restart: unless-stopped`) |
| 07:27:51 | Symptome | `/health/live`, `/health/ready`, `/api/v1/status`, `/status`, `/` antworten **nicht** (Verbindungsfehler); Container `starting`; Log: „Datenbank noch nicht erreichbar, neuer Versuch in 2 s“ |
| 07:30:30 | **Erkennen**: Alarm-Mail | `[FIRING:1] AppDown (app:8080 campusmarkt SEV-1)` an die Rufbereitschaft; `NotReady` löst nicht aus (keine Metrik, weil kein HTTP) |
| 07:30:33 | **Einstufen** | SEV-1 („Plattform nicht nutzbar“) laut Incident-Prozess |
| 07:30:40 | **Kommunizieren** | Statusseite und Ankündigungsbanner sind nicht verfügbar, weil beide an der ausgefallenen App hängen; kein anderer Kanal im Handbuch |
| 07:30:50 | **Diagnose** laut Handbuch §6 („`app` wird nicht healthy“ → `docker compose logs app`) | Log zeigt „Datenbank noch nicht erreichbar“; `docker compose ps` listet `db` **nicht** (gestoppte Container fehlen ohne `-a`) |
| 07:30:51 | **Beheben**: `docker compose -p cmh1 start db` (nicht im Handbuch, aus der Diagnose abgeleitet) | – |
| 07:31:01 | **Bestätigen** | App `healthy` nach 10 s, `/health/ready` 200, `/api/v1/status` meldet alle Bereiche `operational` |
| 07:35:38 | **Entwarnung** | `[RESOLVED] AppDown`-Mail (276 s nach „healthy“) |

## Messwerte

| Messgröße | Wert |
|---|---|
| Störungsbeginn bis Alarm | 181 s |
| Alarm bis Behebungsbefehl | 21 s (Übung, Person bereits am Rechner) |
| Behebung bis „healthy“ | 10 s |
| Gesamtausfall | 3 min 32 s |
| App-Neustarts durch die Störung | 2 |
| Datenverlust | keiner |

## Ergebnis gegen das Akzeptanzkriterium

| Kriterium aus REQ-OPS-011 | Ergebnis |
|---|---|
| Betriebshandbuch deckt Alarme mit Runbooks ab | **teilweise**: Der `AppDown`-Link führt zum Incident-Prozess, der keine technischen Schritte enthält. Für „Datenbank nicht erreichbar“ gibt es keinen Eintrag (H-2). |
| Störungsprozess: Schweregrade S1–S4 mit Reaktionszeiten | **nicht erfüllt**: Der Incident-Prozess kennt SEV-1 bis SEV-3 und keine Reaktionszeiten (H-4). |
| Kommunikation über Statusseite und Ankündigung | **nicht möglich** bei App-Ausfall (H-3) |
| Übergang in den Datenpannen-Prozess | geprüft: kein Datenbezug, also kein Übergang nötig |
| Störung behebbar, Dienst wiederhergestellt | **bestanden** |

**Gesamt:** Die Übung ist durchgeführt und der Nachweis liegt vor. Das Handbuch hat Lücken (H-1 bis H-4), außerdem gibt es einen Code-Befund mit hoher Schwere (B-1).

## Abweichungen und Befunde

| Nr. | Art | Befund | Schwere | Vorschlag |
|---|---|---|---|---|
| B-1 | Code | Ein `pg`-Pool hat keinen `error`-Handler. Bricht die Datenbank Verbindungen ab, stürzt der ganze Prozess ab, statt „nicht bereit“ zu melden. Folgen: Health, Status und Rechtsseiten sind nicht erreichbar, `NotReady` kann nie auslösen, und es gibt einen Neustart-Zyklus. | hoch | `pool.on('error', …)` für alle Pools (App-Pool und pg-boss) mit Log statt Absturz; Readiness meldet 503; Test: DB stoppen → `/health/live` 200, `/health/ready` 503 |
| H-1 | Handbuch | §6 nennt als Diagnose nur `docker compose logs app`; `docker compose ps` zeigt gestoppte Container nicht. | mittel | `docker compose ps -a` aufnehmen |
| H-2 | Handbuch | Kein Eintrag für „Datenbank nicht erreichbar“ (Symptom, Diagnose, `docker compose start db`, Prüfung). Der Runbook-Link von `AppDown`/`NotReady` führt zu Seiten ohne technische Schritte. | mittel | Abschnitt „Runbooks je Alarm“ im Betriebshandbuch, Alarm-Annotationen auf die Anker zeigen lassen |
| H-3 | Prozess | Statusseite und Banner sind Teil der App und fallen mit ihr aus. | mittel | Ausweichkanal festlegen (z. B. statische Störungsseite im Proxy über `handle_errors`, Rundmail); im Incident-Prozess nennen |
| H-4 | Prozess | REQ-OPS-011 verlangt S1–S4 mit Reaktionszeiten; der Incident-Prozess hat SEV-1 bis SEV-3 ohne Reaktionszeiten. | mittel | Anforderung und Prozess angleichen und Reaktionszeiten (fiktive Übungswerte) ergänzen |

## Folgeaufgaben

- B-1 im Code beheben und die Übung mit `NotReady` wiederholen.
- H-1 bis H-4 im Betriebshandbuch und im Incident-Prozess nachziehen.
