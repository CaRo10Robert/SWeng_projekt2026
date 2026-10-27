---
id: REQ-AUTH-004
title: Keine Offenlegung bestehender Konten
type: security
class: constraint
status: implemented
owner: team-identity
risk: high
reviewers: [product-owner, security-lead]
release: R1
moscow: M
moscow_reason: [2]
kano: basis
epic: EPIC-01
source: BG-1
use_cases: [UC-01, UC-02, UC-03]
version: 1.2
created: 2026-10-20
last_updated: 2026-10-23
verification: [AT-AUTH-004, AT-AUTH-004-2]
---

# REQ-AUTH-004 Keine Offenlegung bestehender Konten

## Anforderung
Das System darf bei Registrierung, Anmeldung und Passwort-Reset nicht offenlegen, ob eine E-Mail-Adresse bereits registriert ist – weder über den Antwortinhalt noch über die Antwortzeit. Dargestellt als Sicherheitskontrolle mit Prüftabelle (Guideline Kap. 01, Typ „Security“).

## Begründung
Kontenaufzählung ermöglicht gezieltes Phishing gegen Hochschulangehörige und das Ausspähen, wer die Plattform nutzt.

## Akzeptanzkriterien
| Vorgang | Konto existiert | Konto existiert nicht | Unterschied sichtbar? |
|---|---|---|---|
| Registrierung | gleiche neutrale Meldung; Hinweis-Mail „Du hast bereits ein Konto“ an die Adresse | gleiche neutrale Meldung; Bestätigungsmail | nein |
| Passwort-Reset anfordern | neutrale Meldung, Reset-Mail | neutrale Meldung, keine Mail | nein |
| Anmeldung mit falschem Passwort | „E-Mail-Adresse oder Passwort ist falsch“ | gleiche Meldung | nein |

**Zeitverhalten:** Für jeden der drei Vorgänge unterscheidet sich der Median der Antwortzeit zwischen „Konto existiert“ und „Konto existiert nicht“ um höchstens **50 ms**. Messung: je Vorgang und Fall **30 Anfragen**, abwechselnd gesendet, lokal gegen das Docker-Beispiel, Rate-Limits zwischen den Läufen zurückgesetzt. Begründung der Werte: Das Passwort-Hashing dauert rund 50–100 ms; ein Unterschied unter 50 ms ist bei 30 Messungen im lokalen Netz nicht verlässlich vom Rauschen zu trennen, ein fehlendes Hashing (Unterschied ≥ 50 ms) dagegen schon.

Ausnahme: Erst nach **korrektem** Passwort darf die Anmeldung „bitte E-Mail bestätigen“ bzw. „Konto gesperrt“ melden.

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Automatisiertes Durchprobieren von Adressen | Rate-Limits (REQ-SEC-005) |
| Gesperrte Adresse registriert sich erneut | neutrale Meldung, keine Mail (REQ-AUTH-008) |
| Unterschiedliche Fehlercodes bei Rate-Limit | 429 gilt für existierende und nicht existierende Adressen gleich |

## Nachweis
- `AT-AUTH-004`: Smoke-Test – zweite Registrierung derselben Adresse liefert identische Antwort.
- `AT-AUTH-004-2`: (neu) Antwortinhalt und Median der Antwortzeit (je 30 Anfragen) für Registrierung, Anmeldung und Passwort-Reset mit existierender und nicht existierender Adresse vergleichen.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei, Messgröße für das Zeitverhalten ergänzt |
| 1.2 | 2026-10-23 | Review v0.2: R-03 `class: constraint` (Kontrolle); R-24 Registrierung in die Zeitmessung, Stichprobe 30 und Toleranz begründet; R-15 moscow_reason |
