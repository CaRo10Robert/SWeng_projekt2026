import { describe, expect, it } from 'vitest';
import { unsubscribeToken, verifyUnsubscribeToken } from './domain.js';
import { renderEmail, templateCategory, UNSUBSCRIBABLE, type EmailTemplate } from './templates.js';

const PARAMS: Record<string, string> = {
  name: 'Lea',
  link: 'http://localhost:8080/x?token=abc',
  loginLink: 'http://localhost:8080/login',
  resetLink: 'http://localhost:8080/forgot-password',
  listingTitle: 'Statistik-Buch',
  date: '24.10.2026',
  measure: 'Anzeige entfernt',
  target: 'einer Anzeige',
  facts: 'Die Anzeige bietet Prüfungslösungen an.',
  rule: 'Community-Regeln, Abschnitt „Verbotene Artikel und Inhalte“',
  basis: 'Meldung eines Mitglieds',
  deadline: '24.04.2027',
  appealLink: 'http://localhost:8080/me/notices',
  result: 'keine Maßnahme',
  outcome: 'Widerspruch zurückgewiesen',
  reason: 'Die Entscheidung entspricht den Regeln.',
  caseId: '00000000-0000-4000-8000-000000000001',
  label: 'Verdacht auf Straftat',
  urgent: 'false',
};

const ALL = Object.keys(templateCategory) as EmailTemplate[];

describe('[AT-UX-006-2] Jede E-Mail-Vorlage trägt Absender, Impressum und Datenschutz (REQ-UX-006)', () => {
  it.each(ALL)('%s', (template) => {
    const mail = renderEmail(template, PARAMS, { publicUrl: 'http://localhost:8080' });
    for (const part of [mail.text, mail.html]) {
      expect(part).toContain('Hochschule für Wirtschaft und Gesellschaft Ludwigshafen');
      expect(part).toContain('http://localhost:8080/impressum');
      expect(part).toContain('http://localhost:8080/datenschutz');
    }
    expect(mail.text).not.toContain('undefined');
  });

  it('Abmeldelink nur, wenn er übergeben wird (abbestellbare Kategorien)', () => {
    const url = 'http://localhost:8080/api/v1/notifications/unsubscribe?token=t';
    expect(renderEmail('new_message', PARAMS, { publicUrl: 'http://localhost:8080', unsubscribeUrl: url }).text).toContain(url);
    expect([...UNSUBSCRIBABLE].sort()).toEqual(['listingExpiry', 'newMessage']);
    expect(templateCategory.verify).toBe('security');
    expect(templateCategory.moderation_decision).toBe('service');
  });

  it('Begründung nach DSA Art. 17 enthält Maßnahme, Tatsachen, Regel, Grundlage und Rechtsbehelf', () => {
    const { text } = renderEmail('moderation_decision', PARAMS, { publicUrl: 'http://localhost:8080' });
    for (const part of ['Anzeige entfernt', PARAMS.facts!, PARAMS.rule!, 'Meldung eines Mitglieds', 'Widerspruch', '24.04.2027', 'DSA Art. 21']) {
      expect(text).toContain(part);
    }
  });

});

describe('E-Mails in der Sprache des Kontos (REQ-UX-007, ADR-0016)', () => {
  // Aufrufer übergeben Codes; die Vorlage setzt Texte und Datumsformat der Empfängersprache ein
  const CODES: Record<string, string> = {
    name: 'Lea',
    link: 'http://localhost:8080/x',
    loginLink: 'http://localhost:8080/login',
    resetLink: 'http://localhost:8080/forgot-password',
    listingTitle: 'Statistics book',
    dateIso: '2026-10-24T10:00:00.000Z',
    decision: 'remove',
    targetType: 'listing',
    title: 'Exam solutions',
    facts: 'The listing offers exam solutions.',
    ruleRef: 'community_prohibited_items',
    automated: 'false',
    deadlineIso: '2027-04-24T10:00:00.000Z',
    appealLink: 'http://localhost:8080/me/notices',
    outcomeCode: 'upheld',
    reason: 'The decision complies with the rules.',
    caseId: '00000000-0000-4000-8000-000000000001',
    level: 'suspected',
    urgent: 'false',
  };

  it.each(ALL)('%s ist auf Englisch vollständig, ohne deutsche Reste', (template) => {
    const mail = renderEmail(template, CODES, { publicUrl: 'http://localhost:8080', locale: 'en' });
    expect(mail.html).toContain('<html lang="en">');
    for (const part of [mail.subject, mail.text]) {
      expect(part).not.toMatch(/(Hallo|bitte|Anzeige|Konto|Widerspruch|Begründung|Impressum|Datenschutz)/);
      expect(part).not.toContain('undefined');
    }
    expect(mail.text).toContain('Legal notice');
    expect(mail.text).toContain('University of Economics and Society Ludwigshafen');
  });

  it('Begründung auf Englisch mit Maßnahme, Regel, Grundlage und Frist im englischen Format', () => {
    const { subject, text } = renderEmail('moderation_decision', CODES, { publicUrl: 'http://localhost:8080', locale: 'en' });
    expect(subject).toBe('Moderation decision: listing removed');
    for (const part of ['a listing (“Exam solutions”)', 'Community rules, section “Prohibited items and content”', 'report by a member', '24/04/2027', 'DSA Art. 21']) {
      expect(text).toContain(part);
    }
  });

  it('dieselben Codes ergeben auf Deutsch deutsche Texte', () => {
    const { subject, text } = renderEmail('moderation_decision', CODES, { publicUrl: 'http://localhost:8080', locale: 'de' });
    expect(subject).toBe('Entscheidung der Moderation: Anzeige entfernt');
    for (const part of ['einer Anzeige („Exam solutions“)', 'Meldung eines Mitglieds', '24.04.2027']) expect(text).toContain(part);
  });
});

describe('Signierter Abmeldelink (REQ-NOTI-003, REQ-OPS-010)', () => {
  const userId = '0b5f2c4e-1111-4222-8333-444455556666';
  it('ist gültig für Nutzer und Kategorie und nicht übertragbar', () => {
    const token = unsubscribeToken('geheim', userId, 'newMessage');
    expect(verifyUnsubscribeToken('geheim', token)).toEqual({ userId, category: 'newMessage' });
    expect(verifyUnsubscribeToken('anderes-geheimnis', token)).toBeNull();
    expect(verifyUnsubscribeToken('geheim', token.replace('newMessage', 'listingExpiry'))).toBeNull();
    expect(verifyUnsubscribeToken('geheim', `${userId}.security.x`)).toBeNull();
    expect(verifyUnsubscribeToken('geheim', 'kaputt')).toBeNull();
  });
});
