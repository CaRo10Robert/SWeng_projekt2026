import { lazy, Suspense, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouterState } from '@tanstack/react-router';
import { loadContent, type ContentName, type LegalPageName } from '../lib/content';
import { Alert, Badge, Loading } from '../components/ui';
import { formatDate } from '../lib/format';
import { useDocumentTitle } from '../lib/title';
import { t, tx, useLocale } from '../i18n';

export const legalPageNames: LegalPageName[] = [
  'impressum',
  'datenschutz',
  'nutzungsbedingungen',
  'community-regeln',
  'barrierefreiheit',
  'kontakt',
];

const contentQuery = (name: ContentName, locale: string) => ({
  queryKey: ['content', name, locale],
  queryFn: () => loadContent(name, locale),
  staleTime: Infinity,
});

// Markdown-Renderer nur für Inhaltsseiten nachladen, damit das Haupt-Bundle schlank bleibt (REQ-PERF)
const Markdown = lazy(() => import('../components/Markdown').then((m) => ({ default: m.Markdown })));

/** Inhaltsverzeichnis erst ab vier Abschnitten, sonst stört es mehr, als es hilft. */
const TOC_MIN_SECTIONS = 4;

/** Sprungmarke ansteuern, sobald Inhalt und Renderer geladen sind (z. B. /hilfe#welche-betrugsmaschen-gibt-es). */
function ScrollToHash() {
  const hash = useRouterState({ select: (s) => s.location.hash });
  useEffect(() => {
    if (!hash) return;
    const target = document.getElementById(hash);
    if (target) {
      target.scrollIntoView();
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
  }, [hash]);
  return null;
}

function ContentPage({ name }: { name: ContentName }) {
  const { locale } = useLocale();
  const { data, isPending, isError } = useQuery(contentQuery(name, locale));
  useDocumentTitle(data?.title);

  if (isPending) return <Loading />;
  if (isError) return <Alert tone="error" title={t('content.loadFailed')}>{t('content.reload')}</Alert>;

  const sections = data.headings.filter((h) => h.level === 2);
  const tocEntries = name === 'help/faq' ? data.headings : sections;
  return (
    <article lang={data.lang} className="mx-auto max-w-3xl rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 print:shadow-none print:ring-0 sm:p-8">
      <header className="space-y-2 border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold sm:text-3xl">{data.title}</h1>
        <p className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
          {data.sample && <Badge tone="warning">{t('content.sample')}</Badge>}
          <span>{t('content.version', { version: data.version })}</span>
          {data.lastUpdated && (
            <>
              <span aria-hidden="true">·</span>
              <span>
                {tx('content.lastUpdated', { date: <time dateTime={data.lastUpdated}>{formatDate(data.lastUpdated)}</time> })}
              </span>
            </>
          )}
        </p>
      </header>
      {sections.length >= TOC_MIN_SECTIONS && (
        <nav aria-label={t('content.toc')} className="mt-4 rounded-lg bg-slate-50 p-4 print:hidden">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">{t('content.tocHeading')}</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {tocEntries.map((h) => (
              <li key={h.id} className={h.level === 3 ? 'pl-4' : undefined}>
                <a href={`#${h.id}`} className="text-brand-700 underline">
                  {h.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
      <div className="text-slate-800">
        <Suspense fallback={<Loading />}>
          <Markdown>{data.body}</Markdown>
          <ScrollToHash />
        </Suspense>
      </div>
    </article>
  );
}

export const LegalPage = ({ name }: { name: LegalPageName }) => <ContentPage name={`legal/${name}`} />;
export const HelpPage = () => <ContentPage name="help/faq" />;
