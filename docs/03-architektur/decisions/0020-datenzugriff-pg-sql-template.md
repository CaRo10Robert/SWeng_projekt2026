# ADR-0020: Datenzugriff mit `pg` und parametrisierendem `sql`-Template statt Query Builder

- **Status:** Accepted (2026-10-26; ersetzt ADR-0002 Zeile „Query-Layer“ und ADR-0011 Nr. 1)
- **Datum:** 2026-10-26 (Entscheidung umgesetzt seit dem MVP, 2026-10-23)
- **Bezug:** ADR-0002, ADR-0011, ADR-0005 (transaktionales Enqueue), ADR-0008 (Volltextsuche), Guideline Kap. 14 („Default: type-safe query builder“; Abweichung per ADR), Guideline-Review GL-09

## Kontext
ADR-0002 nannte Drizzle ORM als Query-Layer, also den Standard der Guideline (Kap. 14, „type-safe query builder“). Umgesetzt wurde im MVP stattdessen `pg` mit einem eigenen, parametrisierenden Template. ADR-0011 hielt das nur als eine von neun Sammelentscheidungen fest, ohne Optionen und Abwägung. Die Tabelle in ADR-0002 meldete weiter „Abweichung: nein“. Die Guideline verlangt für Abweichungen vom Standard-Stack eine eigene Entscheidung mit Begründung.

Der Datenzugriff ist stark PostgreSQL-spezifisch:
- generierte `tsvector`-Spalte und `pg_trgm` für die Suche;
- Arrays, Partial Unique Indexes, `ON CONFLICT`, `DISTINCT ON`, `FOR UPDATE`;
- Advisory Locks.

pg-boss muss Jobs in derselben Transaktion einreihen wie die Fachdaten (ADR-0005).

## Optionen
| Option | Pro | Contra |
|---|---|---|
| A: Drizzle ORM (Guideline-Standard) | Typen aus dem Schema, Migrationen mit drizzle-kit | Viele Abfragen bräuchten trotzdem `sql`-Rohtext; Rohabfragen liefern Zeitstempel als unformatierte Strings; zweite Quelle des Schemas neben den SQL-Migrationen |
| B: Kysely | typsicherer Query Builder ohne ORM, gute Postgres-Unterstützung | Typen müssen aus der Datenbank erzeugt werden (zusätzlicher Schritt); Sonderfälle wieder als Rohtext |
| **C: `pg` mit eigenem `sql`-Template (`platform/sql.ts`) und handgeschriebenen SQL-Migrationen** | volle PostgreSQL-Mächtigkeit, eine Verbindung für Fachdaten und pg-boss, eine Quelle des Schemas (Migrationen), wenig Abhängigkeiten | kein Typabgleich zwischen Schema und Code; Fehler in Spaltennamen fallen erst zur Laufzeit auf |

## Entscheidung
**Option C.**

- **Parameter:** Alle Werte gehen ausnahmslos als Parameter an die Datenbank. Ein Unit-Test für das Template belegt das (`platform/sql.test.ts`). Fragmente werden nur über das Template zusammengesetzt, nie per Zeichenkettenverkettung.
- **Abweichung vom Guideline-Standard:** Es handelt sich um eine SHOULD-Abweichung (Kap. 14). Sie ist mit diesem ADR begründet und braucht keinen Eintrag im Ausnahmeregister.
- **Kompensation für den fehlenden Typabgleich:**
  - Integrationstests gegen eine echte PostgreSQL (Guideline-Review GL-09/GL-11, Umsetzung im Testpaket);
  - Smoke- und E2E-Tests gegen das Docker-Beispiel bei jedem CI-Lauf;
  - Schema-Review der Migrationen (MAN-ARCH-004).
- **Neu bewerten:** Option B (Kysely mit erzeugten Typen) wird erneut geprüft, wenn ein zweites Team am Code arbeitet oder wenn Fehler durch Spaltennamen in Produktion auftreten.

## Konsequenzen
- (+) Eine Verbindung und eine Transaktion für Fachdaten und Jobs; keine ORM-Abstraktion zwischen Code und PostgreSQL-Funktionen.
- (−) Typen der Zeilen werden im Code von Hand gepflegt (`interface …Row`).
- ADR-0002 und ADR-0011 verweisen für den Datenzugriff auf diesen ADR.
