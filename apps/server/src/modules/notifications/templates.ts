/**
 * E-Mail-Templates (deutsch). Chat-Benachrichtigungen enthalten nie den Nachrichteninhalt (REQ-NOTI-002).
 * `category` steuert die Abbestellbarkeit; `security` ist nicht abbestellbar (REQ-NOTI-003).
 */
export type EmailTemplate =
  | 'verify'
  | 'account_exists'
  | 'password_reset'
  | 'new_message'
  | 'listing_expiry'
  | 'moderation_decision'
  | 'deletion_scheduled'
  | 'deletion_completed';

type Params = Record<string, string>;

interface Rendered {
  subject: string;
  paragraphs: string[];
  action?: { label: string; url: string };
}

export const templateCategory: Record<EmailTemplate, 'security' | 'newMessage' | 'listingExpiry' | 'service'> = {
  verify: 'security',
  account_exists: 'security',
  password_reset: 'security',
  new_message: 'newMessage',
  listing_expiry: 'listingExpiry',
  moderation_decision: 'service',
  deletion_scheduled: 'security',
  deletion_completed: 'security',
};

const templates: Record<EmailTemplate, (p: Params) => Rendered> = {
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
  moderation_decision: (p) => ({
    subject: 'Entscheidung zu einer Meldung',
    paragraphs: [
      `Hallo ${p.name},`,
      `wir haben eine Meldung zu ${p.target} geprüft. Entscheidung: ${p.decision}.`,
      `Begründung: ${p.reason}`,
      'Wenn du mit der Entscheidung nicht einverstanden bist, antworte bitte auf diese E-Mail (DSA Art. 20).',
    ],
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

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function renderEmail(template: EmailTemplate, params: Params) {
  const r = templates[template](params);
  const footer = 'CampusMarkt HWG LU – Demo-Version, kein Echtbetrieb.';
  const text = [...r.paragraphs, r.action ? `${r.action.label}: ${r.action.url}` : '', '', '--', footer]
    .filter((l, i, all) => l !== '' || all[i - 1] !== '')
    .join('\n\n');
  const html = `<!doctype html><html lang="de"><body style="font-family:system-ui,sans-serif;color:#1f2937;max-width:560px;margin:auto;padding:24px">
<h1 style="font-size:20px;color:#0b4884">CampusMarkt HWG LU</h1>
${r.paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('\n')}
${r.action ? `<p><a href="${escapeHtml(r.action.url)}" style="display:inline-block;background:#0b4884;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">${escapeHtml(r.action.label)}</a></p><p style="font-size:12px;color:#6b7280">Oder kopiere diesen Link: ${escapeHtml(r.action.url)}</p>` : ''}
<hr><p style="font-size:12px;color:#6b7280">${footer}</p></body></html>`;
  return { subject: r.subject, text, html };
}
