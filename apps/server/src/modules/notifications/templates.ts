import type { Locale, ModerationDecisionType, ModerationRule, ReportTargetType } from '@campusmarkt/contracts';

/**
 * E-Mail-Templates. Chat-Benachrichtigungen enthalten nie den Nachrichteninhalt (REQ-NOTI-002).
 * `category` steuert die Abbestellbarkeit; `security` und `service` sind nicht abbestellbar (REQ-NOTI-003),
 * `service` sind Pflichtmitteilungen (z. B. Begründungen nach DSA Art. 17) und erreichen auch gesperrte Konten.
 *
 * Sprachen (ADR-0016, REQ-UX-007): Texte liegen je Sprache in `TEXTS`, versendet wird in der Sprache des Kontos;
 * fehlt eine Übersetzung, gilt Deutsch.
 */
export type EmailTemplate =
  | 'verify'
  | 'account_exists'
  | 'password_reset'
  | 'new_message'
  | 'listing_expiry'
  | 'moderation_decision'
  | 'moderation_report_result'
  | 'provisional_hide'
  | 'appeal_result'
  | 'criminal_suspicion_alert'
  | 'deletion_scheduled'
  | 'deletion_completed';

export type EmailCategory = 'security' | 'service' | 'newMessage' | 'listingExpiry';

type Params = Record<string, string>;

interface Rendered {
  subject: string;
  paragraphs: string[];
  action?: { label: string; url: string };
}

export const templateCategory: Record<EmailTemplate, EmailCategory> = {
  verify: 'security',
  account_exists: 'security',
  password_reset: 'security',
  new_message: 'newMessage',
  listing_expiry: 'listingExpiry',
  moderation_decision: 'service',
  moderation_report_result: 'service',
  provisional_hide: 'service',
  appeal_result: 'service',
  criminal_suspicion_alert: 'service',
  deletion_scheduled: 'security',
  deletion_completed: 'security',
};

/** Kategorien mit Abmeldelink und List-Unsubscribe-Header (REQ-OPS-010). */
export const UNSUBSCRIBABLE: ReadonlySet<EmailCategory> = new Set(['newMessage', 'listingExpiry']);

// ------------------------------------------------------------------ Beschriftungen je Sprache

/**
 * Aufrufer übergeben Codes statt fertiger Texte (`decision`, `targetType`, `ruleRef`, `automated`, `outcomeCode`, `level`,
 * Datumsangaben als ISO in `dateIso`/`deadlineIso`); die Vorlage setzt sie in der Sprache des Empfängers ein.
 * Bereits fertige Texte (`measure`, `target`, `date` …) aus älteren Jobs werden unverändert übernommen.
 */
interface Labels {
  locale: string;
  measure: Record<ModerationDecisionType, Record<ReportTargetType, string>>;
  target: Record<ReportTargetType, string>;
  rule: Record<ModerationRule, string>;
  suspicion: Record<'suspected' | 'imminent_danger', string>;
  basis: { automated: string; report: string };
  noAction: string;
  outcome: Record<'reversed_subject' | 'reversed_reporter' | 'upheld', string>;
}

