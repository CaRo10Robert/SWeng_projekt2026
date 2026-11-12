import { useEffect, useState } from 'react';
import { Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import { useAccountLocale, useLogout, useMe } from '../api/auth';
import { useUnread } from '../api/messaging';
import { useNotices } from '../api/trust';
import { useRealtime, useRealtimeDegraded } from '../lib/realtime';
import { OfflineBanner } from './ErrorPages';
import { Footer } from './Footer';
import { LanguageSwitch } from './LanguageSwitch';
import { AnnouncementBanner, MaintenanceBanner, PrivacyNoticeBanner, TermsDialog, useGlobalApiErrors } from './SiteNotices';
import { ThemeSwitch } from './ThemeSwitch';
import { buttonClass, cx } from './ui';
import { t } from '../i18n';

const navLinkClass =
  'block whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-slate-800 hover:bg-brand-50 [&.active]:bg-brand-100 [&.active]:text-brand-800';

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
        {/* Unter 640 px nur „Anmelden“: Startseite und Anmeldeseite verlinken die Registrierung (REQ-UX-001, 360 px) */}
        <li className="hidden sm:block">
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
        <Link to="/" className="flex shrink-0 items-center gap-2 text-lg font-bold text-brand-700">
          <img src="/icon.svg" alt="" className="h-8 w-8" />
          {/* Schmale Bildschirme: nur das Logo, der Name bleibt als Linktext für Screenreader */}
          <span className="sr-only sm:not-sr-only">CampusMarkt</span>
        </Link>
        <div className="flex items-center gap-2">
        <LanguageSwitch />
        <ThemeSwitch />
        {me === null && <GuestNav />}
        {me && (
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium xl:hidden"
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
              // Volle Navigation erst ab 1280 px; darunter Menü-Schaltfläche, damit nichts umbricht oder überläuft
              'absolute left-0 right-0 top-full border-b border-slate-200 bg-white p-2 xl:static xl:block xl:border-0 xl:p-0',
              !open && 'hidden',
            )}
          >
            <ul className="flex flex-col gap-1 xl:flex-row xl:flex-wrap xl:items-center xl:justify-end">
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
      <OfflineBanner />
      <AnnouncementBanner />
      {me && <PrivacyNoticeBanner />}
      <Header />
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet />
      </main>
      <Footer />
      {me && <TermsDialog />}
    </div>
  );
}
