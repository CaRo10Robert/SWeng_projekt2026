import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { IdParams, ListingCard, SearchQuery, SearchResult, type SearchQuery as Query } from '@campusmarkt/contracts';
import { notFound } from '../../platform/errors.js';
import { requireAuth, type AuthContext } from '../../platform/http/auth.js';
import type { SearchPort } from '../../platform/ports/index.js';
import { sql } from '../../platform/sql.js';
import type { Module, ModuleDeps } from '../shared.js';

export interface SearchApi {
  isFavorite(userId: string, listingId: string): Promise<boolean>;
  deleteForUser(userId: string): Promise<void>;
  exportForUser(userId: string): Promise<unknown[]>;
}

const decodeCursor = (cursor?: string) => {
  const offset = cursor ? Number.parseInt(Buffer.from(cursor, 'base64url').toString(), 10) : 0;
  return Number.isFinite(offset) && offset >= 0 ? Math.min(offset, 10_000) : 0;
};
const encodeCursor = (offset: number) => Buffer.from(String(offset)).toString('base64url');

/** Modul search: Suche (über SearchPort) und Merkliste (REQ-SRCH-001…004, 006). */
export function createSearchModule(deps: ModuleDeps, port: SearchPort): Module<SearchApi> {
  const { db } = deps.database;
  const { modules } = deps;

  async function search(auth: AuthContext, query: Query) {
    const limit = query.limit ?? 24;
    const offset = decodeCursor(query.cursor);
    const result = await port.search({
      ...query,
      sort: query.sort ?? (query.q ? 'relevance' : 'newest'),
      offset,
      limit,
      institutionId: auth.institutionId,
      excludeOwnerIds: await modules.trust.blockRelations(auth.userId),
    });
    return {
      items: await modules.listings.cards(result.ids),
      nextCursor: result.hasMore ? encodeCursor(offset + limit) : null,
      degraded: result.degraded,
    };
  }

  const routes: FastifyPluginAsyncTypebox = async (app) => {
    const tags = ['search'];
    app.get('/listings', { schema: { tags, querystring: SearchQuery, response: { 200: SearchResult } } }, async (req) =>
      search(requireAuth(req), req.query),
    );

    app.get('/me/favorites', { schema: { tags, response: { 200: Type.Array(ListingCard) } } }, async (req) => {
      const auth = requireAuth(req);
      const rows = await db.query<{ listing_id: string }>(sql`
        SELECT listing_id FROM search.favorite WHERE user_id = ${auth.userId} ORDER BY created_at DESC`);
      return modules.listings.cards(rows.map((r) => r.listing_id));
    });

    app.put('/listings/:id/favorite', { schema: { tags, params: IdParams } }, async (req, reply) => {
      const auth = requireAuth(req);
      const listing = await modules.listings.summary(req.params.id);
      if (!listing || !listing.available || listing.ownerId === auth.userId) throw notFound('Anzeige nicht gefunden');
      await db.exec(sql`
        INSERT INTO search.favorite (user_id, listing_id) VALUES (${auth.userId}, ${req.params.id}) ON CONFLICT DO NOTHING`);
      return reply.status(204).send();
    });

    app.delete('/listings/:id/favorite', { schema: { tags, params: IdParams } }, async (req, reply) => {
      const auth = requireAuth(req);
      await db.exec(sql`DELETE FROM search.favorite WHERE user_id = ${auth.userId} AND listing_id = ${req.params.id}`);
      return reply.status(204).send();
    });
  };

  return {
    api: {
      async isFavorite(userId, listingId) {
        return !!(await db.one(sql`
          SELECT 1 FROM search.favorite WHERE user_id = ${userId} AND listing_id = ${listingId}`));
      },
      async deleteForUser(userId) {
        await db.exec(sql`DELETE FROM search.favorite WHERE user_id = ${userId}`);
      },
      async exportForUser(userId) {
        return db.query(sql`
          SELECT listing_id AS "listingId", created_at AS "createdAt" FROM search.favorite WHERE user_id = ${userId}`);
      },
    },
    routes,
  };
}
