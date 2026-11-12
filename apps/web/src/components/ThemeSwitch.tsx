import type { ReactNode } from 'react';
import { t, type MessageKey } from '../i18n';
import { THEME_PREFERENCES, useTheme, type ThemePreference } from '../lib/theme';
import { cx } from './ui';

const icon = (path: ReactNode) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {path}
  </svg>
);

const options: Record<ThemePreference, { label: MessageKey; icon: ReactNode }> = {
  system: {
    label: 'theme.system',
    icon: icon(
      <>
        <rect x="3" y="4" width="18" height="12" rx="2" />
        <path d="M8 20h8M12 16v4" />
      </>,
    ),
  },
  light: {
    label: 'theme.light',
    icon: icon(
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </>,
    ),
  },
  dark: { label: 'theme.dark', icon: icon(<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />) },
};

/**
 * Wahl des Farbschemas im Seitenkopf (REQ-UX-008, ADR-0021): System (Voreinstellung), Hell, Dunkel. Aufbau wie die
 * Sprachwahl: beschriftete Gruppe, die aktive Wahl ist als gedrückt markiert; Symbole mit Text für Screenreader und
 * Tooltip.
 */
export function ThemeSwitch() {
  const { preference, choose } = useTheme();
  return (
    <div role="group" aria-label={t('theme.label')} className="flex items-center rounded-lg border border-slate-300 p-0.5">
      {THEME_PREFERENCES.map((p) => (
        <button
          key={p}
          type="button"
          aria-pressed={preference === p}
          title={t(options[p].label)}
          onClick={() => preference !== p && choose(p)}
          className={cx(
            'inline-flex min-h-6 min-w-7 items-center justify-center rounded-md px-1.5 py-1',
            preference === p ? 'bg-brand-700 text-white' : 'text-slate-800 hover:bg-brand-50',
          )}
        >
          {options[p].icon}
          <span className="sr-only">{t(options[p].label)}</span>
        </button>
      ))}
    </div>
  );
}
