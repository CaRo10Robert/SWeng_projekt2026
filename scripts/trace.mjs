#!/usr/bin/env node
/**
 * Nachverfolgbarkeit der Anforderungen (Guideline Kap. 01 „Stable IDs and automated traceability“,
 * Fallstudie FS-M14). Ohne Abhängigkeiten, läuft lokal und in CI.
 *
 *   node scripts/trace.mjs            Prüfen (Exit-Code 1 bei Fehlern)
 *   node scripts/trace.mjs --report   Prüfen + Statusbericht ausgeben
 *   node scripts/trace.mjs --write    Prüfen + Index in docs/02-anforderungen/02-anforderungen.md erzeugen
 *
 * Prüfungen:
 *  1. Pflichtfelder, gültige Werte, ID = Dateiname, IDs eindeutig
 *  2. Hohes Risiko ⇒ benannte Reviewer
 *  3. depends_on / supersedes zeigen auf existierende Anforderungen
 *  4. Jede Nachweis-ID ist im Nachweiskatalog (nachweise.md) definiert
 *  5. Status „verified“ ⇒ Nachweise vorhanden; automatisierte Nachweise (AT-…) kommen in Testquellen vor
 *  6. Jede in Tests markierte AT-ID ist im Katalog; jede in Doku/Code erwähnte REQ-ID existiert
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const REQ_DIR = join(ROOT, 'docs/02-anforderungen/req');
const CATALOG = join(ROOT, 'docs/02-anforderungen/nachweise.md');
const INDEX_DOC = join(ROOT, 'docs/02-anforderungen/02-anforderungen.md');
const TEST_SOURCES = ['scripts/smoke-test.mjs', 'apps/server/src', 'apps/web/src', 'e2e', 'tests'];
const REFERENCE_SOURCES = ['docs', 'apps/server/src', 'apps/web/src', 'packages/contracts/src', 'scripts', 'e2e', 'README.md'];

const ENUMS = {
  type: ['user-story', 'business-rule', 'data', 'api', 'quality', 'security', 'privacy', 'architecture', 'operational', 'discovery'],
  class: ['functional', 'quality', 'domain', 'constraint'],
  status: ['draft', 'in-review', 'approved', 'implemented', 'verified', 'operational', 'rejected', 'deprecated', 'obsolete'],
  risk: ['low', 'medium', 'high'],
  moscow: ['M', 'S', 'C', 'W'],
  kano: ['basis', 'leistung', 'begeisterung', 'n/a'],
};
const REQUIRED = ['id', 'title', 'type', 'class', 'status', 'owner', 'risk', 'release', 'moscow', 'kano', 'epic', 'source', 'version', 'created', 'last_updated'];
/** Zuordnung Lebenszyklus (Guideline) → Stufenmodell der Vorlesung (Folie 26). */
const STAGE = {
  draft: 'Platzhalter', 'in-review': 'Konkretisiert', approved: 'Konkretisiert (bereit)', implemented: 'Umsetzung',
  verified: 'Test', operational: 'Freigabe/Lieferung', rejected: '–', deprecated: '–', obsolete: '–',
};

const errors = [];
const warnings = [];
const err = (file, msg) => errors.push(`${file}: ${msg}`);

function walk(path, out = []) {
  let info;
  try { info = statSync(path); } catch { return out; }
  if (info.isFile()) return out.concat(path);
  for (const entry of readdirSync(path)) {
    if (['node_modules', 'dist', '.turbo', 'dev-dist'].includes(entry)) continue;
    walk(join(path, entry), out);
  }
  return out;
}

