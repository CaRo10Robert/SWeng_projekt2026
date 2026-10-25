import { useEffect, useState, type FormEvent } from 'react';
import { Link, Outlet, useNavigate, useRouterState, type ErrorComponentProps } from '@tanstack/react-router';
import { useAccountLocale, useLogout, useMe } from '../api/auth';
import { useUnread } from '../api/messaging';
import { useNotices } from '../api/trust';
import { useRealtime, useRealtimeDegraded } from '../lib/realtime';
import { useDocumentTitle } from '../lib/title';
import { ApiError, errorMessage, isMaintenance, NetworkError } from '../api/client';
import { Footer } from './Footer';
import { LanguageSwitch } from './LanguageSwitch';
import { AnnouncementBanner, MaintenanceBanner, TermsDialog, useGlobalApiErrors } from './SiteNotices';
import { Alert, Button, buttonClass, cx } from './ui';
import { t, tx } from '../i18n';

const navLinkClass =
  'block rounded-lg px-3 py-2 text-sm font-medium text-slate-800 hover:bg-brand-50 [&.active]:bg-brand-100 [&.active]:text-brand-800';

function UnreadBadge() {
  const { data } = useUnread();
  const count = data?.count ?? 0;
  if (!count) return null;
  return (
    <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-red-700 px-1.5 text-xs font-bold text-white">
      {count > 99 ? '99+' : count}
      <span className="sr-only"> {t('nav.unreadMessages', { count })}</span>
    </span>
  );
}

function NoticesBadge() {
  const { data } = useNotices();
  const count = data?.filter((n) => !n.readAt).length ?? 0;
  if (!count) return null;
  return (
    <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-red-700 px-1.5 text-xs font-bold text-white">
      {count}
      <span className="sr-only"> {t('nav.unreadNotices', { count })}</span>
    </span>
  );
}

function GuestNav() {
  return (
    <nav aria-label={t('nav.main')}>
      <ul className="flex items-center gap-1 sm:gap-2">
        <li className="hidden sm:block">
          <Link to="/hilfe" className={navLinkClass}>
            {t('nav.help')}
          </Link>
        </li>
        <li>
          <Link to="/login" search={{}} className={navLinkClass}>
            {t('nav.login')}
          </Link>
        </li>
        <li>
          <Link to="/register" className={buttonClass('primary', 'min-h-9 px-3 py-1.5')}>
            {t('nav.register')}
          </Link>
        </li>
      </ul>
    </nav>
  );
}

function Header() {
  const { data: me } = useMe();
  const logout = useLogout();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const degraded = useRealtimeDegraded();

  useEffect(() => setOpen(false), [pathname]);

  const onLogout = () =>
    logout.mutate(undefined, { onSettled: () => void navigate({ to: '/login', search: {} }) });

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white print:static">
      <a href="#main" className="sr-only-focusable absolute left-2 top-2 z-30 rounded bg-white px-3 py-2 text-brand-700">
        {t('nav.skipToContent')}
      </a>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-brand-700">
          <img src="/icon.svg" alt="" className="h-8 w-8" />
          CampusMarkt
        </Link>
        <div className="flex items-center gap-2">
        <LanguageSwitch />
        {me === null && <GuestNav />}
        {me && (
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium md:hidden"
            aria-expanded={open}
            aria-controls="main-nav"
            onClick={() => setOpen((o) => !o)}
          >
            {t('nav.menu')}
          </button>
        )}
        {me && (
          <nav
            id="main-nav"
            aria-label={t('nav.main')}
            className={cx(
              'absolute left-0 right-0 top-full border-b border-slate-200 bg-white p-2 md:static md:block md:border-0 md:p-0',
              !open && 'hidden',
            )}
          >
            <ul className="flex flex-col gap-1 md:flex-row md:items-center">
              <li>
                <Link to="/" className={navLinkClass} activeOptions={{ exact: true }}>
                  {t('nav.search')}
                </Link>
              </li>
              <li>
                <Link to="/listings/new" className={navLinkClass}>
                  {t('nav.newListing')}
                </Link>
              </li>
              <li>
                <Link to="/messages" className={navLinkClass}>
                  {t('nav.messages')}
                  <UnreadBadge />
                </Link>
              </li>
              <li>
                <Link to="/me/listings" className={navLinkClass}>
                  {t('nav.myListings')}
                </Link>
              </li>
              <li>
                <Link to="/me/favorites" className={navLinkClass}>
                  {t('nav.favorites')}
                </Link>
              </li>
              <li>
                <Link to="/me/notices" className={navLinkClass}>
                  {t('nav.notices')}
                  <NoticesBadge />
                </Link>
              </li>
              <li>
                <Link to="/profile" className={navLinkClass}>
                  {t('nav.profile')}
                </Link>
              </li>
              {(me.role === 'moderator' || me.role === 'admin') && (
                <li>
                  <Link to="/moderation" className={navLinkClass}>
                    {t('nav.moderation')}
                  </Link>
                </li>
              )}
              {me.role === 'admin' && (
                <li>
                  <Link to="/admin" className={navLinkClass}>
                    {t('nav.admin')}
                  </Link>
                </li>
              )}
              <li>
                <button type="button" onClick={onLogout} className={cx(navLinkClass, 'w-full text-left')}>
                  {t('nav.logout')}
                </button>
              </li>
            </ul>
          </nav>
        )}
        </div>
      </div>
      {me && degraded && (
        <p className="bg-amber-50 px-4 py-1 text-center text-xs text-amber-900" role="status">
          {t('nav.realtimeDegraded')}
        </p>
      )}
    </header>
  );
}

