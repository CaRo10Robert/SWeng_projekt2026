import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Rechtstexte als versionierte Markdown-Inhalte (ADR-0015). Der Web-Build schreibt `legal-manifest.json`;
 * fehlt es (Entwicklung ohne Build), liest der Server die Front Matter direkt aus dem Repo.
 */
export interface LegalDocument {
  name: string;
  lang: string;
  title: string;
  version: string;
  lastUpdated: string;
  sample: boolean;
  /** Anzahl der `[Platzhalter: …]` im Text. */
  placeholders: number;
}

export interface LegalManifest {
  documents: LegalDocument[];
}

/** Front Matter im Format `schlüssel: wert` zwischen `---`-Zeilen. Reine Funktion. */
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

export function countPlaceholders(text: string): number {
  return (text.match(/\[Platzhalter:/g) ?? []).length;
}

export function readLegalManifest(webDistDir: string, contentDir: string): LegalManifest | null {
  const manifestFile = resolve(webDistDir, 'legal-manifest.json');
  if (existsSync(manifestFile)) return JSON.parse(readFileSync(manifestFile, 'utf8')) as LegalManifest;
  if (!existsSync(contentDir)) return null;
  const documents = readdirSync(contentDir)
    .filter((f) => /^[a-z-]+\.[a-z]{2}\.md$/.test(f))
    .map((file) => {
      const [name, lang] = file.split('.') as [string, string];
      const source = readFileSync(resolve(contentDir, file), 'utf8');
      const { data, body } = parseFrontMatter(source);
      return {
        name,
        lang,
        title: data.title ?? name,
        version: data.version ?? '',
        lastUpdated: data.last_updated ?? '',
        // Muster nur per Front Matter `sample: true`, nicht am Hinweistext (T-1)
        sample: data.sample === 'true',
        placeholders: countPlaceholders(body),
      };
    });
  return { documents };
}

/** Version der verbindlichen (deutschen) Nutzungsbedingungen. */
export function termsVersionOf(manifest: LegalManifest | null): string | null {
  return manifest?.documents.find((d) => d.name === 'nutzungsbedingungen' && d.lang === 'de')?.version || null;
}

/** Version der verbindlichen (deutschen) Datenschutzerklärung; neue Version → Hinweis beim Login (REQ-LEGAL-002, RV-R-08). */
export function privacyVersionOf(manifest: LegalManifest | null): string | null {
  return manifest?.documents.find((d) => d.name === 'datenschutz' && d.lang === 'de')?.version || null;
}

/** LEGAL_STRICT=true (Echtbetrieb): Start verweigern, solange Muster oder Platzhalter enthalten sind. */
export function strictLegalProblems(manifest: LegalManifest | null): string[] {
  if (!manifest) return ['Rechtstexte nicht gefunden (legal-manifest.json fehlt)'];
  return manifest.documents
    .filter((d) => d.lang === 'de' && (d.sample || d.placeholders > 0))
    .map((d) => `${d.name}: ${d.placeholders} Platzhalter${d.sample ? ', als Muster gekennzeichnet' : ''}`);
}
