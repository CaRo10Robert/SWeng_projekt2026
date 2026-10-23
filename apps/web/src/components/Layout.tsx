import { useEffect, useState } from 'react';
import { Link, Outlet, useNavigate, useRouterState, type ErrorComponentProps } from '@tanstack/react-router';
import { useLogout, useMe } from '../api/auth';
import { useUnread } from '../api/messaging';
import { useRealtime, useRealtimeDegraded } from '../lib/realtime';
import { errorMessage } from '../api/client';
import { Alert, Button, cx } from './ui';

const navLinkClass =
  'block rounded-lg px-3 py-2 text-sm font-medium text-slate-800 hover:bg-brand-50 [&.active]:bg-brand-100 [&.active]:text-brand-800';

function UnreadBadge() {
  const { data } = useUnread();
  const count = data?.count ?? 0;
  if (!count) return null;
  return (
    <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-red-700 px-1.5 text-xs font-bold text-white">
      {count > 99 ? '99+' : count}
      <span className="sr-only"> ungelesene Nachrichten</span>
    </span>
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
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
      <a href="#main" className="sr-only-focusable absolute left-2 top-2 z-30 rounded bg-white px-3 py-2 text-brand-700">
        Zum Inhalt springen
      </a>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-brand-700">
          <img src="/icon.svg" alt="" className="h-8 w-8" />
          CampusMarkt
        </Link>
        {me && (
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium md:hidden"
            aria-expanded={open}
            aria-controls="main-nav"
            onClick={() => setOpen((o) => !o)}
          >
            Menü
          </button>
        )}
        {me && (
          <nav
            id="main-nav"
            aria-label="Hauptnavigation"
            className={cx(
              'absolute left-0 right-0 top-full border-b border-slate-200 bg-white p-2 md:static md:block md:border-0 md:p-0',
              !open && 'hidden',
            )}
          >
            <ul className="flex flex-col gap-1 md:flex-row md:items-center">
              <li>
                <Link to="/" className={navLinkClass} activeOptions={{ exact: true }}>
                  Suchen
                </Link>
              </li>
              <li>
                <Link to="/listings/new" className={navLinkClass}>
                  Inserieren
                </Link>
              </li>
              <li>
                <Link to="/messages" className={navLinkClass}>
                  Nachrichten
                  <UnreadBadge />
                </Link>
              </li>
              <li>
                <Link to="/me/listings" className={navLinkClass}>
                  Meine Anzeigen
                </Link>
              </li>
              <li>
                <Link to="/me/favorites" className={navLinkClass}>
                  Merkliste
                </Link>
              </li>
              <li>
                <Link to="/profile" className={navLinkClass}>
                  Profil
                </Link>
              </li>
              {(me.role === 'moderator' || me.role === 'admin') && (
                <li>
                  <Link to="/moderation" className={navLinkClass}>
                    Moderation
                  </Link>
                </li>
              )}
              {me.role === 'admin' && (
                <li>
                  <Link to="/admin" className={navLinkClass}>
                    Admin
                  </Link>
                </li>
              )}
              <li>
                <button type="button" onClick={onLogout} className={cx(navLinkClass, 'w-full text-left')}>
                  Abmelden
                </button>
              </li>
            </ul>
          </nav>
        )}
      </div>
      {me && degraded && (
        <p className="bg-amber-50 px-4 py-1 text-center text-xs text-amber-900" role="status">
          Echtzeitverbindung getrennt – Nachrichten werden alle 10 Sekunden aktualisiert.
        </p>
      )}
    </header>
  );
}

export function Layout() {
  const { data: me } = useMe();
  useRealtime(!!me);
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white px-4 py-4 text-center text-sm text-slate-600">
        Demo-Version – kein Echtbetrieb · CampusMarkt HWG LU
      </footer>
    </div>
  );
}

export function RouteError({ error, reset }: ErrorComponentProps) {
  return (
    <div className="space-y-4">
      <Alert tone="error" title="Diese Seite konnte nicht geladen werden.">
        {errorMessage(error)}
      </Alert>
      <Button variant="secondary" onClick={reset}>
        Erneut versuchen
      </Button>
    </div>
  );
}

export function NotFound() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Seite nicht gefunden</h1>
      <Link to="/" className="text-brand-700 underline">
        Zur Startseite
      </Link>
    </div>
  );
}
