import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { Tx } from './db.js';
import { createDeletionJournal, entriesSince, JOURNAL_RETENTION_DAYS, mergeEntries, parseJournal, type DeletionEntry } from './deletion-journal.js';

describe('[AT-AVAIL-003] Löschjournal für die Wiederherstellung (ADR-0018, RV-A-01)', () => {
  const dirs: string[] = [];
  afterEach(() => dirs.splice(0).forEach((d) => rmSync(d, { recursive: true, force: true })));

  function fakeTx() {
    const after: (() => Promise<void> | void)[] = [];
    const tx = { afterCommit: (fn: () => Promise<void> | void) => void after.push(fn) } as unknown as Tx;
    return { tx, commit: async () => { for (const fn of after) await fn(); } };
  }

  it('schreibt erst nach dem COMMIT und nur Art, ID und Zeitpunkt', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'journal-'));
    dirs.push(dir);
    const journal = createDeletionJournal(dir);
    const { tx, commit } = fakeTx();
    journal.record(tx, 'listing_deleted', '00000000-0000-4000-8000-000000000001');
    expect(await journal.read()).toEqual([]);
    await commit();
    const [entry] = await journal.read();
    expect(Object.keys(entry!).sort()).toEqual(['at', 'id', 'kind']);
    expect(entry!.kind).toBe('listing_deleted');
  });

  it('Wiedergabe-Modus schreibt nicht', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'journal-'));
    dirs.push(dir);
    const journal = createDeletionJournal(dir, { recording: false });
    const { tx, commit } = fakeTx();
    journal.record(tx, 'account_deleted', 'x');
    await commit();
    expect(await journal.read()).toEqual([]);
  });

  const now = new Date('2026-10-25T12:00:00Z');
  const e = (at: string, kind: DeletionEntry['kind'], id: string): DeletionEntry => ({ at, kind, id });

  it('vereinigt Kopien ohne Duplikate, sortiert und verwirft Einträge außerhalb der Aufbewahrung', () => {
    const old = new Date(now.getTime() - (JOURNAL_RETENTION_DAYS + 1) * 86_400_000).toISOString();
    const a = [e('2026-10-24T10:00:00.000Z', 'listing_deleted', 'l1'), e(old, 'account_deleted', 'u0')];
    const b = [e('2026-10-24T10:00:00.000Z', 'listing_deleted', 'l1'), e('2026-10-23T09:00:00.000Z', 'message_removed', 'm1')];
    expect(mergeEntries(a, b, now)).toEqual([e('2026-10-23T09:00:00.000Z', 'message_removed', 'm1'), e('2026-10-24T10:00:00.000Z', 'listing_deleted', 'l1')]);
  });

  it('wiedergegeben wird nur, was nach dem Sicherungszeitpunkt geschah, in Reihenfolge', () => {
    const entries = [
      e('2026-10-24T12:00:00.000Z', 'account_deletion_cancelled', 'u1'),
      e('2026-10-23T12:00:00.000Z', 'listing_deleted', 'l0'),
      e('2026-10-24T11:00:00.000Z', 'account_deletion_requested', 'u1'),
    ];
    expect(entriesSince(entries, new Date('2026-10-24T00:00:00Z')).map((x) => x.kind)).toEqual([
      'account_deletion_requested',
      'account_deletion_cancelled',
    ]);
  });

  it('überspringt abgeschnittene oder fremde Zeilen', () => {
    expect(parseJournal('{"at":"2026-10-24T10:00:00Z","kind":"listing_deleted","id":"l1"}\n{"at":"2026\n{"at":"x","kind":"drop_table","id":"y"}\n')).toHaveLength(1);
  });
});
