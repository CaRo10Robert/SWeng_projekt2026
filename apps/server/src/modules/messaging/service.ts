import type { ConversationSummary, Deal, DealActionBody, Message, ServerEvent } from '@campusmarkt/contracts';
import type { Tx } from '../../platform/db.js';
import { AppError, conflict, forbidden, notFound, rateLimited, unprocessable } from '../../platform/errors.js';
import type { AuthContext } from '../../platform/http/auth.js';
import { empty, sql } from '../../platform/sql.js';
import type { ModuleDeps } from '../shared.js';
import { MESSAGE_RATE, needsSafetyHint, NEW_CONVERSATION_RATE, NOTIFY_DELAY_SECONDS } from './domain.js';

export const NOTIFY_UNREAD = 'notify-unread';
export const DEAL_EVENTS = 'deal-events';

interface ConversationRow {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  last_message_at: string;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  client_msg_id: string;
  kind: 'text' | 'system';
  body: string;
  created_at: string;
  read_at: string | null;
}

interface DealRow {
  id: string;
  conversation_id: string;
  listing_id: string;
  seller_id: string;
  buyer_id: string;
  agreed_price_cents: number | null;
  currency: string;
  status: Deal['status'];
  created_at: string;
}

const toMessage = (m: MessageRow): Message => ({
  id: m.id,
  conversationId: m.conversation_id,
  senderId: m.sender_id,
  clientMsgId: m.client_msg_id,
  kind: m.kind,
  body: m.body,
  createdAt: m.created_at,
  readAt: m.read_at,
  safetyHint: m.kind === 'text' && needsSafetyHint(m.body),
});

const toDeal = (d: DealRow): Deal => ({
  id: d.id,
  status: d.status,
  agreedPriceCents: d.agreed_price_cents,
  currency: d.currency.trim(),
  createdAt: d.created_at,
});

const NOT_POSSIBLE = () => new AppError(403, 'contact_not_possible', 'Kontakt nicht möglich.');

