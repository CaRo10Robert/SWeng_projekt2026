import { Component, useEffect, useRef, useState, useSyncExternalStore, type ErrorInfo, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useRouter, useRouterState, type ErrorComponentProps } from '@tanstack/react-router';
import { useMe } from '../api/auth';
import { ApiError, errorMessage, NetworkError, retryHint } from '../api/client';
import { useDocumentTitle } from '../lib/title';
import { t, tx } from '../i18n';
import { Button, buttonClass } from './ui';

/**
 * Fehlerseiten (REQ-UX-003, REQ-UX-009): ein gemeinsamer Aufbau für alle Fehlerfälle – Fehlercode, Überschrift mit
 * Fokus, verständlicher Text ohne Interna, Wege zurück (erneut versuchen, zurück, Startseite) und Hilfelinks.
 * Seitenkopf und Seitenfuß bleiben erhalten, weil die Seiten innerhalb des Layouts erscheinen.
 */
export type ErrorKind =
  | 'notFound'
  | 'listingNotFound'
  | 'conversationNotFound'
  | 'profileNotFound'
  | 'forbidden'
  | 'unauthenticated'
  | 'rateLimited'
  | 'maintenance'
  | 'offline'
  | 'unexpected';

const STATUS: Record<ErrorKind, number | undefined> = {
  notFound: 404,
  listingNotFound: 404,
  conversationNotFound: 404,
  profileNotFound: 404,
  forbidden: 403,
  unauthenticated: 401,
  rateLimited: 429,
  maintenance: 503,
  offline: undefined,
  unexpected: 500,
};

/** Welche Fehlerseite passt zu einem Fehler? Reine Funktion (Entscheidungstabelle im Test, AT-UX-009). */
export function errorKind(error: unknown, online = typeof navigator === 'undefined' || navigator.onLine): ErrorKind {
  if (error instanceof NetworkError || (!online && !(error instanceof ApiError))) return 'offline';
  if (error instanceof ApiError) {
    if (error.status === 503 && error.code === 'maintenance') return 'maintenance';
    if (error.status === 429) return 'rateLimited';
    if (error.status === 404) return 'notFound';
    if (error.status === 403) return 'forbidden';
    if (error.status === 401) return 'unauthenticated';
  }
  return 'unexpected';
}

function HelpLinks() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
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

export interface ErrorPageProps {
  kind: ErrorKind;
  /** Abweichender HTTP-Status (z. B. 502 bei „unexpected“). */
  status?: number;
  /** Ersetzt den Standardtext der Fehlerart. */
  text?: string;
  requestId?: string;
  /** Sekunden aus `Retry-After` (429, 503). */
  retryAfter?: number;
  onRetry?: () => void;
  children?: ReactNode;
}

