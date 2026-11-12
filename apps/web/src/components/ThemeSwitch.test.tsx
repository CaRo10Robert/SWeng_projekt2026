import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen } from '@testing-library/react';
import { renderApp } from '../test/render';
import { ThemeSwitch } from './ThemeSwitch';
import { applyTheme, chooseTheme, initTheme, resolveTheme, storedPreference, THEME_COLORS, THEME_STORAGE_KEY } from '../lib/theme';
import { t } from '../i18n';

/** Systemeinstellung `prefers-color-scheme` als steuerbare Attrappe (jsdom kennt matchMedia nicht). */
function mockSystem(dark: boolean) {
  const listeners = new Set<(e: { matches: boolean }) => void>();
  const query = {
    matches: dark,
    media: '(prefers-color-scheme: dark)',
    addEventListener: (_: string, l: (e: { matches: boolean }) => void) => listeners.add(l),
    removeEventListener: (_: string, l: (e: { matches: boolean }) => void) => listeners.delete(l),
  };
  vi.stubGlobal('matchMedia', vi.fn(() => query));
  return (next: boolean) => {
    query.matches = next;
    for (const l of listeners) l({ matches: next });
  };
}

const root = () => document.documentElement;
let stop: (() => void) | undefined;

beforeEach(() => {
  document.head.innerHTML =
    '<meta name="theme-color" content="#0b4f8a" media="(prefers-color-scheme: light)"><meta name="theme-color" content="#111a2b" media="(prefers-color-scheme: dark)">';
  root().className = '';
  root().style.colorScheme = '';
});
afterEach(() => {
  stop?.();
  stop = undefined;
  chooseTheme('system');
  window.localStorage.clear();
});

describe('[AT-UX-008] Farbschema: Systemeinstellung als Voreinstellung, Wahl im Seitenkopf bleibt erhalten (REQ-UX-008, REQ-LEGAL-010)', () => {
  it('Entscheidungstabelle: Wahl × Systemeinstellung → wirksames Schema', () => {
    expect(resolveTheme('system', 'light')).toBe('light');
    expect(resolveTheme('system', 'dark')).toBe('dark');
    expect(resolveTheme('light', 'dark')).toBe('light');
    expect(resolveTheme('dark', 'light')).toBe('dark');
  });

  it('ohne Wahl folgt die Seite dem System, auch bei Wechsel während der Sitzung, und speichert nichts', () => {
    const setSystem = mockSystem(true);
    stop = initTheme();
    expect(root().classList.contains('dark')).toBe(true);
    expect(root().style.colorScheme).toBe('dark');
    act(() => setSystem(false));
    expect(root().classList.contains('dark')).toBe(false);
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it('Schalter: drei Optionen in einer beschrifteten Gruppe, aktive Wahl gedrückt, Wahl wird gespeichert und angewandt', async () => {
    mockSystem(false);
    stop = initTheme();
    renderApp(<ThemeSwitch />);
    const group = await screen.findByRole('group', { name: t('theme.label') });
    const system = screen.getByRole('button', { name: t('theme.system') });
    const dark = screen.getByRole('button', { name: t('theme.dark') });
    expect(group).toBeTruthy();
    expect(system.getAttribute('aria-pressed')).toBe('true');
    expect(dark.getAttribute('title')).toBe(t('theme.dark'));

    fireEvent.click(dark);
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(root().classList.contains('dark')).toBe(true);
    expect(screen.getByRole('button', { name: t('theme.dark') }).getAttribute('aria-pressed')).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: t('theme.light') }));
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    expect(root().classList.contains('dark')).toBe(false);

    // „Wie im System“ entfernt die Speicherung wieder (nur ausdrückliche Wahl wird gespeichert)
    fireEvent.click(screen.getByRole('button', { name: t('theme.system') }));
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it('gespeicherte Wahl gilt nach dem Neuladen, auch gegen die Systemeinstellung', () => {
    mockSystem(true);
    window.localStorage.setItem(THEME_STORAGE_KEY, 'light');
    stop = initTheme();
    expect(storedPreference()).toBe('light');
    expect(root().classList.contains('dark')).toBe(false);
    expect(root().style.colorScheme).toBe('light');
  });

  it('ungültiger Eintrag oder gesperrter Speicher: Systemeinstellung, kein Fehler', () => {
    mockSystem(true);
    window.localStorage.setItem(THEME_STORAGE_KEY, 'lila');
    expect(storedPreference()).toBe('system');
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('gesperrt', 'SecurityError');
    });
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('gesperrt', 'SecurityError');
    });
    expect(storedPreference()).toBe('system');
    expect(() => chooseTheme('dark')).not.toThrow();
    expect(root().classList.contains('dark')).toBe(true);
    getItem.mockRestore();
    setItem.mockRestore();
  });

  it('Farbe der Browserleiste: je Schema per media-Abfrage, bei ausdrücklicher Wahl deren Farbe', () => {
    const metas = () => [...document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')].map((m) => m.content);
    applyTheme('system', 'light');
    expect(metas()).toEqual([THEME_COLORS.light, THEME_COLORS.dark]);
    applyTheme('dark', 'light');
    expect(metas()).toEqual([THEME_COLORS.dark, THEME_COLORS.dark]);
  });

  it('Wahl in einem anderen Tab wird übernommen', () => {
    mockSystem(false);
    stop = initTheme();
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: THEME_STORAGE_KEY, newValue: 'dark' }));
    });
    expect(root().classList.contains('dark')).toBe(true);
  });
});
