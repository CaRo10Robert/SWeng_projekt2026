import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { mockApi, renderApp } from '../test/render';
import { NotFound, RouteError } from './Layout';
import { ApiError, NetworkError } from '../api/client';
import { t } from '../i18n';

const routeError = (error: unknown, reset = () => undefined) => (
  <RouteError error={error as Error} reset={reset} info={undefined as never} />
);

describe('Fehlerseiten (REQ-UX-003)', () => {
  it('404: Titel, Hilfe- und Kontaktlinks', async () => {
    mockApi({ 'GET /me': { status: 401, body: { code: 'unauthenticated' } } });
    renderApp(<NotFound />);
    expect(await screen.findByRole('heading', { level: 1, name: t('notFound.title') })).toBeTruthy();
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(expect.arrayContaining(['/hilfe', '/kontakt']));
  });

  it('Serverfehler: Request-ID zum Melden, „Erneut versuchen“ ruft reset', async () => {
    const reset = vi.fn();
    renderApp(routeError(new ApiError(500, 'internal', 'Interner Fehler', [], 'req-1234'), reset));
    expect(await screen.findByText('req-1234')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: t('common.retry') }));
    expect(reset).toHaveBeenCalledOnce();
  });

  it('Wartung: eigener Hinweis mit Rückkehrzeit statt Fehlermeldung', async () => {
    renderApp(routeError(new ApiError(503, 'maintenance', 'Wartung', [], undefined, 600)));
    expect(await screen.findByRole('heading', { name: t('error.maintenanceTitle') })).toBeTruthy();
    expect(screen.getByText(t('error.maintenanceBackIn', { minutes: 10 }))).toBeTruthy();
  });

  it('offline: Hinweis ohne technische Details', async () => {
    renderApp(routeError(new NetworkError()));
    expect(await screen.findByRole('heading', { name: t('error.offlineTitle') })).toBeTruthy();
  });
});
