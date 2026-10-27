import { describe, expect, it } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { mockApi, renderApp } from '../test/render';
import { TermsDialog } from './SiteNotices';
import { t } from '../i18n';

const me = {
  id: '00000000-0000-4000-8000-0000000000b1',
  email: 'tim@studmail.hwg-lu.de',
  displayName: 'Tim',
  userType: 'student',
  role: 'member',
  studyProgram: null,
  preferredLocationIds: [],
  notificationPrefs: { newMessage: true, listingExpiry: true },
  locale: 'de',
  termsRequired: true,
  termsAcceptedVersion: '2026-01',
  privacyNoticeVersion: null,
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('Erneute Zustimmung (REQ-LEGAL-003)', () => {
  it('zeigt den Dialog mit Links zu Nutzungsbedingungen und Datenschutz und sendet die aktuelle Version', async () => {
    const calls = mockApi({
      'GET /me': { body: me },
      'GET /meta': { body: { termsVersion: '2026-10-25', categories: [], locations: [], allowedDomains: [] } },
      'POST /me/terms': { body: { ...me, termsRequired: false } },
    });
    renderApp(<TermsDialog />);
    expect(await screen.findByText(t('terms.changedSince', { version: '2026-10-25', previous: '2026-01' }))).toBeTruthy();
    const hrefs = screen.getAllByRole('link', { hidden: true }).map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(expect.arrayContaining(['/nutzungsbedingungen', '/datenschutz']));
    fireEvent.click(screen.getByRole('button', { name: t('terms.accept'), hidden: true }));
    await waitFor(() => expect(calls).toContainEqual({ method: 'POST', path: '/me/terms', body: { version: '2026-10-25' } }));
  });

  it('kein Dialog, wenn die Zustimmung aktuell ist', async () => {
    mockApi({ 'GET /me': { body: { ...me, termsRequired: false } }, 'GET /meta': { body: { termsVersion: '2026-10-25' } } });
    renderApp(<TermsDialog />);
    await new Promise((r) => setTimeout(r, 100));
    expect(screen.queryByRole('button', { name: t('terms.accept'), hidden: true })).toBeNull();
  });
});