const LABELS: Record<Locale, Labels> = {
  de: {
    locale: 'de-DE',
    measure: {
      no_action: { listing: 'keine Maßnahme', message: 'keine Maßnahme', user: 'keine Maßnahme' },
      remove: { listing: 'Anzeige entfernt', message: 'Nachricht entfernt', user: 'Profilinhalt entfernt' },
      warn: { listing: 'Verwarnung', message: 'Verwarnung', user: 'Verwarnung' },
      ban: { listing: 'Konto dauerhaft gesperrt', message: 'Konto dauerhaft gesperrt', user: 'Konto dauerhaft gesperrt' },
    },
    target: { listing: 'einer Anzeige', message: 'einer Chatnachricht', user: 'einem Profil' },
    rule: {
      community_prohibited_items: 'Community-Regeln, Abschnitt „Verbotene Artikel und Inhalte“',
      community_fair_communication: 'Community-Regeln, Abschnitt „Fair kommunizieren“',
      community_safe_handover: 'Community-Regeln, Abschnitt „Sicher übergeben“',
      terms_private_only: 'Nutzungsbedingungen, Abschnitt 3 „Nur private Angebote“',
      terms_member_duties: 'Nutzungsbedingungen, Abschnitt 5 „Pflichten der Mitglieder“',
      terms_content_rights: 'Nutzungsbedingungen, Abschnitt 6 „Rechte an Inhalten“',
      illegal_content: 'Rechtswidriger Inhalt (Verstoß gegen geltendes Recht)',
    },
    suspicion: {
      suspected: 'Verdacht auf Straftat',
      imminent_danger: 'Verdacht auf Straftat – Gefahr für Leben oder Sicherheit',
    },
    basis: { automated: 'Hinweis der automatischen Inhaltsprüfung', report: 'Meldung eines Mitglieds' },
    noAction: 'keine Maßnahme',
    outcome: {
      reversed_subject: 'Widerspruch stattgegeben, die Maßnahme wurde aufgehoben',
      reversed_reporter: 'Widerspruch stattgegeben, der Fall wird neu geprüft',
      upheld: 'Widerspruch zurückgewiesen, die Entscheidung bleibt bestehen',
    },
  },
  en: {
    locale: 'en-GB',
    measure: {
      no_action: { listing: 'no action', message: 'no action', user: 'no action' },
      remove: { listing: 'listing removed', message: 'message removed', user: 'profile content removed' },
      warn: { listing: 'warning', message: 'warning', user: 'warning' },
      ban: { listing: 'account permanently suspended', message: 'account permanently suspended', user: 'account permanently suspended' },
    },
    target: { listing: 'a listing', message: 'a chat message', user: 'a profile' },
    rule: {
      community_prohibited_items: 'Community rules, section “Prohibited items and content”',
      community_fair_communication: 'Community rules, section “Communicate fairly”',
      community_safe_handover: 'Community rules, section “Hand over safely”',
      terms_private_only: 'Terms of use, section 3 “Private offers only”',
      terms_member_duties: 'Terms of use, section 5 “Members’ obligations”',
      terms_content_rights: 'Terms of use, section 6 “Rights to content”',
      illegal_content: 'Illegal content (violation of applicable law)',
    },
    suspicion: {
      suspected: 'Suspected criminal offence',
      imminent_danger: 'Suspected criminal offence – threat to life or safety',
    },
    basis: { automated: 'notice from the automatic content check', report: 'report by a member' },
    noAction: 'no action',
    outcome: {
      reversed_subject: 'appeal granted, the measure has been lifted',
      reversed_reporter: 'appeal granted, the case will be reviewed again',
      upheld: 'appeal rejected, the decision stands',
    },
  },
};

const formatDate = (iso: string, l: Labels) =>
  new Date(iso).toLocaleDateString(l.locale, { timeZone: 'Europe/Berlin', day: '2-digit', month: '2-digit', year: 'numeric' });

