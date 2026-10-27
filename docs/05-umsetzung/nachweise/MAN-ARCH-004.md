---
id: MAN-ARCH-004
type: evidence
requirement: REQ-ARCH-004
status: done
owner: architecture-lead
date: 2026-10-25
---

# MAN-ARCH-004 Schema-Review der Migrationen 0001 bis 0004

## Ziel

Dieser Nachweis prüft zwei Dinge:
1. Mitglieder, Anzeigen und Campus-Standorte sind verpflichtend einer Institution zugeordnet, und die Suche ist auf die Institution beschränkt ([REQ-ARCH-004](../../02-anforderungen/req/REQ-ARCH-004.md)).
2. Das Schema insgesamt ist sauber modelliert: Schlüssel, Constraints, Indizes, Kaskaden im Abgleich mit dem Löschkonzept ([REQ-PRIV-003](../../02-anforderungen/req/REQ-PRIV-003.md)), Datentypen, Namenskonventionen und Rückwärtskompatibilität. Diese Prüfung dient zugleich als Schema-Review für [REQ-ARCH-001](../../02-anforderungen/req/REQ-ARCH-001.md) (Geldspalten).

## Gegenstand

`apps/server/migrations/`:
- `0001_init.sql` (281 Zeilen)
- `0002_contact_consent.sql`
- `0003_recht_betrieb.sql`
- `0004_review_korrekturen.sql`

Dazu die SQL-Abfragen im Code (`apps/server/src/modules/*/service.ts`, `platform/adapters/pg-search.ts`). Stand: Commit `37ac306`.

## Vorgehen

1. Jede Tabelle geprüft auf Primärschlüssel, Fremdschlüssel, CHECK-Constraints, Pflichtfelder und Datentypen.
2. Die häufigsten Abfragen im Code den vorhandenen Indizes gegenübergestellt.
3. Jede `ON DELETE CASCADE` gegen die Fristen in REQ-PRIV-003 gehalten.
4. Die Migrationen 0002 bis 0004 auf additive Änderungen geprüft.

## Ergebnis gegen die Konformitätsprüfung von REQ-ARCH-004

| Prüfung | Kriterium | Befund | Ergebnis |
|---|---|---|---|
| Schema-Review | Institutionsbezug als Pflichtfeld bei Mitglied | `identity."user".institution_id uuid NOT NULL REFERENCES identity.institution(id)` | erfüllt |
| Schema-Review | … bei Anzeige | `listings.listing.institution_id uuid NOT NULL`, ohne Fremdschlüssel, weil die Referenz über die Modulgrenze geht (ADR-0001); gesetzt aus `auth.institutionId` beim Anlegen | erfüllt |
| Schema-Review | … bei Campus-Standort | `listings.campus_location.institution_id uuid NOT NULL`, `UNIQUE (institution_id, name)` | erfüllt |
| Suche | Ergebnisse auf die Institution des Mitglieds beschränkt | `modules/search/index.ts` übergibt `institutionId: auth.institutionId`, `pg-search.ts` filtert mit `l.institution_id = …` | erfüllt |

**Geldspalten (für REQ-ARCH-001):** `listing.price_cents integer` mit CHECK 1 bis 1.000.000 bei Festpreis/VB, sonst NULL; `deal.agreed_price_cents integer CHECK >= 0`; jeweils `currency char(3) NOT NULL DEFAULT 'EUR'`. Gleitkommatypen gibt es nicht. **Erfüllt.**

## Allgemeine Schemaprüfung