export function createMessagingService(deps: ModuleDeps) {
  const { database, realtime, rateLimit, modules, config } = deps;
  const { db } = database;

  /** Teilnahme prüfen; Fremde bekommen 404 (QS-2, keine Existenzpreisgabe). */
  async function participant(auth: AuthContext, id: string, tx?: Tx) {
    const conv = await (tx?.db ?? db).one<ConversationRow>(sql`
      SELECT * FROM messaging.conversation WHERE id = ${id}`);
    if (!conv || (conv.buyer_id !== auth.userId && conv.seller_id !== auth.userId)) {
      throw notFound('Konversation nicht gefunden');
    }
    return { conv, counterpartId: conv.buyer_id === auth.userId ? conv.seller_id : conv.buyer_id };
  }

  async function limit(key: string, rule: { limit: number; windowSeconds: number }) {
    const result = await rateLimit.hit(key, rule.limit, rule.windowSeconds);
    if (!result.allowed) throw rateLimited(result.retryAfterSeconds);
  }

  async function publish(userIds: string[], event: ServerEvent) {
    for (const userId of userIds) await realtime.publish(userId, event);
  }

  /** Persistenz zuerst, danach Publish (ADR-0004). Idempotent über (conversation_id, client_msg_id). */
  async function insertMessage(
    tx: Tx,
    conv: ConversationRow,
    senderId: string,
    clientMsgId: string,
    body: string,
    kind: 'text' | 'system' = 'text',
  ): Promise<{ message: MessageRow; created: boolean }> {
    const inserted = await tx.db.one<MessageRow>(sql`
      INSERT INTO messaging.message (conversation_id, sender_id, client_msg_id, kind, body)
      VALUES (${conv.id}, ${senderId}, ${clientMsgId}, ${kind}, ${body})
      ON CONFLICT (conversation_id, client_msg_id) DO NOTHING RETURNING *`);
    if (!inserted) {
      const existing = await tx.db.one<MessageRow>(sql`
        SELECT * FROM messaging.message WHERE conversation_id = ${conv.id} AND client_msg_id = ${clientMsgId}`);
      return { message: existing!, created: false };
    }
    await tx.db.exec(sql`UPDATE messaging.conversation SET last_message_at = now() WHERE id = ${conv.id}`);
    const recipient = senderId === conv.buyer_id ? conv.seller_id : conv.buyer_id;
    if (kind === 'text') {
      await tx.enqueue(
        NOTIFY_UNREAD,
        { conversationId: conv.id, recipientId: recipient },
        { startAfterSeconds: NOTIFY_DELAY_SECONDS, singletonKey: `${conv.id}:${recipient}`, singletonSeconds: NOTIFY_DELAY_SECONDS },
      );
    }
    return { message: inserted, created: true };
  }

  async function send(auth: AuthContext, conversationId: string, body: string, clientMsgId: string): Promise<Message> {
    const { conv, counterpartId } = await participant(auth, conversationId);
    if (await modules.trust.isBlockedEither(auth.userId, counterpartId)) throw NOT_POSSIBLE();
    if (!(await modules.identity.isActive(counterpartId))) throw NOT_POSSIBLE();
    await limit(`chat-msg:${auth.userId}`, MESSAGE_RATE);
    const { message, created } = await database.tx((tx) =>
      insertMessage(tx, conv, auth.userId, clientMsgId, body.trim() || body),
    );
    const dto = toMessage(message);
    if (created) await publish([counterpartId, auth.userId], { type: 'message', message: dto });
    return dto;
  }

  async function dealFor(conversationId: string) {
    return db.one<DealRow>(sql`
      SELECT * FROM messaging.deal WHERE conversation_id = ${conversationId}
      ORDER BY (status = 'agreed') DESC, created_at DESC LIMIT 1`);
  }

  return {
    send,

    async list(auth: AuthContext): Promise<ConversationSummary[]> {
      const rows = await db.query<ConversationRow & {
        last_body: string | null;
        last_at: string | null;
        last_sender: string | null;
        unread: number;
      }>(sql`
        SELECT c.*, m.body AS last_body, m.created_at AS last_at, m.sender_id AS last_sender,
          (SELECT count(*) FROM messaging.message u
            WHERE u.conversation_id = c.id AND u.sender_id <> ${auth.userId} AND u.read_at IS NULL) AS unread
        FROM messaging.conversation c
        LEFT JOIN LATERAL (
          SELECT body, created_at, sender_id FROM messaging.message
          WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) m ON true
        WHERE c.buyer_id = ${auth.userId} OR c.seller_id = ${auth.userId}
        ORDER BY c.last_message_at DESC LIMIT 200`);
      return summarize(auth, rows);
    },

    async get(auth: AuthContext, id: string): Promise<ConversationSummary> {
      await participant(auth, id);
      const all = await this.list(auth);
      const found = all.find((c) => c.id === id);
      if (!found) throw notFound('Konversation nicht gefunden');
      return found;
    },

    async start(auth: AuthContext, listingId: string, body: string, clientMsgId: string) {
      const listing = await modules.listings.summary(listingId);
      if (!listing || !listing.available) throw notFound('Anzeige nicht gefunden');
      if (listing.ownerId === auth.userId) throw unprocessable('own_listing', 'Das ist deine eigene Anzeige.');
      if (await modules.trust.isBlockedEither(auth.userId, listing.ownerId)) throw NOT_POSSIBLE();

      let conv = await db.one<ConversationRow>(sql`
        SELECT * FROM messaging.conversation WHERE listing_id = ${listingId} AND buyer_id = ${auth.userId}`);
      if (!conv) {
        await limit(`chat-conv:${auth.userId}`, NEW_CONVERSATION_RATE);
        conv = await db.one<ConversationRow>(sql`
          INSERT INTO messaging.conversation (listing_id, buyer_id, seller_id)
          VALUES (${listingId}, ${auth.userId}, ${listing.ownerId})
          ON CONFLICT (listing_id, buyer_id) DO UPDATE SET listing_id = EXCLUDED.listing_id
          RETURNING *`);
        await realtime.publish(listing.ownerId, { type: 'conversation', conversationId: conv!.id });
      }
      const message = await send(auth, conv!.id, body, clientMsgId);
      return { conversationId: conv!.id, message };
    },

    async messages(auth: AuthContext, id: string, after?: string, max = 100): Promise<Message[]> {
      await participant(auth, id);
      const cursor = after
        ? sql`AND (m.created_at, m.id) > (SELECT created_at, id FROM messaging.message WHERE id = ${after})`
        : empty;
      const rows = await db.query<MessageRow>(sql`
        SELECT * FROM (
          SELECT m.* FROM messaging.message m WHERE m.conversation_id = ${id} ${cursor}
          ORDER BY m.created_at ${after ? sql`ASC` : sql`DESC`}, m.id LIMIT ${max}
        ) m ORDER BY m.created_at ASC, m.id ASC`);
      return rows.map(toMessage);
    },

    async markRead(auth: AuthContext, id: string): Promise<void> {
      const { counterpartId } = await participant(auth, id);
      const rows = await db.query<{ read_at: string }>(sql`
        UPDATE messaging.message SET read_at = now()
        WHERE conversation_id = ${id} AND sender_id <> ${auth.userId} AND read_at IS NULL RETURNING read_at`);
      if (rows.length) {
        await publish([counterpartId, auth.userId], {
          type: 'read',
          conversationId: id,
          readerId: auth.userId,
          readAt: rows[0]!.read_at,
        });
      }
    },

    async unreadCount(auth: AuthContext): Promise<number> {
      const row = await db.one<{ n: number }>(sql`
        SELECT count(*) AS n FROM messaging.message m
        JOIN messaging.conversation c ON c.id = m.conversation_id
        WHERE (c.buyer_id = ${auth.userId} OR c.seller_id = ${auth.userId})
          AND m.sender_id <> ${auth.userId} AND m.read_at IS NULL`);
      return row?.n ?? 0;
    },

    /** Deal (ADR-0006): Reservierung bzw. Abgabe an genau diesen Interessenten. Nur der Anbieter. */
    async deal(auth: AuthContext, id: string, body: DealActionBody): Promise<Deal> {
      const { conv } = await participant(auth, id);
      if (conv.seller_id !== auth.userId) throw forbidden('Nur der Anbieter kann den Deal steuern.');
      const listing = await modules.listings.summary(conv.listing_id);
      if (!listing) throw notFound('Anzeige nicht gefunden');

      const result = await database.tx(async (tx) => {
        const open = await tx.db.one<DealRow>(sql`
          SELECT * FROM messaging.deal WHERE listing_id = ${conv.listing_id} AND status = 'agreed' FOR UPDATE`);
        let deal: DealRow;
        let systemText: string;

        if (body.action === 'reserve') {
          if (open) throw conflict('already_reserved', 'Die Anzeige ist bereits reserviert.');
          if (listing.status !== 'active') throw conflict('invalid_transition', 'Nur aktive Anzeigen können reserviert werden.');
          deal = (await tx.db.one<DealRow>(sql`
            INSERT INTO messaging.deal (conversation_id, listing_id, seller_id, buyer_id, agreed_price_cents, currency, status)
            VALUES (${conv.id}, ${conv.listing_id}, ${conv.seller_id}, ${conv.buyer_id},
                    ${body.agreedPriceCents ?? listing.priceCents}, ${listing.currency}, 'agreed')
            RETURNING *`))!;
          await modules.listings.setStatusFromDeal(tx, conv.listing_id, 'reserved');
          systemText = 'Die Anzeige wurde für dich reserviert.';
        } else if (body.action === 'complete') {
          if (open && open.conversation_id !== conv.id) {
            throw conflict('reserved_for_other', 'Die Anzeige ist für eine andere Person reserviert.');
          }
          if (!['active', 'reserved'].includes(listing.status)) throw conflict('invalid_transition', 'Die Anzeige ist nicht mehr verfügbar.');
          deal = open
            ? (await tx.db.one<DealRow>(sql`
                UPDATE messaging.deal SET status = 'completed', updated_at = now() WHERE id = ${open.id} RETURNING *`))!
            : (await tx.db.one<DealRow>(sql`
                INSERT INTO messaging.deal (conversation_id, listing_id, seller_id, buyer_id, agreed_price_cents, currency, status)
                VALUES (${conv.id}, ${conv.listing_id}, ${conv.seller_id}, ${conv.buyer_id},
                        ${body.agreedPriceCents ?? listing.priceCents}, ${listing.currency}, 'completed')
                RETURNING *`))!;
          await modules.listings.setStatusFromDeal(tx, conv.listing_id, 'completed');
          systemText = 'Die Anzeige wurde als an dich abgegeben markiert.';
        } else {
          if (!open || open.conversation_id !== conv.id) throw conflict('no_open_deal', 'Es gibt keine offene Reservierung.');
          deal = (await tx.db.one<DealRow>(sql`
            UPDATE messaging.deal SET status = 'cancelled', updated_at = now() WHERE id = ${open.id} RETURNING *`))!;
          await modules.listings.setStatusFromDeal(tx, conv.listing_id, 'active');
          systemText = 'Die Reservierung wurde aufgehoben.';
        }

        const { message } = await insertMessage(tx, conv, auth.userId, crypto.randomUUID(), systemText, 'system');
        const eventType = { agreed: 'DealAgreed', completed: 'DealCompleted', cancelled: 'DealCancelled' }[deal.status];
        await tx.enqueue(DEAL_EVENTS, { type: eventType, ...toDeal(deal), listingId: deal.listing_id, sellerId: deal.seller_id, buyerId: deal.buyer_id });
        return { deal, message };
      });

      await publish([conv.buyer_id, conv.seller_id], { type: 'message', message: toMessage(result.message) });
      return toDeal(result.deal);
    },

    async findConversationId(listingId: string, buyerId: string): Promise<string | null> {
      const row = await db.one<{ id: string }>(sql`
        SELECT id FROM messaging.conversation WHERE listing_id = ${listingId} AND buyer_id = ${buyerId}`);
      return row?.id ?? null;
    },

    /** Vom Anbieter direkt an der Anzeige geänderter Status hält den Deal konsistent. */
    async onListingStatusChanged(tx: Tx, listingId: string, status: string): Promise<void> {
      const target = status === 'completed' ? 'completed' : 'cancelled';
      const deals = await tx.db.query<DealRow>(sql`
        UPDATE messaging.deal SET status = ${target}, updated_at = now()
        WHERE listing_id = ${listingId} AND status = 'agreed' RETURNING *`);
      for (const deal of deals) {
        await tx.enqueue(DEAL_EVENTS, {
          type: target === 'completed' ? 'DealCompleted' : 'DealCancelled',
          ...toDeal(deal),
          listingId,
          sellerId: deal.seller_id,
          buyerId: deal.buyer_id,
        });
      }
    },

    // ------------------------------------------------------------ Moderation / Datenschutz
    /** Gemeldete Nachricht ± 5 (REQ-PRIV-004). */
    async messageContext(messageId: string): Promise<{ senderId: string; messages: Message[] } | null> {
      const target = await db.one<MessageRow>(sql`SELECT * FROM messaging.message WHERE id = ${messageId}`);
      if (!target) return null;
      const rows = await db.query<MessageRow>(sql`
        (SELECT * FROM messaging.message WHERE conversation_id = ${target.conversation_id}
          AND (created_at, id) < (${target.created_at}::timestamptz, ${target.id}::uuid) ORDER BY created_at DESC, id DESC LIMIT 5)
        UNION ALL (SELECT * FROM messaging.message WHERE id = ${target.id})
        UNION ALL
        (SELECT * FROM messaging.message WHERE conversation_id = ${target.conversation_id}
          AND (created_at, id) > (${target.created_at}::timestamptz, ${target.id}::uuid) ORDER BY created_at ASC, id ASC LIMIT 5)`);
      rows.sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));
      return { senderId: target.sender_id, messages: rows.map(toMessage) };
    },

    async isParticipantOfMessage(userId: string, messageId: string): Promise<boolean> {
      return !!(await db.one(sql`
        SELECT 1 FROM messaging.message m JOIN messaging.conversation c ON c.id = m.conversation_id
        WHERE m.id = ${messageId} AND (c.buyer_id = ${userId} OR c.seller_id = ${userId})`));
    },

    async removeByModeration(tx: Tx, messageId: string): Promise<void> {
      await tx.db.exec(sql`
        UPDATE messaging.message SET body = '[Nachricht wurde von der Moderation entfernt]', kind = 'system'
        WHERE id = ${messageId}`);
    },

    async deleteForUser(tx: Tx, userId: string): Promise<void> {
      await tx.db.exec(sql`DELETE FROM messaging.conversation WHERE buyer_id = ${userId} OR seller_id = ${userId}`);
    },

    async exportForUser(userId: string) {
      return db.query(sql`
        SELECT c.id AS "conversationId", c.listing_id AS "listingId", m.body, m.created_at AS "createdAt"
        FROM messaging.message m JOIN messaging.conversation c ON c.id = m.conversation_id
        WHERE m.sender_id = ${userId} ORDER BY m.created_at`);
    },

    /** Job: gebündelte E-Mail bei ungelesenen Nachrichten, ohne Inhalt (REQ-NOTI-002). */
    async notifyUnread(conversationId: string, recipientId: string): Promise<void> {
      const pending = await db.one<{ listing_id: string }>(sql`
        SELECT c.listing_id FROM messaging.conversation c
        WHERE c.id = ${conversationId}
          AND EXISTS (SELECT 1 FROM messaging.message m WHERE m.conversation_id = c.id
                      AND m.sender_id <> ${recipientId} AND m.read_at IS NULL AND m.kind = 'text')
          AND NOT EXISTS (SELECT 1 FROM messaging.notification_state s WHERE s.conversation_id = c.id
                      AND s.user_id = ${recipientId} AND s.last_notified_at > now() - make_interval(secs => ${NOTIFY_DELAY_SECONDS}))`);
      if (!pending) return;
      const listing = await modules.listings.summary(pending.listing_id);
      await database.tx(async (tx) => {
        await tx.db.exec(sql`
          INSERT INTO messaging.notification_state (conversation_id, user_id, last_notified_at)
          VALUES (${conversationId}, ${recipientId}, now())
          ON CONFLICT (conversation_id, user_id) DO UPDATE SET last_notified_at = now()`);
        await modules.notifications.email(tx, { userId: recipientId }, 'new_message', {
          listingTitle: listing?.title ?? 'einer Anzeige',
          link: `${config.publicUrl}/messages/${conversationId}`,
        });
      });
    },
  };

  async function summarize(
    auth: AuthContext,
    rows: (ConversationRow & { last_body: string | null; last_at: string | null; last_sender: string | null; unread: number })[],
  ): Promise<ConversationSummary[]> {
    const listings = await modules.listings.summaries([...new Set(rows.map((r) => r.listing_id))]);
    const counterpartIds = rows.map((r) => (r.buyer_id === auth.userId ? r.seller_id : r.buyer_id));
    const users = await modules.identity.getPublicUsers([...new Set(counterpartIds)]);
    const blocked = new Set(await modules.trust.blockRelations(auth.userId));
    const result: ConversationSummary[] = [];
    for (const [i, r] of rows.entries()) {
      const counterpartId = counterpartIds[i]!;
      const listing = listings.get(r.listing_id);
      const deal = await dealFor(r.id);
      result.push({
        id: r.id,
        role: r.buyer_id === auth.userId ? 'buyer' : 'seller',
        listing: {
          id: r.listing_id,
          title: listing?.title ?? 'Gelöschte Anzeige',
          status: listing?.status ?? 'removed',
          thumbnailUrl: listing?.thumbnailUrl ?? null,
        },
        counterpart: { id: counterpartId, displayName: users.get(counterpartId)?.displayName ?? 'Ehemaliges Mitglied' },
        lastMessage: r.last_body ? { body: r.last_body, createdAt: r.last_at!, senderId: r.last_sender! } : null,
        unreadCount: r.unread,
        deal: deal ? toDeal(deal) : null,
        blocked: blocked.has(counterpartId),
      });
    }
    return result;
  }
}

export type MessagingService = ReturnType<typeof createMessagingService>;
