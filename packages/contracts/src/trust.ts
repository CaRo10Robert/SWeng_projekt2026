import { Type, type Static } from '@sinclair/typebox';
import { Timestamp, Uuid } from './common.js';
import { Role, UserType } from './identity.js';
import { ListingCard } from './listings.js';
import { Message } from './messaging.js';

export const ReportTargetType = Type.Union([Type.Literal('listing'), Type.Literal('message'), Type.Literal('user')]);
export type ReportTargetType = Static<typeof ReportTargetType>;

export const ReportReason = Type.Union([
  Type.Literal('prohibited_item'),
  Type.Literal('fraud'),
  Type.Literal('harassment'),
  Type.Literal('spam'),
  Type.Literal('wrong_category'),
  Type.Literal('other'),
  /** Wird nur vom System gesetzt (Wortfilter, REQ-LST-010). */
  Type.Literal('auto_filter'),
]);
export type ReportReason = Static<typeof ReportReason>;

export const CreateReportBody = Type.Object({
  targetType: ReportTargetType,
  targetId: Uuid,
  reason: ReportReason,
  details: Type.Optional(Type.String({ maxLength: 1000 })),
});
export type CreateReportBody = Static<typeof CreateReportBody>;

export const ModerationDecisionType = Type.Union([
  Type.Literal('no_action'),
  Type.Literal('remove'),
  Type.Literal('warn'),
  Type.Literal('ban'),
]);
export type ModerationDecisionType = Static<typeof ModerationDecisionType>;

export const ModerationCase = Type.Object({
  id: Uuid,
  targetType: ReportTargetType,
  targetId: Uuid,
  status: Type.Union([Type.Literal('open'), Type.Literal('decided')]),
  reports: Type.Array(
    Type.Object({
      id: Uuid,
      reason: ReportReason,
      details: Type.Union([Type.String(), Type.Null()]),
      createdAt: Timestamp,
      reporterId: Type.Union([Uuid, Type.Null()]),
    }),
  ),
  hidden: Type.Boolean(),
  /** Betroffenes Mitglied (Anbieter, Absender oder gemeldetes Profil). */
  subject: Type.Union([Type.Object({ id: Uuid, displayName: Type.String() }), Type.Null()]),
  listing: Type.Union([Type.Composite([ListingCard, Type.Object({ description: Type.String() })]), Type.Null()]),
  /** Gemeldete Nachricht ± 5 (REQ-PRIV-004). Nur bei targetType = message. */
  messageContext: Type.Union([Type.Array(Message), Type.Null()]),
  createdAt: Timestamp,
});
export type ModerationCase = Static<typeof ModerationCase>;

export const DecisionBody = Type.Object({
  decision: ModerationDecisionType,
  reason: Type.String({ minLength: 5, maxLength: 1000 }),
});
export type DecisionBody = Static<typeof DecisionBody>;

export const BlockedUser = Type.Object({ userId: Uuid, displayName: Type.String(), blockedAt: Timestamp });
export type BlockedUser = Static<typeof BlockedUser>;

export const AdminUser = Type.Object({
  id: Uuid,
  email: Type.String(),
  displayName: Type.String(),
  role: Role,
  status: Type.String(),
  userType: UserType,
  createdAt: Timestamp,
});
export type AdminUser = Static<typeof AdminUser>;

export const SetRoleBody = Type.Object({ role: Role });
export type SetRoleBody = Static<typeof SetRoleBody>;

export const AuditEntry = Type.Object({
  id: Uuid,
  actorId: Type.Union([Uuid, Type.Null()]),
  actorName: Type.Union([Type.String(), Type.Null()]),
  action: Type.String(),
  targetType: Type.String(),
  targetId: Type.Union([Type.String(), Type.Null()]),
  details: Type.Record(Type.String(), Type.Unknown()),
  createdAt: Timestamp,
});
export type AuditEntry = Static<typeof AuditEntry>;

export const JobOverview = Type.Object({
  queues: Type.Array(
    Type.Object({
      name: Type.String(),
      queued: Type.Integer(),
      active: Type.Integer(),
      failed: Type.Integer(),
      completed: Type.Integer(),
    }),
  ),
  deadLetters: Type.Array(
    Type.Object({ id: Type.String(), name: Type.String(), createdOn: Timestamp, data: Type.Unknown() }),
  ),
});
export type JobOverview = Static<typeof JobOverview>;
