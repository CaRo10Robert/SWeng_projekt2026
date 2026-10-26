---
id: REQ-SEC-001
title: OWASP ASVS Level 2
type: security
class: quality
status: implemented
owner: team-plattform
risk: high
reviewers: [product-owner, security-lead, qa-lead]
review_due: 2027-04-23
release: R1
moscow: M
moscow_reason: [2]
kano: basis
epic: EPIC-00
source: OWASP ASVS 4.0.3 (geprüfte Fassung; Abgleich mit 5.0 siehe Text)
version: 1.3
created: 2026-10-20
last_updated: 2026-10-26
verification: [MAN-SEC-001]
---

# REQ-SEC-001 OWASP ASVS Level 2

## Anforderung
Das System muss die Anforderungen des OWASP Application Security Verification Standard auf **Level 2** (geprüft nach Fassung **4.0.3**, deren Kontrollnummern stabil und in Werkzeugen wie ZAP verbreitet sind; die Inhalte der anwendbaren Kapitel decken sich mit 5.0, eine Umstellung der Nummerierung ist vor einem Echtbetrieb einzuplanen) erfüllen, beschränkt auf die für das Docker-Beispiel **anwendbaren** Kapitel: Authentisierung, Sitzungsverwaltung, Autorisierung, Eingabevalidierung und Kodierung, Dateiverarbeitung, sichere Konfiguration, Datenschutz und Protokollierung. Nicht anwendbare Kontrollen (z. B. TLS-Konfiguration und Betrieb im Echtbetrieb, EPIC-12) werden in der Checkliste als N/A mit Begründung geführt.

## Begründung
Die Plattform verarbeitet personenbezogene Daten und private Kommunikation; Level 2 ist der empfohlene Standard für Anwendungen mit solchen Daten.

## Qualitätsmerkmal, Metrik, Messverfahren
| Feld | Festlegung |
|---|---|
| Qualitätsmerkmal (ISO 25010) | Security |
| Metrik | Anteil der anwendbaren ASVS-L2-Kontrollen mit Status „erfüllt“ |
| Akzeptanzkriterium | 100 % der anwendbaren Kontrollen erfüllt oder mit begründeter, befristeter Ausnahme (Ablaufdatum, Genehmigung security-lead); 0 offene Befunde „hoch“ aus dem Pentest-Light |
| Messverfahren | Checkliste je ASVS-Kapitel mit Nachweis (Test, Code-Stelle oder Konfiguration); Pentest-Light mit OWASP ZAP gegen das Docker-Beispiel |
| Messkontext | vor jeder Abgabe/Release; Ergebnis im Repository unter `docs/04-review/` |

## Nachweis
- `MAN-SEC-001`: ASVS-L2-Checkliste mit Nachweis je Kontrolle und ZAP-Bericht – [MAN-SEC-001](../../05-umsetzung/nachweise/MAN-SEC-001.md), ZAP-Zusammenfassungen in `zap/` (Baseline 0 FAIL / 63 PASS, angemeldeter API-Scan 0 FAIL / 114 PASS).
- Ergebnis (Übung): 190 anwendbare Kontrollen – 159 erfüllt (84 %), 25 teilweise bzw. mit befristeter Ausnahme bis zum Go-live (13 %), 6 nicht erfüllt (3 %). Das Akzeptanzkriterium ist damit **noch nicht** erreicht; die sechs offenen Kontrollen sind als Backlog-Einträge B-59 bis B-63 eingeplant (u. a. Passwortwechsel im Profil, Sitzungsübersicht, Leerlaufgrenze, `__Host-`-Cookie).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei, Metrik und Messverfahren ergänzt |
| 1.2 | 2026-10-23 | Review v0.2: R-15 Umfang auf anwendbare Kapitel begrenzt, Ausnahmen mit Ablaufdatum; R-16 qa-lead, review_due; Status `approved` |
| 1.3 | 2026-10-26 | ASVS 4.0.3 als geprüfte Fassung festgelegt; Checkliste MAN-SEC-001 mit Quote 84 %; offene Kontrollen als B-59…B-63; Status → implemented |
