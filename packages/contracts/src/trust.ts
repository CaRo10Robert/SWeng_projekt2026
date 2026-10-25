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

/**
 * Verletzte Regel (DSA Art. 17 Abs. 3 lit. d): Abschnitt der Nutzungsbedingungen bzw. Community-Regeln
 * oder ein Gesetzesverstoß. Pflicht für jede Maßnahme außer „keine Maßnahme“ (REQ-LEGAL-006).
 */
export const ModerationRule = Type.Union([
  Type.Literal('community_prohibited_items'),
  Type.Literal('community_fair_communication'),
  Type.Literal('community_safe_handover'),
  Type.Literal('terms_private_only'),
  Type.Literal('terms_member_duties'),
  Type.Literal('terms_content_rights'),
  Type.Literal('illegal_content'),
]);
export type ModerationRule = Static<typeof ModerationRule>;

/** Kennzeichnung nach DSA Art. 18 (REQ-LEGAL-008); erscheint nie in Mitteilungen an Betroffene. */
export const CriminalSuspicion = Type.Union([
  Type.Literal('none'),
  Type.Literal('suspected'),
  Type.Literal('imminent_danger'),
]);
export type CriminalSuspicion = Static<typeof CriminalSuspicion>;

export const DecisionBody = Type.Object({
  decision: ModerationDecisionType,
  /** Tatsachen und Umstände (DSA Art. 17 Abs. 3 lit. b), mindestens 20 Zeichen. */
  reason: Type.String({ minLength: 20, maxLength: 1000 }),
  ruleRef: Type.Optional(ModerationRule),
  criminalSuspicion: Type.Optional(CriminalSuspicion),
  criminalSuspicionReason: Type.Optional(Type.String({ maxLength: 1000 })),
  /**
   * Pflicht bei `illegal_content`: verletzte Norm und Erläuterung, warum der Inhalt rechtswidrig ist
   * (DSA Art. 17 Abs. 3 lit. d, mindestens 20 Zeichen; RV-R-03).
   */
  legalGround: Type.Optional(Type.String({ maxLength: 1000 })),
});
export type DecisionBody = Static<typeof DecisionBody>;

export const AppealStatus = Type.Union([Type.Literal('open'), Type.Literal('upheld'), Type.Literal('reversed')]);
export type AppealStatus = Static<typeof AppealStatus>;

/** Begründete Entscheidung aus Sicht der Empfänger (ohne Identität der Meldenden, ohne Art.-18-Kennzeichnung). */
export const DecisionStatement = Type.Object({
  id: Uuid,
  decision: ModerationDecisionType,
  targetType: ReportTargetType,
  /** Titel der Anzeige, falls vorhanden. */
  targetTitle: Type.Union([Type.String(), Type.Null()]),
  facts: Type.String(),
  ruleRef: Type.Union([ModerationRule, Type.Null()]),
  /** Rechtsgrundlage bei rechtswidrigen Inhalten (Art. 17 Abs. 3 lit. d). */
  legalGround: Type.Union([Type.String(), Type.Null()]),
  automatedDetection: Type.Boolean(),
  decidedAt: Timestamp,
});
export type DecisionStatement = Static<typeof DecisionStatement>;

/** Mitteilung im Konto (REQ-LEGAL-006) mit Einstieg in den Widerspruch (REQ-LEGAL-007). */
export const ModerationNotice = Type.Object({
  id: Uuid,
  kind: Type.Union([Type.Literal('decision'), Type.Literal('appeal_result'), Type.Literal('provisional_hide')]),
  recipientRole: Type.Union([Type.Literal('subject'), Type.Literal('reporter')]),
  createdAt: Timestamp,
  readAt: Type.Union([Timestamp, Type.Null()]),
  /** `null` bei `provisional_hide`: noch keine Entscheidung, nur vorläufig ausgeblendet (REQ-MOD-004, RV-R-04). */
  decision: Type.Union([DecisionStatement, Type.Null()]),
  provisional: Type.Union([
    Type.Object({
      targetType: ReportTargetType,
      targetTitle: Type.Union([Type.String(), Type.Null()]),
      /** Immer true: Ausblenden erfolgt automatisch ab drei Meldungen. */
      automated: Type.Boolean(),
    }),
    Type.Null(),
  ]),
  appeal: Type.Object({
    /** Widerspruch ist möglich (Frist läuft, noch keiner eingelegt, Rolle berechtigt). */
    possible: Type.Boolean(),
    deadline: Type.Union([Timestamp, Type.Null()]),
    status: Type.Union([AppealStatus, Type.Null()]),
    outcomeReason: Type.Union([Type.String(), Type.Null()]),
  }),
});
export type ModerationNotice = Static<typeof ModerationNotice>;

