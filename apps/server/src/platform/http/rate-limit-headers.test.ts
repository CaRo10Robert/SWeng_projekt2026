import { describe, expect, it } from 'vitest';
import type { RateLimitResult, RateLimitStore } from '../ports/index.js';
import { rateLimitHeaders, runWithRateLimitState, stricter, withRateLimitHeaders, type RateLimitState } from './rate-limit-headers.js';

const result = (remaining: number, retryAfterSeconds = 60, limit = 10): RateLimitResult => ({
  allowed: remaining > 0,
  retryAfterSeconds,
  limit,
  remaining,
  windowSeconds: 3600,
});

describe('RateLimit-Header (Guideline Kap. 06, GL-14)', () => {
  it('setzt Limit, Rest, Reset und Policy', () => {
    expect(rateLimitHeaders(result(3, 42))).toEqual({
      'ratelimit-limit': '10',
      'ratelimit-remaining': '3',
      'ratelimit-reset': '42',
      'ratelimit-policy': '10;w=3600',
    });
  });

  it('wählt bei mehreren Grenzen im selben Request die strengste', () => {
    expect(stricter(undefined, result(5))).toEqual(result(5));
    expect(stricter(result(5), result(2)).remaining).toBe(2);
    expect(stricter(result(2, 30), result(2, 10)).retryAfterSeconds).toBe(10);
  });

  it('merkt sich das Ergebnis nur im Kontext des Requests', async () => {
    const inner: RateLimitStore = {
      hit: async (_key, limit) => result(limit - 1, 60, limit),
      reset: async () => undefined,
      purge: async () => 0,
    };
    const store = withRateLimitHeaders(inner);
    const state: RateLimitState = {};
    await new Promise<void>((resolve, reject) =>
      runWithRateLimitState(state, () => {
        store.hit('a', 30, 3600).then(() => store.hit('b', 3, 3600)).then(() => resolve(), reject);
      }),
    );
    expect(state.result?.limit).toBe(3);
    // Außerhalb eines Requests (z. B. Jobs) wird nichts gemerkt, der Aufruf funktioniert trotzdem
    await expect(store.hit('c', 5, 60)).resolves.toMatchObject({ remaining: 4 });
  });
});
