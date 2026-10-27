import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { API_PREFIX } from '@campusmarkt/contracts';
import pg from 'pg';
import { inject } from 'vitest';
import { loadConfig } from '../../src/config.js';
import { createFsStorage } from '../../src/platform/adapters/fs-storage.js';
import { createInProcessRealtime } from '../../src/platform/adapters/in-process-realtime.js';
import { createPgRateLimit } from '../../src/platform/adapters/pg-rate-limit.js';
import { createPgSearch } from '../../src/platform/adapters/pg-search.js';
import { createDatabase, createPool, type Database } from '../../src/platform/db.js';
import { createDeletionJournal } from '../../src/platform/deletion-journal.js';
import { createHttpServer, type App } from '../../src/platform/http/server.js';
import { createLogger } from '../../src/platform/logger.js';
import { createMetrics } from '../../src/platform/metrics.js';
import { createOps } from '../../src/platform/ops.js';
import type { JobContext, JobHandler, JobQueue, MailMessage, MailPort } from '../../src/platform/ports/index.js';
import { createPseudonymizer } from '../../src/platform/pseudonym.js';
import { createSettings } from '../../src/platform/settings.js';
import { adminRoutes } from '../../src/modules/admin.js';
import { createIdentityModule } from '../../src/modules/identity/index.js';
import { createListingsModule } from '../../src/modules/listings/index.js';
import { createMessagingModule } from '../../src/modules/messaging/index.js';
import { createNotificationsModule } from '../../src/modules/notifications/index.js';
import { createPrivacyModule } from '../../src/modules/privacy/index.js';
import { createReportingModule } from '../../src/modules/reporting/index.js';
import { createSearchModule } from '../../src/modules/search/index.js';
import type { ModuleDeps, Modules } from '../../src/modules/shared.js';
import { createTrustModule } from '../../src/modules/trust/index.js';
import { seedBaseData } from '../../src/seed/seed.js';
import { TEMPLATE_DB, withDatabase } from './global-setup.js';

/** true, wenn ein Datenbank-Container bereitsteht (lokal ohne Docker werden Integrationstests übersprungen). */
export const integrationAvailable = Boolean(inject('integrationAdminUrl'));

export const PASSWORD = 'ein-sicheres-testpasswort';
const APP_SCHEMAS = ['identity', 'listings', 'search', 'messaging', 'trust', 'platform'];

// ------------------------------------------------------------------ Fakes für Ports ohne Datenbank

/** MailPort im Speicher: Tests lesen Bestätigungs- und Reset-Links direkt aus den versendeten Mails. */
export class FakeMail implements MailPort {
  sent: MailMessage[] = [];
  async send(message: MailMessage) {
    this.sent.push(message);
  }
  async verify() {
    return true;
  }
  to(address: string) {
    return this.sent.filter((m) => m.to.toLowerCase() === address.toLowerCase());
  }
  /** Token aus dem letzten Link der Form …/pfad?token=… bzw. #token=… an diese Adresse. */
  token(address: string, path: string): string {
    const pattern = new RegExp(`${path}[?#]token=([A-Za-z0-9_-]+)`);
    for (const message of [...this.to(address)].reverse()) {
      const match = pattern.exec(message.text);
      if (match) return match[1]!;
    }
    throw new Error(`Kein Link ${path} an ${address} (${this.to(address).length} Mails)`);
  }
}

interface QueuedJob {
  id: string;
  name: string;
  data: unknown;
}

/**
 * JobQueue im Speicher: speichert eingereihte Jobs und führt sie erst auf `drain()` aus. So prüfen Tests auch
 * zeitversetzte Jobs (Benachrichtigungen, Löschläufe) deterministisch, ohne pg-boss-Scheduler.
 */
export class FakeJobs implements JobQueue {
  queued: QueuedJob[] = [];
  private handlers = new Map<string, JobHandler<unknown>>();
  failed: { name: string; error: unknown }[] = [];

