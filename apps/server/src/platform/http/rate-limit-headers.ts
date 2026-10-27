import { AsyncLocalStorage } from 'node:async_hooks';
import type { RateLimitResult, RateLimitStore } from '../ports/index.js';

/**
 * `RateLimit-*`-Header (Guideline Kap. 06 „Rate limiting with informative headers“, GL-14).
 *
 * Format nach draft-ietf-httpapi-ratelimit-headers-07: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
 * (Sekunden) und `RateLimit-Policy` (`<limit>;w=<Fenster>`). Die neueren Entwürfe fassen alles in strukturierte
 * Felder `RateLimit`/`RateLimit-Policy` zusammen; die drei getrennten Header sind aber das, was Clients und
 * Proxys heute verbreitet auswerten, und entsprechen der Formulierung der Guideline.
 *
 * Die Grenzen werden in den Fachmodulen geprüft, ohne Zugriff auf die Antwort. Ein Wrapper um den
 * RateLimitStore merkt sich deshalb je Request das strengste Ergebnis (wenigste verbleibende Anfragen), und der
 * HTTP-Server setzt daraus die Header. Schlüssel (pseudonymisiert, ADR-0014) gelangen nicht in die Antwort.
 */
export interface RateLimitState {
  result?: RateLimitResult;
}

const scope = new AsyncLocalStorage<RateLimitState>();

/** Führt `next` im Kontext des Requests aus; Fastify-Hook im Callback-Stil, damit der Handler den Kontext erbt. */
export function runWithRateLimitState(state: RateLimitState, next: () => void): void {
  scope.run(state, next);
}

/** Strengeres Ergebnis gewinnt: weniger verbleibende Anfragen, bei Gleichstand das frühere Fensterende. */
export function stricter(a: RateLimitResult | undefined, b: RateLimitResult): RateLimitResult {
  if (!a) return b;
  if (b.remaining !== a.remaining) return b.remaining < a.remaining ? b : a;
  return b.retryAfterSeconds < a.retryAfterSeconds ? b : a;
}

/** `factor` hebt alle Grenzen für Lasttests an (RATE_LIMIT_FACTOR, nur im Demo-Modus, siehe config.ts). */
export function withRateLimitHeaders(store: RateLimitStore, factor = 1): RateLimitStore {
  return {
    ...store,
    async hit(key, limit, windowSeconds) {
      const result = await store.hit(key, limit * factor, windowSeconds);
      const state = scope.getStore();
      if (state) state.result = stricter(state.result, result);
      return result;
    },
  };
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'ratelimit-limit': String(result.limit),
    'ratelimit-remaining': String(result.remaining),
    'ratelimit-reset': String(Math.max(0, result.retryAfterSeconds)),
    'ratelimit-policy': `${result.limit};w=${result.windowSeconds}`,
  };
}
