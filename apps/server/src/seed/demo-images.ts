import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

/**
 * Beispielfotos der Demo-Anzeigen (REQ-DEMO-003). Sie liegen als JPEG (1200 × 900) unter
 * `apps/server/assets/demo-images/lNN-M.jpg`: NN = Position der Anzeige in DEMO_LISTINGS, M = Bildnummer ab 1.
 * Herkunft und Bildbeschreibungen: `assets/demo-images/README.md` und `prompts.json`.
 * Der Ordner liegt im Paketstamm, damit `pnpm deploy` ihn ins Laufzeit-Image übernimmt; `src/seed` und `dist/seed`
 * liegen gleich tief, daher führt derselbe relative Pfad aus Quelltext und Build zum Ordner.
 */
export const DEMO_IMAGE_DIR = resolve(import.meta.dirname, '../../assets/demo-images');

/** Dateiname des Beispielfotos Nummer `imageNumber` (ab 1) der Anzeige an Position `listingIndex`. */
export function demoImageFile(listingIndex: number, imageNumber: number): string {
  return `l${String(listingIndex).padStart(2, '0')}-${imageNumber}.jpg`;
}

/**
 * Liest das Beispielfoto; fehlt es (oder ist der Ordner nicht lesbar), liefert `fallback()` das schlichte
 * Platzhalterbild. So bleibt der Seed offline lauffähig, auch wenn Bilder fehlen (ADR-0010).
 */
export async function loadDemoImage(
  listingIndex: number,
  imageNumber: number,
  fallback: () => Promise<Buffer>,
  dir: string = DEMO_IMAGE_DIR,
): Promise<Buffer> {
  try {
    return await readFile(resolve(dir, demoImageFile(listingIndex, imageNumber)));
  } catch {
    return fallback();
  }
}
