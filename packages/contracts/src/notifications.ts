import { Type, type Static } from '@sinclair/typebox';
import { Page, Timestamp, Uuid } from './common.js';

/** Arten von Benachrichtigungen in der App (REQ-NOTI-008). Neue Chatnachrichten haben einen eigenen Zähler. */
export const NotificationKind = Type.Union([
  Type.Literal('listing_expiry'),
  Type.Literal('reservation_expired'),
  Type.Literal('moderation_notice'),
  Type.Literal('appeal_result'),
  Type.Literal('offer_received'),
  Type.Literal('offer_countered'),
  Type.Literal('offer_accepted'),
  Type.Literal('offer_declined'),
  Type.Literal('offer_unavailable'),
  Type.Literal('rating_possible'),
  Type.Literal('listing_renewal_due'),
  Type.Literal('listing_auto_paused'),
  Type.Literal('listing_deleted'),
  Type.Literal('deal_reserved'),
  Type.Literal('deal_cancelled'),
  Type.Literal('deal_completed'),
]);
export type NotificationKind = Static<typeof NotificationKind>;

/** Nur Verweise und Anzeigetexte, nie Chatinhalte. */
export const NotificationData = Type.Object(
  {
    listingId: Type.Optional(Uuid),
    listingTitle: Type.Optional(Type.String()),
    conversationId: Type.Optional(Uuid),
    amountCents: Type.Optional(Type.Integer()),
    currency: Type.Optional(Type.String()),
    /** z. B. Löschdatum einer automatisch pausierten Anzeige oder Frist der Erneuerung */
    dueAt: Type.Optional(Type.String()),
  },
  { additionalProperties: false },
);
export type NotificationData = Static<typeof NotificationData>;

export const AppNotification = Type.Object({
  id: Uuid,
  kind: NotificationKind,
  data: NotificationData,
  createdAt: Timestamp,
  readAt: Type.Union([Timestamp, Type.Null()]),
});
export type AppNotification = Static<typeof AppNotification>;

export const NotificationPage = Page(AppNotification);
export type NotificationPage = Static<typeof NotificationPage>;

export const MarkNotificationBody = Type.Object({ read: Type.Boolean() });
export type MarkNotificationBody = Static<typeof MarkNotificationBody>;
