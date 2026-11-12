import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Website-Hygiene ohne Browser (REQ-UX-010): Pflichtangaben im Kopf von index.html und ein vollständiger Icon-Satz in
 * public/ mit den richtigen Pixelmaßen. Schnelle Rückmeldung im CI-Job „checks“; der Browser-Test AT-UX-010 prüft
 * dieselben Dinge am laufenden Docker-Beispiel.
 */
const web = join(import.meta.dirname, '..');
const html = readFileSync(join(web, 'index.html'), 'utf8');
const file = (name: string) => readFileSync(join(web, 'public', name));

/** Breite und Höhe aus dem IHDR-Block einer PNG-Datei. */
const pngSize = (png: Buffer) => {
  expect(png.subarray(1, 4).toString('ascii')).toBe('PNG');
  return [png.readUInt32BE(16), png.readUInt32BE(20)];
};

describe('[AT-UX-010-2] Kopf der Startseite und Icon-Satz (REQ-UX-010)', () => {
  it.each([
    ['Sprache', /<html lang="de">/],
    ['Zeichensatz', /<meta charset="UTF-8" \/>/],
    ['Viewport', /<meta name="viewport" content="width=device-width, initial-scale=1.0" \/>/],
    ['Beschreibung', /<meta name="description" content="CampusMarkt[^"]+" \/>/],
    ['keine Indexierung', /<meta name="robots" content="noindex, nofollow" \/>/],
    ['Farbschemata', /<meta name="color-scheme" content="light dark" \/>/],
    ['Browserleiste hell', /<meta name="theme-color" content="#[0-9a-f]{6}" media="\(prefers-color-scheme: light\)" \/>/],
    ['Browserleiste dunkel', /<meta name="theme-color" content="#[0-9a-f]{6}" media="\(prefers-color-scheme: dark\)" \/>/],
    ['Favicon ICO', /<link rel="icon" href="\/favicon.ico" sizes="32x32" \/>/],
    ['Favicon SVG', /<link rel="icon" href="\/icon.svg" type="image\/svg\+xml" \/>/],
    ['Apple Touch Icon', /<link rel="apple-touch-icon" href="\/apple-touch-icon.png" \/>/],
    ['Titel', /<title>CampusMarkt HWG LU<\/title>/],
    ['Hinweis ohne JavaScript', /<noscript>[^<]+<\/noscript>/],
  ])('%s', (_name, pattern) => {
    expect(html).toMatch(pattern);
  });

  it('keine externen Ressourcen im Kopf (ADR-0010)', () => {
    expect(html).not.toMatch(/(src|href)="(https?:)?\/\//);
  });

  it.each([
    ['apple-touch-icon.png', 180],
    ['icon-192.png', 192],
    ['icon-512.png', 512],
    ['icon-maskable-512.png', 512],
  ])('%s hat %i × %i px', (name, size) => {
    expect(pngSize(file(name))).toEqual([size, size]);
  });

  it('favicon.ico enthält 16, 32 und 48 px', () => {
    const ico = file('favicon.ico');
    expect(ico.readUInt16LE(2)).toBe(1);
    const count = ico.readUInt16LE(4);
    const sizes = Array.from({ length: count }, (_, i) => ico.readUInt8(6 + 16 * i));
    expect(sizes).toEqual([16, 32, 48]);
  });
});
