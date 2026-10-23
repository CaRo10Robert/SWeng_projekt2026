import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { API_PREFIX } from '@campusmarkt/contracts';
import { APP_ROOT, loadConfig } from './config.js';
import { createFsStorage } from './platform/adapters/fs-storage.js';
import { createInProcessRealtime } from './platform/adapters/in-process-realtime.js';
import { createPgBossQueue } from './platform/adapters/pg-boss-queue.js';
import { createPgRateLimit } from './platform/adapters/pg-rate-limit.js';
import { createPgSearch } from './platform/adapters/pg-search.js';
import { createSmtpMail } from './platform/adapters/smtp-mail.js';
import { createDatabase, createPool } from './platform/db.js';
import { createHttpServer } from './platform/http/server.js';
import { createLogger } from './platform/logger.js';
import { createMetrics } from './platform/metrics.js';
import { migrate } from './platform/migrate.js';
import type { JobQueue } from './platform/ports/index.js';
import { adminRoutes } from './modules/admin.js';
import { createIdentityModule } from './modules/identity/index.js';
import { createListingsModule } from './modules/listings/index.js';
import { createMessagingModule } from './modules/messaging/index.js';
import { createNotificationsModule } from './modules/notifications/index.js';
import { createPrivacyModule } from './modules/privacy/index.js';
import { createSearchModule } from './modules/search/index.js';
import type { ModuleDeps, Modules } from './modules/shared.js';
import { createTrustModule } from './modules/trust/index.js';
import { seedBaseData, seedDemoData } from './seed/seed.js';

/** Composition Root: verdrahtet Adapter mit Ports und Modulen. Startmodi all | api | worker (ADR-0001). */
async function main() {
  const config = loadConfig();
  const logger = createLogger(config.logLevel);
  const metrics = createMetrics();
  logger.info({ mode: config.mode }, 'CampusMarkt startet');

  const pool = createPool(config.databaseUrl, config.dbPoolSize);
  await waitForDatabase(pool, logger);
  await migrate(pool, resolve(APP_ROOT, 'migrations'), logger);

  let jobs: JobQueue | undefined;
  const database = createDatabase(pool, () => jobs!);
  jobs = await createPgBossQueue(config.databaseUrl, logger);

  await mkdir(config.uploadsDir, { recursive: true });
  const modules = {} as Modules;
  const deps: ModuleDeps = {
    config,
    logger,
    metrics,
    database,
    jobs,
    storage: createFsStorage(config.uploadsDir),
    realtime: createInProcessRealtime(),
    rateLimit: createPgRateLimit(database.db),
    modules,
  };

  const identity = createIdentityModule(deps);
  const notifications = createNotificationsModule(deps, createSmtpMail(config.smtp));
  const listings = createListingsModule(deps);
  const search = createSearchModule(deps, createPgSearch(database.db, logger));
  const messaging = createMessagingModule(deps);
  const trust = createTrustModule(deps);
  const privacy = createPrivacyModule(deps);
  Object.assign(modules, {
    identity: identity.api,
    notifications: notifications.api,
    listings: listings.api,
    search: search.api,
    messaging: messaging.api,
    trust: trust.api,
  } satisfies Modules);

  const withWorkers = config.mode !== 'api';
  for (const module of [notifications, listings, messaging, privacy]) await module.registerJobs?.(withWorkers);

  await seedBaseData(database);
  if (config.seedDemo) await seedDemoData(deps);

  let app: Awaited<ReturnType<typeof createHttpServer>> | undefined;
  if (config.mode !== 'worker') {
    app = await createHttpServer({
      config,
      logger,
      metrics,
      resolveSession: (token) => identity.api.resolveSession(token),
      isReady: () => database.ping(),
    });
    for (const module of [identity, listings, search, messaging, trust, privacy]) {
      if (module.routes) await app.register(module.routes, { prefix: API_PREFIX });
    }
    await app.register(adminRoutes(deps), { prefix: API_PREFIX });
    await app.register(messaging.websocket);
    await app.listen({ port: config.port, host: config.host });
  }

  // Graceful Shutdown (REQ-OPS-001): keine neuen Requests, laufende abschließen, ≤ 30 s
  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, 'Fahre herunter');
    const timer = setTimeout(() => {
      logger.error('Shutdown-Timeout überschritten');
      process.exit(1);
    }, config.shutdownTimeoutMs);
    timer.unref();
    try {
      await app?.close();
      await jobs?.stop();
      await pool.end();
      logger.info('Beendet');
      process.exit(0);
    } catch (error) {
      logger.error({ err: error }, 'Fehler beim Herunterfahren');
      process.exit(1);
    }
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

async function waitForDatabase(pool: ReturnType<typeof createPool>, logger: ReturnType<typeof createLogger>) {
  for (let attempt = 1; ; attempt++) {
    try {
      await pool.query('SELECT 1');
      return;
    } catch (error) {
      if (attempt >= 30) throw error;
      logger.warn({ attempt }, 'Datenbank noch nicht erreichbar, neuer Versuch in 2 s');
      await new Promise((r) => setTimeout(r, 2_000));
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
