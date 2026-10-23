#!/usr/bin/env node
/**
 * Rendert alle Mermaid-Diagramme der Dokumentation und schlägt bei Syntaxfehlern fehl
 * (ADR-0012, Guideline Kap. 12). Nutzt mermaid-cli über npx, ohne Projektabhängigkeit.
 *
 *   node scripts/check-diagrams.mjs [--out <ordner>]
 *
 * Browser: In CI lädt Puppeteer Chromium selbst. Lokal kann ein installierter Browser
 * genutzt werden: CHROME_PATH="C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const outArg = process.argv.indexOf('--out');
const work = mkdtempSync(join(tmpdir(), 'mermaid-'));
const out = outArg > 0 ? process.argv[outArg + 1] : work;
mkdirSync(out, { recursive: true });

const walk = (p) => statSync(p).isDirectory() ? readdirSync(p).flatMap((e) => walk(join(p, e))) : [p];
const files = walk(join(ROOT, 'docs')).filter((f) => f.endsWith('.md'));

const config = join(work, 'puppeteer.json');
writeFileSync(config, JSON.stringify({
  headless: 'new',
  args: ['--no-sandbox'],
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
}));

let count = 0;
const failures = [];
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  let i = 0;
  for (const m of text.matchAll(/```mermaid\r?\n([\s\S]*?)```/g)) {
    i++;
    count++;
    const name = `${relative(ROOT, file).replace(/[\\/]/g, '_').replace(/\.md$/, '')}_${i}`;
    const input = join(work, `${name}.mmd`);
    writeFileSync(input, m[1]);
    try {
      execFileSync('npx', ['-y', '-p', '@mermaid-js/mermaid-cli@11', 'mmdc', '-q', '-p', config, '-i', input, '-o', join(out, `${name}.svg`)], {
        stdio: 'pipe',
        shell: process.platform === 'win32',
        env: { ...process.env, PUPPETEER_SKIP_DOWNLOAD: process.env.CHROME_PATH ? '1' : '' },
      });
      console.log(`✔ ${relative(ROOT, file)} #${i}`);
    } catch (error) {
      const msg = String(error.stderr || error.message).split('\n').find((l) => /error/i.test(l)) ?? 'Renderfehler';
      failures.push(`${relative(ROOT, file)} #${i}: ${msg.trim()}`);
      console.error(`✘ ${relative(ROOT, file)} #${i}: ${msg.trim()}`);
    }
  }
}
console.log(failures.length ? `\n${failures.length} von ${count} Diagrammen fehlerhaft` : `\n${count} Diagramme ok`);
process.exit(failures.length ? 1 : 0);
