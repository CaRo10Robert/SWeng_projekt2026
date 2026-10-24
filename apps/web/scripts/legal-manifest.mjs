// Vite-Plugin: schreibt beim Build dist/legal-manifest.json aus dem Front Matter der Rechtstexte (ADR-0015 Nr. 5).
// Der Server liest daraus die Version der Nutzungsbedingungen (eine Quelle) und zählt Platzhalter für LEGAL_STRICT.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Front Matter im Format `schlüssel: wert` zwischen `---`-Zeilen (wie apps/server/src/platform/legal.ts). */
function parseFrontMatter(source) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(source);
  if (!match) return { data: {}, body: source };
  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(line.trim());
    if (kv) data[kv[1]] = kv[2].replace(/^["']|["']$/g, '');
  }
  return { data, body: source.slice(match[0].length) };
}

export function buildLegalManifest(dir) {
  const documents = readdirSync(dir)
    .filter((f) => /^[a-z-]+\.[a-z]{2}\.md$/.test(f))
    .sort()
    .map((file) => {
      const [name, lang] = file.split('.');
      const source = readFileSync(resolve(dir, file), 'utf8');
      const { data, body } = parseFrontMatter(source);
      if (!data.version) throw new Error(`Rechtstext ${file}: Front Matter "version" fehlt`);
      return {
        name,
        lang,
        title: data.title ?? name,
        version: data.version,
        lastUpdated: data.last_updated ?? '',
        sample: data.sample === 'true' || /Muster im Rahmen einer Übungsaufgabe/.test(body),
        placeholders: (body.match(/\[Platzhalter:/g) ?? []).length,
        sha256: createHash('sha256').update(source).digest('hex'),
      };
    });
  return { generatedAt: new Date().toISOString(), documents };
}

/** `dir` als Pfad oder file:-URL (z. B. `new URL('./src/content/legal', import.meta.url)`). */
export function legalManifest(dir) {
  if (dir instanceof URL) dir = fileURLToPath(dir);
  return {
    name: 'campusmarkt-legal-manifest',
    apply: 'build',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'legal-manifest.json',
        source: JSON.stringify(buildLegalManifest(dir), null, 2),
      });
    },
  };
}
