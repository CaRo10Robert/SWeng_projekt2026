import { Fragment, createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createIntl, createIntlCache, RawIntlProvider, type IntlShape } from 'react-intl';
import type { Locale } from '@campusmarkt/contracts';
import de from './de.json';

/**
 * Internationalisierung (ADR-0016, REQ-UX-007): react-intl mit ICU MessageFormat, Sprachen nach BCP 47.
 * Texte liegen in `de.json` und `en.json`; fehlt ein englischer Schlüssel, gilt der deutsche (scripts/check-i18n.mjs
 * erkennt das in CI). `t()` ist auch außerhalb von Komponenten nutzbar (z. B. Fehlermeldungen, Beschriftungen).
 * Deutsch ist im Haupt-Bundle; Englisch wird erst geladen, wenn es gebraucht wird (eigener Chunk).
 */
export type MessageKey = keyof typeof de;
export type MessageValues = Record<string, string | number | Date | null | undefined>;
export type RichValues = Record<string, ReactNode | ((chunks: ReactNode[]) => ReactNode)>;

export const LOCALES: readonly Locale[] = ['de', 'en'];
export const LOCALE_NAMES: Record<Locale, string> = { de: 'Deutsch', en: 'English' };
/** Nur nach ausdrücklicher Wahl gesetzt, unbedingt erforderlich (TDDDG § 25 Abs. 2 Nr. 2, REQ-LEGAL-010). */
export const LOCALE_STORAGE_KEY = 'cm_locale';

const MESSAGES: Partial<Record<Locale, Record<string, string>>> = { de };

/** Texte einer Sprache laden (einmalig); muss vor `apply`/`choose` bzw. vor dem ersten Rendern erfolgt sein. */
export async function loadMessages(locale: Locale): Promise<void> {
  if (MESSAGES[locale]) return;
  const en = (await import('./en.json')).default as Record<string, string>;
  MESSAGES.en = { ...de, ...en };
}
const cache = createIntlCache();

const build = (locale: Locale): IntlShape =>
  createIntl({ locale, defaultLocale: 'de', messages: MESSAGES[locale] ?? de, onError: reportError }, cache);

function reportError(err: { code?: string; message: string }) {
  // Fehlende Übersetzungen fallen auf Deutsch zurück; im Entwicklungsmodus sichtbar machen
  if (import.meta.env.DEV && err.code !== 'MISSING_TRANSLATION') console.warn(err.message);
}

const isLocale = (v: unknown): v is Locale => v === 'de' || v === 'en';

/** Auf diesem Gerät ausdrücklich gewählte Sprache, falls vorhanden. */
export function storedLocale(): Locale | null {
  try {
    const v = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return isLocale(v) ? v : null;
  } catch {
    return null;
  }
}

/** Reihenfolge ohne Konto: ausdrückliche Wahl → Browsersprache → Deutsch. Das Konto überschreibt später. */
export function initialLocale(): Locale {
  const stored = storedLocale();
  if (stored) return stored;
  const browser = typeof navigator !== 'undefined' ? navigator.languages ?? [navigator.language] : [];
  for (const tag of browser) {
    const base = tag.toLowerCase().split('-')[0];
    if (isLocale(base)) return base;
  }
  return 'de';
}

let current: IntlShape = build('de');

/** Übersetzter Text (reiner String). */
export function t(id: MessageKey, values?: MessageValues): string {
  return current.formatMessage({ id }, values) as string;
}

/** Übersetzter Text mit Rich-Text-Platzhaltern (z. B. `<link>…</link>`). */
export function tx(id: MessageKey, values: RichValues): ReactNode {
  return current.formatMessage({ id }, values as never) as ReactNode;
}

/** Übersetzung, falls der Schlüssel existiert (z. B. Fehlercodes des Servers). */
export function tMaybe(id: string, values?: MessageValues): string | undefined {
  return id in current.messages ? (current.formatMessage({ id }, values) as string) : undefined;
}

export const currentLocale = (): Locale => current.locale as Locale;
export const intlLocale = (): string => (current.locale === 'en' ? 'en-GB' : 'de-DE');

interface LocaleContextValue {
  locale: Locale;
  /** Ausdrückliche Wahl: wird gespeichert und an `onChoose` (Konto) gemeldet. */
  choose: (locale: Locale) => void;
  /** Sprache aus dem Konto übernehmen, ohne lokale Speicherung. */
  apply: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('LocaleProvider fehlt');
  return ctx;
}

type ChooseListener = (locale: Locale) => void;
const chooseListeners = new Set<ChooseListener>();
/** Das Konto-Modul meldet sich hier an, um die Wahl im Profil zu speichern (PATCH /me). */
export function onLocaleChosen(listener: ChooseListener): () => void {
  chooseListeners.add(listener);
  return () => chooseListeners.delete(listener);
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    const initial = initialLocale();
    current = build(initial);
    return initial;
  });

  const apply = useCallback((next: Locale) => {
    void loadMessages(next).then(() => {
      if (current.locale !== next) current = build(next);
      setLocale(next);
    });
  }, []);

  const choose = useCallback(
    (next: Locale) => {
      try {
        window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
      } catch {
        // Speicher gesperrt: Wahl gilt nur für diese Sitzung
      }
      // Kontospeicherung sofort anstoßen (vor dem Neuaufbau), damit der Abgleich mit dem Konto die Wahl nicht überschreibt
      for (const listener of chooseListeners) listener(next);
      apply(next);
    },
    [apply],
  );

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo(() => ({ locale, choose, apply }), [locale, choose, apply]);
  return (
    <LocaleContext.Provider value={value}>
      <RawIntlProvider value={current}>
        {/* Neu aufbauen, damit auch `t()` außerhalb von Hooks die neue Sprache liefert */}
        <Fragment key={locale}>{children}</Fragment>
      </RawIntlProvider>
    </LocaleContext.Provider>
  );
}
