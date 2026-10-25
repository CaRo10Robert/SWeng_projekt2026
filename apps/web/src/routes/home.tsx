import { Link } from '@tanstack/react-router';
import { useMeta } from '../api/auth';
import { buttonClass } from '../components/ui';
import { useDocumentTitle } from '../lib/title';
import { t, tx, type MessageKey } from '../i18n';

const steps = [
  { title: 'home.step1.title', text: 'home.step1.text' },
  { title: 'home.step2.title', text: 'home.step2.text' },
  { title: 'home.step3.title', text: 'home.step3.text' },
] as const satisfies readonly { title: MessageKey; text: MessageKey }[];

/** Startseite für Gäste (REQ-UX-004): erklärt Nutzen, Zugang und Ablauf, zeigt keine Anzeigen oder Bilder (Q-1). */
export function HomePage() {
  const { data: meta } = useMeta();
  const domains = meta?.allowedDomains ?? ['hwg-lu.de', 'studmail.hwg-lu.de'];
  useDocumentTitle(t('home.docTitle'));
  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <section aria-labelledby="home-title" className="space-y-4 rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200 sm:p-10">
        <h1 id="home-title" className="text-3xl font-bold text-brand-800 sm:text-4xl">
          {t('home.title')}
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-slate-700">{t('home.intro')}</p>
        <p className="mx-auto max-w-2xl rounded-lg bg-brand-50 px-4 py-3 text-brand-800">
          {tx('home.onlyMembers', { strong: (chunks) => <strong>{chunks}</strong> })}{' '}
          {domains.map((d, i) => (
            <span key={d}>
              {i > 0 && (i === domains.length - 1 ? t('common.or') : ', ')}
              <code className="font-mono">@{d}</code>
            </span>
          ))}
          .
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/register" className={buttonClass('primary', 'px-6')}>
            {t('nav.register')}
          </Link>
          <Link to="/login" search={{}} className={buttonClass('secondary', 'px-6')}>
            {t('nav.login')}
          </Link>
        </div>
      </section>

      <section aria-labelledby="steps-title" className="space-y-4">
        <h2 id="steps-title" className="text-2xl font-bold">
          {t('home.howItWorks')}
        </h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-700 font-bold text-white">
                {i + 1}
              </span>
              <h3 className="mt-3 font-semibold">
                <span className="sr-only">{t('home.step', { n: i + 1 })} </span>
                {t(s.title)}
              </h3>
              <p className="mt-1 text-sm text-slate-700">{t(s.text)}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="safety-title" className="space-y-3 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 id="safety-title" className="text-xl font-bold">
          {t('home.safety.title')}
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-slate-700">
          <li>{t('home.safety.handover')}</li>
          <li>{t('home.safety.prepay')}</li>
          <li>{t('home.safety.email')}</li>
          <li>{t('home.safety.report')}</li>
        </ul>
        <p>
          <Link to="/hilfe" hash="welche-betrugsmaschen-gibt-es" className="text-brand-700 underline">
            {t('home.safety.more')}
          </Link>
        </p>
      </section>
    </div>
  );
}
