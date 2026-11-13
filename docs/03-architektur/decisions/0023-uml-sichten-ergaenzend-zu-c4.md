# ADR-0023: UML-Sichten ergänzend zu C4, als Mermaid-Diagramme aus dem Code

- **Status:** Accepted (2026-11-13)
- **Datum:** 2026-11-13
- **Bezug:** B-72, ergänzt [ADR-0012](0012-c4-notation.md) (unverändert gültig), ADR-0001, ADR-0006, ADR-0010; Guideline Kap. 02 (Documenting architecture), Kap. 12 (Docs-as-Code); [architektur.md](../architektur.md), [uml-sichten.md](../uml-sichten.md)

## Kontext
Die Architektur ist nach ADR-0012 im C4-Modell dokumentiert (Kontext, Container, Komponenten, Verteilung) und um UML-Sequenzdiagramme in der Laufzeitsicht ergänzt. Für Lehre, Prüfung und Einarbeitung wird dieselbe Architektur zusätzlich in UML gebraucht: Paketdiagramm mit erlaubten Abhängigkeiten, Komponentendiagramm mit bereitgestellten und benötigten Schnittstellen (Ports und Adapter, darunter der `PaymentPort` aus ADR-0006), Klassendiagramm des Fachmodells, Zustandsdiagramme für Anzeige und Deal und ein Verteilungsdiagramm des Docker-Beispiels. Zwei Notationen nebeneinander bergen das Risiko, dass sie auseinanderlaufen. Zugleich gilt die Projektregel: Diagramme in Mermaid, PlantUML nur für UML-Use-Case-Diagramme (CLAUDE.md).

Mermaid hat native UML-Klassen-, Zustands- und Sequenzdiagramme, aber keine eigenen Paket-, Komponenten- und Verteilungsdiagramme.

## Optionen
| Option | Pro | Contra |
|---|---|---|
| **A: Eigene Datei `uml-sichten.md` mit Mermaid; Paket-, Komponenten- und Verteilungsdiagramm über `classDiagram` mit Stereotypen bzw. `flowchart` mit Subgraphen; C4 bleibt führend** | Eine Werkzeugkette (GitHub-Rendering, `check-diagrams.mjs` in CI); Projektregel eingehalten; C4-Sichten bleiben unverändert | UML-Notation nur nachgebildet (Stereotypen statt Symbolen, z. B. kein Ball-and-Socket); zweite Sicht muss gepflegt werden |
| B: PlantUML für alle UML-Diagramme | Vollständige UML-Notation | Verstößt gegen die Projektregel; zweites Werkzeug für Leser und CI; kein natives Rendering auf GitHub |
| C: UML statt C4 (C4 ablösen) | Nur eine Notation | Verwirft eine geprüfte Dokumentation (ADR-0012, Reviews); C4 ist für Kontext und Container verständlicher |
| D: Keine UML-Sichten | Kein Pflegeaufwand | Anforderung aus B-72 nicht erfüllt; Fachmodell und Zustände nur verstreut (ER-Diagramm, Übergangstabelle, Code) |

## Entscheidung
**Option A.** Regeln:
1. **C4 bleibt führend** (ADR-0012). Die UML-Sichten zeigen dieselbe Architektur und führen keine neuen Bausteine ein. Laufzeitsichten bleiben in [architektur.md §6](../architektur.md#6-laufzeitsicht); `uml-sichten.md` verweist darauf, statt sie zu doppeln.
2. **Quelle ist der Code:** Modulnamen, Ports, Adapter, Tabellen, Statuswerte und Übergänge werden aus `apps/server/src`, den Migrationen und `.dependency-cruiser.cjs` übernommen. Weicht die Architekturdokumentation ab, zeigt das UML-Diagramm den Code und der Abschnitt „Abgleich“ nennt die Abweichung.
3. **Notation in Mermaid:** Klassendiagramm mit `classDiagram` und Stereotypen (`<<entity>>`, `<<enumeration>>`), Zustandsdiagramme mit `stateDiagram-v2`. Paket- und Komponentendiagramm mit `classDiagram` und `<<package>>`, `<<component>>`, `<<interface>>` (Realisierung = bereitgestellte, `«use»` = benötigte Schnittstelle); Paketdiagramm der Importe und Verteilungsdiagramm mit `flowchart` und Subgraphen (`«package»`, `«device»`, `«executionEnvironment»`, `«node»`, `«artifact»`). Die Datei sagt je Diagramm, welche UML-Notation es nachbildet.
4. **Abgleich mit dependency-cruiser:** Das Paketdiagramm zeigt die Importe, wie dependency-cruiser sie sieht, und die Regeln aus `.dependency-cruiser.cjs`. Das Ergebnis von `pnpm --filter @campusmarkt/server lint:deps` steht im Abgleich. Die Nutzung zwischen Modulen zur Laufzeit (über `ModuleDeps.modules`) zeigt ein eigenes Diagramm, weil dependency-cruiser sie nicht sieht.
5. **Prüfung:** Alle Diagramme laufen durch `node scripts/check-diagrams.mjs` (CI-Job `diagrams`); Links und Anker prüft `node scripts/trace.mjs`.
6. **Pflege:** Ändert ein Pull Request Modulgrenzen, Ports, Adapter, Migrationen mit Statuswerten oder `compose.yaml`, passt er `uml-sichten.md` mit an (wie die C4-Sichten).

## Konsequenzen
- (+) Fachmodell, Zustände und Schnittstellen sind an einer Stelle in einer verbreiteten Notation sichtbar; die Zustandsdiagramme machen Abweichungen zwischen Übergangstabelle und Code sichtbar.
- (+) Keine neue Werkzeugabhängigkeit; dieselbe CI-Prüfung wie für C4.
- (−) Zwei Sichten auf dieselbe Architektur müssen gepflegt werden. Gegenmittel: Regel 2 und 6 sowie der Abgleich-Abschnitt.
- (−) Paket-, Komponenten- und Verteilungsdiagramm bilden UML nur mit Stereotypen nach; Layout ist in Mermaid nur begrenzt steuerbar. Reicht das nicht mehr, ist ein eigenes ADR für ein anderes Werkzeug nötig (vgl. ADR-0012, Option B).
- Die Laufzeitnutzung zwischen Modulen bleibt ungeprüft, bis Modulregel 2 (B-38) und die Umstellung auf Domain Events (B-39) umgesetzt sind; das Paketdiagramm 2.2 macht sie bis dahin sichtbar.
