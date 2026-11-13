import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { mockApi, renderApp } from '../test/render';
import { ErrorPage, errorKind, ErrorView, NotFound, OfflineBanner, RouteError, type ErrorKind } from './ErrorPages';
import { ApiError, NetworkError } from '../api/client';
import { t } from '../i18n';

const routeError = (error: unknown, reset = () => undefined) => (
  <RouteError error={error as Error} reset={reset} info={undefined as never} />
);

const guest = () => mockApi({ 'GET /me': { status: 401, body: { code: 'unauthenticated' } } });

describe('Fehlerseiten (REQ-UX-003)', () => {
  it('404: Titel, Hilfe- und Kontaktlinks', async () => {
    guest();
    renderApp(<NotFound />);
    expect(await screen.findByRole('heading', { level: 1, name: t('errorPage.notFound.title') })).toBeTruthy();
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(expect.arrayContaining(['/', '/hilfe', '/kontakt']));
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
    expect(await screen.findByRole('heading', { name: t('errorPage.maintenance.title') })).toBeTruthy();
    expect(screen.getByText(t('error.maintenanceBackIn', { minutes: 10 }))).toBeTruthy();
  });

  it('offline: Hinweis ohne technische Details', async () => {
    renderApp(routeError(new NetworkError()));
    expect(await screen.findByRole('heading', { name: t('errorPage.offline.title') })).toBeTruthy();
  });
});

describe('[AT-UX-009] Fehlerseiten für alle Fehlerarten, einheitlich aufgebaut (REQ-UX-009)', () => {
  // Entscheidungstabelle: Fehler → Fehlerseite
  it.each([
    ['Netzwerkfehler', new NetworkError(), true, 'offline'],
    ['beliebiger Fehler ohne Verbindung', new TypeError('Failed to fetch'), false, 'offline'],
    ['503 Wartung', new ApiError(503, 'maintenance', undefined), true, 'maintenance'],
    ['503 sonstiger Grund', new ApiError(503, 'unavailable', undefined), true, 'unexpected'],
    ['429', new ApiError(429, 'rate_limited', undefined), true, 'rateLimited'],
    ['429 auch offline gemeldet', new ApiError(429, 'rate_limited', undefined), false, 'rateLimited'],
    ['404', new ApiError(404, 'not_found', undefined), true, 'notFound'],
    ['403', new ApiError(403, 'forbidden', undefined), true, 'forbidden'],
    ['401', new ApiError(401, 'unauthenticated', undefined), true, 'unauthenticated'],
    ['500', new ApiError(500, 'internal', undefined), true, 'unexpected'],
    ['422 beim Laden', new ApiError(422, 'validation_failed', undefined), true, 'unexpected'],
    ['Renderfehler', new Error('kaputt'), true, 'unexpected'],
  ] as const)('%s → %s', (_name, error, online, kind) => {
    expect(errorKind(error, online)).toBe(kind);
  });

  const cases: [ErrorKind, number | null][] = [
    ['notFound', 404],
    ['listingNotFound', 404],
    ['conversationNotFound', 404],
    ['profileNotFound', 404],
    ['forbidden', 403],
    ['unauthenticated', 401],
    ['rateLimited', 429],
    ['maintenance', 503],
    ['unexpected', 500],
    ['offline', null],
  ];
  it.each(cases)('%s: Fehlercode, Überschrift mit Fokus, Seitentitel, Weg zur Startseite und Hilfe', async (kind, code) => {
    renderApp(<ErrorPage kind={kind} />);
    const heading = await screen.findByRole('heading', { level: 1, name: t(`errorPage.${kind}.title`) });
    await waitFor(() => expect(document.activeElement).toBe(heading));
    expect(document.title).toBe(`${t(`errorPage.${kind}.title`)} – CampusMarkt HWG LU`);
    if (code) expect(screen.getByText(t('errorPage.status', { status: code }))).toBeTruthy();
    else expect(screen.queryByText(/Fehlercode|Error code/)).toBeNull();
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(expect.arrayContaining(['/', '/hilfe', '/kontakt', '/status']));
  });

  it('403 aus der Rollenprüfung: „Kein Zugriff“ ohne „Erneut versuchen“', async () => {
    renderApp(routeError(new ApiError(403, 'forbidden', undefined)));
    expect(await screen.findByRole('heading', { name: t('errorPage.forbidden.title') })).toBeTruthy();
    expect(screen.queryByRole('button', { name: t('common.retry') })).toBeNull();
  });

  it('401: Link zur Anmeldung mit Rücksprung auf die aktuelle Seite', async () => {
    renderApp(routeError(new ApiError(401, 'unauthenticated', undefined)), { path: '/kontakt' });
    const login = await screen.findByRole('link', { name: t('errorPage.login') });
    expect(login.getAttribute('href')).toBe('/login?redirect=%2Fkontakt');
  });

  it('429: Wartezeit aus Retry-After und „Erneut versuchen“', async () => {
    const reset = vi.fn();
    renderApp(routeError(new ApiError(429, 'rate_limited', 'Zu viele', [], undefined, 30), reset));
    expect(await screen.findByRole('heading', { name: t('errorPage.rateLimited.title') })).toBeTruthy();
    expect(screen.getByText(t('error.retryInSeconds', { seconds: 30 }))).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: t('common.retry') }));
    expect(reset).toHaveBeenCalledOnce();
  });

  it('unbekannte Anzeige: eigene 404-Seite statt der allgemeinen', async () => {
    renderApp(<ErrorView error={new ApiError(404, 'not_found', undefined)} notFound="listingNotFound" />);
    expect(await screen.findByRole('heading', { name: t('errorPage.listingNotFound.title') })).toBeTruthy();
  });

  it('„Zurück“ nur mit Verlauf, dann per history.back()', async () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => undefined);
    vi.spyOn(window.history, 'length', 'get').mockReturnValue(2);
    renderApp(<ErrorPage kind="notFound" />);
    fireEvent.click(await screen.findByRole('button', { name: t('errorPage.back') }));
    expect(back).toHaveBeenCalledOnce();
    vi.restoreAllMocks();
  });

  it('Offline-Hinweis erscheint bei Verbindungsverlust und verschwindet wieder', async () => {
    const onLine = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    renderApp(<OfflineBanner />);
    expect(screen.queryByText(t('error.offlineBanner'))).toBeNull();
    onLine.mockReturnValue(false);
    window.dispatchEvent(new Event('offline'));
    expect(await screen.findByText(t('error.offlineBanner'))).toBeTruthy();
    onLine.mockReturnValue(true);
    window.dispatchEvent(new Event('online'));
    await waitFor(() => expect(screen.queryByText(t('error.offlineBanner'))).toBeNull());
    vi.restoreAllMocks();
  });
});