| Aspekt | Bewertung |
|---|---|
| Normalisierung | 3NF bis auf bewusste Ausnahmen: `listing.location_ids uuid[]` und `user.preferred_location_ids uuid[]` sind Arrays statt Zuordnungstabellen. Das ist vertretbar, weil die Listen klein sind und nur als Ganzes gelesen werden; referenzielle Integrität prüft die Anwendung (REQ-LST-004). `search_doc` ist eine generierte Spalte, also keine Redundanz. |
| Schlüssel | Überall `uuid` mit `gen_random_uuid()`. Fachliche Eindeutigkeit über UNIQUE: `email_canonical`, `(listing_id, buyer_id)`, `(conversation_id, client_msg_id)`. Teil-Indizes für fachliche Regeln: ein offener Deal je Anzeige, ein offener Fall je Ziel, eine Meldung je Meldendem, ein Widerspruch je Entscheidung und Person. |
| Constraints | Aufzählungen als `text` + CHECK, einheitlich verwendet; Längen- und Preisregeln als CHECK; `buyer_id <> seller_id`, `blocker_id <> blocked_id`; `notice_reference_check` koppelt Art und Bezug. Append-only per Trigger für `platform.audit_log` und `trust.decision`. |
| Datentypen | `timestamptz` für alle Zeitpunkte, `citext` für E-Mail und Domains, `jsonb` für Einstellungen und Details, `bytea` für den Pepper, `char(3)` für ISO 4217. Passend. |
| Namenskonventionen | `snake_case`, Tabellen im Singular, ein Schema je Modul (ADR-0001), Indizes `<tabelle>_<zweck>_idx`. Ausnahme: `identity."user"` braucht Anführungszeichen, weil `user` ein reserviertes Wort ist (Befund S-7). |
| Rückwärtskompatibilität | 0002 bis 0004 sind additiv: neue Tabellen, neue Spalten mit Default oder nullable, ein gelockertes NOT NULL (`notice.decision_id`), ein erweiterter CHECK (`notice_kind_check`). Zwei Datenänderungen sind unkritisch: `DELETE FROM platform.rate_limit` (wertlose Zähler, 0004) und `UPDATE … privacy_ack_version = '2026-10'` (Initialwert). Keine Spalte wurde umbenannt oder entfernt. |

### Indizes gegen die Hauptabfragen

| Abfrage im Code | Index | Bewertung |
|---|---|---|
| Suche: Volltext, Titel-Trigramm, Status und Datum (`pg-search.ts`) | `listing_search_idx` (GIN), `listing_title_trgm_idx`, `listing_status_created_idx` | passend |
| Eigene Anzeigen (`owner_id`) | `listing_owner_idx` | passend |
| Konversationsliste je Mitglied | `conversation_buyer_idx`, `conversation_seller_idx` | passend |
| Nachrichten je Konversation, Cursor | `message_conversation_idx (conversation_id, created_at, id)` | passend |
| Deals gesammelt je Konversation (`dealsFor`, `conversation_id = ANY(…)`) | **kein Index auf `deal.conversation_id`** | Befund S-1 |
| DAC7-Auswertung je Anbieter und Jahr (`deal` nach `seller_id`, `status`, `updated_at`) | kein Index | Befund S-2 |
| Zustimmung zu den Nutzungsbedingungen bei **jeder** Sitzungsprüfung (`LATEST_TERMS` in `resolveSession`) | **kein Index auf `consent.user_id`** | Befund S-3 |
| Moderations-Queue nach Status | nur Teil-Index `moderation_case_one_open (target_type, target_id) WHERE status = 'open'` | ausreichend bei kleinem Volumen, Befund S-5 |
| Entscheidungen je Fall (`decision.case_id`) | kein Index | Befund S-5 |
| Mitteilungen je Mitglied | `notice_user_idx` | passend |
| Rate-Limit-Bereinigung nach `window_start` | PK `(key, window_start)`, also ohne führende Spalte `window_start` | Befund S-6 |

### Kaskaden gegen das Löschkonzept

| Kaskade | Frist laut REQ-PRIV-003 | Bewertung |
|---|---|---|
| `message` → mit `conversation` | 12 Monate nach letzter Nachricht | passt |
| `contact_consent` → mit `conversation` | mit der Konversation | passt |
| `deal` → mit `conversation` | „mit der Konversation; DAC7-Angaben im Echtbetrieb vor der Löschung sichern“ | bekannte Lücke, dokumentiert im DAC7-Konzept |
| `image` → mit `listing` | mit der Anzeige | passt |
| `consent` → mit `user` | **3 Jahre nach Kontolöschung ohne Profilbezug als Nachweis** | **Widerspruch, Befund S-4** |
| `session`, `token` → mit `user` | mit dem Konto bzw. 7 Tage | passt (Kaskade), Frist-Löschlauf fehlt (Befund S-8) |
| `decision`, `report`, `appeal`, `notice`, `evidence_hold` → mit `moderation_case` bzw. `decision` | 12 Monate nach Abschluss; Beweissicherung bis zur Freigabe | passt, sofern Fälle nur nach Frist gelöscht werden; die Beweissicherung liegt seit 0004 als Kopie in `evidence_copy` |

## Befunde

