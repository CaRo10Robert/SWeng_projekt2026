---
id: REQ-SEC-010
title: Gehärtetes Anwendungs-Image
type: security
class: constraint
status: implemented
owner: team-plattform
risk: medium
release: R1
moscow: M
moscow_reason: [2]
kano: n/a
epic: EPIC-00
source: CIS Docker Benchmark, ADR-0010
version: 1.2
created: 2026-10-20
last_updated: 2026-10-23
verification: [CTRL-IMAGE-INSPECT]
---

# REQ-SEC-010 Gehärtetes Anwendungs-Image

## Anforderung
Das Anwendungs-Image muss als Benutzer ohne Root-Rechte laufen, mit schreibgeschütztem Root-Dateisystem betreibbar sein (Schreibzugriff nur auf das Bild-Volume und temporären Speicher) und darf keine Geheimnisse enthalten.

## Begründung
Begrenzt die Folgen einer Kompromittierung der Anwendung.

## Akzeptanzkriterien
| Prüfung | Erwartung |
|---|---|
| Benutzer des Images | nicht `root` |
| Start mit schreibgeschütztem Root-Dateisystem | Anwendung wird „healthy“ |
| Umgebungsvariablen und Dateien des Images | keine Passwörter, Schlüssel oder Tokens |

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Geheimnis gelangt über den Build-Kontext ins Image | Ausschluss über die Ignorier-Liste des Builds; Image-Scan (REQ-SEC-008) |
| Anwendung braucht unerwartet Schreibzugriff | Start schlägt fehl und ist im Log sichtbar; nur temporärer Speicher und Bild-Volume sind beschreibbar |
| Kompromittierte Anwendung | ohne Root-Rechte und ohne zusätzliche Privilegien begrenzter Schaden |

## Nachweis
- `CTRL-IMAGE-INSPECT`: Prüfung von Benutzer und Umgebung des Images sowie Start mit `read_only: true` (Compose) bis zum Status „healthy“.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog |
| 1.1 | 2026-10-23 | Eigene Datei, Prüftabelle |
| 1.2 | 2026-10-23 | Review v0.2: R-04 Fehler- und Missbrauchsfälle; R-15 moscow_reason |
