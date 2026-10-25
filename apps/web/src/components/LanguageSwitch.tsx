import { LOCALE_NAMES, LOCALES, t, useLocale } from '../i18n';
import { cx } from './ui';

/**
 * Sprachwahl im Seitenkopf (REQ-UX-007, ADR-0016). Jede Sprache ist in sich selbst benannt und trägt ihr `lang`,
 * damit Screenreader sie richtig aussprechen; die aktive Sprache ist als gedrückt markiert.
 */
export function LanguageSwitch() {
  const { locale, choose } = useLocale();
  return (
    <div role="group" aria-label={t('language.label')} className="flex items-center rounded-lg border border-slate-300 p-0.5">
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={locale === l}
          onClick={() => locale !== l && choose(l)}
          className={cx(
            'rounded-md px-2 py-1 text-xs font-semibold',
            locale === l ? 'bg-brand-700 text-white' : 'text-slate-800 hover:bg-brand-50',
          )}
        >
          <abbr title={LOCALE_NAMES[l]} className="no-underline">
            {l.toUpperCase()}
          </abbr>
          <span className="sr-only"> {LOCALE_NAMES[l]}</span>
        </button>
      ))}
    </div>
  );
}
