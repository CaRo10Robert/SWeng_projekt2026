import { createHash, randomBytes } from 'node:crypto';
import type { CriminalSuspicion, ModerationDecisionType, ModerationRule } from '@campusmarkt/contracts';

/** DSA Art. 20 Abs. 1: Widerspruch mindestens sechs Monate nach Mitteilung der Entscheidung (REQ-LEGAL-007). */
export const APPEAL_WINDOW_MONTHS = 6;
/** Missbrauchsschutz: höchstens 10 Widersprüche je Konto und Tag (REQ-LEGAL-007). */
export const APPEAL_RATE = { limit: 10, windowSeconds: 86_400 };
/** Beweissicherung bei Straftatverdacht höchstens 6 Monate (REQ-LEGAL-008). */
export const EVIDENCE_HOLD_MONTHS = 6;
/** DSA Art. 17 Abs. 3 lit. b: konkrete Tatsachen, nicht nur ein Stichwort (REQ-LEGAL-006). */
export const MIN_REASON_LENGTH = 20;
/** Begründung eines Widerspruchs (UC-35) und der Entscheidung darüber (UC-36), jeweils ohne Leerzeichen am Rand. */
export const MIN_APPEAL_REASON_LENGTH = 20;

/** Länge nach dem Entfernen von Leerzeichen am Rand (RV-C-11: nur Leerzeichen zählt nicht). */
export function hasMinLength(text: string | undefined, min: number): boolean {
  return (text ?? '').trim().length >= min;
}

/** Kalendermonate addieren; am Monatsende auf den letzten Tag begrenzen (31.08. + 6 = 28./29.02.). */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date.getTime());
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay));
  return result;
}

export function appealDeadline(notifiedAt: Date): Date {
  return addMonths(notifiedAt, APPEAL_WINDOW_MONTHS);
}

export type AppealRole = 'subject' | 'reporter';

/**
 * Wer darf widersprechen? Betroffene gegen jede Maßnahme, Meldende gegen „keine Maßnahme“ (REQ-LEGAL-007).
 * Alle anderen erhalten 404 (keine Existenzpreisgabe).
 */
export function appealRole(input: {
  userId: string;
  subjectUserId: string | null;
  reporterIds: readonly string[];
  decision: ModerationDecisionType;
}): AppealRole | null {
  if (input.subjectUserId === input.userId && input.decision !== 'no_action') return 'subject';
  if (input.reporterIds.includes(input.userId) && input.decision === 'no_action') return 'reporter';
  return null;
}

export type AppealCheck = { ok: true } | { ok: false; code: 'not_found' | 'appeal_expired' | 'appeal_exists' };

export function checkAppeal(input: {
  role: AppealRole | null;
  notifiedAt: Date;
  now: Date;
  alreadyAppealed: boolean;
}): AppealCheck {
  if (!input.role) return { ok: false, code: 'not_found' };
  if (input.alreadyAppealed) return { ok: false, code: 'appeal_exists' };
  if (input.now > appealDeadline(input.notifiedAt)) return { ok: false, code: 'appeal_expired' };
  return { ok: true };
}

/**
 * Vier-Augen-Prinzip (REQ-LEGAL-007, RV-C-01): Den Widerspruch entscheidet nie, wer die ursprüngliche Entscheidung
 * getroffen hat, wer selbst widerspricht, wer betroffen ist oder wer den Fall gemeldet hat.
 */
export function canReviewAppeal(input: {
  reviewerId: string;
  originalModeratorId: string;
  appellantId: string | null;
  subjectUserId: string | null;
  reporterIds: readonly string[];
}): boolean {
  const { reviewerId } = input;
  return (
    reviewerId !== input.originalModeratorId &&
    reviewerId !== input.appellantId &&
    reviewerId !== input.subjectUserId &&
    !input.reporterIds.includes(reviewerId)
  );
}

/** Eine Moderationsentscheidung trifft nicht, wer betroffen ist oder den Fall selbst gemeldet hat (RV-C-01). */
export function canDecideCase(input: { moderatorId: string; subjectUserId: string | null; reporterIds: readonly string[] }): boolean {
  return input.moderatorId !== input.subjectUserId && !input.reporterIds.includes(input.moderatorId);
}

export type DecisionCheck =
  | { ok: true }
  | { ok: false; code: 'rule_required' | 'criminal_reason_required' | 'reason_too_short' | 'legal_ground_required'; path: string };

/** Pflichtangaben einer Moderationsentscheidung (REQ-LEGAL-006, REQ-LEGAL-008). */
export function checkDecision(input: {
  decision: ModerationDecisionType;
  reason: string;
  ruleRef?: ModerationRule;
  criminalSuspicion?: CriminalSuspicion;
  criminalSuspicionReason?: string;
  legalGround?: string;
}): DecisionCheck {
  if (!hasMinLength(input.reason, MIN_REASON_LENGTH)) return { ok: false, code: 'reason_too_short', path: 'reason' };
  if (input.decision !== 'no_action' && !input.ruleRef) return { ok: false, code: 'rule_required', path: 'ruleRef' };
  // DSA Art. 17 Abs. 3 lit. d: bei rechtswidrigen Inhalten die Rechtsgrundlage mit Erläuterung (RV-R-03)
  if (input.decision !== 'no_action' && input.ruleRef === 'illegal_content' && !hasMinLength(input.legalGround, MIN_REASON_LENGTH)) {
    return { ok: false, code: 'legal_ground_required', path: 'legalGround' };
  }
  const flagged = (input.criminalSuspicion ?? 'none') !== 'none';
  if (flagged && !hasMinLength(input.criminalSuspicionReason, MIN_REASON_LENGTH)) {
    return { ok: false, code: 'criminal_reason_required', path: 'criminalSuspicionReason' };
  }
  return { ok: true };
}

/** Einmal-Link für den Widerspruch gesperrter Konten: nur der Hash wird gespeichert (wie Verifikations-Links). */
export function newAppealToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, hash: hashAppealToken(token) };
}

export function hashAppealToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
