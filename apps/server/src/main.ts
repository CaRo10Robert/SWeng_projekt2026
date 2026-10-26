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
import { createDeletionJournal, parseJournal } from './platform/deletion-journal.js';
import { createHttpServer } from './platform/http/server.js';
import { createLogger } from './platform/logger.js';
import { createMetrics } from './platform/metrics.js';
import { strictLegalProblems } from './platform/legal.js';
import { migrate } from './platform/migrate.js';
import { createOps } from './platform/ops.js';
import { createPseudonymizer, ensureSecret } from './platform/pseudonym.js';
import { createSettings } from './platform/settings.js';
import type { JobQueue } from './platform/ports/index.js';
import { adminRoutes } from './modules/admin.js';
import { createIdentityModule } from './modules/identity/index.js';
import { createListingsModule } from './modules/listings/index.js';
import { createMessagingModule } from './modules/messaging/index.js';
import { createNotificationsModule } from './modules/notifications/index.js';
import { createPrivacyModule } from './modules/privacy/index.js';
import { createReportingModule } from './modules/reporting/index.js';
import { createSearchModule } from './modules/search/index.js';
import type { ModuleDeps, Modules } from './modules/shared.js';
import { createTrustModule } from './modules/trust/index.js';
import { seedBaseData, seedDemoData, syncDemoLegalVersions } from './seed/seed.js';

/** Composition Root: verdrahtet Adapter mit Ports und Modulen. Startmodi all | api | worker (ADR-0001). */
/**
 * Befehle neben dem Serverstart:
 *   node dist/main.js replay-deletions --since <ISO>   Löschjournal nach einer Wiederherstellung erneut anwenden (ADR-0018).
 *     Liest zusätzliche Journal-Einträge (NDJSON) von stdin, z. B. die Kopie neben den Sicherungen.
 */
const command = process.argv[2] === 'replay-deletions' ? 'replay-deletions' : 'serve';

async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) return '';
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString('utf8');
}

async function main() {
  const config = loadConfig();
  const logger = createLogger(config.logLevel);
  const metrics = createMetrics();
  logger.info({ mode: config.mode, termsVersion: config.termsVersion }, 'CampusMarkt startet');
  // Echtbetrieb (ADR-0015 Nr. 7): nicht mit Muster-Rechtstexten starten
  const legalProblems = strictLegalProblems(config.legalManifest);
  if (config.legalStrict && legalProblems.length) {
    throw new Error(`LEGAL_STRICT: Rechtstexte unvollständig – ${legalProblems.join('; ')}`);
  }
  if (legalProblems.length) logger.warn({ legalProblems }, 'Rechtstexte sind Muster mit Platzhaltern (Übungsaufgabe)');

  const pool = createPool(config.databaseUrl, config.dbPoolSize, (error) =>
    logger.error({ err: error }, 'Datenbankverbindung unterbrochen'),
  );
  await waitForDatabase(pool, logger);
  await migrate(pool, resolve(APP_ROOT, 'migrations'), logger);

  let jobs: JobQueue | undefined;
  const database = createDatabase(pool, () => jobs!, (error) => logger.error({ err: error }, 'Nachlauf nach COMMIT fehlgeschlagen'));
  jobs = await createPgBossQueue(config.databaseUrl, logger);

  await mkdir(config.uploadsDir, { recursive: true });
  // Kein öffentlich bekannter Standardwert für das Geheimnis der Abmeldelinks (RV-C-02)
  if (!config.unsubscribeSecret) config.unsubscribeSecret = await ensureSecret(database.db, 'secret.unsubscribe');
  const journal = createDeletionJournal(config.journalDir, {
    recording: command === 'serve',
    onError: (error) => logger.error({ err: error }, 'Löschjournal konnte nicht geschrieben werden'),
  });
  const mail = createSmtpMail(config.smtp);
  const settings = createSettings(database.db);
  const ops = createOps({
    maintenanceFromEnv: config.maintenanceMode,
    maintenanceUntilFromEnv: config.maintenanceUntil,
    settings,
    checkDatabase: () => database.ping(),
    checkMail: () => mail.verify(),
  });
  metrics.bindProbes({
    ready: () => database.ping(),
    maintenance: async () => (await ops.maintenance()).active,
    lastBackupAt: () => ops.lastBackupAt(),
  });
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
    settings,
    ops,
    pseudonym: createPseudonymizer(database.db),
    journal,
    modules,
  };

  const identity = createIdentityModule(deps);
  const notifications = createNotificationsModule(deps, mail);
  const listings = createListingsModule(deps);
  const search = createSearchModule(deps, createPgSearch(database.db, logger));
  const messaging = createMessagingModule(deps);
  const trust = createTrustModule(deps);
  const privacy = createPrivacyModule(deps);
  const reporting = createReportingModule(deps);
  Object.assign(modules, {
    identity: identity.api,
    notifications: notifications.api,
    listings: listings.api,
    search: search.api,
    messaging: messaging.api,
    trust: trust.api,
  } satisfies Modules);

  if (command === 'replay-deletions') {
    // Nach einer Wiederherstellung: Löschungen seit dem Sicherungszeitpunkt erneut ausführen (idempotent)
    for (const module of [notifications, listings, messaging, privacy]) await module.registerJobs?.(false);
    const sinceArg = process.argv[process.argv.indexOf('--since') + 1];
    const since = new Date(sinceArg ?? '');
    if (Number.isNaN(since.getTime())) throw new Error('replay-deletions: --since <ISO-Zeitpunkt> fehlt');
    const merged = await journal.merge(parseJournal(await readStdin()));
    const replayed = await privacy.api.replayDeletions(merged, since);
    logger.info({ since: since.toISOString(), journal: merged.length, replayed }, 'Löschjournal angewendet');
    await jobs.stop();
    await pool.end();
    process.exit(0);
  }

  const withWorkers = config.mode !== 'api';
  for (const module of [notifications, listings, messaging, privacy]) await module.registerJobs?.(withWorkers);

  await seedBaseData(database);
  if (config.seedDemo) {
    await seedDemoData(deps);
    await syncDemoLegalVersions(deps);
  }

  let app: Awaited<ReturnType<typeof createHttpServer>> | undefined;
  if (config.mode !== 'worker') {
    app = await createHttpServer({
      config,
      logger,
      metrics,
      resolveSession: (token) => identity.api.resolveSession(token),
      isReady: () => database.ping(),
      ops,
    });
    for (const module of [identity, notifications, listings, search, messaging, trust, privacy, reporting]) {
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
