import { Type, type Static } from '@sinclair/typebox';
import { Timestamp, Uuid } from './common.js';
import { ListingStatus } from './listings.js';

export const MessageBody = Type.String({ minLength: 1, maxLength: 2000 });

/** Systemnachrichten als Code; der Client übersetzt, body bleibt als deutscher Klartext (ADR-0016, MAN-UX-002 T-2). */
export const SystemCode = Type.Union([
  Type.Literal('contact_exchanged'),
  Type.Literal('deal_reserved'),
  Type.Literal('deal_completed'),
  Type.Literal('deal_cancelled'),
  Type.Literal('reservation_expired'),
  Type.Literal('message_removed'),
  Type.Literal('message_deleted'),
]);
export type SystemCode = Static<typeof SystemCode>;

export const Message = Type.Object({
  id: Uuid,
  conversationId: Uuid,
  senderId: Uuid,
  clientMsgId: Uuid,
  kind: Type.Union([Type.Literal('text'), Type.Literal('system')]),
  body: Type.String(),
  createdAt: Timestamp,
  readAt: Type.Union([Timestamp, Type.Null()]),
  /** Sicherheitshinweis bei Links, IBAN oder Telefonnummern (REQ-CHAT-006). */
  safetyHint: Type.Boolean(),
  /** Nur bei kind = system; ältere Systemnachrichten haben keinen Code. */
  systemCode: Type.Optional(Type.Union([SystemCode, Type.Null()])),
});
export type Message = Static<typeof Message>;

export const DealStatus = Type.Union([Type.Literal('agreed'), Type.Literal('completed'), Type.Literal('cancelled')]);
export type DealStatus = Static<typeof DealStatus>;

export const Deal = Type.Object({
  id: Uuid,
  status: DealStatus,
  agreedPriceCents: Type.Union([Type.Integer(), Type.Null()]),
  currency: Type.String(),
  createdAt: Timestamp,
});
export type Deal = Static<typeof Deal>;

/**
 * Kontaktfreigabe (REQ-CHAT-010, Fallstudie FS-C1). Zustand je Teilnehmer aus dessen Sicht:
 * `none` noch nichts, `granted` stimmt zu, `withdrawn` hat zurückgezogen, `declined` eigene Anfrage wurde abgelehnt.
 */
export const ContactState = Type.Union([
  Type.Literal('none'),
  Type.Literal('granted'),
  Type.Literal('withdrawn'),
  Type.Literal('declined'),
]);
export type ContactState = Static<typeof ContactState>;

export const ContactShare = Type.Object({
  mine: ContactState,
  theirs: ContactState,
  /** Nur gesetzt, wenn beide zugestimmt haben und kein Hinderungsgrund besteht. Nie Teil einer Nachricht. */
  counterpartEmail: Type.Union([Type.String(), Type.Null()]),
  /** Ob ich jetzt zustimmen bzw. anfragen darf (Sperrfrist, Höchstzahl, Blockierung). */
  canGrant: Type.Boolean(),
  /** Frühester Zeitpunkt für eine erneute Anfrage, falls gesperrt. */
  retryAfter: Type.Union([Timestamp, Type.Null()]),
  /** Verbleibende Anfragen in dieser Konversation (höchstens 3). */
  requestsLeft: Type.Integer(),
});
export type ContactShare = Static<typeof ContactShare>;

export const ContactActionBody = Type.Object({
  action: Type.Union([Type.Literal('grant'), Type.Literal('withdraw'), Type.Literal('decline')]),
});
export type ContactActionBody = Static<typeof ContactActionBody>;

export const ConversationSummary = Type.Object({
  id: Uuid,
  role: Type.Union([Type.Literal('buyer'), Type.Literal('seller')]),
  listing: Type.Object({
    id: Uuid,
    title: Type.String(),
    status: ListingStatus,
    thumbnailUrl: Type.Union([Type.String(), Type.Null()]),
  }),
  counterpart: Type.Object({ id: Uuid, displayName: Type.String() }),
  lastMessage: Type.Union([
    Type.Object({ body: Type.String(), createdAt: Timestamp, senderId: Uuid }),
    Type.Null(),
  ]),
  unreadCount: Type.Integer(),
  deal: Type.Union([Deal, Type.Null()]),
  /** true, wenn einer der beiden den anderen blockiert hat. */
  blocked: Type.Boolean(),
  contact: ContactShare,
});
export type ConversationSummary = Static<typeof ConversationSummary>;

export const StartConversationBody = Type.Object({
  listingId: Uuid,
  body: MessageBody,
  clientMsgId: Uuid,
});
export type StartConversationBody = Static<typeof StartConversationBody>;

export const StartConversationResult = Type.Object({ conversationId: Uuid, message: Message });
export type StartConversationResult = Static<typeof StartConversationResult>;

export const SendMessageBody = Type.Object({ body: MessageBody, clientMsgId: Uuid });
export type SendMessageBody = Static<typeof SendMessageBody>;

export const MessagesQuery = Type.Object({
  /** Nur Nachrichten nach dieser Nachricht (Nachladen nach Reconnect). */
  after: Type.Optional(Uuid),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 200 })),
});
export type MessagesQuery = Static<typeof MessagesQuery>;

export const DealActionBody = Type.Object({
  action: Type.Union([Type.Literal('reserve'), Type.Literal('complete'), Type.Literal('cancel')]),
  agreedPriceCents: Type.Optional(Type.Union([Type.Integer({ minimum: 0, maximum: 1_000_000 }), Type.Null()])),
});
export type DealActionBody = Static<typeof DealActionBody>;

export const UnreadCount = Type.Object({ count: Type.Integer() });
export type UnreadCount = Static<typeof UnreadCount>;

/**
 * WebSocket `/ws` (AsyncAPI-Kurzform). Authentifizierung über das Session-Cookie beim Handshake.
 * Server → Client: `ServerEvent`. Client → Server: `ClientEvent`.
 */
export type ServerEvent =
  | { type: 'hello'; userId: string }
  | { type: 'message'; message: Message }
  | { type: 'read'; conversationId: string; readerId: string; readAt: string }
  | { type: 'conversation'; conversationId: string }
  | { type: 'ack'; clientMsgId: string; message: Message }
  | { type: 'error'; clientMsgId?: string; code: string; detail: string };

export type ClientEvent =
  | { type: 'send'; conversationId: string; clientMsgId: string; body: string }
  | { type: 'read'; conversationId: string }
  | { type: 'ping' };