export function Layout() {
  const { data: me } = useMe();
  useRealtime(!!me);
  useGlobalApiErrors();
  useAccountLocale();
  return (
    <div className="flex min-h-screen flex-col">
      <MaintenanceBanner />
      <AnnouncementBanner />
      <Header />
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet />
      </main>
      <Footer />
      {me && <TermsDialog />}
    </div>
  );
}

function HelpLinks() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-2">
      <li>
        <Link to="/" className="text-brand-700 underline">
          {t('error.toHome')}
        </Link>
      </li>
      <li>
        <Link to="/hilfe" className="text-brand-700 underline">
          {t('error.helpFaq')}
        </Link>
      </li>
      <li>
        <Link to="/kontakt" className="text-brand-700 underline">
          {t('footer.contact')}
        </Link>
      </li>
      <li>
        <Link to="/status" className="text-brand-700 underline">
          {t('error.systemStatus')}
        </Link>
      </li>
    </ul>
  );
}

/** Unerwartete Fehler, Offline und Wartung (REQ-UX-003, REQ-OPS-006): verständlich, ohne Interna, mit Request-ID zum Melden. */
export function RouteError({ error, reset }: ErrorComponentProps) {
  useDocumentTitle(t('error.title'));
  if (isMaintenance(error)) {
    const minutes = error.retryAfter ? Math.ceil(error.retryAfter / 60) : null;
    return (
      <section className="mx-auto max-w-2xl space-y-4" aria-labelledby="error-title">
        <h1 id="error-title" className="text-2xl font-bold">
          {t('error.maintenanceTitle')}
        </h1>
        <p>{minutes ? t('error.maintenanceBackIn', { minutes }) : t('error.maintenanceText')}</p>
        <Button variant="secondary" onClick={reset}>
          {t('common.retry')}
        </Button>
        <HelpLinks />
      </section>
    );
  }
  const offline = error instanceof NetworkError;
  const requestId = error instanceof ApiError ? error.requestId : undefined;
  return (
    <section className="mx-auto max-w-2xl space-y-4" aria-labelledby="error-title">
      <h1 id="error-title" className="text-2xl font-bold">
        {offline ? t('error.offlineTitle') : t('error.loadFailedTitle')}
      </h1>
      <Alert tone="error">
        {offline ? t('error.offlineText') : errorMessage(error)}
      </Alert>
      {requestId && (
        <p className="text-sm text-slate-700">
          {tx('error.reportWithId', {
            link: (chunks) => (
              <Link to="/kontakt" className="text-brand-700 underline">
                {chunks}
              </Link>
            ),
            id: <code className="rounded bg-slate-100 px-1 font-mono">{requestId}</code>,
          })}
        </p>
      )}
      <Button variant="secondary" onClick={reset}>
        {t('common.retry')}
      </Button>
      <HelpLinks />
    </section>
  );
}

export function NotFound() {
  const { data: me } = useMe();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  useDocumentTitle(t('notFound.title'));
  const search = (e: FormEvent) => {
    e.preventDefault();
    void navigate({ to: '/', search: { q: q.trim() || undefined } });
  };
  return (
    <section className="mx-auto max-w-2xl space-y-4" aria-labelledby="notfound-title">
      <h1 id="notfound-title" className="text-2xl font-bold">
        {t('notFound.title')}
      </h1>
      <p>{t('notFound.text')}</p>
      {me && (
        <form role="search" onSubmit={search} className="flex gap-2">
          <label htmlFor="notfound-q" className="sr-only">
            {t('notFound.searchLabel')}
          </label>
          <input
            id="notfound-q"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('notFound.searchLabel')}
            className="flex-1 rounded-lg border border-slate-400 px-3 py-2"
          />
          <Button type="submit">{t('common.search')}</Button>
        </form>
      )}
      <HelpLinks />
    </section>
  );
}
