// Rechtstexte und Hilfe als versionierte Markdown-Dateien (ADR-0015). Jede Datei wird zur Build-Zeit
// gebündelt und erst beim Aufruf der Seite nachgeladen (eigener Chunk je Seite, keine externen Quellen).

const loaders = import.meta.glob<string>('../content/**/*.md', { query: '?raw', import: 'default' });

export type LegalPageName = 'impressum' | 'datenschutz' | 'nutzungsbedingungen' | 'community-regeln' | 'barrierefreiheit' | 'kontakt';
export type ContentName = `legal/${LegalPageName}` | 'help/faq';

export interface ContentDocument {
  title: string;
  version: string;
  lastUpdated: string;
  /** Muster im Rahmen der Übungsaufgabe (Front Matter `sample: true` oder Hinweistext im Inhalt). */
  sample: boolean;
  body: string;
  headings: { id: string; text: string; level: 2 | 3 }[];
}

/** Front Matter im Format `schlüssel: wert` zwischen `---`-Zeilen (wie scripts/legal-manifest.mjs). */
export function parseFrontMatter(source: string): { data: Record<string, string>; body: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(source);
  if (!match) return { data: {}, body: source };
  const data: Record<string, string> = {};
  for (const line of match[1]!.split(/\r?\n/)) {
    const kv = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(line.trim());
    if (kv) data[kv[1]!] = kv[2]!.replace(/^["']|["']$/g, '');
  }
  return { data, body: source.slice(match[0].length) };
}

/** Stabile Anker aus Überschriften: „Welche Betrugsmaschen gibt es?“ → `welche-betrugsmaschen-gibt-es`. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Markdown-Formatierung aus Überschriften entfernen, damit Anker und Inhaltsverzeichnis den Klartext nutzen. */
export const plainHeading = (text: string) => text.replace(/[*_`]/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').trim();

export function extractHeadings(body: string): ContentDocument['headings'] {
  const headings: ContentDocument['headings'] = [];
  let inCode = false;
  for (const line of body.split(/\r?\n/)) {
    if (line.startsWith('```')) inCode = !inCode;
    const m = !inCode && /^(#{2,3})\s+(.+?)\s*#*$/.exec(line);
    if (m) {
      const text = plainHeading(m[2]!);
      headings.push({ id: slugify(text), text, level: m[1]!.length as 2 | 3 });
    }
  }
  return headings;
}

export async function loadContent(name: ContentName, lang = 'de'): Promise<ContentDocument> {
  const load = loaders[`../content/${name}.${lang}.md`] ?? loaders[`../content/${name}.de.md`];
  if (!load) throw new Error(`Inhalt ${name} fehlt`);
  const { data, body } = parseFrontMatter(await load());
  return {
    title: data.title ?? name,
    version: data.version ?? '',
    lastUpdated: data.last_updated ?? '',
    sample: data.sample === 'true' || body.includes('Muster im Rahmen einer Übungsaufgabe'),
    body,
    headings: extractHeadings(body),
  };
}
