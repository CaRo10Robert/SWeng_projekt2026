import type { ContactShare, ConversationSummary, Deal, DealActionBody, Message, ServerEvent } from '@campusmarkt/contracts';
import type { Tx } from '../../platform/db.js';
import { AppError, conflict, forbidden, notFound, rateLimited, unprocessable } from '../../platform/errors.js';
import type { AuthContext } from '../../platform/http/auth.js';
import { empty, sql } from '../../platform/sql.js';
import type { ModuleDeps } from '../shared.js';
import {
  CONTACT_ACTION_RATE,
  contactView,
  decideContactAction,
  MESSAGE_RATE,
  needsSafetyHint,
  NEW_CONVERSATION_RATE,
  NOTIFY_DELAY_SECONDS,
  type ContactAction,
  type ContactContext,
  type ContactRow,
} from './domain.js';

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

interface ContactRowDb {
  conversation_id: string;
  user_id: string;
  state: ContactRow['state'];
  request_count: number;
  changed_at: string;
}

const CONTACT_ERRORS = {
  contact_not_possible: () => NOT_POSSIBLE(),
  contact_request_limit: () =>
    new AppError(429, 'contact_request_limit', 'Eine erneute Anfrage ist derzeit nicht möglich.'),
  invalid_contact_action: () =>
    conflict('invalid_contact_action', 'Diese Aktion ist im aktuellen Zustand nicht möglich.'),
};

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

  /** Neueste Deals mehrerer Konversationen in einer Abfrage, offene zuerst. */
  async function dealsFor(conversationIds: string[]): Promise<Map<string, DealRow>> {
    if (conversationIds.length === 0) return new Map();
    const rows = await db.query<DealRow>(sql`
      SELECT DISTINCT ON (conversation_id) * FROM messaging.deal WHERE conversation_id = ANY(${conversationIds}::uuid[])
      ORDER BY conversation_id, (status = 'agreed') DESC, created_at DESC`);
    return new Map(rows.map((d) => [d.conversation_id, d]));
  }

  /** Zustimmungen mehrerer Konversationen in einer Abfrage; in einer Transaktion gesperrt (REQ-CHAT-010). */
  async function contactRows(conversationIds: string[], tx?: Tx): Promise<Map<string, ContactRowDb[]>> {
    const byConversation = new Map<string, ContactRowDb[]>();
    if (conversationIds.length === 0) return byConversation;
    const rows = await (tx?.db ?? db).query<ContactRowDb>(sql`
      SELECT conversation_id, user_id, state, request_count, changed_at FROM messaging.contact_consent
      WHERE conversation_id = ANY(${conversationIds}::uuid[]) ${tx ? sql`FOR UPDATE` : empty}`);
    for (const r of rows) byConversation.set(r.conversation_id, [...(byConversation.get(r.conversation_id) ?? []), r]);
    return byConversation;
  }

  function contactContext(
    rows: ContactRowDb[] | undefined,
    me: string,
    counterpartId: string,
    status: { blocked: boolean; bothActive: boolean },
  ): ContactContext {
    const toRow = (r?: ContactRowDb): ContactRow | undefined =>
      r && { state: r.state, requestCount: r.request_count, changedAt: new Date(r.changed_at) };
    return {
      mine: toRow(rows?.find((r) => r.user_id === me)),
      theirs: toRow(rows?.find((r) => r.user_id === counterpartId)),
      ...status,
      now: new Date(),
    };
  }

  /** Sichten mehrerer Konversationen; Adressen nur über das schmale identity-API und nur bei gegenseitiger Sichtbarkeit. */
  async function contactShares(items: { ctx: ContactContext; counterpartId: string }[]): Promise<ContactShare[]> {
    const views = items.map((item) => contactView(item.ctx));
    const addresses = await modules.identity.getSharedContactAddresses(
      items.filter((_, i) => views[i]!.visible).map((item) => item.counterpartId),
    );
    return views.map((view, i) => ({
      mine: view.mine,
      theirs: view.theirs,
      counterpartEmail: view.visible ? (addresses.get(items[i]!.counterpartId) ?? null) : null,
      canGrant: view.canGrant,
      retryAfter: view.retryAfter?.toISOString() ?? null,
      requestsLeft: view.requestsLeft,
    }));
  }

  type ConversationListRow = ConversationRow & {
    last_body: string | null;
    last_at: string | null;
    last_sender: string | null;
    unread: number;
  };

  async function conversationRows(auth: AuthContext, onlyId?: string): Promise<ConversationListRow[]> {
    return db.query<ConversationListRow>(sql`
      SELECT c.*, m.body AS last_body, m.created_at AS last_at, m.sender_id AS last_sender,
        (SELECT count(*) FROM messaging.message u
          WHERE u.conversation_id = c.id AND u.sender_id <> ${auth.userId} AND u.read_at IS NULL) AS unread
      FROM messaging.conversation c
      LEFT JOIN LATERAL (
        SELECT body, created_at, sender_id FROM messaging.message
        WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) m ON true
      WHERE (c.buyer_id = ${auth.userId} OR c.seller_id = ${auth.userId}) ${onlyId ? sql`AND c.id = ${onlyId}` : empty}
      ORDER BY c.last_message_at DESC LIMIT 200`);
  }

  return {
    send,

    /** REQ-CHAT-010: zustimmen, zurückziehen oder eine Anfrage ablehnen. */
    async contactAction(auth: AuthContext, conversationId: string, action: ContactAction): Promise<ContactShare> {
      const { conv, counterpartId } = await participant(auth, conversationId);
      await limit(`contact:${auth.userId}`, CONTACT_ACTION_RATE);
      // Vor der Transaktion lesen: keine zweite Pool-Verbindung, während die Zeilensperre gehalten wird
      const status = {
        blocked: await modules.trust.isBlockedEither(auth.userId, counterpartId),
        bothActive: (await modules.identity.activeUserIds([auth.userId, counterpartId])).size === 2,
      };
      const exchanged = await database.tx(async (tx) => {
        // Die Sperre serialisiert parallele Aktionen beider Teilnehmer; fehlt die Zeile, wurde die Konversation gelöscht
        const locked = await tx.db.one(sql`SELECT 1 FROM messaging.conversation WHERE id = ${conv.id} FOR UPDATE`);
        if (!locked) throw notFound('Konversation nicht gefunden');
        const rows = (await contactRows([conv.id], tx)).get(conv.id);
        const decision = decideContactAction(action, contactContext(rows, auth.userId, counterpartId, status));
        if (!decision.ok) throw CONTACT_ERRORS[decision.code]();
        if (decision.set === 'mine') {
          await tx.db.exec(sql`
            INSERT INTO messaging.contact_consent (conversation_id, user_id, state, request_count, granted_at, withdrawn_at)
            VALUES (${conv.id}, ${auth.userId}, ${decision.state}, ${decision.countsAsRequest ? 1 : 0},
                    ${decision.state === 'granted' ? sql`now()` : sql`NULL`}, ${decision.state === 'withdrawn' ? sql`now()` : sql`NULL`})
            ON CONFLICT (conversation_id, user_id) DO UPDATE SET
              state = EXCLUDED.state,
              request_count = messaging.contact_consent.request_count + ${decision.countsAsRequest ? 1 : 0},
              granted_at = COALESCE(EXCLUDED.granted_at, messaging.contact_consent.granted_at),
              withdrawn_at = COALESCE(EXCLUDED.withdrawn_at, messaging.contact_consent.withdrawn_at),
              changed_at = now()`);
        } else {
          await tx.db.exec(sql`
            UPDATE messaging.contact_consent SET state = 'declined', declined_at = now(), changed_at = now()
            WHERE conversation_id = ${conv.id} AND user_id = ${counterpartId}`);
        }
        if (decision.exchanged) {
          // Systemnachricht ohne Adressen; die Adressen erscheinen nur als Angabe zur Konversation
          const { message } = await insertMessage(tx, conv, auth.userId, crypto.randomUUID(),
            'Kontaktdaten wurden ausgetauscht. Ihr seht die Hochschul-E-Mail-Adresse des anderen oben im Chat.', 'system');
          return message;
        }
        return null;
      });
      if (exchanged) await publish([conv.buyer_id, conv.seller_id], { type: 'message', message: toMessage(exchanged) });
      await publish([conv.buyer_id, conv.seller_id], { type: 'conversation', conversationId: conv.id });
      const rows = (await contactRows([conv.id])).get(conv.id);
      const [share] = await contactShares([{ ctx: contactContext(rows, auth.userId, counterpartId, status), counterpartId }]);
      return share!;
    },

    /** Datenexport (REQ-ACC-003): eigene Zustimmungen und die Anfragen, die ich abgelehnt habe. */
    async exportContactConsents(userId: string) {
      return db.query(sql`
        SELECT conversation_id AS "conversationId", 'own' AS kind, state, request_count AS "requestCount",
               granted_at AS "grantedAt", withdrawn_at AS "withdrawnAt", declined_at AS "declinedAt"
        FROM messaging.contact_consent WHERE user_id = ${userId}
        UNION ALL
        SELECT cc.conversation_id, 'declined_by_me', cc.state, NULL, NULL, NULL, cc.declined_at
        FROM messaging.contact_consent cc JOIN messaging.conversation c ON c.id = cc.conversation_id
        WHERE cc.user_id <> ${userId} AND cc.state = 'declined' AND (c.buyer_id = ${userId} OR c.seller_id = ${userId})`);
    },

    async list(auth: AuthContext): Promise<ConversationSummary[]> {
      return summarize(auth, await conversationRows(auth));
    },

    /** Einzelabfrage, unabhängig davon, ob die Konversation unter den neuesten 200 ist. */
    async get(auth: AuthContext, id: string): Promise<ConversationSummary> {
      await participant(auth, id);
      const [found] = await summarize(auth, await conversationRows(auth, id));
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

  /** Feste Zahl von Abfragen je Liste, unabhängig von der Anzahl der Konversationen. */
  async function summarize(auth: AuthContext, rows: ConversationListRow[]): Promise<ConversationSummary[]> {
    const ids = rows.map((r) => r.id);
    const counterpartIds = rows.map((r) => (r.buyer_id === auth.userId ? r.seller_id : r.buyer_id));
    const [listings, users, blockedIds, deals, consents, active] = await Promise.all([
      modules.listings.summaries([...new Set(rows.map((r) => r.listing_id))]),
      modules.identity.getPublicUsers([...new Set(counterpartIds)]),
      modules.trust.blockRelations(auth.userId),
      dealsFor(ids),
      contactRows(ids),
      modules.identity.activeUserIds([...new Set([auth.userId, ...counterpartIds])]),
    ]);
    const blocked = new Set(blockedIds);
    const contacts = await contactShares(
      rows.map((r, i) => {
        const counterpartId = counterpartIds[i]!;
        const status = { blocked: blocked.has(counterpartId), bothActive: active.has(auth.userId) && active.has(counterpartId) };
        return { ctx: contactContext(consents.get(r.id), auth.userId, counterpartId, status), counterpartId };
      }),
    );
    const result: ConversationSummary[] = [];
    for (const [i, r] of rows.entries()) {
      const counterpartId = counterpartIds[i]!;
      const listing = listings.get(r.listing_id);
      const deal = deals.get(r.id);
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
        contact: contacts[i]!,
      });
    }
    return result;
  }
}

export type MessagingService = ReturnType<typeof createMessagingService>;