export function ErrorPage({ kind, status = STATUS[kind], text, requestId, retryAfter, onRetry, children }: ErrorPageProps) {
  const title = t(`errorPage.${kind}.title`);
  useDocumentTitle(title);
  const heading = useRef<HTMLHeadingElement>(null);
  const href = useRouterState({ select: (s) => s.location.href });
  // Überschrift fokussieren, damit Screenreader den Fehler sofort ansagen (architektur.md 8.10)
  useEffect(() => heading.current?.focus({ preventScroll: true }), [kind]);
  const canGoBack = typeof window !== 'undefined' && window.history.length > 1;

  let body = text ?? t(`errorPage.${kind}.text`);
  if (kind === 'maintenance' && retryAfter) body = t('error.maintenanceBackIn', { minutes: Math.ceil(retryAfter / 60) });

  return (
    <section className="mx-auto max-w-2xl space-y-4 py-4" aria-labelledby="error-title" data-error-kind={kind}>
      {status && <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">{t('errorPage.status', { status })}</p>}
      <h1 id="error-title" ref={heading} tabIndex={-1} className="text-2xl font-bold text-slate-900 sm:text-3xl">
        {title}
      </h1>
      <p className="text-slate-800">{body}</p>
      {kind === 'rateLimited' && <p className="font-medium text-slate-900">{retryHint(retryAfter)}</p>}
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
      {children}
      <div className="flex flex-wrap gap-2">
        {onRetry && (
          <Button onClick={onRetry}>{t('common.retry')}</Button>
        )}
        {kind === 'unauthenticated' && (
          <Link to="/login" search={{ redirect: href }} className={buttonClass('primary')}>
            {t('errorPage.login')}
          </Link>
        )}
        {canGoBack && (
          <Button variant="secondary" onClick={() => window.history.back()}>
            {t('errorPage.back')}
          </Button>
        )}
        <Link to="/" className={buttonClass('secondary')}>
          {t('error.toHome')}
        </Link>
      </div>
      <HelpLinks />
    </section>
  );
}

/** Fehler aus einer Abfrage oder Route als passende Fehlerseite. `notFound` ersetzt die allgemeine 404-Art. */
export function ErrorView({ error, onRetry, notFound = 'notFound' }: { error: unknown; onRetry?: () => void; notFound?: ErrorKind }) {
  const kind = errorKind(error);
  const api = error instanceof ApiError ? error : undefined;
  const retryable = kind === 'offline' || kind === 'maintenance' || kind === 'rateLimited' || kind === 'unexpected';
  return (
    <ErrorPage
      kind={kind === 'notFound' ? notFound : kind}
      status={kind === 'unexpected' && api ? api.status : undefined}
      text={kind === 'unexpected' && api ? errorMessage(api) : undefined}
      requestId={kind === 'unexpected' ? api?.requestId : undefined}
      retryAfter={api?.retryAfter}
      onRetry={retryable ? onRetry : undefined}
    />
  );
}

/** Fehler beim Laden oder Rendern einer Route (TanStack Router `defaultErrorComponent`). */
export function RouteError({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  return (
    <ErrorView
      error={error}
      onRetry={() => {
        void router.invalidate();
        reset();
      }}
    />
  );
}

/** Unbekannte Adresse (404); Mitglieder können direkt suchen. */
export function NotFound() {
  const { data: me } = useMe();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const search = (e: FormEvent) => {
    e.preventDefault();
    void navigate({ to: '/', search: { q: q.trim() || undefined } });
  };
  return (
    <ErrorPage kind="notFound">
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
            className="flex-1 rounded-lg border border-slate-500 bg-white px-3 py-2"
          />
          <Button type="submit">{t('common.search')}</Button>
        </form>
      )}
    </ErrorPage>
  );
}

// ------------------------------------------------------------------ Verbindung (offline/online)

const subscribeOnline = (listener: () => void) => {
  window.addEventListener('online', listener);
  window.addEventListener('offline', listener);
  return () => {
    window.removeEventListener('online', listener);
    window.removeEventListener('offline', listener);
  };
};

export const useOnline = () => useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);

/** Hinweis im Seitenkopf, solange das Gerät offline ist (Guideline Kap. 03: „no network“ ≠ Serverfehler). */
export function OfflineBanner() {
  const online = useOnline();
  if (online) return null;
  return (
    <p role="status" className="border-b border-amber-300 bg-amber-50 px-4 py-2 text-center text-sm text-amber-950">
      {t('error.offlineBanner')}
    </p>
  );
}

// ------------------------------------------------------------------ Letzte Rückfallebene

/**
 * Fängt Fehler außerhalb des Routers (Provider, Layout selbst). Bewusst ohne Router-Abhängigkeit: einfache Links und
 * Neuladen, damit die Seite auch dann noch erscheint, wenn der Router nicht mehr funktioniert (REQ-UX-003
 * „Fehler im Fehlerbehandler“).
 */
export class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Nur Fehlerart und Komponentenpfad, keine Inhalte (REQ-OPS-002)
    console.error('Unbehandelter Fehler in der Oberfläche', error.name, info.componentStack?.split('\n')[1]?.trim());
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main id="main" className="mx-auto max-w-2xl space-y-4 px-4 py-12" data-error-kind="unexpected">
        <h1 className="text-2xl font-bold text-slate-900">{t('errorPage.unexpected.title')}</h1>
        <p className="text-slate-800">{t('errorPage.unexpected.text')}</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={buttonClass('primary')} onClick={() => window.location.reload()}>
            {t('errorPage.reload')}
          </button>
          <a href="/" className={buttonClass('secondary')}>
            {t('error.toHome')}
          </a>
        </div>
        <p className="text-sm">
          <a href="/hilfe" className="text-brand-700 underline">
            {t('error.helpFaq')}
          </a>
          {' · '}
          <a href="/kontakt" className="text-brand-700 underline">
            {t('footer.contact')}
          </a>
        </p>
      </main>
    );
  }
}
