import { existsSync, statSync } from 'node:fs';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { DEMO_LISTINGS } from './demo-data.js';
import { DEMO_IMAGE_DIR, demoImageFile, loadDemoImage } from './demo-images.js';

const slots = DEMO_LISTINGS.flatMap((l, index) =>
  Array.from({ length: l.images ?? 0 }, (_, i) => ({ index, n: i + 1, title: l.title })),
);

describe('Beispielfotos der Demo-Anzeigen (REQ-DEMO-003)', () => {
  it('[AT-DEMO-003] jede Demo-Anzeige mit Bildern hat ihre Fotos: JPEG 1200 × 900, höchstens 350 KB', async () => {
    expect(slots.length).toBeGreaterThan(0);
    for (const s of slots) {
      const file = join(DEMO_IMAGE_DIR, demoImageFile(s.index, s.n));
      expect(existsSync(file), `${file} fehlt (${s.title})`).toBe(true);
      expect(statSync(file).size, `${file} zu groß`).toBeLessThanOrEqual(350 * 1024);
      const meta = await sharp(file).metadata();
      expect([meta.format, meta.width, meta.height], file).toEqual(['jpeg', 1200, 900]);
    }
  });

  it('[AT-DEMO-003-2] fehlt ein Foto, liefert der Seed das Platzhalterbild (offline lauffähig, ADR-0010)', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'demo-images-'));
    await writeFile(join(dir, demoImageFile(3, 1)), Buffer.from('foto'));
    const fallback = async () => Buffer.from('platzhalter');
    expect((await loadDemoImage(3, 1, fallback, dir)).toString()).toBe('foto');
    expect((await loadDemoImage(3, 2, fallback, dir)).toString()).toBe('platzhalter');
    expect((await loadDemoImage(0, 1, fallback, join(dir, 'gibt-es-nicht'))).toString()).toBe('platzhalter');
  });

  it('Dateinamen: Position zweistellig, Bildnummer ab 1', () => {
    expect(demoImageFile(3, 1)).toBe('l03-1.jpg');
    expect(demoImageFile(17, 2)).toBe('l17-2.jpg');
  });
});
