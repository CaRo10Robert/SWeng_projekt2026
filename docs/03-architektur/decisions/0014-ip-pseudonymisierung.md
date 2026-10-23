# ADR-0014: Pseudonymisierung von IP-Adressen mit rotierendem Schlüssel

- **Status:** Proposed
- **Datum:** 2026-10-23
- **Bezug:** REQ-PRIV-002, REQ-SEC-005, Architektur-Review A-03 / OE-2, Backlog B-35

## Kontext
IP-Adressen werden nur für den Missbrauchsschutz (Rate-Limits) gebraucht und dürfen nur pseudonymisiert gespeichert werden; eine Rückführung muss ohne einen geheimen, regelmäßig gewechselten Schlüssel unmöglich sein (REQ-PRIV-002). Der Prototyp berechnet `sha256(salt + ip)` mit einem festen Standardwert aus dem Quelltext. Da es nur 2³² IPv4-Adressen gibt, lassen sich solche Werte durch Durchprobieren zurückrechnen.

## Optionen
| Option | Pro | Contra |
|---|---|---|
| **A: Zufälliger Schlüssel in der Datenbank, tägliche Rotation per Job** | Offline, kein Secret im Image, für mehrere Instanzen tragfähig | Eine Tabelle und ein Job mehr |
| B: Schlüssel nur im Speicher, bei jedem Start neu | Einfach | Nur eine Instanz; Neustart setzt alle Zähler zurück |
| C: Secret per Umgebungsvariable, manuelle Rotation | Bekanntes Muster | Rotation wird vergessen; Secret muss verteilt werden; im Beispiel gäbe es wieder einen Standardwert |

## Entscheidung
**Option A.**
1. Pseudonym = `HMAC-SHA256(schlüssel, ip)`, gekürzt auf 128 Bit (hex). Keine einfache Verkettung mit Hash.
2. Schlüssel: 32 Byte aus `crypto.randomBytes`, gespeichert in `platform.ip_pepper (id, key, valid_from)`. Fehlt beim Start ein gültiger Schlüssel, wird einer erzeugt. Es gibt **keinen** Standardwert im Code oder in der Konfiguration.
3. Rotation: täglicher Job erzeugt einen neuen Schlüssel; der Vorgänger bleibt bis zum Ende des längsten Zählfensters (1 h) gültig und wird danach gelöscht. Zähler unter dem alten Pseudonym laufen dadurch spätestens nach einer Stunde aus.
4. Auch E-Mail-Adressen in Rate-Limit-Schlüsseln werden mit demselben Verfahren pseudonymisiert, damit der Zählerspeicher keine Klartext-Adressen enthält.
5. Die Funktion liegt in der Plattform (`platform/pseudonym.ts`); Fachmodule rufen nur `pseudonymize(wert)` auf.

## Konsequenzen
- (+) Rückrechnung ist ohne den Schlüssel nicht möglich; nach dem Löschen des Schlüssels auch mit Datenbankzugriff nicht mehr.
- (+) Kein Secret im Image (REQ-SEC-010).
- (−) Bei der Rotation beginnen Zähler neu; ein Angreifer gewinnt höchstens ein Zählfenster.
- Umsetzung: Backlog B-35 (Sprint 2).