/** Begründung des Widerspruchs, mindestens 20 Zeichen ohne führende und folgende Leerzeichen (UC-35, RV-C-11). */
export const AppealBody = Type.Object({ reason: Type.String({ minLength: 20, maxLength: 2000 }) });
export type AppealBody = Static<typeof AppealBody>;

export const TokenAppealBody = Type.Object({
  token: Type.String({ minLength: 10, maxLength: 200 }),
  reason: Type.String({ minLength: 20, maxLength: 2000 }),
});
export type TokenAppealBody = Static<typeof TokenAppealBody>;

/** Token im Body statt in der URL: erscheint so in keinem Zugriffsprotokoll (RV-C-07). */
export const TokenInfoBody = Type.Object({ token: Type.String({ minLength: 10, maxLength: 200 }) });
export type TokenInfoBody = Static<typeof TokenInfoBody>;

/** Angaben für das Widerspruchsformular über den Einmal-Link (gesperrte Konten). */
export const TokenAppealInfo = Type.Object({ decision: DecisionStatement, deadline: Timestamp });
export type TokenAppealInfo = Static<typeof TokenAppealInfo>;

export const AppealReceipt = Type.Object({ id: Uuid, status: AppealStatus, createdAt: Timestamp });
export type AppealReceipt = Static<typeof AppealReceipt>;

/** Widerspruch in der Moderations-Queue (UC-36). */
export const Appeal = Type.Object({
  id: Uuid,
  status: AppealStatus,
  appellantRole: Type.Union([Type.Literal('subject'), Type.Literal('reporter')]),
  reason: Type.String(),
  createdAt: Timestamp,
  decidedAt: Type.Union([Timestamp, Type.Null()]),
  outcomeReason: Type.Union([Type.String(), Type.Null()]),
  /** false, wenn die anfragende Person die ursprüngliche Entscheidung getroffen hat (Vier-Augen-Prinzip). */
  canDecide: Type.Boolean(),
  decision: DecisionStatement,
  /** Originaltext einer entfernten Nachricht, nur für die Prüfung (Zugriff wird protokolliert, RV-C-10). */
  originalContent: Type.Union([Type.String(), Type.Null()]),
  subject: Type.Union([Type.Object({ id: Uuid, displayName: Type.String() }), Type.Null()]),
});
export type Appeal = Static<typeof Appeal>;

export const AppealDecisionBody = Type.Object({
  outcome: Type.Union([Type.Literal('upheld'), Type.Literal('reversed')]),
  reason: Type.String({ minLength: 20, maxLength: 1000 }),
});
export type AppealDecisionBody = Static<typeof AppealDecisionBody>;

/** Beweissicherung (REQ-LEGAL-008), nur für Administratoren. */
export const EvidenceHold = Type.Object({
  id: Uuid,
  decisionId: Uuid,
  targetType: ReportTargetType,
  targetId: Uuid,
  urgent: Type.Boolean(),
  heldUntil: Timestamp,
  releasedAt: Type.Union([Timestamp, Type.Null()]),
  createdAt: Timestamp,
  /** Anzahl gesicherter Kopien (Inhalt und Kontext), unabhängig von späteren Löschungen (RV-R-15). */
  preservedItems: Type.Integer(),
});
export type EvidenceHold = Static<typeof EvidenceHold>;

/** DAC7-Auswertung (REQ-LEGAL-009, Q-26). */
export const Dac7Query = Type.Object({
  year: Type.Integer({ minimum: 2023, maximum: 9999 }),
  format: Type.Optional(Type.Union([Type.Literal('json'), Type.Literal('csv')])),
});
export type Dac7Query = Static<typeof Dac7Query>;

export const Dac7Report = Type.Object({
  year: Type.Integer(),
  thresholds: Type.Object({ sales: Type.Integer(), amountCents: Type.Integer() }),
  note: Type.String(),
  sellers: Type.Array(
    Type.Object({
      userId: Uuid,
      displayName: Type.String(),
      sales: Type.Integer(),
      amountCents: Type.Integer(),
      quarters: Type.Array(Type.Object({ quarter: Type.Integer(), sales: Type.Integer(), amountCents: Type.Integer() })),
    }),
  ),
});
export type Dac7Report = Static<typeof Dac7Report>;

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
