import type { AppealStatus, CriminalSuspicion, ModerationDecisionType, ModerationRule, ReportTargetType } from '@campusmarkt/contracts';

// Bezeichnungen für Moderationsentscheidungen, Begründungen und Widersprüche (DSA Art. 17/18/20, REQ-LEGAL-006…008)

export const decisionLabels: Record<ModerationDecisionType, string> = {
  no_action: 'Keine Maßnahme',
  remove: 'Inhalt entfernen',
  warn: 'Verwarnen',
  ban: 'Konto sperren',
};

/** Folgen der Entscheidung aus Sicht der Betroffenen (Angabe 3 der Begründung). */
export const decisionConsequences: Record<ModerationDecisionType, string> = {
  no_action: 'Es wurde keine Maßnahme ergriffen.',
  remove: 'Der Inhalt wurde entfernt und ist für andere nicht mehr sichtbar.',
  warn: 'Das Konto wurde verwarnt. Bei weiteren Verstößen kann es gesperrt werden.',
  ban: 'Das Konto wurde gesperrt. Anmelden und Inserieren sind nicht mehr möglich.',
};

export const targetLabels: Record<ReportTargetType, string> = { listing: 'Anzeige', message: 'Nachricht', user: 'Profil' };

/** Regel mit Fundstelle in Community-Regeln bzw. Nutzungsbedingungen (Angabe 4 der Begründung). */
export const ruleLabels: Record<ModerationRule, { label: string; href: string }> = {
  community_prohibited_items: { label: 'Community-Regeln: Verbotene Artikel und Inhalte', href: '/community-regeln#verbotene-artikel-und-inhalte' },
  community_fair_communication: { label: 'Community-Regeln: Fair kommunizieren', href: '/community-regeln#fair-kommunizieren' },
  community_safe_handover: { label: 'Community-Regeln: Sicher übergeben', href: '/community-regeln#sicher-uebergeben' },
  terms_private_only: { label: 'Nutzungsbedingungen 3: Nur private Angebote', href: '/nutzungsbedingungen#3-nur-private-angebote' },
  terms_member_duties: { label: 'Nutzungsbedingungen 5: Pflichten der Mitglieder', href: '/nutzungsbedingungen#5-pflichten-der-mitglieder' },
  terms_content_rights: { label: 'Nutzungsbedingungen 6: Rechte an Inhalten', href: '/nutzungsbedingungen#6-rechte-an-inhalten' },
  illegal_content: { label: 'Rechtswidriger Inhalt (gesetzlicher Verstoß)', href: '/nutzungsbedingungen#5-pflichten-der-mitglieder' },
};

export const suspicionLabels: Record<CriminalSuspicion, string> = {
  none: 'Kein Verdacht auf eine Straftat',
  suspected: 'Verdacht auf eine Straftat',
  imminent_danger: 'Gefahr für Leben oder Sicherheit',
};

export const appealStatusLabels: Record<AppealStatus, string> = {
  open: 'in Prüfung',
  upheld: 'zurückgewiesen – Entscheidung bleibt bestehen',
  reversed: 'stattgegeben – Entscheidung aufgehoben',
};

/** Mindestlänge der Begründung (REQ-LEGAL-006), identisch mit `DecisionBody.reason` im Contract. */
export const MIN_REASON = 20;
/** Mindestlänge eines Widerspruchs, identisch mit `AppealBody.reason`. */
export const MIN_APPEAL = 10;
