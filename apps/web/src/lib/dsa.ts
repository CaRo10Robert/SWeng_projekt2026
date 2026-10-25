import type { AppealStatus, CriminalSuspicion, ModerationDecisionType, ModerationRule, ReportTargetType } from '@campusmarkt/contracts';
import { labels } from './format';
import { t, type MessageKey } from '../i18n';

// Bezeichnungen für Moderationsentscheidungen, Begründungen und Widersprüche (DSA Art. 17/18/20, REQ-LEGAL-006…008)

export const decisionLabels = labels<ModerationDecisionType>({
  no_action: 'dsa.decision.no_action',
  remove: 'dsa.decision.remove',
  warn: 'dsa.decision.warn',
  ban: 'dsa.decision.ban',
});

/** Folgen der Entscheidung aus Sicht der Betroffenen (Angabe 3 der Begründung). */
export const decisionConsequences = labels<ModerationDecisionType>({
  no_action: 'dsa.consequence.no_action',
  remove: 'dsa.consequence.remove',
  warn: 'dsa.consequence.warn',
  ban: 'dsa.consequence.ban',
});

export const targetLabels = labels<ReportTargetType>({ listing: 'dsa.target.listing', message: 'dsa.target.message', user: 'dsa.target.user' });

/**
 * Regel mit Fundstelle in Community-Regeln bzw. Nutzungsbedingungen (Angabe 4 der Begründung). Die Anker sind
 * sprachunabhängig: Übersetzungen tragen die ID der deutschen Überschrift (`{#…}`, ADR-0016).
 */
const RULES: Record<ModerationRule, { label: MessageKey; href: string }> = {
  community_prohibited_items: { label: 'dsa.rule.community_prohibited_items', href: '/community-regeln#verbotene-artikel-und-inhalte' },
  community_fair_communication: { label: 'dsa.rule.community_fair_communication', href: '/community-regeln#fair-kommunizieren' },
  community_safe_handover: { label: 'dsa.rule.community_safe_handover', href: '/community-regeln#sicher-uebergeben' },
  terms_private_only: { label: 'dsa.rule.terms_private_only', href: '/nutzungsbedingungen#3-nur-private-angebote' },
  terms_member_duties: { label: 'dsa.rule.terms_member_duties', href: '/nutzungsbedingungen#5-pflichten-der-mitglieder' },
  terms_content_rights: { label: 'dsa.rule.terms_content_rights', href: '/nutzungsbedingungen#6-rechte-an-inhalten' },
  illegal_content: { label: 'dsa.rule.illegal_content', href: '/nutzungsbedingungen#5-pflichten-der-mitglieder' },
};
export const ruleLabels = Object.fromEntries(
  Object.entries(RULES).map(([k, r]) => [k, { get label() { return t(r.label); }, href: r.href }]),
) as Record<ModerationRule, { label: string; href: string }>;

export const suspicionLabels = labels<CriminalSuspicion>({
  none: 'dsa.suspicion.none',
  suspected: 'dsa.suspicion.suspected',
  imminent_danger: 'dsa.suspicion.imminent_danger',
});

export const appealStatusLabels = labels<AppealStatus>({
  open: 'dsa.appealStatus.open',
  upheld: 'dsa.appealStatus.upheld',
  reversed: 'dsa.appealStatus.reversed',
});

/** Mindestlänge der Begründung (REQ-LEGAL-006), identisch mit `DecisionBody.reason` im Contract. */
export const MIN_REASON = 20;
/** Mindestlänge eines Widerspruchs, identisch mit `AppealBody.reason`. */
export const MIN_APPEAL = 10;