/** Codes in Texte der Empfängersprache übersetzen; vorhandene Texte gehen vor. */
function resolveParams(p: Params, locale: Locale): Params {
  const l = LABELS[locale];
  const decision = p.decision as ModerationDecisionType | undefined;
  const targetType = p.targetType as ReportTargetType | undefined;
  const measure = p.measure ?? (decision && targetType ? l.measure[decision][targetType] : undefined);
  const quoted = p.title ? (locale === 'en' ? ` (“${p.title}”)` : ` („${p.title}“)`) : '';
  const out: Params = { ...p };
  if (measure) out.measure = measure;
  if (!p.target && targetType) out.target = l.target[targetType] + quoted;
  if (!p.targetPlain && targetType) out.targetPlain = l.target[targetType];
  if (!p.rule && p.ruleRef) out.rule = l.rule[p.ruleRef as ModerationRule];
  if (!p.basis && p.automated) out.basis = p.automated === 'true' ? l.basis.automated : l.basis.report;
  if (!p.result && decision) out.result = decision === 'no_action' ? l.noAction : (measure ?? '');
  if (!p.outcome && p.outcomeCode) out.outcome = l.outcome[p.outcomeCode as keyof Labels['outcome']];
  if (!p.label && p.level) out.label = l.suspicion[p.level as keyof Labels['suspicion']];
  if (!p.date && p.dateIso) out.date = formatDate(p.dateIso, l);
  if (!p.deadline && p.deadlineIso) out.deadline = formatDate(p.deadlineIso, l);
  return out;
}

// ------------------------------------------------------------------ Vorlagen

