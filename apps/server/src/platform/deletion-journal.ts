import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Tx } from './db.js';

/**
 * Löschjournal außerhalb der Datenbank (RV-A-01, ADR-0018): Nach einer Wiederherstellung werden alle Löschungen
 * seit dem Sicherungszeitpunkt erneut ausgeführt (Art. 17 DSGVO). Es enthält nur Art, ID und Zeitpunkt, keine Inhalte.
 * Liegt in einem eigenen Volume (`journal`), das eine Wiederherstellung nicht überschreibt.
 */
export const DELETION_KINDS = [
  'account_deletion_requested',
  'account_deletion_cancelled',
  'account_deleted',
  'listing_deleted',
  'listing_removed',
  'listing_restored',
  'message_removed',
  'message_restored',
  'image_deleted',
] as const;
export type DeletionKind = (typeof DELETION_KINDS)[number];

export interface DeletionEntry {
  at: string;
  kind: DeletionKind;
  id: string;
}

/** Aufbewahrung: länger als die älteste Sicherung (28 Tage, ADR-0018) plus Puffer. */
export const JOURNAL_RETENTION_DAYS = 35;

export interface DeletionJournal {
  /** Schreibt den Eintrag erst nach erfolgreichem COMMIT der Transaktion. */
  record(tx: Tx, kind: DeletionKind, id: string): void;
  read(): Promise<DeletionEntry[]>;
  /** Vereinigt Einträge (z. B. aus der Kopie neben den Sicherungen) und kürzt auf die Aufbewahrungsfrist. */
  merge(entries: readonly DeletionEntry[], now?: Date): Promise<DeletionEntry[]>;
}

export function parseJournal(text: string): DeletionEntry[] {
  const out: DeletionEntry[] = [];
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    try {
      const e = JSON.parse(line) as DeletionEntry;
      if (typeof e.at === 'string' && typeof e.id === 'string' && (DELETION_KINDS as readonly string[]).includes(e.kind)) out.push(e);
    } catch {
      // abgeschnittene Zeile nach Absturz: überspringen
    }
  }
  return out;
}

/** Reine Funktion: Duplikate entfernen, nach Zeit sortieren, ältere Einträge als die Aufbewahrungsfrist verwerfen. */
export function mergeEntries(a: readonly DeletionEntry[], b: readonly DeletionEntry[], now: Date): DeletionEntry[] {
  const limit = now.getTime() - JOURNAL_RETENTION_DAYS * 86_400_000;
  const seen = new Map<string, DeletionEntry>();
  for (const e of [...a, ...b]) {
    if (new Date(e.at).getTime() < limit) continue;
    seen.set(`${e.at}|${e.kind}|${e.id}`, e);
  }
  return [...seen.values()].sort((x, y) => x.at.localeCompare(y.at));
}

/** Einträge, die nach dem Sicherungszeitpunkt entstanden sind, in ihrer Reihenfolge. */
export function entriesSince(entries: readonly DeletionEntry[], since: Date): DeletionEntry[] {
  return entries.filter((e) => new Date(e.at) > since).sort((x, y) => x.at.localeCompare(y.at));
}

export function createDeletionJournal(dir: string, options: { recording?: boolean; onError?: (e: unknown) => void } = {}): DeletionJournal {
  const file = join(dir, 'deletions.ndjson');
  const recording = options.recording ?? true;

  async function read() {
    try {
      return parseJournal(await readFile(file, 'utf8'));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw error;
    }
  }

  return {
    record(tx, kind, id) {
      if (!recording) return;
      const line = `${JSON.stringify({ at: new Date().toISOString(), kind, id } satisfies DeletionEntry)}\n`;
      tx.afterCommit(async () => {
        try {
          await mkdir(dir, { recursive: true });
          await appendFile(file, line);
        } catch (error) {
          options.onError?.(error);
          throw error;
        }
      });
    },
    read,
    async merge(entries, now = new Date()) {
      const merged = mergeEntries(await read(), entries, now);
      await mkdir(dir, { recursive: true });
      await writeFile(file, merged.map((e) => JSON.stringify(e)).join('\n') + (merged.length ? '\n' : ''));
      return merged;
    },
  };
}
