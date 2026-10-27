/**
 * Keyset-Paginierung für Listen-Endpunkte (Guideline Kap. 06 „Pagination on every list endpoint“, GL-14).
 * Der Cursor ist opak (base64url) und enthält nur die Sortierschlüssel des letzten Eintrags, keine Inhalte.
 * Keyset statt Offset: Neue Einträge zwischen zwei Seiten verschieben keine Zeilen.
 */

export const PAGE_DEFAULT = 50;
export const PAGE_MAX = 200;

export function pageLimit(limit: number | undefined): number {
  if (!limit || !Number.isInteger(limit) || limit < 1) return PAGE_DEFAULT;
  return Math.min(limit, PAGE_MAX);
}

export function encodeCursor(parts: (string | number)[]): string {
  return Buffer.from(JSON.stringify(parts)).toString('base64url');
}

/** Liefert die Teile des Cursors oder null bei ungültigem Wert (dann beginnt die Liste von vorn nicht still, sondern mit 422). */
export function decodeCursor(cursor: string | undefined, arity: number): (string | number)[] | null | undefined {
  if (!cursor) return undefined;
  try {
    const parts: unknown = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    if (!Array.isArray(parts) || parts.length !== arity) return null;
    if (!parts.every((p) => typeof p === 'string' || typeof p === 'number')) return null;
    return parts as (string | number)[];
  } catch {
    return null;
  }
}

/** Schneidet die eine zusätzlich gelesene Zeile ab und bildet daraus den nächsten Cursor. */
export function toPage<T, R>(rows: R[], limit: number, map: (row: R) => T, key: (row: R) => (string | number)[]) {
  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;
  const last = pageRows.at(-1);
  return { items: pageRows.map(map), nextCursor: hasMore && last ? encodeCursor(key(last)) : null };
}
