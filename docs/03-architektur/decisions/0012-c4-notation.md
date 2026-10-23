# ADR-0012: C4-Modell als Notation der Architektur, als Mermaid-C4-Diagramme

- **Status:** Proposed
- **Datum:** 2026-10-23
- **Bezug:** Guideline Kap. 02 (Documenting architecture), Kap. 12 (Docs-as-Code); architektur.md §3, §5, §7

## Kontext
Die Architekturdokumentation folgt arc42. Bisher waren Kontext-, Container- und Komponentensicht als Mermaid-Flussdiagramme im C4-Stil gezeichnet, ohne die C4-Elementtypen (Person, Softwaresystem, Container, Komponente) formal zu verwenden. Die Ebenen waren teils vermischt (z. B. Web-App und Anwendung als ein Container). Die Guideline verlangt textbasierte, versionierte Diagramme und je Diagramm genau eine Ebene.

## Optionen
| Option | Pro | Contra |
|---|---|---|
| **A: Mermaid-C4 (`C4Context`, `C4Container`, `C4Component`, `C4Deployment`) im Markdown** | Wird von GitHub und VS Code direkt gerendert; Diagramm steht neben dem Text; im Pull Request diffbar; mit mermaid-cli in CI prüfbar | C4-Unterstützung in Mermaid ist als experimentell gekennzeichnet; Layout nur begrenzt steuerbar |
| B: Structurizr DSL (ein Modell, mehrere Sichten) | Ein Modell für alle Ebenen, konsistente Elemente | Kein Rendering auf GitHub; zusätzliches Werkzeug (Structurizr Lite/CLI) für Prüfer/innen |
| C: PlantUML mit C4-PlantUML | Ausgereifte Bibliothek, gutes Layout | Kein natives Rendering auf GitHub; Abhängigkeit zur PlantUML-Standardbibliothek im Netz |
| D: Weiter Flussdiagramme im C4-Stil | Kein Aufwand | Elementtypen nicht formal, Ebenen leicht vermischt |

## Entscheidung
**Option A.** Regeln:
1. Ebenen: Systemkontext (§3.1), Container (§5.1), Komponenten je Container (§5.2, §5.3), Verteilung (§7.1). Die Code-Ebene wird nicht gezeichnet.
2. Jedes Diagramm nennt seine Ebene im Titel („C4 Ebene 2 – …“) und zeigt nur Elemente dieser Ebene plus unmittelbare Nachbarn.
3. Zu jedem Diagramm gehört eine Elementtabelle (Name, Technologie, Verantwortung, Anforderungen bzw. ADR).
4. Dichte Komponentensichten werden in mehrere Diagramme derselben Ebene geteilt und mit Boundaries („Schicht“) gegliedert, damit Linien nicht durch Elemente laufen.
5. Laufzeitsichten bleiben UML-Sequenzdiagramme (C4 schreibt dafür keine Notation vor); sie verwenden die Element-Namen aus den C4-Sichten.
6. Alle Mermaid-Diagramme werden mit `node scripts/check-diagrams.mjs` gerendert; ein Syntaxfehler lässt den Lauf fehlschlagen (Guideline Kap. 12).

## Konsequenzen
- (+) Prüfbare, auf GitHub lesbare C4-Sichten ohne zusätzliche Werkzeuge für Leser.
- (−) Layout-Grenzen von Mermaid-C4: Diagramme werden bewusst klein gehalten. Reicht das nicht mehr, ist Option B der Ausweg (eigenes ADR).
- „Container“ im Sinne von C4 ist nicht dasselbe wie ein Docker-Container; §5 erklärt den Unterschied.
