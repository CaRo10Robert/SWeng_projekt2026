// Erzeugt die Rastergrafiken des Icon-Satzes aus public/icon.svg (REQ-UX-010):
//   favicon.ico (16/32/48 px), icon-192.png, icon-512.png (Manifest, „any“), icon-maskable-512.png (Manifest,
//   „maskable“, randlos) und apple-touch-icon.png (180 px, randlos und deckend, iOS rundet selbst ab).
// Gerendert wird mit dem Browser aus dem E2E-Paket (Playwright), damit die Schrift im Logo wie im Browser aussieht.
//   node apps/web/scripts/generate-icons.mjs        (ICON_BROWSER_CHANNEL=chromium für das mitgelieferte Chromium)
// Die erzeugten Dateien werden eingecheckt; das Skript läuft nur, wenn sich icon.svg ändert.
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const publicDir = fileURLToPath(new URL('../public/', import.meta.url));
const require = createRequire(new URL('../../../e2e/package.json', import.meta.url));
const { chromium } = require('@playwright/test');

const svg = readFileSync(`${publicDir}icon.svg`, 'utf8');
// Randlos: ohne abgerundete Ecken, damit Plattformen ihre eigene Maske anlegen können (Inhalt liegt in der Schutzzone)
const fullBleed = svg.replace(/\s+rx="\d+"/, '');

const channel = process.env.ICON_BROWSER_CHANNEL ?? 'msedge';
const browser = await chromium.launch(channel === 'chromium' ? {} : { channel });
const page = await browser.newPage({ deviceScaleFactor: 1 });

async function render(source, size, transparent) {
  await page.setViewportSize({ width: size, height: size });
  const src = `data:image/svg+xml;base64,${Buffer.from(source).toString('base64')}`;
  await page.setContent(`<html><body style="margin:0"><img src="${src}" width="${size}" height="${size}" style="display:block"></body></html>`);
  await page.locator('img').evaluate((img) => img.decode());
  return page.screenshot({ clip: { x: 0, y: 0, width: size, height: size }, omitBackground: transparent });
}

/** ICO-Container mit PNG-Einträgen (seit Windows Vista von allen Browsern unterstützt). */
function ico(images) {
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, png }, i) => {
    const entry = 6 + 16 * i;
    header.writeUInt8(size >= 256 ? 0 : size, entry);
    header.writeUInt8(size >= 256 ? 0 : size, entry + 1);
    header.writeUInt8(0, entry + 2);
    header.writeUInt8(0, entry + 3);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(png.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += png.length;
  });
  return Buffer.concat([header, ...images.map((i) => i.png)]);
}

const favicon = [];
for (const size of [16, 32, 48]) favicon.push({ size, png: await render(svg, size, true) });
writeFileSync(`${publicDir}favicon.ico`, ico(favicon));
writeFileSync(`${publicDir}icon-192.png`, await render(svg, 192, true));
writeFileSync(`${publicDir}icon-512.png`, await render(svg, 512, true));
writeFileSync(`${publicDir}icon-maskable-512.png`, await render(fullBleed, 512, false));
writeFileSync(`${publicDir}apple-touch-icon.png`, await render(fullBleed, 180, false));
await browser.close();
console.log('Icons erzeugt in', publicDir);
