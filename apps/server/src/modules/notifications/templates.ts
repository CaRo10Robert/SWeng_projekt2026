import type { Locale } from '@campusmarkt/contracts';

/**
 * E-Mail-Templates. Chat-Benachrichtigungen enthalten nie den Nachrichteninhalt (REQ-NOTI-002).
 * `category` steuert die Abbestellbarkeit; `security` und `service` sind nicht abbestellbar (REQ-NOTI-003),
 * `service` sind Pflichtmitteilungen (z. B. Begründungen nach DSA Art. 17) und erreichen auch gesperrte Konten.
 *
 * Sprachen (ADR-0016): Texte liegen je Sprache in `TEXTS`; fehlt eine Übersetzung, gilt Deutsch.
 */
export type EmailTemplate =
  | 'verify'
  | 'account_exists'
  | 'password_reset'
  | 'new_message'
  | 'listing_expiry'
  | 'moderation_decision'
  | 'moderation_report_result'
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
  appeal_result: 'service',
  criminal_suspicion_alert: 'service',
  deletion_scheduled: 'security',
  deletion_completed: 'security',
};

/** Kategorien mit Abmeldelink und List-Unsubscribe-Header (REQ-OPS-010). */
export const UNSUBSCRIBABLE: ReadonlySet<EmailCategory> = new Set(['newMessage', 'listingExpiry']);

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
      `Grundlage: ${p.basis}. Geprüft und entschieden hat ein Mensch aus der Moderation.`,
      ...(p.appealLink
        ? [
            `Deine Möglichkeiten: Du kannst bis zum ${p.deadline} kostenlos Widerspruch einlegen (DSA Art. 20); eine andere Person aus der Moderation prüft den Fall dann erneut. Außerdem stehen dir eine außergerichtliche Streitbeilegungsstelle ([Platzhalter: Stelle nach DSA Art. 21]) und der Rechtsweg offen.`,
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
      `wir haben deine Meldung zu ${p.target} geprüft. Ergebnis: ${p.result}.`,
      ...(p.appealLink
        ? [`Wenn du mit dem Ergebnis nicht einverstanden bist, kannst du bis zum ${p.deadline} Widerspruch einlegen (DSA Art. 20).`]
        : ['Danke, dass du hilfst, CampusMarkt sicher zu halten.']),
    ],
    action: p.appealLink ? { label: 'Mitteilung ansehen', url: p.appealLink } : undefined,
  }),
  appeal_result: (p) => ({
    subject: 'Ergebnis des Widerspruchs',
    paragraphs: [
      `Hallo ${p.name},`,
      `eine andere Person aus der Moderation hat den Widerspruch zu ${p.target} geprüft. Ergebnis: ${p.outcome}.`,
      `Begründung: ${p.reason}`,
      'Gegen diese Entscheidung stehen dir eine außergerichtliche Streitbeilegungsstelle ([Platzhalter: Stelle nach DSA Art. 21]) und der Rechtsweg offen.',
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
        ? 'Gefahr für Leben oder Sicherheit: Bitte informiere unverzüglich die zuständige Stelle ([Platzhalter: zuständige Polizeidienststelle]) nach dem Prozess in docs/06-recht/dsa-prozesse.md.'
        : 'Bitte prüfe den Fall mit [Platzhalter: Justiziariat der Hochschule] nach dem Prozess in docs/06-recht/dsa-prozesse.md.',
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

interface FooterTexts {
  sender: string;
  imprint: string;
  privacy: string;
  contact: string;
  unsubscribe: string;
  demo: string;
}

const FOOTER_DE: FooterTexts = {
  sender: 'CampusMarkt HWG LU – ein Angebot von [Platzhalter: Name der Hochschule]',
  imprint: 'Impressum',
  privacy: 'Datenschutz',
  contact: 'Kontakt',
  unsubscribe: 'Diese Benachrichtigungen abbestellen',
  demo: 'Demo-Version im Rahmen einer Übungsaufgabe, kein Echtbetrieb.',
};

/** Texte je Sprache; der i18n-Fork ergänzt `en` (ADR-0016). */
export const TEXTS: Record<Locale, { templates: Partial<Record<EmailTemplate, (p: Params) => Rendered>>; footer: FooterTexts }> = {
  de: { templates: DE, footer: FOOTER_DE },
  en: { templates: {}, footer: FOOTER_DE },
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
  const r = (texts.templates[template] ?? DE[template])(params);
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
${r.action ? `<p><a href="${escapeHtml(r.action.url)}" style="display:inline-block;background:#0b4884;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">${escapeHtml(r.action.label)}</a></p><p style="font-size:12px;color:#6b7280">Oder kopiere diesen Link: ${escapeHtml(r.action.url)}</p>` : ''}
<hr><p style="font-size:12px;color:#4b5563">${escapeHtml(f.sender)}<br>${links.map(linkHtml).join(' · ')}${
    context.unsubscribeUrl ? `<br>${linkHtml({ label: f.unsubscribe, url: context.unsubscribeUrl })}` : ''
  }<br>${escapeHtml(f.demo)}</p></body></html>`;
  return { subject: r.subject, text, html };
}
