import type { RealtimeBroker, RealtimeListener } from '../ports/index.js';

/**
 * RealtimeBroker → In-Process (ADR-0004). Reicht für genau eine App-Instanz.
 * Skalierungspfad: PgNotifyAdapter (Postgres LISTEN/NOTIFY) mit derselben Schnittstelle.
 */
export function createInProcessRealtime(): RealtimeBroker {
  const listeners = new Map<string, Set<RealtimeListener>>();

  return {
    async publish(userId, event) {
      for (const listener of listeners.get(userId) ?? []) listener(event);
    },
    subscribe(userId, listener) {
      let set = listeners.get(userId);
      if (!set) listeners.set(userId, (set = new Set()));
      set.add(listener);
      return () => {
        set.delete(listener);
        if (set.size === 0) listeners.delete(userId);
      };
    },
    connectionCount() {
      let count = 0;
      for (const set of listeners.values()) count += set.size;
      return count;
    },
  };
}
