import { useEffect, useState, type FormEvent } from 'react';
import { Link, Outlet, useNavigate, useRouterState, type ErrorComponentProps } from '@tanstack/react-router';
import { useLogout, useMe } from '../api/auth';
import { useUnread } from '../api/messaging';
import { useNotices } from '../api/trust';
import { useRealtime, useRealtimeDegraded } from '../lib/realtime';
import { useDocumentTitle } from '../lib/title';
import { ApiError, errorMessage, isMaintenance, NetworkError } from '../api/client';
import { Footer } from './Footer';
import { AnnouncementBanner, MaintenanceBanner, TermsDialog, useGlobalApiErrors } from './SiteNotices';
import { Alert, Button, buttonClass, cx } from './ui';

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

function NoticesBadge() {
  const { data } = useNotices();
  const count = data?.filter((n) => !n.readAt).length ?? 0;
  if (!count) return null;
  return (
    <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-red-700 px-1.5 text-xs font-bold text-white">
      {count}
      <span className="sr-only"> ungelesene Mitteilungen</span>
    </span>
  );
}

function GuestNav() {
  return (
    <nav aria-label="Hauptnavigation">
      <ul className="flex items-center gap-1 sm:gap-2">
        <li className="hidden sm:block">
          <Link to="/hilfe" className={navLinkClass}>
            Hilfe
          </Link>
        </li>
        <li>
          <Link to="/login" search={{}} className={navLinkClass}>
            Anmelden
          </Link>
        </li>
        <li>
          <Link to="/register" className={buttonClass('primary', 'min-h-9 px-3 py-1.5')}>
            Registrieren
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
        Zum Inhalt springen
      </a>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-brand-700">
          <img src="/icon.svg" alt="" className="h-8 w-8" />
          CampusMarkt
        </Link>
        {me === null && <GuestNav />}
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
                <Link to="/me/notices" className={navLinkClass}>
                  Mitteilungen
                  <NoticesBadge />
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
  useGlobalApiErrors();
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
          Zur Startseite
        </Link>
      </li>
      <li>
        <Link to="/hilfe" className="text-brand-700 underline">
          Hilfe und häufige Fragen
        </Link>
      </li>
      <li>
        <Link to="/kontakt" className="text-brand-700 underline">
          Kontakt
        </Link>
      </li>
      <li>
        <Link to="/status" className="text-brand-700 underline">
          Systemstatus
        </Link>
      </li>
    </ul>
  );
}

/** Unerwartete Fehler, Offline und Wartung (REQ-UX-003, REQ-OPS-006): verständlich, ohne Interna, mit Request-ID zum Melden. */
export function RouteError({ error, reset }: ErrorComponentProps) {
  useDocumentTitle('Fehler');
  if (isMaintenance(error)) {
    const minutes = error.retryAfter ? Math.ceil(error.retryAfter / 60) : null;
    return (
      <section className="mx-auto max-w-2xl space-y-4" aria-labelledby="error-title">
        <h1 id="error-title" className="text-2xl font-bold">
          Wartungsarbeiten
        </h1>
        <p>
          CampusMarkt wird gerade gewartet
          {minutes ? ` und ist voraussichtlich in etwa ${minutes} Minute${minutes === 1 ? '' : 'n'} wieder erreichbar` : ''}.
          Deine Daten bleiben erhalten.
        </p>
        <Button variant="secondary" onClick={reset}>
          Erneut versuchen
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
        {offline ? 'Keine Verbindung' : 'Diese Seite konnte nicht geladen werden'}
      </h1>
      <Alert tone="error">
        {offline ? 'Bitte prüfe deine Internetverbindung und versuche es erneut.' : errorMessage(error)}
      </Alert>
      {requestId && (
        <p className="text-sm text-slate-700">
          Wenn der Fehler bleibt, melde ihn bitte über die{' '}
          <Link to="/kontakt" className="text-brand-700 underline">
            Kontaktseite
          </Link>{' '}
          und nenne diese Fehlernummer: <code className="rounded bg-slate-100 px-1 font-mono">{requestId}</code>
        </p>
      )}
      <Button variant="secondary" onClick={reset}>
        Erneut versuchen
      </Button>
      <HelpLinks />
    </section>
  );
}

export function NotFound() {
  const { data: me } = useMe();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  useDocumentTitle('Seite nicht gefunden');
  const search = (e: FormEvent) => {
    e.preventDefault();
    void navigate({ to: '/', search: { q: q.trim() || undefined } });
  };
  return (
    <section className="mx-auto max-w-2xl space-y-4" aria-labelledby="notfound-title">
      <h1 id="notfound-title" className="text-2xl font-bold">
        Seite nicht gefunden
      </h1>
      <p>Diese Adresse gibt es nicht (mehr). Vielleicht wurde die Anzeige gelöscht oder der Link ist unvollständig.</p>
      {me && (
        <form role="search" onSubmit={search} className="flex gap-2">
          <label htmlFor="notfound-q" className="sr-only">
            Anzeigen durchsuchen
          </label>
          <input
            id="notfound-q"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Anzeigen durchsuchen"
            className="flex-1 rounded-lg border border-slate-400 px-3 py-2"
          />
          <Button type="submit">Suchen</Button>
        </form>
      )}
      <HelpLinks />
    </section>
  );
}
