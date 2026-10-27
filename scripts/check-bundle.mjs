#!/usr/bin/env node
/**
 * JS-Budget der Web-App (Guideline Kap. 03 „Performance budget (enforced in CI)“, GL-11; REQ-PERF-005 LCP).
 *
 *   node scripts/check-bundle.mjs [apps/web/dist]      → Exit 1, wenn ein Budget überschritten ist
 *
 * Gemessen wird gzip-komprimiert, weil das die übertragene Größe ist:
 *   - initial: alles JS, das `index.html` sofort lädt (Entry-Skript und `modulepreload`) – bestimmt den Start jeder Route
 *   - chunk:   der größte nachgeladene Chunk (Rechtstexte, Markdown, Englisch, Seiten)
 * Die SPA lädt alle Routen über denselben Entry; ein Budget „je Route“ ist hier deshalb das Startbudget plus der
 * größte Chunk, den eine Route nachlädt.
 *
 * Budgets: gemessener Stand vom 2026-10-26 plus etwa 10 % Puffer. Wer sie anhebt, begründet das im PR.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

export const BUDGET_KB = { initial: 177, chunk: 53 };

const dist = process.argv[2] ?? 'apps/web/dist';
const html = readFileSync(join(dist, 'index.html'), 'utf8');
const initialFiles = [...html.matchAll(/(?:src|href)="\/(assets\/[^"]+\.js)"/g)].map((m) => m[1]);
const gz = (file) => gzipSync(readFileSync(join(dist, file))).length / 1024;

const initial = [...new Set(initialFiles)].reduce((sum, f) => sum + gz(f), 0);
const lazy = readdirSync(join(dist, 'assets'))
  .filter((f) => f.endsWith('.js') && !initialFiles.includes(`assets/${f}`))
  .map((f) => ({ file: f, kb: gz(`assets/${f}`) }))
  .sort((a, b) => b.kb - a.kb);
const biggest = lazy[0] ?? { file: '–', kb: 0 };

const rows = [
  ['initial (Entry + modulepreload)', initial, BUDGET_KB.initial],
  [`größter Chunk (${biggest.file})`, biggest.kb, BUDGET_KB.chunk],
];
let failed = false;
for (const [label, kb, budget] of rows) {
  const ok = kb <= budget;
  failed ||= !ok;
  console.log(`${ok ? '✔' : '✘'} ${label}: ${kb.toFixed(1)} kB gzip (Budget ${budget} kB)`);
}
console.log(`${lazy.length} nachgeladene Chunks, ${initialFiles.length} initiale Dateien`);
process.exit(failed ? 1 : 0);