const DE: Record<EmailTemplate, (p: Params) => Rendered> = {
  verify: (p) => ({
    subject: 'Bitte bestätige deine E-Mail-Adresse',
    paragraphs: [
      `Hallo ${p.name},`,
      'willkommen beim CampusMarkt der HWG LU! Bitte bestätige deine Hochschuladresse. Der Link ist 24 Stunden gültig.',
      'Falls du dich nicht registriert hast, kannst du diese E-Mail ignorieren.',
    ],
    action: { label: 'E-Mail-Adresse bestätigen', url: p.link! },
  }),
  account_exists: (p) => ({
    subject: 'Du hast bereits ein Konto',
    paragraphs: [
      `Hallo ${p.name},`,
      'jemand hat versucht, mit deiner Adresse ein neues Konto anzulegen. Du hast bereits ein Konto.',
      `Passwort vergessen? Du kannst es hier zurücksetzen: ${p.resetLink}`,
    ],
    action: { label: 'Zur Anmeldung', url: p.loginLink! },
  }),
  password_reset: (p) => ({
    subject: 'Passwort zurücksetzen',
    paragraphs: [
      `Hallo ${p.name},`,
      'über den folgenden Link kannst du ein neues Passwort setzen. Der Link ist 1 Stunde gültig und nur einmal verwendbar.',
      'Falls du das nicht angefordert hast, ignoriere diese E-Mail. Dein Passwort bleibt unverändert.',
    ],
    action: { label: 'Neues Passwort setzen', url: p.link! },
  }),
  new_message: (p) => ({
    subject: `Neue Nachricht zu „${p.listingTitle}“`,
    paragraphs: [
      `Hallo ${p.name},`,
      `du hast ungelesene Nachrichten zu „${p.listingTitle}“. Aus Datenschutzgründen steht der Inhalt nicht in dieser E-Mail.`,
    ],
    action: { label: 'Nachrichten lesen', url: p.link! },
  }),
  listing_expiry: (p) => ({
    subject: `Deine Anzeige „${p.listingTitle}“ läuft bald ab`,
    paragraphs: [
      `Hallo ${p.name},`,
      `deine Anzeige „${p.listingTitle}“ läuft am ${p.date} ab. Mit einem Klick kannst du sie um 60 Tage verlängern.`,
    ],
    action: { label: 'Anzeige verlängern', url: p.link! },
  }),
  // Begründung an Betroffene nach DSA Art. 17 Abs. 3 (REQ-LEGAL-006), Vorlage in docs/06-recht/dsa-prozesse.md
  moderation_decision: (p) => ({
    subject: `Entscheidung der Moderation: ${p.measure}`,
    paragraphs: [
      `Hallo ${p.name},`,
      `Maßnahme: ${p.measure} (${p.target}).`,
      `Begründung: ${p.facts}`,
      ...(p.rule ? [`Verletzte Regel: ${p.rule}`] : []),
      ...(p.legalGround ? [`Rechtsgrundlage: ${p.legalGround}`] : []),
      `Grundlage: ${p.basis}. Geprüft und entschieden hat ein Mensch aus der Moderation.`,
      ...(p.appealLink
        ? [
            `Deine Möglichkeiten: Du kannst bis zum ${p.deadline} kostenlos Widerspruch einlegen (DSA Art. 20); eine andere Person aus der Moderation prüft den Fall dann erneut. Außerdem stehen dir eine außergerichtliche Streitbeilegungsstelle nach DSA Art. 21 (Schlichtungsstelle Digitale Dienste e. V., fiktiv) und der Rechtsweg offen.`,
          ]
        : []),
    ],
    action: p.appealLink ? { label: 'Widerspruch einlegen', url: p.appealLink } : undefined,
  }),
  // Mitteilung an Meldende nach DSA Art. 16 Abs. 5; ohne Angaben zur betroffenen Person
  moderation_report_result: (p) => ({
    subject: 'Ergebnis deiner Meldung',
    paragraphs: [
      `Hallo ${p.name},`,
      `wir haben deine Meldung zu ${p.targetPlain ?? p.target} geprüft. Ergebnis: ${p.result}.`,
      ...(p.facts ? [`Begründung: ${p.facts}`] : []),
      ...(p.rule ? [`Regel: ${p.rule}`] : []),
      ...(p.appealLink
        ? [`Wenn du mit dem Ergebnis nicht einverstanden bist, kannst du bis zum ${p.deadline} kostenlos Widerspruch einlegen (DSA Art. 20).`]
        : []),
      'Außerdem stehen dir eine außergerichtliche Streitbeilegungsstelle nach DSA Art. 21 (Schlichtungsstelle Digitale Dienste e. V., fiktiv) und der Rechtsweg offen. Danke, dass du hilfst, CampusMarkt sicher zu halten.',
    ],
    action: p.appealLink ? { label: 'Mitteilung ansehen', url: p.appealLink } : undefined,
  }),
  // REQ-MOD-004, RV-R-04: automatisch vorläufig ausgeblendet, noch keine Entscheidung
  provisional_hide: (p) => ({
    subject: 'Deine Anzeige ist vorläufig ausgeblendet',
    paragraphs: [
      `Hallo ${p.name},`,
      `${p.target} wurde von mehreren Mitgliedern gemeldet und deshalb automatisch vorläufig ausgeblendet. Das ist noch keine Entscheidung.`,
      'Eine Person aus der Moderation prüft den Fall. Über das Ergebnis informieren wir dich mit Begründung; dann kannst du auch Widerspruch einlegen.',
    ],
    action: p.link ? { label: 'Mitteilung ansehen', url: p.link } : undefined,
  }),
  appeal_result: (p) => ({
    subject: 'Ergebnis des Widerspruchs',
    paragraphs: [
      `Hallo ${p.name},`,
      `eine andere Person aus der Moderation hat den Widerspruch zu ${p.targetPlain ?? p.target} geprüft. Ergebnis: ${p.outcome}.`,
      `Begründung: ${p.reason}`,
      'Gegen diese Entscheidung stehen dir eine außergerichtliche Streitbeilegungsstelle nach DSA Art. 21 (Schlichtungsstelle Digitale Dienste e. V., fiktiv) und der Rechtsweg offen.',
    ],
    action: p.link ? { label: 'Mitteilung ansehen', url: p.link } : undefined,
  }),
  // Eskalation nach DSA Art. 18 (REQ-LEGAL-008): keine Inhalte in der Mail, nur der Verweis auf den Fall
  criminal_suspicion_alert: (p) => ({
    subject: `${p.urgent === 'true' ? 'DRINGEND – ' : ''}Verdacht auf Straftat gekennzeichnet`,
    paragraphs: [
      `Hallo ${p.name},`,
      `eine Moderationsentscheidung (Fall ${p.caseId}) wurde als „${p.label}“ gekennzeichnet. Die Inhalte sind gesichert.`,
      p.urgent === 'true'
        ? 'Gefahr für Leben oder Sicherheit: Bitte informiere unverzüglich die zuständige Stelle (Polizeipräsidium Rheinpfalz bzw. Zentrale Meldestelle für strafbare Inhalte im Internet beim BKA – Übungsannahme) nach dem Prozess in docs/06-recht/dsa-prozesse.md.'
        : 'Bitte prüfe den Fall mit dem Justiziariat der Hochschule (fiktiv: justiziariat@hwg-lu.example) nach dem Prozess in docs/06-recht/dsa-prozesse.md.',
    ],
    action: { label: 'Zur Administration', url: p.link! },
  }),
  deletion_scheduled: (p) => ({
    subject: 'Dein Konto wird gelöscht',
    paragraphs: [
      `Hallo ${p.name},`,
      `du hast die Löschung deines Kontos beantragt. Am ${p.date} werden dein Konto und deine Daten endgültig gelöscht.`,
      'Wenn du es dir anders überlegst, melde dich einfach bis dahin wieder an. Dann wird die Löschung abgebrochen.',
    ],
    action: { label: 'Löschung abbrechen (anmelden)', url: p.loginLink! },
  }),
  deletion_completed: (p) => ({
    subject: 'Dein Konto wurde gelöscht',
    paragraphs: [`Hallo ${p.name},`, 'dein CampusMarkt-Konto und die zugehörigen Daten wurden endgültig gelöscht.'],
  }),
};

