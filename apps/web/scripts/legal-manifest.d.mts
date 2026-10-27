import type { Plugin } from 'vite';

export interface LegalManifest {
  generatedAt: string;
  documents: {
    name: string;
    lang: string;
    title: string;
    version: string;
    lastUpdated: string;
    sample: boolean;
    placeholders: number;
    sha256: string;
  }[];
}

export function buildLegalManifest(dir: string): LegalManifest;
export function legalManifest(dir: string | URL): Plugin;
