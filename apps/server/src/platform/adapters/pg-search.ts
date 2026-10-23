import type { Logger } from 'pino';
import type { Db } from '../db.js';
import type { SearchCriteria, SearchPort } from '../ports/index.js';
import { join, raw, sql, type Sql } from '../sql.js';

/**
 * SearchPort → PostgreSQL-Volltext (ADR-0008): `tsvector` mit Konfiguration `german` (Wortstämme)
 * plus `pg_trgm` (Tippfehlertoleranz). Liest die Projektion `listings.listing.search_doc`.
 * Ein Meilisearch-Adapter wäre der Wechselpfad, ohne Änderung im Modul search.
 */
export function createPgSearch(db: Db, log: Logger): SearchPort {
  function filters(c: SearchCriteria): Sql[] {
    const where: Sql[] = [
      sql`l.status IN ('active', 'reserved')`,
      sql`NOT l.hidden`,
      sql`NOT l.owner_suspended`,
      sql`l.institution_id = ${c.institutionId}`,
    ];
    if (c.excludeOwnerIds.length) where.push(sql`NOT (l.owner_id = ANY(${c.excludeOwnerIds}::uuid[]))`);
    if (c.categoryId) where.push(sql`l.category_id = ${c.categoryId}`);
    if (c.kind) where.push(sql`l.kind = ${c.kind}`);
    if (c.priceType) where.push(sql`l.price_type = ${c.priceType}`);
    if (c.condition) where.push(sql`l.condition = ${c.condition}`);
    if (c.locationId) where.push(sql`${c.locationId}::uuid = ANY(l.location_ids)`);
    if (c.minPriceCents !== undefined) where.push(sql`l.price_cents >= ${c.minPriceCents}`);
    if (c.maxPriceCents !== undefined) where.push(sql`l.price_cents <= ${c.maxPriceCents}`);
    return where;
  }

  const orderBy = (c: SearchCriteria, ranked: boolean) => {
    switch (c.sort) {
      case 'price_asc':
        return raw('l.price_cents ASC NULLS FIRST, l.created_at DESC');
      case 'price_desc':
        return raw('l.price_cents DESC NULLS LAST, l.created_at DESC');
      case 'relevance':
        return ranked ? raw('rank DESC, l.created_at DESC') : raw('l.created_at DESC');
      default:
        return raw('l.created_at DESC');
    }
  };

  async function fullText(c: SearchCriteria) {
    const where = filters(c);
    const q = c.q?.trim();
    let rank = sql`0`;
    if (q) {
      where.push(sql`(l.search_doc @@ websearch_to_tsquery('german', ${q}) OR ${q} <% l.title)`);
      rank = sql`ts_rank(l.search_doc, websearch_to_tsquery('german', ${q})) + word_similarity(${q}, l.title)`;
    }
    return db.query<{ id: string }>(sql`
      SELECT l.id, ${rank} AS rank FROM listings.listing l
      WHERE ${join(where, ' AND ')}
      ORDER BY ${orderBy(c, !!q)}
      LIMIT ${c.limit + 1} OFFSET ${c.offset}`);
  }

  /** Degradation (REQ-PERF-001): einfache Titelsuche. */
  async function titleOnly(c: SearchCriteria) {
    const where = filters(c);
    if (c.q?.trim()) where.push(sql`l.title ILIKE ${'%' + c.q.trim().replace(/[%_\\]/g, '\\$&') + '%'}`);
    return db.query<{ id: string }>(sql`
      SELECT l.id FROM listings.listing l WHERE ${join(where, ' AND ')}
      ORDER BY ${orderBy(c, false)} LIMIT ${c.limit + 1} OFFSET ${c.offset}`);
  }

  return {
    async search(c) {
      let rows: { id: string }[];
      let degraded = false;
      try {
        rows = await fullText(c);
      } catch (error) {
        log.warn({ err: error }, 'Volltextsuche fehlgeschlagen, Fallback auf Titelsuche');
        rows = await titleOnly(c);
        degraded = true;
      }
      return { ids: rows.slice(0, c.limit).map((r) => r.id), hasMore: rows.length > c.limit, degraded };
    },
  };
}
