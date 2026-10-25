#!/usr/bin/env node
/**
 * Prüft die Übersetzungen der Web-App (ADR-0016, REQ-UX-007):
 *   1. de.json und en.json haben dieselben Schlüssel,
 *   2. jeder im Code verwendete Schlüssel existiert, jeder vorhandene wird verwendet,
 *   3. alle Nachrichten sind gültiges ICU MessageFormat mit denselben Platzhaltern in beiden Sprachen,
 *   4. englische Lesefassungen der Inhalte (apps/web/src/content/**\/*.en.md) gibt es zu jeder deutschen Datei,
 *      mit gleicher Version und den Anker-IDs der deutschen Überschriften.
 *   node scripts/check-i18n.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WEB = join(ROOT, 'apps/web/src');
const I18N = join(WEB, 'i18n');
const CONTENT = join(WEB, 'content');

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

/** ICU-Parser aus der Abhängigkeit von react-intl (pnpm legt ihn nicht im Wurzelverzeichnis ab). */
async function loadParser() {
  const fromWeb = createRequire(join(ROOT, 'apps/web/package.json'));
  const fromIntl = createRequire(fromWeb.resolve('react-intl'));
  return import(pathToFileURL(fromIntl.resolve('@formatjs/icu-messageformat-parser')).href);
}

/** Namen aller Argumente einer geparsten Nachricht (inkl. Tags für Rich Text). */
function argumentNames(ast, out = new Set()) {
  for (const el of ast) {
    if ('value' in el && typeof el.value === 'string' && el.type !== 0 && el.type !== 7) out.add(el.value);
    if (el.options) for (const opt of Object.values(el.options)) argumentNames(opt.value, out);
    if (el.children) argumentNames(el.children, out);
  }
  return out;
}

const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

function headingIds(markdown) {
  const ids = [];
  let inCode = false;
  for (const line of markdown.split(/\r?\n/)) {
    if (line.startsWith('```')) inCode = !inCode;
    const m = !inCode && /^#{2,3}\s+(.+?)\s*#*$/.exec(line);
    if (!m) continue;
    const explicit = /\s*\{#([a-z0-9-]+)\}\s*$/.exec(m[1]);
    const text = (explicit ? m[1].slice(0, explicit.index) : m[1]).replace(/[*_`]/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').trim();
    ids.push(explicit ? explicit[1] : slugify(text));
  }
  return ids;
}

const frontMatter = (src) => Object.fromEntries([...(/^---\r?\n([\s\S]*?)\r?\n---/.exec(src)?.[1] ?? '').matchAll(/^(\w+):\s*(.*)$/gm)].map((m) => [m[1], m[2].trim()]));

export async function checkI18n() {
  const errors = [];
  const de = JSON.parse(readFileSync(join(I18N, 'de.json'), 'utf8'));
  const en = JSON.parse(readFileSync(join(I18N, 'en.json'), 'utf8'));
  const deKeys = Object.keys(de);
  const enKeys = new Set(Object.keys(en));

  // 1. Gleiche Schlüsselmengen
  for (const k of deKeys) if (!enKeys.has(k)) errors.push(`en.json: Schlüssel fehlt: ${k}`);
  for (const k of enKeys) if (!(k in de)) errors.push(`de.json: Schlüssel fehlt: ${k}`);

  // 2. Verwendung im Code: String-Literale mit Schlüsselform; dynamische Präfixe wie t(`apiError.${code}`)
  const sources = walk(WEB).filter((f) => /\.(tsx?|mts)$/.test(f) && !f.includes(`${sep}i18n${sep}`));
  const used = new Set();
  const prefixes = new Set();
  const missing = [];
  for (const file of sources) {
    const src = readFileSync(file, 'utf8');
    for (const m of src.matchAll(/['"]([a-z][A-Za-z0-9]*(?:\.[A-Za-z0-9_]+)+)['"]/g)) if (m[1] in de) used.add(m[1]);
    for (const m of src.matchAll(/\b(?:t|tx|tMaybe)\(\s*`([a-zA-Z0-9_.]+)\.\$\{/g)) prefixes.add(`${m[1]}.`);
    for (const m of src.matchAll(/\b(?:t|tx)\(\s*'([^']+)'/g)) {
      if (!(m[1] in de)) missing.push(`${relative(ROOT, file)}: unbekannter Schlüssel ${m[1]}`);
    }
  }
  errors.push(...missing);
  const unused = deKeys.filter((k) => !used.has(k) && ![...prefixes].some((p) => k.startsWith(p)));
  for (const k of unused) errors.push(`de.json: nicht verwendeter Schlüssel ${k}`);

  // 3. ICU-Syntax und gleiche Platzhalter
  const { parse } = await loadParser();
  for (const k of deKeys) {
    let deArgs;
    let enArgs;
    try {
      deArgs = argumentNames(parse(de[k]));
    } catch (e) {
      errors.push(`de.json ${k}: ungültiges ICU (${e.message})`);
    }
    if (!(k in en)) continue;
    try {
      enArgs = argumentNames(parse(en[k]));
    } catch (e) {
      errors.push(`en.json ${k}: ungültiges ICU (${e.message})`);
    }
    if (deArgs && enArgs) {
      const a = [...deArgs].sort().join(',');
      const b = [...enArgs].sort().join(',');
      if (a !== b) errors.push(`${k}: Platzhalter unterscheiden sich (de: ${a || '–'}, en: ${b || '–'})`);
    }
  }

  // 4. Englische Lesefassungen der Inhalte
  const contentFiles = walk(CONTENT).filter((f) => f.endsWith('.de.md'));
  for (const deFile of contentFiles) {
    const enFile = deFile.replace(/\.de\.md$/, '.en.md');
    const rel = relative(ROOT, enFile);
    let enSrc;
    try {
      enSrc = readFileSync(enFile, 'utf8');
    } catch {
      errors.push(`${rel}: englische Lesefassung fehlt`);
      continue;
    }
    const deSrc = readFileSync(deFile, 'utf8');
    if (frontMatter(deSrc).version !== frontMatter(enSrc).version) errors.push(`${rel}: Version weicht von der deutschen Fassung ab`);
    if (!enSrc.includes('Only the German version is legally binding')) errors.push(`${rel}: Hinweis auf die verbindliche deutsche Fassung fehlt`);
    const deIds = headingIds(deSrc);
    const enIds = new Set(headingIds(enSrc));
    for (const id of deIds) if (!enIds.has(id)) errors.push(`${rel}: Anker #${id} der deutschen Fassung fehlt (Überschrift mit {#${id}} versehen)`);
  }

  return { errors, keys: deKeys.length, files: sources.length, contents: contentFiles.length };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const { errors, keys, files, contents } = await checkI18n();
  for (const e of errors) console.error(`✘ ${e}`);
  if (errors.length) {
    console.error(`\n${errors.length} Fehler in den Übersetzungen`);
    process.exit(1);
  }
  console.log(`i18n ok: ${keys} Schlüssel in de/en, ${files} Quelldateien, ${contents} Inhalte mit englischer Lesefassung`);
}