  async defineQueue() {}
  async enqueue(name: string, data: object) {
    this.queued.push({ id: randomUUID(), name, data });
  }
  async work<T>(name: string, handler: JobHandler<T>) {
    this.handlers.set(name, handler as JobHandler<unknown>);
  }
  async schedule() {}
  async overview() {
    return { queues: [], deadLetters: [] };
  }
  async stop() {}

  /** Führt alle eingereihten Jobs (auch neu entstehende) aus, optional nur eine Queue. */
  async drain(only?: string) {
    for (let round = 0; round < 20; round++) {
      const batch = this.queued.filter((j) => !only || j.name === only);
      if (batch.length === 0) return;
      this.queued = this.queued.filter((j) => !batch.includes(j));
      for (const job of batch) {
        const handler = this.handlers.get(job.name);
        if (!handler) continue;
        const ctx: JobContext = { id: job.id, name: job.name, finalAttempt: true };
        try {
          await handler(job.data, ctx);
        } catch (error) {
          this.failed.push({ name: job.name, error });
        }
      }
    }
  }

  /** Startet einen geplanten Job (Cron) sofort. */
  async trigger(name: string) {
    await this.enqueue(name, {});
    await this.drain(name);
  }
}

// ------------------------------------------------------------------ HTTP-Client mit Sitzung

export interface Response<T = any> {
  status: number;
  data: T;
  headers: Record<string, string | string[] | undefined>;
}

export class Client {
  cookie = '';
  constructor(private app: App) {}

  async call<T = any>(method: string, path: string, body?: unknown, extraHeaders: Record<string, string> = {}): Promise<Response<T>> {
    const headers: Record<string, string> = { ...extraHeaders };
    if (this.cookie) headers.cookie = this.cookie;
    if (method !== 'GET' && method !== 'HEAD') headers['x-campusmarkt-csrf'] = '1';
    const res = await this.app.inject({
      method: method as 'GET',
      url: path.startsWith('/') && !path.startsWith(API_PREFIX) ? `${API_PREFIX}${path}` : path,
      headers,
      ...(body === undefined ? {} : { payload: body as object }),
    });
    const setCookie = res.headers['set-cookie'];
    for (const c of Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : []) {
      const [pair] = c.split(';');
      if (pair?.startsWith('cm_session=')) this.cookie = pair.endsWith('=') ? '' : pair;
    }
    let data: unknown = res.body;
    if ((res.headers['content-type'] ?? '').toString().includes('json') && res.body) data = res.json();
    return { status: res.statusCode, data: data as T, headers: res.headers as Response['headers'] };
  }
}

// ------------------------------------------------------------------ Testumgebung je Datei

export interface Harness {
  app: App;
  deps: ModuleDeps;
  modules: Modules;
  privacy: ReturnType<typeof createPrivacyModule>['api'];
  database: Database;
  mail: FakeMail;
  jobs: FakeJobs;
  /** Leert alle Fachtabellen und legt Stammdaten neu an (Isolation je Test). */
  reset(): Promise<void>;
  close(): Promise<void>;
  client(): Client;
  /** Registriert über die API, bestätigt per Mail-Link und meldet an. */
  member(email: string, extra?: { displayName?: string }): Promise<Client & { userId: string; email: string }>;
  /** Legt ein aktives Konto direkt an (z. B. Moderation, Admin) und meldet an. */
  staff(email: string, role: 'member' | 'moderator' | 'admin'): Promise<Client & { userId: string; email: string }>;
  sql<T = any>(text: string, values?: unknown[]): Promise<T[]>;
}