| ID | Schwere | Befund | Vorschlag |
|---|---|---|---|
| S-1 | mittel | `messaging.deal` hat keinen Index auf `conversation_id`. `dealsFor` (Konversationsliste, CR-01) liest je Liste mit `= ANY(ids)` und `DISTINCT ON (conversation_id)`, das führt zum Seq Scan über alle Deals. | `CREATE INDEX deal_conversation_idx ON messaging.deal (conversation_id, status, created_at DESC);` |
| S-2 | niedrig | Für die DAC7-Auswertung (`seller_id`, `status = 'completed'`, Jahr) gibt es keinen Index. Sie läuft nur auf Abruf durch die Administration. | `CREATE INDEX deal_seller_completed_idx ON messaging.deal (seller_id, updated_at) WHERE status = 'completed';` |
| S-3 | mittel | `identity.consent` hat keinen Index auf `user_id`. `LATEST_TERMS` läuft als Unterabfrage in `resolveSession`, also bei jeder angemeldeten Anfrage. | `CREATE INDEX consent_user_kind_idx ON identity.consent (user_id, kind, given_at DESC);` |
| S-4 | mittel | `identity.consent` ist per `ON DELETE CASCADE` an das Konto gebunden. REQ-PRIV-003 verlangt aber, Zustimmungen 3 Jahre nach der Kontolöschung ohne Profilbezug als Nachweis aufzubewahren. Mit der Kontolöschung verschwinden sie sofort. | Entweder die Frist in REQ-PRIV-003 auf „mit dem Konto“ ändern (Übungsannahme), oder vor dem Löschen eine anonymisierte Nachweiszeile behalten (`user_id` NULL, Pseudonym nach ADR-0014, `version`, `given_at`). |
| S-5 | niedrig | Kein Index auf `trust.decision.case_id`, `trust.evidence_hold.decision_id` und `trust.moderation_case.status`. | Bei wachsendem Volumen ergänzen; im Beispiel unkritisch. |
| S-6 | niedrig | Der Löschlauf für Rate-Limits (`window_start < …`) nutzt den PK nicht. | `CREATE INDEX rate_limit_window_idx ON platform.rate_limit (window_start);` |
| S-7 | niedrig | `identity."user"` braucht Anführungszeichen (reserviertes Wort). | Kein Umbenennen (Rückwärtskompatibilität); nur dokumentieren. |
| S-8 | mittel | Für mehrere Fristen aus REQ-PRIV-003 gibt es im Code keinen Löschlauf: **unbestätigte Konten nach 7 Tagen (Q-13, REQ-AUTH-002)** – `dueDeletions` erfasst nur `pending_deletion` –, Chatnachrichten nach 12 Monaten, Meldungen und Entscheidungen nach 12 Monaten, Audit-Log nach 24 Monaten, abgelaufene Sitzungen sowie Bestätigungs- und Reset-Links nach 7 Tagen. `purgeDueAccounts` bearbeitet nur Kontolöschungen, entfernte Originaltexte und Beweissicherungen. Das Schema trägt diese Löschläufe (Zeitstempel vorhanden), der Code fehlt. | Löschläufe je Kategorie im Job `privacy-purge` ergänzen, jeweils mit Szenario-Test AT-PRIV-003 (bereits als „neu“ im Nachweiskatalog). |
| S-9 | niedrig | `listings.listing.institution_id` wird beim Lesen einzelner Anzeigen (`GET /listings/:id`) nicht geprüft, nur in der Suche. REQ-ARCH-004 verlangt das heute nur für die Suche. | Vor EPIC-10 (weitere Hochschulen) beim Einzelabruf ebenfalls prüfen. |

## Ergebnis

**MAN-ARCH-004 ist erfüllt.** Der Institutionsbezug ist bei Mitglied, Anzeige und Campus-Standort Pflicht, und die Suche ist auf die Institution beschränkt. Das Schema ist insgesamt konsistent und die Migrationen sind additiv.

Daneben hat der Review neun Befunde ergeben (S-1 bis S-9). Die vier mittleren betreffen fehlende Indizes (S-1, S-3), die Kaskade bei Zustimmungen (S-4) und fehlende Löschläufe (S-8). Sie verletzen REQ-ARCH-004 nicht, berühren aber REQ-PERF und REQ-PRIV-003.

## Folgeaufgaben

- Migration `0005_indizes.sql` mit S-1, S-2, S-3 und S-6 (additiv)
- S-4: Entscheidung über die Aufbewahrung der Zustimmungen treffen und REQ-PRIV-003 oder das Schema anpassen
- S-8: Löschläufe nach REQ-PRIV-003 ergänzen; Nachweis AT-PRIV-003 schreiben
- S-9: Vormerken für EPIC-10