const EN: Record<EmailTemplate, (p: Params) => Rendered> = {
  verify: (p) => ({
    subject: 'Please confirm your email address',
    paragraphs: [
      `Hi ${p.name},`,
      'welcome to CampusMarkt at HWG LU! Please confirm your university address. The link is valid for 24 hours.',
      'If you did not sign up, you can ignore this email.',
    ],
    action: { label: 'Confirm email address', url: p.link! },
  }),
  account_exists: (p) => ({
    subject: 'You already have an account',
    paragraphs: [
      `Hi ${p.name},`,
      'someone tried to create a new account with your address. You already have an account.',
      `Forgot your password? You can reset it here: ${p.resetLink}`,
    ],
    action: { label: 'Go to login', url: p.loginLink! },
  }),
  password_reset: (p) => ({
    subject: 'Reset your password',
    paragraphs: [
      `Hi ${p.name},`,
      'you can set a new password using the following link. The link is valid for 1 hour and can only be used once.',
      'If you did not request this, please ignore this email. Your password remains unchanged.',
    ],
    action: { label: 'Set a new password', url: p.link! },
  }),
  new_message: (p) => ({
    subject: `New message about “${p.listingTitle}”`,
    paragraphs: [
      `Hi ${p.name},`,
      `you have unread messages about “${p.listingTitle}”. For privacy reasons, the content is not included in this email.`,
    ],
    action: { label: 'Read messages', url: p.link! },
  }),
  listing_expiry: (p) => ({
    subject: `Your listing “${p.listingTitle}” expires soon`,
    paragraphs: [
      `Hi ${p.name},`,
      `your listing “${p.listingTitle}” expires on ${p.date}. You can extend it by 60 days with one click.`,
    ],
    action: { label: 'Extend listing', url: p.link! },
  }),
  moderation_decision: (p) => ({
    subject: `Moderation decision: ${p.measure}`,
    paragraphs: [
      `Hi ${p.name},`,
      `Measure: ${p.measure} (${p.target}).`,
      `Reasons: ${p.facts}`,
      ...(p.rule ? [`Rule violated: ${p.rule}`] : []),
      ...(p.legalGround ? [`Legal ground: ${p.legalGround}`] : []),
      `Basis: ${p.basis}. The case was reviewed and decided by a human moderator.`,
      ...(p.appealLink
        ? [
            `Your options: you can appeal free of charge until ${p.deadline} (DSA Art. 20); another moderator will then review the case again. You can also turn to an out-of-court dispute settlement body under DSA Art. 21 (Schlichtungsstelle Digitale Dienste e. V., fictitious) or the courts.`,
          ]
        : []),
    ],
    action: p.appealLink ? { label: 'File an appeal', url: p.appealLink } : undefined,
  }),
  moderation_report_result: (p) => ({
    subject: 'Result of your report',
    paragraphs: [
      `Hi ${p.name},`,
      `we have reviewed your report about ${p.targetPlain ?? p.target}. Result: ${p.result}.`,
      ...(p.facts ? [`Reasons: ${p.facts}`] : []),
      ...(p.rule ? [`Rule: ${p.rule}`] : []),
      ...(p.appealLink
        ? [`If you disagree with the result, you can appeal free of charge until ${p.deadline} (DSA Art. 20).`]
        : []),
      'You can also turn to an out-of-court dispute settlement body under DSA Art. 21 (Schlichtungsstelle Digitale Dienste e. V., fictitious) or the courts. Thank you for helping to keep CampusMarkt safe.',
    ],
    action: p.appealLink ? { label: 'View notice', url: p.appealLink } : undefined,
  }),
  provisional_hide: (p) => ({
    subject: 'Your listing is temporarily hidden',
    paragraphs: [
      `Hi ${p.name},`,
      `${p.target} was reported by several members and has therefore been hidden automatically for the time being. This is not a decision yet.`,
      'A moderator is reviewing the case. We will inform you of the result with reasons; you can then also file an appeal.',
    ],
    action: p.link ? { label: 'View notice', url: p.link } : undefined,
  }),
  appeal_result: (p) => ({
    subject: 'Result of the appeal',
    paragraphs: [
      `Hi ${p.name},`,
      `another moderator has reviewed the appeal about ${p.targetPlain ?? p.target}. Result: ${p.outcome}.`,
      `Reasons: ${p.reason}`,
      'You can turn to an out-of-court dispute settlement body under DSA Art. 21 (Schlichtungsstelle Digitale Dienste e. V., fictitious) or the courts against this decision.',
    ],
    action: p.link ? { label: 'View notice', url: p.link } : undefined,
  }),
  criminal_suspicion_alert: (p) => ({
    subject: `${p.urgent === 'true' ? 'URGENT – ' : ''}Suspected criminal offence flagged`,
    paragraphs: [
      `Hi ${p.name},`,
      `a moderation decision (case ${p.caseId}) was flagged as “${p.label}”. The content has been preserved.`,
      p.urgent === 'true'
        ? 'Threat to life or safety: please inform the competent authority (Polizeipräsidium Rheinpfalz or the BKA reporting office for criminal content online – exercise assumption) without delay, following the process in docs/06-recht/dsa-prozesse.md.'
        : 'Please review the case with the legal office of the university (fictitious: justiziariat@hwg-lu.example) following the process in docs/06-recht/dsa-prozesse.md.',
    ],
    action: { label: 'Go to administration', url: p.link! },
  }),
  deletion_scheduled: (p) => ({
    subject: 'Your account will be deleted',
    paragraphs: [
      `Hi ${p.name},`,
      `you have requested the deletion of your account. On ${p.date}, your account and your data will be permanently deleted.`,
      'If you change your mind, simply log in again before then. The deletion will then be cancelled.',
    ],
    action: { label: 'Cancel deletion (log in)', url: p.loginLink! },
  }),
  deletion_completed: (p) => ({
    subject: 'Your account has been deleted',
    paragraphs: [`Hi ${p.name},`, 'your CampusMarkt account and the associated data have been permanently deleted.'],
  }),
};

