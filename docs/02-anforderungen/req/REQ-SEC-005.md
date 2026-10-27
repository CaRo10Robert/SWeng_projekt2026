---
id: REQ-SEC-005
title: Begrenzung von Anfragen (Rate-Limits)
type: security
class: constraint
status: implemented
owner: team-plattform
risk: high
reviewers: [product-owner, security-lead]
release: R1
moscow: M
moscow_reason: [2]
kano: n/a
epic: EPIC-01
source: OWASP ASVS 4.0.3 (EX-01)
use_cases: [UC-01, UC-02, UC-03]
version: 3.2
created: 2026-10-20
last_updated: 2026-10-26
review_due: 2027-04-26
verification: [AT-SEC-005, AT-SEC-005-2, AT-SEC-005-3]
---

# REQ-SEC-005 Begrenzung von Anfragen (Rate-Limits)

## Anforderung
Das System muss missbrauchsanfällige Vorgänge begrenzen. Die Grenzen gelten auch über mehrere Instanzen hinweg. Ein Überschreiten führt zu einer **Wartezeit**, nie zu einer dauerhaften Kontosperre (sonst könnten Angreifer fremde Konten aussperren). Festlegung nach Entscheidung Q-18:

| Vorgang | Schlüssel | Grenze | Fenster | Wirkung bei Überschreitung | Missbrauch, der verhindert wird |
|---|---|---|---|---|---|
| Anmeldung (Fehlversuche) | Paar (kanonische Adresse, IP) | 5 | 15 min | Wartezeit bis Fensterende; Zähler wird nach erfolgreicher Anmeldung zurückgesetzt | Passwort-Raten |
| Registrierung | Adresse | 3 | 1 h | Wartezeit | Fluten eines Postfachs |
| Registrierung | IP | 30 | 1 h | Wartezeit | Massenregistrierung (Grenze hoch genug für Campus-NAT) |
| Bestätigungsmail erneut senden | Adresse | 3 | 1 h | Wartezeit | Mail-Bombing |
| Passwort-Reset anfordern | Adresse | 3 | 1 h | Wartezeit | Mail-Bombing |
| Neue Konversationen, Nachrichten | Konto | siehe REQ-CHAT-007 | – | Wartezeit | Spam |

## Begründung
Ohne Begrenzung sind Passwort-Raten, Spam und das Fluten von Hochschulpostfächern trivial. Viele Studierende teilen sich im Campus-WLAN eine öffentliche IP; eine niedrige Grenze je IP würde zum Semesterstart legitime Registrierungen blockieren.

## Akzeptanzkriterien
- Bei Überschreitung antwortet das System mit 429 und dem Hinweis „Zu viele Anfragen“ samt Wartezeit (`Retry-After`).
- Die Antwort verrät nicht, ob das Konto existiert (REQ-AUTH-004).
- Nach erfolgreicher Anmeldung wird der Fehlversuchszähler des Paars zurückgesetzt.
- IP-Adressen werden nur **pseudonymisiert** verarbeitet: Eine Rückführung auf die IP ist ohne einen geheimen, regelmäßig gewechselten Schlüssel nicht möglich (REQ-PRIV-002).

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Verteiltes Raten über viele IPs gegen ein Konto | je Paar begrenzt; Restrisiko akzeptiert, Gegenmaßnahme Passwortrichtlinie (REQ-SEC-003) |
| Aussperren eines fremden Kontos durch absichtliche Fehlversuche | nicht möglich: Grenze gilt je (Adresse, IP), das Opfer meldet sich von seiner IP normal an |
| Rückrechnung der IP aus dem gespeicherten Wert durch Durchprobieren aller IPv4-Adressen | ohne geheimen Schlüssel nicht möglich |
| Ausfall des Zählerspeichers | Anfrage wird abgelehnt (sicherer Zustand), Fehler im Log |

## Nachweis
- `AT-SEC-005`: (neu) 5 falsche Passwörter, die 6. Anmeldung desselben Paars liefert 429 mit `Retry-After`.
- `AT-SEC-005-2`: (neu) 4. Registrierung derselben Adresse innerhalb einer Stunde liefert 429.
- `AT-SEC-005-3`: (neu) Registrierungen verschiedener Adressen von derselben IP: die 30. wird angenommen, die 31. liefert 429.
- Teilweise umgesetzt: Die Registrierungsgrenzen nach Q-18 (je Adresse 3, je IP 30) und die Pseudonymisierung mit wechselndem Schlüssel fehlen noch; umgesetzt ist „5 je IP“ und ein fester Schlüssel.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 2.0 | 2026-10-23 | Speichertechnik entfernt (ADR-0010/0011), Grenze für „erneut senden“ und Akzeptanzkriterien ergänzt |
| 3.0 | 2026-10-23 | Review v0.2: R-25 Entscheidungstabelle Schlüssel/Grenze/Fenster/Wirkung nach Q-18 (Campus-NAT, keine Kontosperre); R-26 Pseudonymisierung statt „gehasht“; R-03 `class: constraint`; R-04 Fehler- und Missbrauchsfälle; Status `approved`, weil die neuen Grenzen noch nicht umgesetzt sind |
| 3.1 | 2026-10-23 | Umgesetzt (Schritt 6): Registrierungsgrenzen nach Q-18 (3 je Adresse, 30 je IP und Stunde); Status → implemented |
| 3.2 | 2026-10-26 | Guideline-Review: GL-02/GL-06 ASVS-Fassung 4.0.3 (EX-01), review_due |