export async function startHarness(env: Record<string, string> = {}): Promise<Harness> {
  const adminUrl = inject('integrationAdminUrl');
  if (!adminUrl) throw new Error('Kein Datenbank-Container verfügbar');
  const dbName = `cm_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
  const admin = new pg.Client({ connectionString: adminUrl });
  await admin.connect();
  await admin.query(`CREATE DATABASE ${dbName} TEMPLATE ${TEMPLATE_DB}`);
  await admin.end();

  const dataDir = await mkdtemp(join(tmpdir(), 'cm-it-'));
  Object.assign(process.env, {
    DATABASE_URL: withDatabase(adminUrl, dbName),
    PUBLIC_URL: 'http://localhost:8080',
    COOKIE_SECURE: 'false',
    DEMO_MODE: 'true',
    UNSUBSCRIBE_SECRET: 'integrationstest-geheimnis',
    UPLOADS_DIR: join(dataDir, 'uploads'),
    JOURNAL_DIR: join(dataDir, 'journal'),
    LOG_LEVEL: 'silent',
    ...env,
  });
  const config = loadConfig();
  const logger = createLogger('silent');
  const metrics = createMetrics();
  const pool = createPool(config.databaseUrl, 5);
  const jobs = new FakeJobs();
  const database = createDatabase(pool, () => jobs);
  const mail = new FakeMail();
  const settings = createSettings(database.db, 0);
  const ops = createOps({
    maintenanceFromEnv: config.maintenanceMode,
    maintenanceUntilFromEnv: config.maintenanceUntil,
    settings,
    checkDatabase: () => database.ping(),
    checkMail: () => mail.verify(),
    statusCacheMs: 0,
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
    journal: createDeletionJournal(config.journalDir),
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
  for (const module of [notifications, listings, messaging, privacy]) await module.registerJobs?.(true);
  await seedBaseData(database);

  const app = await createHttpServer({
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
  await app.ready();

  const sql = async <T>(text: string, values: unknown[] = []) => (await pool.query(text, values)).rows as T[];

  const harness: Harness = {
    app,
    deps,
    modules,
    privacy: privacy.api,
    database,
    mail,
    jobs,
    sql,
    client: () => new Client(app),
    async reset() {
      const tables = await sql<{ name: string }>(
        `SELECT format('%I.%I', schemaname, tablename) AS name FROM pg_tables WHERE schemaname = ANY($1)`,
        [APP_SCHEMAS],
      );
      if (tables.length) await pool.query(`TRUNCATE ${tables.map((t) => t.name).join(', ')} RESTART IDENTITY CASCADE`);
      await seedBaseData(database);
      mail.sent = [];
      jobs.queued = [];
      jobs.failed = [];
    },
    async close() {
      await app.close();
      await pool.end();
      const cleanup = new pg.Client({ connectionString: adminUrl });
      await cleanup.connect();
      await cleanup.query(`DROP DATABASE IF EXISTS ${dbName} WITH (FORCE)`);
      await cleanup.end();
      await rm(dataDir, { recursive: true, force: true });
    },
    async member(email, extra = {}) {
      const c = new Client(app);
      const reg = await c.call('POST', '/auth/register', {
        email,
        password: PASSWORD,
        displayName: extra.displayName ?? email.split('@')[0]!.slice(0, 30),
        acceptTerms: true,
        termsVersion: config.termsVersion,
      });
      if (reg.status !== 202) throw new Error(`Registrierung ${email}: ${reg.status} ${JSON.stringify(reg.data)}`);
      await jobs.drain();
      const verified = await c.call('POST', '/auth/verify', { token: mail.token(email, '/verify') });
      if (verified.status >= 300) throw new Error(`Bestätigung ${email}: ${verified.status} ${JSON.stringify(verified.data)}`);
      const login = await c.call('POST', '/auth/login', { email, password: PASSWORD });
      if (login.status !== 200) throw new Error(`Login ${email}: ${login.status} ${JSON.stringify(login.data)}`);
      return Object.assign(c, { userId: login.data.id as string, email });
    },
    async staff(email, role) {
      await database.tx((tx) =>
        identity.api.createVerifiedUser(tx, { email, password: PASSWORD, displayName: role, role }),
      );
      const c = new Client(app);
      const login = await c.call('POST', '/auth/login', { email, password: PASSWORD });
      if (login.status !== 200) throw new Error(`Login ${email}: ${login.status} ${JSON.stringify(login.data)}`);
      return Object.assign(c, { userId: login.data.id as string, email });
    },
  };
  return harness;
}