interface FooterTexts {
  sender: string;
  imprint: string;
  privacy: string;
  contact: string;
  unsubscribe: string;
  demo: string;
  copyLink: string;
}

const FOOTER_DE: FooterTexts = {
  sender: 'CampusMarkt HWG LU – ein Angebot der Hochschule für Wirtschaft und Gesellschaft Ludwigshafen (fiktive Übungsangaben)',
  imprint: 'Impressum',
  privacy: 'Datenschutz',
  contact: 'Kontakt',
  unsubscribe: 'Diese Benachrichtigungen abbestellen',
  demo: 'Demo-Version im Rahmen einer Übungsaufgabe, kein Echtbetrieb.',
  copyLink: 'Oder kopiere diesen Link:',
};

const FOOTER_EN: FooterTexts = {
  sender: 'CampusMarkt HWG LU – a service of the University of Economics and Society Ludwigshafen (fictitious exercise data)',
  imprint: 'Legal notice',
  privacy: 'Privacy',
  contact: 'Contact',
  unsubscribe: 'Unsubscribe from these notifications',
  demo: 'Demo version created as a course exercise, not a live service.',
  copyLink: 'Or copy this link:',
};

/** Texte je Sprache (ADR-0016). */
export const TEXTS: Record<Locale, { templates: Partial<Record<EmailTemplate, (p: Params) => Rendered>>; footer: FooterTexts }> = {
  de: { templates: DE, footer: FOOTER_DE },
  en: { templates: EN, footer: FOOTER_EN },
};

