import type { MemberRatings, RatingBody, RatingState, RatingView } from '@campusmarkt/contracts';
import type { Tx } from '../../platform/db.js';
import { conflict, notFound, unprocessable } from '../../platform/errors.js';
import type { AuthContext } from '../../platform/http/auth.js';
import { decodeCursor, pageLimit, toPage } from '../../platform/http/pagination.js';
import { empty, sql } from '../../platform/sql.js';
import type { ModuleDeps } from '../shared.js';
import { checkRatingText, RATING_SUMMARY_MONTHS, RATING_WINDOW_DAYS, rateeRole, ratingDeadline, ratingPublished } from './domain.js';

interface RatingRow {
  id: string;
  deal_id: string;
  rater_id: string | null;
  ratee_id: string;
  role: 'seller' | 'buyer';
  score: 'positive' | 'neutral' | 'negative';
  body: string | null;
  listing_title: string;
  deal_completed_at: string;
  created_at: string;
  deleted_at: string | null;
}

const FORMER_MEMBER = 'Ehemaliges Mitglied';

/** Sichtbar: nicht gelöscht oder entfernt und veröffentlicht (beide bewertet oder Frist abgelaufen). */
const VISIBLE = sql`r.deleted_at IS NULL AND r.removed_at IS NULL AND (
  r.published_at IS NOT NULL OR EXISTS (SELECT 1 FROM trust.rating o WHERE o.deal_id = r.deal_id AND o.rater_id = r.ratee_id)
  OR r.deal_completed_at < now() - make_interval(days => ${RATING_WINDOW_DAYS}))`;

