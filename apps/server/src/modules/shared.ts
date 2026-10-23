import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import type { Config } from '../config.js';
import type { Database } from '../platform/db.js';
import type { Logger } from '../platform/logger.js';
import type { Metrics } from '../platform/metrics.js';
import type { JobQueue, RateLimitStore, RealtimeBroker, StoragePort } from '../platform/ports/index.js';
import type { IdentityApi } from './identity/index.js';
import type { ListingsApi } from './listings/index.js';
import type { MessagingApi } from './messaging/index.js';
import type { NotificationsApi } from './notifications/index.js';
import type { SearchApi } from './search/index.js';
import type { TrustApi } from './trust/index.js';

/** Öffentliche APIs aller Module. Module rufen einander nur hierüber auf (ADR-0001). */
export interface Modules {
  identity: IdentityApi;
  listings: ListingsApi;
  messaging: MessagingApi;
  notifications: NotificationsApi;
  search: SearchApi;
  trust: TrustApi;
}

/** Was ein Modul von der Plattform bekommt: nur Ports, nie konkrete Adapter. */
export interface ModuleDeps {
  config: Config;
  logger: Logger;
  metrics: Metrics;
  database: Database;
  jobs: JobQueue;
  storage: StoragePort;
  realtime: RealtimeBroker;
  rateLimit: RateLimitStore;
  /** Wird nach dem Erzeugen aller Module befüllt (späte Bindung, vermeidet Zyklen beim Start). */
  modules: Modules;
}

export interface Module<Api> {
  api: Api;
  routes?: FastifyPluginAsyncTypebox;
  /** Queues definieren; Worker und Schedules nur, wenn `withWorkers` (Startmodus all/worker). */
  registerJobs?(withWorkers: boolean): Promise<void>;
}
