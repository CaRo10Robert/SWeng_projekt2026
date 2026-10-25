import pg from 'pg';
import type { EnqueueOptions, JobQueue, SqlExecutor } from './ports/index.js';
import type { Sql } from './sql.js';

export interface Db {
  query<T>(query: Sql): Promise<T[]>;
  one<T>(query: Sql): Promise<T | undefined>;
  exec(query: Sql): Promise<number>;
}

/** Unit of Work: Fachänderungen und eingereihte Jobs werden gemeinsam committed (Outbox, ADR-0005). */
export interface Tx {
  db: Db;
  enqueue(name: string, data: object, options?: EnqueueOptions): Promise<void>;
  /** Läuft erst nach erfolgreichem COMMIT (z. B. Löschjournal außerhalb der Datenbank); Fehler werden nur protokolliert. */
  afterCommit(fn: () => Promise<void> | void): void;
}

export interface Database {
  pool: pg.Pool;
  db: Db;
  tx<T>(fn: (tx: Tx) => Promise<T>): Promise<T>;
  /** Nutzt eine bestehende Transaktion oder öffnet eine neue. */
  inTx<T>(tx: Tx | undefined, fn: (tx: Tx) => Promise<T>): Promise<T>;
  ping(): Promise<boolean>;
}

// Nur für den eigenen Pool (pg-boss bleibt unberührt): timestamptz als ISO-String, bigint als number
const typeParsers = {
  getTypeParser: ((oid: number, format?: 'text' | 'binary') => {
    if (oid === pg.types.builtins.TIMESTAMPTZ) {
      const toDate = pg.types.getTypeParser(oid, 'text') as (v: string) => Date;
      return (v: string) => toDate(v).toISOString();
    }
    if (oid === pg.types.builtins.INT8) return (v: string) => Number.parseInt(v, 10);
    return pg.types.getTypeParser(oid, format);
  }) as typeof pg.types.getTypeParser,
};

export function createPool(connectionString: string, max: number): pg.Pool {
  return new pg.Pool({
    connectionString,
    types: typeParsers,
    max,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
    statement_timeout: 10_000,
    application_name: 'campusmarkt',
  });
}

function wrap(client: pg.Pool | pg.PoolClient): Db {
  return {
    async query<T>(query: Sql) {
      const result = await client.query(query.toQuery());
      return result.rows as T[];
    },
    async one<T>(query: Sql) {
      const result = await client.query(query.toQuery());
      return result.rows[0] as T | undefined;
    },
    async exec(query: Sql) {
      const result = await client.query(query.toQuery());
      return result.rowCount ?? 0;
    },
  };
}

export function createDatabase(
  pool: pg.Pool,
  jobs: () => JobQueue,
  onAfterCommitError: (error: unknown) => void = () => undefined,
): Database {
  async function tx<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
    const client = await pool.connect();
    const executor: SqlExecutor = {
      executeSql: (text, values) => client.query(text, values),
    };
    const after: (() => Promise<void> | void)[] = [];
    try {
      await client.query('BEGIN');
      const result = await fn({
        db: wrap(client),
        enqueue: (name, data, options) => jobs().enqueue(name, data, options, executor),
        afterCommit: (cb) => void after.push(cb),
      });
      await client.query('COMMIT');
      for (const cb of after) {
        try {
          await cb();
        } catch (error) {
          onAfterCommitError(error);
        }
      }
      return result;
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  return {
    pool,
    db: wrap(pool),
    tx,
    inTx: (existing, fn) => (existing ? fn(existing) : tx(fn)),
    async ping() {
      try {
        await pool.query('SELECT 1');
        return true;
      } catch {
        return false;
      }
    },
  };
}
