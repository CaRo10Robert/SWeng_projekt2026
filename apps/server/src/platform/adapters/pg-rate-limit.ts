import type { Db } from '../db.js';
import type { RateLimitStore } from '../ports/index.js';
import { sql } from '../sql.js';

/** RateLimitStore → Postgres, feste Zeitfenster (REQ-SEC-005). Gilt über Instanzen hinweg. */
export function createPgRateLimit(db: Db): RateLimitStore {
  const windowStart = (windowSeconds: number) =>
    new Date(Math.floor(Date.now() / (windowSeconds * 1000)) * windowSeconds * 1000);

  return {
    async hit(key, limit, windowSeconds) {
      const start = windowStart(windowSeconds);
      const row = await db.one<{ count: number }>(sql`
        INSERT INTO platform.rate_limit (key, window_start, count) VALUES (${key}, ${start}, 1)
        ON CONFLICT (key, window_start) DO UPDATE SET count = platform.rate_limit.count + 1
        RETURNING count`);
      const allowed = (row?.count ?? 1) <= limit;
      const retryAfterSeconds = Math.ceil((start.getTime() + windowSeconds * 1000 - Date.now()) / 1000);
      return { allowed, retryAfterSeconds };
    },
    async reset(key) {
      await db.exec(sql`DELETE FROM platform.rate_limit WHERE key = ${key}`);
    },
    async purge(olderThanSeconds) {
      return db.exec(sql`
        DELETE FROM platform.rate_limit WHERE window_start < now() - make_interval(secs => ${olderThanSeconds})`);
    },
  };
}