/** Minimaler Front-Matter-Parser: `key: value`, Inline-Listen `[a, b]`, Kommentare. */
function parseFrontMatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  const data = {};
  for (const raw of match[1].split(/\r?\n/)) {
    const line = raw.replace(/\s+#.*$/, '').trimEnd();
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const m = line.match(/^([a-z_]+):\s*(.*)$/);
    if (!m) continue;
    let value = m[2].trim();
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1).split(',').map((v) => v.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    } else {
      value = value.replace(/^["']|["']$/g, '');
    }
    data[m[1]] = value;
  }
  return data;
}

// ------------------------------------------------------------------ Anforderungen laden
const files = readdirSync(REQ_DIR).filter((f) => /^REQ-[A-Z0-9]+-\d{3}\.md$/.test(f)).sort();
const reqs = new Map();
for (const file of files) {
  const text = readFileSync(join(REQ_DIR, file), 'utf8');
  const fm = parseFrontMatter(text);
  if (!fm) { err(file, 'Front Matter fehlt'); continue; }
  for (const key of REQUIRED) if (!fm[key] || (Array.isArray(fm[key]) && !fm[key].length)) err(file, `Pflichtfeld ${key} fehlt`);
  for (const [key, allowed] of Object.entries(ENUMS)) {
    if (fm[key] && !allowed.includes(fm[key])) err(file, `${key} = "${fm[key]}" ungültig (erlaubt: ${allowed.join(', ')})`);
  }
  if (fm.id !== file.replace(/\.md$/, '')) err(file, `id ${fm.id} passt nicht zum Dateinamen`);
  if (reqs.has(fm.id)) err(file, `doppelte ID ${fm.id}`);
  if (fm.risk === 'high' && !(Array.isArray(fm.reviewers) && fm.reviewers.length)) err(file, 'hohes Risiko ohne reviewers');
  if (!new RegExp(`^# ${fm.id} `, 'm').test(text)) err(file, 'Überschrift „# <ID> <Titel>“ fehlt');
  if (fm.type === 'user-story' && !/^## Akzeptanzkriterien/m.test(text)) err(file, 'User Story ohne Akzeptanzkriterien');
  if (fm.class === 'quality' && !/^## Qualitätsmerkmal, Metrik, Messverfahren/m.test(text)) err(file, 'Qualitätsanforderung ohne Merkmal/Metrik/Messverfahren');
  if (['medium', 'high'].includes(fm.risk) && fm.type !== 'quality' && fm.class !== 'quality' && !/^## Fehler- und Missbrauchsfälle/m.test(text)) {
    warnings.push(`${file}: Risiko ${fm.risk} ohne Abschnitt „Fehler- und Missbrauchsfälle“`);
  }
  for (const key of ['depends_on', 'use_cases', 'reviewers', 'verification']) {
    if (fm[key] !== undefined && !Array.isArray(fm[key])) fm[key] = [fm[key]];
  }
  reqs.set(fm.id, { ...fm, file });
}

for (const r of reqs.values()) {
  for (const dep of [...(r.depends_on ?? []), ...(r.supersedes ? [r.supersedes] : [])]) {
    if (!reqs.has(dep)) err(r.file, `verweist auf unbekannte Anforderung ${dep}`);
  }
  for (const v of r.verification ?? []) {
    if (!/^(AT|MAN|CTRL)-[A-Z0-9-]+$/.test(v)) err(r.file, `Nachweis-ID ${v} hat ungültiges Format`);
  }
}

// ------------------------------------------------------------------ Nachweiskatalog und Testquellen
const catalogText = (() => { try { return readFileSync(CATALOG, 'utf8'); } catch { return ''; } })();
if (!catalogText) err('nachweise.md', 'Nachweiskatalog fehlt');
const catalogIds = new Set([...catalogText.matchAll(/^\|\s*`?((?:AT|MAN|CTRL)-[A-Z0-9-]+)`?\s*\|/gm)].map((m) => m[1]));

const testFiles = TEST_SOURCES.flatMap((p) => walk(join(ROOT, p))).filter((f) => /\.(m?[jt]sx?)$/.test(f));
const taggedInTests = new Map();
for (const f of testFiles) {
  for (const m of readFileSync(f, 'utf8').matchAll(/\b(AT-[A-Z0-9]+-[A-Z0-9-]*[A-Z0-9])\b/g)) {
    if (!taggedInTests.has(m[1])) taggedInTests.set(m[1], relative(ROOT, f).split(sep).join('/'));
  }
}

const allVerification = new Set([...reqs.values()].flatMap((r) => r.verification ?? []));
for (const r of reqs.values()) {
  for (const v of r.verification ?? []) if (!catalogIds.has(v)) err(r.file, `Nachweis ${v} fehlt im Nachweiskatalog`);
  if (['verified', 'operational'].includes(r.status)) {
    if (!(r.verification ?? []).length) err(r.file, `Status ${r.status} ohne Nachweise`);
    for (const v of r.verification ?? []) {
      if (v.startsWith('AT-') && !taggedInTests.has(v)) err(r.file, `Status ${r.status}, aber ${v} kommt in keinem Test vor`);
    }
  }
}
for (const [id, file] of taggedInTests) {
  if (!catalogIds.has(id)) err(file, `Test markiert ${id}, das nicht im Nachweiskatalog steht`);
}
for (const id of catalogIds) if (!allVerification.has(id)) warnings.push(`nachweise.md: ${id} wird von keiner Anforderung verwendet`);

const referenceFiles = REFERENCE_SOURCES.flatMap((p) => walk(join(ROOT, p))).filter((f) => /\.(md|m?[jt]sx?)$/.test(f) && !f.includes(`${sep}req${sep}_TEMPLATE.md`));
for (const f of referenceFiles) {
  const text = readFileSync(f, 'utf8');
  for (const m of text.matchAll(/\bREQ-([A-Z0-9]+)-(\d{3})\b/g)) {
    const id = `REQ-${m[1]}-${m[2]}`;
    if (!reqs.has(id)) err(relative(ROOT, f), `erwähnt unbekannte Anforderung ${id}`);
  }
}

// ------------------------------------------------------------------ Bericht und Index
const list = [...reqs.values()];
const count = (pred) => list.filter(pred).length;
const pct = (a, b) => (b ? `${Math.round((a / b) * 100)} %` : '–');
const done = (r) => ['verified', 'operational'].includes(r.status);
const r1Must = list.filter((r) => r.release === 'R1' && r.moscow === 'M');

function summary() {
  const lines = [];
  lines.push(`Anforderungen: ${list.length}`);
  for (const s of ENUMS.status) {
    const n = count((r) => r.status === s);
    if (n) lines.push(`  ${s.padEnd(12)} ${String(n).padStart(3)}  (${STAGE[s]})`);
  }
  lines.push(`R1-Must verifiziert: ${count((r) => r1Must.includes(r) && done(r))}/${r1Must.length} (${pct(count((r) => r1Must.includes(r) && done(r)), r1Must.length)})`);
  lines.push(`Gesamt verifiziert: ${pct(count(done), list.length)}`);
  return lines.join('\n');
}

function indexMarkdown() {
  const rows = list.map((r) =>
    `| [${r.id}](req/${r.file}) | ${r.title} | ${r.class} | ${r.moscow} | ${r.kano} | ${r.risk} | ${r.status} | ${(r.verification ?? []).join(', ') || '–'} |`);
  const stats = ENUMS.status.filter((s) => count((r) => r.status === s))
    .map((s) => `| ${s} | ${STAGE[s]} | ${count((r) => r.status === s)} |`);
  return [
    '<!-- req-index:start (generiert mit `node scripts/trace.mjs --write`, nicht von Hand bearbeiten) -->',
    '',
    `**Stand:** ${list.length} Anforderungen · R1-Must verifiziert: ${count((r) => r1Must.includes(r) && done(r))} von ${r1Must.length} (${pct(count((r) => r1Must.includes(r) && done(r)), r1Must.length)})`,
    '',
    '| Status | Stufe (Vorlesung) | Anzahl |',
    '|---|---|---|',
    ...stats,
    '',
    '| ID | Titel | Klasse | MoSCoW (R1) | Kano | Risiko | Status | Nachweise |',
    '|---|---|---|---|---|---|---|---|',
    ...rows,
    '',
    '<!-- req-index:end -->',
  ].join('\n');
}

if (process.argv.includes('--write')) {
  const doc = readFileSync(INDEX_DOC, 'utf8');
  const updated = doc.replace(/<!-- req-index:start[\s\S]*?<!-- req-index:end -->/, indexMarkdown());
  if (updated === doc && !doc.includes('<!-- req-index:start')) err('02-anforderungen.md', 'Marker <!-- req-index:start --> fehlt');
  else writeFileSync(INDEX_DOC, updated);
}

for (const w of warnings) console.warn(`⚠ ${w}`);
for (const e of errors) console.error(`✘ ${e}`);
if (process.argv.includes('--report') || process.argv.includes('--write')) console.log(`\n${summary()}`);
console.log(errors.length ? `\n${errors.length} Fehler` : `\nTraceability ok (${list.length} Anforderungen, ${taggedInTests.size} markierte Tests)`);
process.exit(errors.length ? 1 : 0);
