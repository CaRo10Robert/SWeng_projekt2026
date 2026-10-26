/**
 * Löschfristen aus dem Löschkonzept (REQ-PRIV-003). Reine Funktionen; die Läufe in den Modulen bekommen nur noch
 * Stichtage und löschen alles, was davor liegt. Fristen nach Datum sind idempotent und brauchen nach einer
 * Wiederherstellung kein Löschjournal: der nächste Lauf löscht dasselbe noch einmal.
 */
export const RETENTION = {
  /** Unbestätigte Konten (Q-13, REQ-AUTH-002). */
  unverifiedAccountDays: 7,
  /** Bestätigungs- und Reset-Links nach Ablauf bzw. Nutzung. */
  linkDays: 7,
  /** Chatnachrichten nach der letzten Nachricht der Konversation (Q-7). */
  conversationMonths: 12,
  /** Meldungen, Moderationsentscheidungen und Widersprüche nach Abschluss. */
  moderationMonths: 12,
  /** Von der Moderation entfernte Anzeigen nach der Entscheidung. */
  removedListingMonths: 12,
  /** Pausierte Anzeigen laufen danach ab (Zustandsmodell). */
  pausedListingDays: 90,
  /** Mitteilungen im Konto (REQ-LEGAL-006). */
  noticeMonths: 12,
  /** Audit-Log. */
  auditMonths: 24,
  /** Nachweise über Zustimmungen ohne Profilbezug nach der Kontolöschung (Verjährung). */
  consentProofYears: 3,
} as const;

export interface RetentionCutoffs {
  unverifiedAccountsBefore: Date;
  linksBefore: Date;
  conversationsBefore: Date;
  moderationBefore: Date;
  removedListingsBefore: Date;
  pausedListingsBefore: Date;
  noticesBefore: Date;
  auditBefore: Date;
  consentProofsBefore: Date;
}

const DAY = 86_400_000;

/** Kalendermonate rückwärts (UTC); der 31. eines kürzeren Monats wird auf dessen letzten Tag gekürzt. */
export function monthsBefore(now: Date, months: number): Date {
  const date = new Date(now.getTime());
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() - months);
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return date;
}

export function retentionCutoffs(now: Date): RetentionCutoffs {
  const daysBefore = (days: number) => new Date(now.getTime() - days * DAY);
  return {
    unverifiedAccountsBefore: daysBefore(RETENTION.unverifiedAccountDays),
    linksBefore: daysBefore(RETENTION.linkDays),
    conversationsBefore: monthsBefore(now, RETENTION.conversationMonths),
    moderationBefore: monthsBefore(now, RETENTION.moderationMonths),
    removedListingsBefore: monthsBefore(now, RETENTION.removedListingMonths),
    pausedListingsBefore: daysBefore(RETENTION.pausedListingDays),
    noticesBefore: monthsBefore(now, RETENTION.noticeMonths),
    auditBefore: monthsBefore(now, RETENTION.auditMonths),
    consentProofsBefore: monthsBefore(now, RETENTION.consentProofYears * 12),
  };
}
