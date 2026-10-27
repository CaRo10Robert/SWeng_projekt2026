import type { ReactNode } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link } from '@tanstack/react-router';
import { headingParts, stripHeadingId } from '../lib/content';
import { t } from '../i18n';

function textOf(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (node && typeof node === 'object' && 'props' in node) return textOf((node.props as { children?: ReactNode }).children);
  return '';
}

const headingId = (children: ReactNode) => headingParts(textOf(children)).id;

/** Feste ID `{#…}` aus dem sichtbaren Text der Überschrift entfernen. */
function headingText(children: ReactNode): ReactNode {
  if (typeof children === 'string') return stripHeadingId(children);
  if (Array.isArray(children)) return children.map((c, i) => (i === children.length - 1 ? headingText(c) : c));
  return children;
}

const components: Components = {
  // Überschriften der Datei beginnen bei ##; die Seite setzt selbst die h1
  h1: ({ children }) => <h2 className="mt-8 text-xl font-bold">{children}</h2>,
  h2: ({ children }) => (
    <h2 id={headingId(children)} className="mt-8 scroll-mt-20 text-xl font-bold text-slate-900">
      {headingText(children)}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 id={headingId(children)} className="mt-6 scroll-mt-20 text-lg font-semibold text-slate-900">
      {headingText(children)}
    </h3>
  ),
  p: ({ children }) => <p className="mt-3 leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="mt-3 list-disc space-y-1 pl-6">{children}</ul>,
  ol: ({ children }) => <ol className="mt-3 list-decimal space-y-1 pl-6">{children}</ol>,
  blockquote: ({ children }) => (
    <aside className="mt-4 rounded-lg border-l-4 border-amber-500 bg-amber-50 px-4 py-1 text-amber-950">{children}</aside>
  ),
  // Breite Tabellen scrollen auf kleinen Bildschirmen; der Bereich ist per Tastatur erreichbar (WCAG 2.1.1)
  table: ({ children }) => (
    <div className="mt-4 overflow-x-auto" tabIndex={0} role="region" aria-label={t('content.tableRegion')}>
      <table className="w-full border-collapse text-left text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th scope="col" className="border-b-2 border-slate-300 p-2 align-top font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => <td className="border-b border-slate-200 p-2 align-top">{children}</td>,
  code: ({ children }) => <code className="rounded bg-slate-100 px-1 py-0.5 text-[0.9em]">{children}</code>,
  hr: () => <hr className="my-6 border-slate-200" />,
  a: ({ href = '', children }) => {
    // Interne Links über den Router (kein Neuladen), Anker auf derselben Seite, externe Links ohne Referrer
    if (href.startsWith('/') && !href.startsWith('//')) {
      const [to, hash] = href.split('#');
      return (
        // Pfade aus den Inhaltsdateien sind zur Übersetzungszeit unbekannt; der Server liefert für unbekannte 404
        <Link to={to as '/'} hash={hash} className="text-brand-700 underline">
          {children}
        </Link>
      );
    }
    if (href.startsWith('#')) {
      return (
        <a href={href} className="text-brand-700 underline">
          {children}
        </a>
      );
    }
    return (
      <a href={href} className="text-brand-700 underline" rel="noopener noreferrer">
        {children}
      </a>
    );
  },
  img: ({ alt }) => <span>{alt}</span>,
};

/** Markdown ohne HTML (skipHtml, kein rehype-raw): Inhalte können kein Skript oder Markup einschleusen (ADR-0015). */
export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml components={components}>
      {children}
    </ReactMarkdown>
  );
}