/** Bewertungen als Käufer und Verkäufer (REQ-MOD-006, B-70). */
export function createRatings(deps: ModuleDeps) {
  const { database, modules } = deps;
  const { db } = database;

  /** Deal der angemeldeten Person; fremde, offene und stornierte Deals sind nicht unterscheidbar (404). */
  async function context(auth: AuthContext, dealId: string) {
    const deal = await modules.messaging.dealForRating(dealId);
    if (!deal || deal.status !== 'completed' || (auth.userId !== deal.sellerId && auth.userId !== deal.buyerId)) {
      throw notFound('Deal nicht gefunden');
    }
    const listing = await modules.listings.summary(deal.listingId);
    const counterpartId = auth.userId === deal.sellerId ? deal.buyerId : deal.sellerId;
    return {
      deal,
      counterpartId,
      role: rateeRole(listing?.kind ?? 'offer', deal.sellerId, counterpartId),
      title: listing?.title ?? 'Anzeige',
      completedAt: new Date(deal.completedAt),
    };
  }

  async function state(auth: AuthContext, dealId: string): Promise<RatingState> {
    const ctx = await context(auth, dealId);
    const rows = await db.query<RatingRow>(sql`SELECT * FROM trust.rating WHERE deal_id = ${dealId}`);
    const mine = rows.find((r) => r.rater_id === auth.userId);
    const theirs = rows.some((r) => r.rater_id === ctx.counterpartId && !r.deleted_at);
    const now = new Date();
    const windowOpen = now.getTime() <= ratingDeadline(ctx.completedAt).getTime();
    return {
      dealId,
      counterpartRole: ctx.role,
      deadline: ratingDeadline(ctx.completedAt).toISOString(),
      windowOpen,
      canRate: windowOpen && !mine,
      mine: mine
        ? {
            score: mine.score,
            text: mine.body,
            createdAt: new Date(mine.created_at).toISOString(),
            published: ratingPublished({ counterpartRated: theirs, dealCompletedAt: ctx.completedAt, now }),
          }
        : null,
      counterpartRated: theirs,
    };
  }

  return {
    ratingState: state,

    async rate(auth: AuthContext, dealId: string, body: RatingBody): Promise<RatingState> {
      const ctx = await context(auth, dealId);
      if (Date.now() > ratingDeadline(ctx.completedAt).getTime()) {
        throw conflict('rating_window_closed', 'Die Frist für die Bewertung ist abgelaufen.');
      }
      const text = checkRatingText(body.score, body.text);
      if (!text.ok) {
        throw unprocessable(text.code, text.code === 'text_required'
          ? 'Bei einer negativen Bewertung brauchen wir eine kurze Begründung (mindestens 10 Zeichen).'
          : 'Der Text ist zu lang (höchstens 280 Zeichen).');
      }
      if (text.text && modules.listings.containsProhibitedTerms(text.text)) {
        throw unprocessable('text_not_allowed', 'Der Text enthält Begriffe, die gegen die Community-Regeln verstoßen.');
      }
      const inserted = await db.one(sql`
        INSERT INTO trust.rating (deal_id, rater_id, ratee_id, role, score, body, listing_title, deal_completed_at)
        VALUES (${dealId}, ${auth.userId}, ${ctx.counterpartId}, ${ctx.role}, ${body.score}, ${text.text}, ${ctx.title}, ${ctx.completedAt})
        ON CONFLICT (deal_id, rater_id) DO NOTHING RETURNING id`);
      if (!inserted) throw conflict('already_rated', 'Du hast für diesen Deal schon bewertet.');
      return state(auth, dealId);
    },

    /** Eigene Bewertung löschen: vor der Veröffentlichung neu abgebbar, danach nicht (REQ-MOD-006, Regel „Ändern“). */
    async deleteRating(auth: AuthContext, dealId: string): Promise<void> {
      const current = await state(auth, dealId);
      if (!current.mine) throw notFound('Keine Bewertung vorhanden');
      if (current.mine.published) {
        await db.exec(sql`UPDATE trust.rating SET deleted_at = now() WHERE deal_id = ${dealId} AND rater_id = ${auth.userId}`);
      } else {
        await db.exec(sql`DELETE FROM trust.rating WHERE deal_id = ${dealId} AND rater_id = ${auth.userId}`);
      }
    },

    /** Bewertungen im Profil: Übersicht je Rolle (24 Monate, je Paar und Rolle nur die neueste) und Liste, neueste zuerst. */
    async ratingsFor(rateeId: string, query: { cursor?: string; limit?: number }): Promise<MemberRatings> {
      const limit = pageLimit(query.limit);
      const after = decodeCursor(query.cursor, 2);
      if (after === null) throw unprocessable('invalid_cursor', 'Ungültiger Cursor.');
      const counts = await db.query<{ role: 'seller' | 'buyer'; score: 'positive' | 'neutral' | 'negative'; n: number }>(sql`
        SELECT role, score, count(*)::int AS n FROM (
          SELECT DISTINCT ON (COALESCE(r.rater_id::text, r.id::text), r.role) r.role, r.score
          FROM trust.rating r
          WHERE r.ratee_id = ${rateeId} AND ${VISIBLE}
            AND r.created_at > now() - make_interval(months => ${RATING_SUMMARY_MONTHS})
          ORDER BY COALESCE(r.rater_id::text, r.id::text), r.role, r.created_at DESC
        ) newest GROUP BY role, score`);
      const summary = {
        seller: { positive: 0, neutral: 0, negative: 0 },
        buyer: { positive: 0, neutral: 0, negative: 0 },
      };
      for (const c of counts) summary[c.role][c.score] = c.n;

      const rows = await db.query<RatingRow>(sql`
        SELECT r.* FROM trust.rating r
        WHERE r.ratee_id = ${rateeId} AND ${VISIBLE}
          ${after ? sql`AND (date_trunc('milliseconds', r.created_at), r.id) < (${after[0]}::timestamptz, ${after[1]}::uuid)` : empty}
        ORDER BY date_trunc('milliseconds', r.created_at) DESC, r.id DESC LIMIT ${limit + 1}`);
      const raterIds = [...new Set(rows.map((r) => r.rater_id).filter((id): id is string => !!id))];
      const [users, active] = await Promise.all([modules.identity.getPublicUsers(raterIds), modules.identity.activeUserIds(raterIds)]);
      const page = toPage(
        rows,
        limit,
        (r): RatingView => {
          // Gesperrte oder gelöschte Bewertende: Bewertung zählt weiter, Text entfällt, Autor „Ehemaliges Mitglied“
          const present = !!r.rater_id && active.has(r.rater_id);
          return {
            id: r.id,
            role: r.role,
            score: r.score,
            text: present ? r.body : null,
            raterName: present ? (users.get(r.rater_id!)?.displayName ?? FORMER_MEMBER) : FORMER_MEMBER,
            raterId: present ? r.rater_id : null,
            listingTitle: r.listing_title,
            dealCompletedAt: new Date(r.deal_completed_at).toISOString(),
          };
        },
        (r) => [new Date(r.created_at).toISOString(), r.id],
      );
      return { summary, ...page };
    },

    // ------------------------------------------------------------ Moderation und Datenschutz (B-71)
    /** Für Meldungen (REQ-MOD-001): nur veröffentlichte, nicht entfernte Bewertungen; betroffen ist die bewertende Person. */
    async ratingForReport(id: string): Promise<{ raterId: string | null; rateeId: string } | null> {
      const row = await db.one<{ rater_id: string | null; ratee_id: string }>(sql`
        SELECT r.rater_id, r.ratee_id FROM trust.rating r WHERE r.id = ${id} AND ${VISIBLE}`);
      return row ? { raterId: row.rater_id, rateeId: row.ratee_id } : null;
    },

    /** Inhalt einer gemeldeten Bewertung für die Moderation (B-71). */
    async ratingForModeration(id: string) {
      const row = await db.one<{ score: string; body: string | null; listing_title: string; removed_at: string | null }>(sql`
        SELECT score, body, listing_title, removed_at FROM trust.rating WHERE id = ${id}`);
      return row ? { score: row.score, text: row.body, listingTitle: row.listing_title, removed: !!row.removed_at } : null;
    },

    /** Entfernt durch die Moderation: zählt nicht mehr; Löschjournal für Wiederherstellungen (ADR-0018). */
    async removeRatingByModeration(tx: Tx, id: string): Promise<void> {
      const changed = await tx.db.exec(sql`UPDATE trust.rating SET removed_at = now() WHERE id = ${id} AND removed_at IS NULL`);
      if (changed) deps.journal.record(tx, 'rating_removed', id);
    },

    /** Widerspruch stattgegeben (REQ-LEGAL-007): Bewertung zählt wieder. */
    async restoreRatingByModeration(tx: Tx, id: string): Promise<boolean> {
      const changed = await tx.db.exec(sql`UPDATE trust.rating SET removed_at = NULL WHERE id = ${id} AND removed_at IS NOT NULL`);
      if (changed) deps.journal.record(tx, 'rating_restored', id);
      return changed > 0;
    },

    /**
     * Datenexport (Art. 15/20, REQ-ACC-003): abgegebene Bewertungen vollständig, erhaltene nur veröffentlichte – noch
     * verdeckte bleiben bis zur Veröffentlichung geschützt (Schutz vor Racheabwertung) und werden nur gezählt.
     */
    async exportRatingsForUser(userId: string) {
      const given = await db.query(sql`
        SELECT r.role AS "counterpartRole", r.score, r.body AS text, r.listing_title AS "listingTitle",
               r.created_at AS "createdAt", r.deleted_at AS "deletedAt", r.removed_at AS "removedAt"
        FROM trust.rating r WHERE r.rater_id = ${userId} ORDER BY r.created_at`);
      const received = await db.query(sql`
        SELECT r.role, r.score, r.body AS text, r.listing_title AS "listingTitle", r.created_at AS "createdAt"
        FROM trust.rating r WHERE r.ratee_id = ${userId} AND ${VISIBLE} ORDER BY r.created_at`);
      const hidden = await db.one<{ n: number }>(sql`
        SELECT count(*)::int AS n FROM trust.rating r WHERE r.ratee_id = ${userId} AND r.deleted_at IS NULL AND r.removed_at IS NULL
          AND NOT (${VISIBLE})`);
      return { given, received, receivedNotYetPublished: hidden?.n ?? 0 };
    },

    /** Löschlauf (REQ-PRIV-003): Bewertungen älter als 24 Monate. */
    async purgeExpiredRatings(before: Date): Promise<number> {
      return db.exec(sql`DELETE FROM trust.rating WHERE created_at < ${before}`);
    },

    /** Kontolöschung (REQ-ACC-002, B-71): erhaltene Bewertungen löschen, abgegebene anonymisieren. */
    async deleteRatingsForUser(tx: Tx, userId: string): Promise<void> {
      await tx.db.exec(sql`DELETE FROM trust.rating WHERE ratee_id = ${userId}`);
      // Abgegebene zählen weiter, ohne Text und Namen; sichtbar, weil es keine Gegenseite mehr gibt, die schützen müsste
      await tx.db.exec(sql`UPDATE trust.rating SET rater_id = NULL, body = NULL, published_at = COALESCE(published_at, now()) WHERE rater_id = ${userId}`);
    },
  };
}

