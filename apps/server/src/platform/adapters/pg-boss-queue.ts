import PgBoss from 'pg-boss';
import type { Logger } from 'pino';
import type { JobQueue } from '../ports/index.js';

export const DEAD_LETTER_QUEUE = 'dead-letter';

/** JobQueue → pg-boss (Postgres, Schema `pgboss`; ADR-0005). */
export async function createPgBossQueue(connectionString: string, log: Logger): Promise<JobQueue> {
  const boss = new PgBoss({ connectionString, schema: 'pgboss', max: 5, application_name: 'campusmarkt-jobs' });
  boss.on('error', (error) => log.error({ err: error }, 'pg-boss Fehler'));
  await boss.start();
  await boss.createQueue(DEAD_LETTER_QUEUE, { name: DEAD_LETTER_QUEUE, retentionDays: 30 });

  const defined = new Set<string>([DEAD_LETTER_QUEUE]);

  return {
    async defineQueue(name, options = {}) {
      const queue: PgBoss.Queue = {
        name,
        retryLimit: options.retryLimit ?? 3,
        retryDelay: options.retryDelaySeconds ?? 5,
        retryBackoff: options.retryBackoff ?? true,
        expireInSeconds: options.expireInSeconds ?? 120,
        deadLetter: options.deadLetter === false ? undefined : DEAD_LETTER_QUEUE,
      };
      if (await boss.getQueue(name)) await boss.updateQueue(name, queue);
      else await boss.createQueue(name, queue);
      defined.add(name);
    },

    async enqueue(name, data, options = {}, executor) {
      if (!defined.has(name)) throw new Error(`Queue ${name} ist nicht definiert`);
      await boss.send(name, data, {
        startAfter: options.startAfterSeconds,
        singletonKey: options.singletonKey,
        singletonSeconds: options.singletonSeconds,
        db: executor,
      });
    },

    async work(name, handler, options = {}) {
      await boss.work<object>(name, { batchSize: options.batchSize ?? 1, pollingIntervalSeconds: 1, includeMetadata: true }, async (jobs) => {
        for (const job of jobs) {
          try {
            await handler(job.data as never, { id: job.id, name: job.name, finalAttempt: job.retryCount >= job.retryLimit });
          } catch (error) {
            log.warn({ err: error, job: job.name, jobId: job.id }, 'Job fehlgeschlagen, wird ggf. wiederholt');
            throw error;
          }
        }
      });
    },

    async schedule(name, cron) {
      await boss.schedule(name, cron, {}, { tz: 'Europe/Berlin' });
    },

    async overview() {
      const db = boss.getDb() as { executeSql(text: string, values?: unknown[]): Promise<{ rows: never[] }> };
      const counts = await db.executeSql(
        `SELECT name,
           count(*) FILTER (WHERE state IN ('created', 'retry'))::int AS queued,
           count(*) FILTER (WHERE state = 'active')::int AS active,
           count(*) FILTER (WHERE state = 'failed')::int AS failed,
           count(*) FILTER (WHERE state = 'completed')::int AS completed
         FROM pgboss.job GROUP BY name ORDER BY name`,
      );
      const dead = await db.executeSql(
        `SELECT id::text, name, created_on, data FROM pgboss.job
         WHERE name = $1 ORDER BY created_on DESC LIMIT 50`,
        [DEAD_LETTER_QUEUE],
      );
      return {
        queues: counts.rows,
        deadLetters: (dead.rows as { id: string; name: string; created_on: Date; data: unknown }[]).map((r) => ({
          id: r.id,
          name: r.name,
          createdOn: new Date(r.created_on).toISOString(),
          data: r.data,
        })),
      };
    },

    async stop() {
      await boss.stop({ graceful: true, timeout: 20_000, wait: true });
    },
  };
}
