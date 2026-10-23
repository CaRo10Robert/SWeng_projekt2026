import { describe, expect, it } from 'vitest';
import { join, raw, sql } from './sql.js';

describe('sql-Template', () => {
  it('übergibt Werte immer als Parameter', () => {
    const name = "x'; DROP TABLE users; --";
    expect(sql`SELECT * FROM t WHERE name = ${name}`.toQuery()).toEqual({
      text: 'SELECT * FROM t WHERE name = $1',
      values: [name],
    });
  });

  it('nummeriert verschachtelte Fragmente fortlaufend', () => {
    const where = join([sql`a = ${1}`, sql`b = ${2}`], ' AND ');
    expect(sql`SELECT ${raw('id')} FROM t WHERE ${where} LIMIT ${10}`.toQuery()).toEqual({
      text: 'SELECT id FROM t WHERE a = $1 AND b = $2 LIMIT $3',
      values: [1, 2, 10],
    });
  });
});
