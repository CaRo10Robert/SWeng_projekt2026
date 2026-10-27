import { describe, expect, it } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import type { ConversationSummary } from '@campusmarkt/contracts';
import { mockApi, renderApp } from '../test/render';
import { ContactShare } from './ContactShare';
import { t } from '../i18n';

const base = {
  id: '00000000-0000-4000-8000-0000000000c1',
  role: 'buyer',
  listing: { id: '00000000-0000-4000-8000-0000000000a1', title: 'Fahrrad', status: 'active', thumbnailUrl: null },
  counterpart: { id: '00000000-0000-4000-8000-0000000000b1', displayName: 'Ben' },
  lastMessage: null,
  unreadCount: 0,
  deal: null,
  blocked: false,
  contact: { mine: 'none', theirs: 'none', counterpartEmail: null, canGrant: true, retryAfter: null, requestsLeft: 3 },
} as unknown as ConversationSummary;
const conv = (contact: Partial<ConversationSummary['contact']>, extra: Partial<ConversationSummary> = {}) =>
  ({ ...base, ...extra, contact: { ...base.contact, ...contact } }) as ConversationSummary;
const contactPath = `/conversations/${base.id}/contact`;

describe('Kontaktfreigabe (REQ-CHAT-010)', () => {
  it('Ausgangszustand: Hinweis und „teilen“; Bestätigung im Dialog sendet grant', async () => {
    const calls = mockApi({ [`POST ${contactPath}`]: { body: { ...base.contact, mine: 'granted' } } });
    renderApp(<ContactShare conversation={conv({})} />);
    fireEvent.click(await screen.findByRole('button', { name: t('contact.share') }));
    fireEvent.click(await screen.findByRole('button', { name: t('contact.shareShort') }));
    await waitFor(() => expect(calls).toContainEqual({ method: 'POST', path: contactPath, body: { action: 'grant' } }));
  });

  it('offene Anfrage des Gegenübers: zustimmen und ablehnen', async () => {
    renderApp(<ContactShare conversation={conv({ theirs: 'granted' })} />);
    expect(await screen.findByText(t('contact.theyAsk', { name: 'Ben' }))).toBeTruthy();
    expect(screen.getByRole('button', { name: t('contact.agree') })).toBeTruthy();
    expect(screen.getByRole('button', { name: t('contact.decline') })).toBeTruthy();
  });

  it('ausgetauscht: Adresse als mailto-Link und Widerruf', async () => {
    renderApp(<ContactShare conversation={conv({ mine: 'granted', theirs: 'granted', counterpartEmail: 'ben@studmail.hwg-lu.de' })} />);
    const link = await screen.findByRole('link', { name: 'ben@studmail.hwg-lu.de' });
    expect(link.getAttribute('href')).toBe('mailto:ben@studmail.hwg-lu.de');
    expect(screen.getByRole('button', { name: t('contact.revoke') })).toBeTruthy();
  });

  it('nach eigenem Widerruf mit Sperrfrist: kein Zustimmen-Knopf, Hinweis auf erneute Anfrage', async () => {
    renderApp(
      <ContactShare
        conversation={conv({ mine: 'withdrawn', theirs: 'granted', canGrant: false, retryAfter: '2026-10-27T10:00:00.000Z', requestsLeft: 2 })}
      />,
    );
    await screen.findByText(t('contact.theyAsk', { name: 'Ben' }));
    expect(screen.queryByRole('button', { name: t('contact.agree') })).toBeNull();
    expect(screen.getByText(/27\.10\.2026|2026/)).toBeTruthy();
  });

  it('Kontakt nicht möglich (Gegenüber gesperrt): keine Aktion', async () => {
    renderApp(<ContactShare conversation={conv({ canGrant: false })} />);
    expect(await screen.findByText(t('apiError.contact_not_possible'))).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('blockiert: Bereich wird nicht angezeigt', async () => {
    renderApp(<ContactShare conversation={conv({}, { blocked: true })} />);
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByText(t('contact.title'))).toBeNull();
  });

  it('Fehler 409 zeigt eine verständliche Meldung', async () => {
    mockApi({ [`POST ${contactPath}`]: { status: 409, body: { code: 'invalid_contact_action', detail: 'x' } } });
    renderApp(<ContactShare conversation={conv({ theirs: 'granted' })} />);
    fireEvent.click(await screen.findByRole('button', { name: t('contact.decline') }));
    expect(await screen.findByText(t('contact.invalidAction'))).toBeTruthy();
  });
});
