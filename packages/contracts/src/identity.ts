import { Type, type Static } from '@sinclair/typebox';
import { Timestamp, Uuid } from './common.js';

export const UserType = Type.Union([Type.Literal('student'), Type.Literal('staff')]);
export type UserType = Static<typeof UserType>;

export const Role = Type.Union([Type.Literal('member'), Type.Literal('moderator'), Type.Literal('admin')]);
export type Role = Static<typeof Role>;

/** Sprache der Oberfläche und der E-Mails (BCP 47, ADR-0016). */
export const Locale = Type.Union([Type.Literal('de'), Type.Literal('en')]);
export type Locale = Static<typeof Locale>;

export const NotificationPrefs = Type.Object({
  newMessage: Type.Boolean(),
  listingExpiry: Type.Boolean(),
});
export type NotificationPrefs = Static<typeof NotificationPrefs>;

export const Me = Type.Object({
  id: Uuid,
  email: Type.String(),
  displayName: Type.String(),
  userType: UserType,
  role: Role,
  studyProgram: Type.Union([Type.String(), Type.Null()]),
  preferredLocationIds: Type.Array(Uuid),
  notificationPrefs: NotificationPrefs,
  locale: Locale,
  /** Version der Nutzungsbedingungen, der das Mitglied zuletzt zugestimmt hat (REQ-LEGAL-003). */
  termsAcceptedVersion: Type.Union([Type.String(), Type.Null()]),
  /** true, wenn eine neuere Fassung gilt: schreibende Aktionen erst nach erneuter Zustimmung (403 terms_required). */
  termsRequired: Type.Boolean(),
  createdAt: Timestamp,
  /** Gesetzt, wenn eine Kontolöschung beim Login abgebrochen wurde (Karenzzeit). */
  deletionCancelled: Type.Optional(Type.Boolean()),
});
export type Me = Static<typeof Me>;

export const PublicUser = Type.Object({
  id: Uuid,
  displayName: Type.String(),
  userType: UserType,
  memberSince: Timestamp,
});
export type PublicUser = Static<typeof PublicUser>;

export const Password = Type.String({ minLength: 12, maxLength: 256 });
export const Email = Type.String({ minLength: 3, maxLength: 254 });

export const RegisterBody = Type.Object({
  email: Email,
  password: Password,
  displayName: Type.String({ minLength: 2, maxLength: 40 }),
  acceptTerms: Type.Literal(true),
  termsVersion: Type.String(),
});
export type RegisterBody = Static<typeof RegisterBody>;

export const TokenBody = Type.Object({ token: Type.String({ minLength: 10, maxLength: 200 }) });
export type TokenBody = Static<typeof TokenBody>;

export const EmailBody = Type.Object({ email: Email });
export type EmailBody = Static<typeof EmailBody>;

export const LoginBody = Type.Object({ email: Email, password: Type.String({ minLength: 1, maxLength: 256 }) });
export type LoginBody = Static<typeof LoginBody>;

export const ResetConfirmBody = Type.Object({ token: Type.String({ minLength: 10, maxLength: 200 }), password: Password });
export type ResetConfirmBody = Static<typeof ResetConfirmBody>;

export const UpdateMeBody = Type.Partial(
  Type.Object({
    displayName: Type.String({ minLength: 2, maxLength: 40 }),
    studyProgram: Type.Union([Type.String({ maxLength: 80 }), Type.Null()]),
    preferredLocationIds: Type.Array(Uuid, { maxItems: 10 }),
    notificationPrefs: NotificationPrefs,
    locale: Locale,
  }),
);
export type UpdateMeBody = Static<typeof UpdateMeBody>;

export const DeleteAccountBody = Type.Object({ password: Type.String({ minLength: 1, maxLength: 256 }) });
export type DeleteAccountBody = Static<typeof DeleteAccountBody>;

/** Erneute Zustimmung zu einer neuen Fassung der Nutzungsbedingungen (REQ-LEGAL-003). */
export const AcceptTermsBody = Type.Object({ version: Type.String({ minLength: 1, maxLength: 20 }) });
export type AcceptTermsBody = Static<typeof AcceptTermsBody>;
