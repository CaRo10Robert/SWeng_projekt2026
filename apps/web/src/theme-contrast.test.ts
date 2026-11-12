import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Kontrastmatrix der Farb-Tokens in beiden Schemata (REQ-UX-008, REQ-A11Y-001, WCAG 2.2 SC 1.4.3 und 1.4.11).
 * Liest die Tailwind-Standardpalette (oklch), die eigenen Tokens aus `@theme` und die Umdeutung unter `.dark`
 * aus index.css und prüft jede Paarung, die in den Komponenten vorkommt. Ergänzt die axe-Prüfung im Browser
 * (AT-UX-008-3), die nur sichtbare Zustände sieht (z. B. kein Hover, keine Fehlermeldung ohne Fehler).
 */

// Rohtext lesen: Vitest ersetzt CSS-Importe (auch ?raw) durch leere Module
const css = readFileSync(join(import.meta.dirname, 'index.css'), 'utf8');
const tailwindTheme = readFileSync(createRequire(import.meta.filename).resolve('tailwindcss/theme.css'), 'utf8');

const vars = (text: string) => new Map([...text.matchAll(/--color-([a-z]+(?:-\d+)?):\s*([^;]+);/g)].map((m) => [m[1]!, m[2]!.trim()]));
const block = (text: string, selector: RegExp) => text.match(selector)?.[1] ?? '';

const defaults = vars(tailwindTheme);
const own = vars(block(css, /@theme\s*\{([\s\S]*?)\}/));
const dark = vars(block(css, /:root\.dark\s*\{([\s\S]*?)\}/));

type Rgb = [number, number, number];

/** oklch(L% C H) → lineares sRGB (Björn Ottosson, OKLab). */
function oklchToLinear(value: string): Rgb {
  const [l, c, h] = value.replace(/oklch\(|\)/g, '').split(/\s+/);
  const L = parseFloat(l!) / 100;
  const C = parseFloat(c!);
  const H = (parseFloat(h!) * Math.PI) / 180;
  const a = C * Math.cos(H);
  const b = C * Math.sin(H);
  const l_ = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const clamp = (x: number) => Math.min(1, Math.max(0, x));
  return [
    clamp(4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_),
    clamp(-1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_),
    clamp(-0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_),
  ];
}

const hexToLinear = (hex: string): Rgb => {
  const n = hex.replace('#', '');
  const full = n.length === 3 ? [...n].map((x) => x + x).join('') : n;
  return [0, 2, 4].map((i) => {
    const v = parseInt(full.slice(i, i + 2), 16) / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  }) as Rgb;
};

const toLinear = (value: string): Rgb => (value.startsWith('oklch') ? oklchToLinear(value) : hexToLinear(value));
const luminance = ([r, g, b]: Rgb) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const ratio = (a: Rgb, b: Rgb) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};

function color(token: string, scheme: 'light' | 'dark'): Rgb {
  const value = (scheme === 'dark' ? dark.get(token) : undefined) ?? own.get(token) ?? defaults.get(token);
  if (!value) throw new Error(`Token ${token} unbekannt`);
  return toLinear(value);
}

/** [Vordergrund, Hintergrund, Mindestkontrast, Verwendung] – Text 4,5:1, Bedienelemente und Rahmen 3:1. */
const PAIRS: [string, string, number, string][] = [
  // Text auf Flächen (Seite, Karte, getönte Fläche)
  ...['slate-900', 'slate-800', 'slate-700', 'slate-600'].flatMap((fg) =>
    ['white', 'slate-50', 'slate-100'].map((bg) => [fg, bg, 4.5, 'Text'] as [string, string, number, string]),
  ),
  ['slate-800', 'slate-200', 4.5, 'Badge neutral'],
  ['slate-500', 'white', 4.5, 'Platzhalter in Feldern'],
  ['brand-700', 'white', 4.5, 'Link'],
  ['brand-700', 'slate-50', 4.5, 'Link auf Seitenhintergrund'],
  ['brand-700', 'brand-50', 4.5, 'Ghost-Button beim Überfahren'],
  ['brand-800', 'white', 4.5, 'Preis, Überschrift Startseite'],
  ['brand-800', 'brand-50', 4.5, 'Hinweis info'],
  ['brand-800', 'brand-100', 4.5, 'aktiver Menüpunkt, Badge info'],
  ['white', 'brand-700', 4.5, 'Primär-Button, eigene Chatnachricht, aktive Umschalter'],
  ['white', 'brand-800', 4.5, 'Primär-Button beim Überfahren'],
  ['white', 'red-700', 4.5, 'Gefahr-Button, Zähler ungelesen'],
  ['white', 'red-800', 4.5, 'Gefahr-Button beim Überfahren'],
  ['red-700', 'white', 4.5, 'Fehlertext am Feld'],
  ['red-700', 'slate-50', 4.5, 'Fehlertext auf Seitenhintergrund'],
  ['red-900', 'red-50', 4.5, 'Hinweis Fehler'],
  ['red-900', 'red-100', 4.5, 'Badge Gefahr'],
  ['green-900', 'green-50', 4.5, 'Hinweis Erfolg'],
  ['green-900', 'green-100', 4.5, 'Badge Erfolg'],
  ['green-800', 'white', 4.5, 'Text Erfolg'],
  ['amber-900', 'amber-50', 4.5, 'Hinweis Warnung, Echtzeit-Hinweis'],
  ['amber-900', 'amber-100', 4.5, 'Badge Warnung'],
  ['amber-950', 'amber-50', 4.5, 'Ankündigung'],
  ['sky-950', 'sky-50', 4.5, 'Hinweis neue Datenschutzerklärung'],
  // Nicht-Text-Kontrast (SC 1.4.11)
  ['slate-500', 'white', 3, 'Rahmen von Eingabefeldern und Sekundär-Buttons'],
  ['slate-500', 'slate-50', 3, 'Rahmen von Eingabefeldern auf Seitenhintergrund'],
  ['brand-600', 'white', 3, 'Fokusrahmen auf Fläche'],
  ['brand-600', 'slate-50', 3, 'Fokusrahmen auf Seitenhintergrund'],
  ['red-700', 'white', 3, 'Rahmen ungültiges Feld'],
];

describe('[AT-UX-008-2] Kontrast der Farb-Tokens in hellem und dunklem Schema (REQ-UX-008, REQ-A11Y-001)', () => {
  it('jedes umgedeutete Token hat einen hellen Gegenpart', () => {
    for (const token of dark.keys()) expect(own.has(token) || defaults.has(token), token).toBe(true);
  });

  for (const scheme of ['light', 'dark'] as const) {
    it(`${scheme}: alle Paarungen erreichen den Mindestkontrast`, () => {
      const failures = PAIRS.map(([fg, bg, min, use]) => ({ fg, bg, min, use, ratio: ratio(color(fg, scheme), color(bg, scheme)) }))
        .filter((p) => p.ratio < p.min)
        .map((p) => `${p.fg} auf ${p.bg}: ${p.ratio.toFixed(2)} < ${p.min} (${p.use})`);
      expect(failures).toEqual([]);
    });
  }

  it('dunkles Schema deutet jedes Token um, das eine Paarung nutzt (kein helles Token bleibt stehen)', () => {
    const used = new Set(PAIRS.flatMap(([fg, bg]) => [fg, bg]));
    expect([...used].filter((token) => !dark.has(token))).toEqual([]);
  });
});
