import type { Module, ModuleDeps } from '../shared.js';
import { messagingRoutes, websocketRoute } from './routes.js';
import { createMessagingService, DEAL_EVENTS, NOTIFY_UNREAD, type MessagingService } from './service.js';

export type MessagingApi = MessagingService;

/** Modul messaging: Konversationen, Nachrichten, Deals (ADR-0004, ADR-0006). */
export function createMessagingModule(deps: ModuleDeps): Module<MessagingApi> & {
  websocket: ReturnType<typeof websocketRoute>;
} {
  const service = createMessagingService(deps);
  return {
    api: service,
    routes: messagingRoutes(service, deps),
    websocket: websocketRoute(service, deps),
    async registerJobs(withWorkers) {
      await deps.jobs.defineQueue(NOTIFY_UNREAD, { retryLimit: 3 });
      // Domain Events DealAgreed/DealCompleted/DealCancelled (Outbox). Späterer Konsument: Modul payments (EPIC-09).
      await deps.jobs.defineQueue(DEAL_EVENTS, { retryLimit: 5 });
      if (!withWorkers) return;
      await deps.jobs.work<{ conversationId: string; recipientId: string }>(NOTIFY_UNREAD, (job) =>
        service.notifyUnread(job.conversationId, job.recipientId),
      );
      await deps.jobs.work<{ type: string; id: string }>(DEAL_EVENTS, async (event) => {
        deps.logger.info({ event: event.type, dealId: event.id }, 'Domain Event');
      });
    },
  };
}
