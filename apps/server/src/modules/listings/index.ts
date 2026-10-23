import type { Module, ModuleDeps } from '../shared.js';
import { listingRoutes } from './routes.js';
import { createListingsService, LISTINGS_MAINTENANCE, PROCESS_IMAGE, type ListingsService } from './service.js';

export type ListingsApi = ListingsService;

/** Modul listings: Anzeigen, Kategorien, Übergabeorte, Bilder, Lebenszyklus. */
export function createListingsModule(deps: ModuleDeps): Module<ListingsApi> {
  const service = createListingsService(deps);
  return {
    api: service,
    routes: listingRoutes(service, deps, deps.config),
    async registerJobs(withWorkers) {
      await deps.jobs.defineQueue(PROCESS_IMAGE, { retryLimit: 2, expireInSeconds: 120 });
      await deps.jobs.defineQueue(LISTINGS_MAINTENANCE, { retryLimit: 1, expireInSeconds: 600 });
      if (!withWorkers) return;
      await deps.jobs.work<{ imageId: string }>(PROCESS_IMAGE, (job) => service.processImage(job.imageId), {
        batchSize: 2,
      });
      await deps.jobs.work(LISTINGS_MAINTENANCE, async () => {
        const stats = await service.maintenance();
        deps.logger.info({ stats }, 'Anzeigen-Wartung ausgeführt');
      });
      await deps.jobs.schedule(LISTINGS_MAINTENANCE, '7 * * * *');
    },
  };
}

export { LISTINGS_MAINTENANCE };
