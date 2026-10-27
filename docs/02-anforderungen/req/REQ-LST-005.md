---
id: REQ-LST-005
title: Studienbezogene Attribute für Bücher und Skripte
type: data
class: domain
status: verified
owner: team-marktplatz
risk: low
release: R1
moscow: S
kano: begeisterung
epic: EPIC-02
source: Personas, Wettbewerbsanalyse
use_cases: [UC-10]
version: 1.3
created: 2026-10-20
last_updated: 2026-10-24
verification: [AT-LST-005]
---

# REQ-LST-005 Studienbezogene Attribute für Bücher und Skripte

## Anforderung
Die Kategorie **Bücher & Skripte** soll die optionalen Attribute **Studiengang**, **Modul** und **ISBN** anbieten. In anderen Kategorien werden sie nicht abgefragt.

## Begründung
Lehrbücher und Skripte sind die campus-typischste Warengruppe. Der Modulbezug hebt die Plattform von allgemeinen Marktplätzen ab.

## Akzeptanzkriterien
| Attribut | Pflicht | Format |
|---|---|---|
| Studiengang | nein | ≤ 80 Zeichen |
| Modul | nein | ≤ 80 Zeichen |
| ISBN | nein | ISBN-10 oder ISBN-13: Ziffern, `X` und Bindestriche, 10–17 Zeichen |

```gherkin
Szenario: Attribute anzeigen
  Angenommen ich erstelle eine Anzeige in "Bücher & Skripte" mit Modul "Statistik I"
  Wenn ein anderes Mitglied die Anzeige öffnet
  Dann sieht es "Modul: Statistik I"

Szenario: Andere Kategorie
  Wenn ich eine Anzeige in "Möbel & Wohnen" erstelle
  Dann werden Studiengang, Modul und ISBN nicht abgefragt
```


## Nachweis
- `AT-LST-005`: API-Test – Attribute werden gespeichert und ausgeliefert, ungültige ISBN → 422 (neu).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei, Formate und Szenarien |
| 1.2 | 2026-10-23 | Review v0.2: formale Prüfung ohne inhaltliche Änderung |
| 1.3 | 2026-10-24 | Verifiziert im finalen Lauf gegen das Docker-Beispiel (AT-LST-005 bestanden bzw. ausgeführt); Status → verified |
