/**
 * Ports (ADR-0010, REQ-ARCH-006): Jede im Docker-Beispiel vereinfachte Infrastruktur steckt hinter
 * einer dieser Schnittstellen. Fachmodule kennen nur die Ports, nie die Adapter.
 */
import type { ServerEvent } from '@campusmarkt/contracts';

// ----------------------------------------------------------------- MailPort (ADR-0005)
export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export interface MailPort {
  send(message: MailMessage): Promise<void>;
}

// ----------------------------------------------------------------- StoragePort (ADR-0007)
export interface StoragePort {
  put(key: string, data: Buffer): Promise<void>;
  get(key: string): Promise<Buffer | null>;
  delete(key: string): Promise<void>;
  deletePrefix(prefix: string): Promise<void>;
  /** Schlüssel, die älter als `olderThan` sind (Aufräumjob für die Quarantäne). */
  listOlderThan(prefix: string, olderThan: Date): Promise<string[]>;
}

// ----------------------------------------------------------------- RealtimeBroker (ADR-0004)
export type RealtimeListener = (event: ServerEvent) => void;

export interface RealtimeBroker {
  publish(userId: string, event: ServerEvent): Promise<void>;
  subscribe(userId: string, listener: RealtimeListener): () => void;
  connectionCount(): number;
}

// ----------------------------------------------------------------- JobQueue (ADR-0005)
/** Führt SQL in einer bestehenden Transaktion aus (transaktionales Enqueue / Outbox). */
export interface SqlExecutor {
  executeSql(text: string, values: unknown[]): Promise<{ rows: unknown[] }>;
}

export interface EnqueueOptions {
  startAfterSeconds?: number;
  singletonKey?: string;
  singletonSeconds?: number;
}

export interface QueueOptions {
  /** Anzahl Wiederholungen nach dem ersten Versuch. */
  retryLimit?: number;
  retryDelaySeconds?: number;
  retryBackoff?: boolean;
  expireInSeconds?: number;
  /** Fehlgeschlagene Jobs landen in der Dead-Letter-Queue. */
  deadLetter?: boolean;
}

export interface JobContext {
  id: string;
  name: string;
}

export type JobHandler<T> = (data: T, ctx: JobContext) => Promise<void>;

export interface JobQueue {
  defineQueue(name: string, options?: QueueOptions): Promise<void>;
  enqueue(name: string, data: object, options?: EnqueueOptions, executor?: SqlExecutor): Promise<void>;
  /** Registriert einen Worker; wird nur im Startmodus `all`/`worker` aufgerufen. */
  work<T>(name: string, handler: JobHandler<T>, options?: { batchSize?: number }): Promise<void>;
  schedule(name: string, cron: string): Promise<void>;
  overview(): Promise<{
    queues: { name: string; queued: number; active: number; failed: number; completed: number }[];
    deadLetters: { id: string; name: string; createdOn: string; data: unknown }[];
  }>;
  stop(): Promise<void>;
}

// ----------------------------------------------------------------- SearchPort (ADR-0008)
export interface SearchCriteria {
  q?: string;
  categoryId?: string;
  kind?: string;
  priceType?: string;
  minPriceCents?: number;
  maxPriceCents?: number;
  locationId?: string;
  condition?: string;
  sort: 'relevance' | 'newest' | 'price_asc' | 'price_desc';
  offset: number;
  limit: number;
  institutionId: string;
  /** Anbieter, die nicht erscheinen dürfen (Blockierungen, REQ-SRCH-006). */
  excludeOwnerIds: string[];
}

export interface SearchPort {
  /** Liefert Anzeigen-IDs in Trefferreihenfolge. `degraded` = Fallback-Suche aktiv. */
  search(criteria: SearchCriteria): Promise<{ ids: string[]; hasMore: boolean; degraded: boolean }>;
}

// ----------------------------------------------------------------- RateLimitStore (REQ-SEC-005)
export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export interface RateLimitStore {
  /** Zählt einen Treffer für `key` im festen Zeitfenster und prüft gegen `limit`. */
  hit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult>;
  reset(key: string): Promise<void>;
  /** Löscht abgelaufene Zähler; Schlüssel können IP-Hashes enthalten (REQ-PRIV-002: max. 7 Tage). */
  purge(olderThanSeconds: number): Promise<number>;
}
