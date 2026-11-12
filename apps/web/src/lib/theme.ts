import { useSyncExternalStore } from 'react';

/**
 * Farbschema hell/dunkel (REQ-UX-008, ADR-0021).
 *
 * - Voreinstellung „system“: folgt `prefers-color-scheme` des Betriebssystems, auch bei Änderungen während der Sitzung.
 * - Ausdrückliche Wahl „light“ oder „dark“ über den Schalter im Seitenkopf; nur sie wird gespeichert (`cm_theme`,
 *   unbedingt erforderlich auf ausdrücklichen Wunsch, REQ-LEGAL-010). „system“ entfernt den Eintrag wieder.
 * - Umgesetzt über die Klasse `dark` auf `<html>`; die Farbwerte stehen als Tokens in `index.css`.
 * - Das Inline-Skript in `index.html` setzt die Klasse schon vor dem ersten Rendern (kein Aufblitzen des falschen
 *   Schemas). Es wiederholt bewusst nur `storedPreference` + `resolveTheme` in Kurzform; der Server erlaubt es per
 *   CSP-Hash (`inlineScriptHashes` in apps/server/src/platform/http/server.ts).
 */
export type ThemePreference = 'system' | 'light' | 'dark';
export type Theme = 'light' | 'dark';

export const THEME_PREFERENCES: readonly ThemePreference[] = ['system', 'light', 'dark'];
/** Nur nach ausdrücklicher Wahl gesetzt (TDDDG § 25 Abs. 2 Nr. 2, REQ-LEGAL-010, e2e/storage-allowlist.json). */
export const THEME_STORAGE_KEY = 'cm_theme';
/** Farbe der Browserleiste je Schema (`<meta name="theme-color">`); hell = Markenblau, dunkel = Seitenkopf. */
export const THEME_COLORS: Record<Theme, string> = { light: '#0b4f8a', dark: '#111a2b' };
const DARK_QUERY = '(prefers-color-scheme: dark)';

const darkQuery = (): MediaQueryList | null =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(DARK_QUERY) : null;

/** Auf diesem Gerät ausdrücklich gewähltes Schema, sonst „system“ (auch wenn der Speicher gesperrt ist). */
export function storedPreference(): ThemePreference {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : 'system';
  } catch {
    return 'system';
  }
}

export const systemTheme = (): Theme => (darkQuery()?.matches ? 'dark' : 'light');

export const resolveTheme = (preference: ThemePreference, system: Theme = systemTheme()): Theme =>
  preference === 'system' ? system : preference;

/** Setzt Klasse, `color-scheme` (Formularelemente, Scrollleisten) und die Farbe der Browserleiste. */
export function applyTheme(preference: ThemePreference, system: Theme = systemTheme(), doc: Document = document) {
  const theme = resolveTheme(preference, system);
  const root = doc.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
  // Zwei Meta-Tags mit media-Abfrage für die Systemeinstellung; bei ausdrücklicher Wahl tragen beide deren Farbe
  for (const meta of doc.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
    const forScheme: Theme = (meta.getAttribute('media') ?? '').includes('dark') ? 'dark' : 'light';
    meta.content = THEME_COLORS[preference === 'system' ? forScheme : theme];
  }
}

// ------------------------------------------------------------------ Zustand (ein Wert für die ganze App)

let preference: ThemePreference = 'system';
let system: Theme = 'light';
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** Ausdrückliche Wahl: anwenden und speichern; „system“ löscht den gespeicherten Eintrag. */
export function chooseTheme(next: ThemePreference) {
  preference = next;
  try {
    if (next === 'system') window.localStorage.removeItem(THEME_STORAGE_KEY);
    else window.localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    // Speicher gesperrt (z. B. privater Modus mit Sperre): Wahl gilt nur bis zum Neuladen
  }
  applyTheme(preference, system);
  emit();
}

/**
 * Einmal beim Start (main.tsx): Zustand aus Speicher und Systemeinstellung lesen, anwenden und auf Änderungen
 * hören (Systemeinstellung, Wahl in einem anderen Tab). Liefert eine Abmeldefunktion (für Tests).
 */
export function initTheme(): () => void {
  preference = storedPreference();
  system = systemTheme();
  applyTheme(preference, system);
  const query = darkQuery();
  const onSystem = (e: MediaQueryListEvent) => {
    system = e.matches ? 'dark' : 'light';
    applyTheme(preference, system);
    emit();
  };
  const onStorage = (e: StorageEvent) => {
    if (e.key !== null && e.key !== THEME_STORAGE_KEY) return;
    preference = storedPreference();
    applyTheme(preference, system);
    emit();
  };
  query?.addEventListener('change', onSystem);
  window.addEventListener('storage', onStorage);
  return () => {
    query?.removeEventListener('change', onSystem);
    window.removeEventListener('storage', onStorage);
  };
}

/** Aktuelle Wahl und wirksames Schema; setzt `initTheme()` beim Start voraus (sonst „system“/hell). */
export function useTheme(): { preference: ThemePreference; theme: Theme; choose: (next: ThemePreference) => void } {
  const pref = useSyncExternalStore(subscribe, () => preference);
  const sys = useSyncExternalStore(subscribe, () => system);
  return { preference: pref, theme: resolveTheme(pref, sys), choose: chooseTheme };
}

