import { describe, expect, it } from 'vitest';
import { decodeCursor, encodeCursor, PAGE_DEFAULT, PAGE_MAX, pageLimit, toPage } from './pagination.js';

describe('Keyset-Paginierung (Guideline Kap. 06, GL-14)', () => {
  it('begrenzt die Seitengröße und nutzt einen Standardwert', () => {
    expect(pageLimit(undefined)).toBe(PAGE_DEFAULT);
    expect(pageLimit(0)).toBe(PAGE_DEFAULT);
    expect(pageLimit(10)).toBe(10);
    expect(pageLimit(10_000)).toBe(PAGE_MAX);
  });

  it('Cursor ist umkehrbar und prüft die Anzahl der Teile', () => {
    const cursor = encodeCursor(['2026-10-26T10:00:00.123Z', '00000000-0000-4000-8000-000000000001']);
    expect(decodeCursor(cursor, 2)).toEqual(['2026-10-26T10:00:00.123Z', '00000000-0000-4000-8000-000000000001']);
    expect(decodeCursor(cursor, 3)).toBeNull();
    expect(decodeCursor(undefined, 2)).toBeUndefined();
  });

  it.each(['kaputt', encodeCursor([]).slice(1), Buffer.from('{"a":1}').toString('base64url'), Buffer.from('[{}, 1]').toString('base64url')])(
    'ungültiger Cursor %s → null (Route antwortet 422)',
    (cursor) => {
      expect(decodeCursor(cursor, 2)).toBeNull();
    },
  );

  it('liest eine Zeile mehr und bildet daraus den nächsten Cursor', () => {
    const rows = [1, 2, 3].map((n) => ({ id: `id-${n}`, at: `t${n}` }));
    const page = toPage(rows, 2, (r) => r.id, (r) => [r.at, r.id]);
    expect(page.items).toEqual(['id-1', 'id-2']);
    expect(decodeCursor(page.nextCursor!, 2)).toEqual(['t2', 'id-2']);
    expect(toPage(rows.slice(0, 2), 2, (r) => r.id, (r) => [r.at, r.id]).nextCursor).toBeNull();
  });
});