export interface RenderContext {
  publicUrl: string;
  locale?: Locale;
  /** Signierter Abmeldelink, nur bei abbestellbaren Kategorien. */
  unsubscribeUrl?: string;
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function renderEmail(template: EmailTemplate, params: Params, context: RenderContext) {
  const locale = context.locale ?? 'de';
  const texts = TEXTS[locale];
  const r = (texts.templates[template] ?? DE[template])(resolveParams(params, locale));
  const f = texts.footer;
  // Rechtliche Links in jeder Mail (REQ-UX-006, DDG § 5)
  const links = [
    { label: f.imprint, url: `${context.publicUrl}/impressum` },
    { label: f.privacy, url: `${context.publicUrl}/datenschutz` },
    { label: f.contact, url: `${context.publicUrl}/kontakt` },
  ];
  const footerText = [
    f.sender,
    links.map((l) => `${l.label}: ${l.url}`).join(' · '),
    ...(context.unsubscribeUrl ? [`${f.unsubscribe}: ${context.unsubscribeUrl}`] : []),
    f.demo,
  ];
  const text = [...r.paragraphs, r.action ? `${r.action.label}: ${r.action.url}` : '', '', '--', ...footerText]
    .filter((l, i, all) => l !== '' || all[i - 1] !== '')
    .join('\n\n');
  const linkHtml = (l: { label: string; url: string }) =>
    `<a href="${escapeHtml(l.url)}" style="color:#4b5563">${escapeHtml(l.label)}</a>`;
  const html = `<!doctype html><html lang="${locale}"><body style="font-family:system-ui,sans-serif;color:#1f2937;max-width:560px;margin:auto;padding:24px">
<h1 style="font-size:20px;color:#0b4884">CampusMarkt HWG LU</h1>
${r.paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('\n')}
${r.action ? `<p><a href="${escapeHtml(r.action.url)}" style="display:inline-block;background:#0b4884;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">${escapeHtml(r.action.label)}</a></p><p style="font-size:12px;color:#6b7280">${escapeHtml(f.copyLink)} ${escapeHtml(r.action.url)}</p>` : ''}
<hr><p style="font-size:12px;color:#4b5563">${escapeHtml(f.sender)}<br>${links.map(linkHtml).join(' · ')}${
    context.unsubscribeUrl ? `<br>${linkHtml({ label: f.unsubscribe, url: context.unsubscribeUrl })}` : ''
  }<br>${escapeHtml(f.demo)}</p></body></html>`;
  return { subject: r.subject, text, html };
}
