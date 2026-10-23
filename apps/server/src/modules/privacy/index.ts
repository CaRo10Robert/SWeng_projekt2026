import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Accepted, DeleteAccountBody } from '@campusmarkt/contracts';
import { SESSION_COOKIE, requireAuth } from '../../platform/http/auth.js';
import type { Module, ModuleDeps } from '../shared.js';

export const PRIVACY_PURGE = 'privacy-purge';

export interface PrivacyApi {
  purgeDueAccounts(): Promise<number>;
}

/** Modul privacy: Datenexport (Art. 15/20) und Kontolöschung mit Karenz (Art. 17, REQ-ACC-002/003). */
export function createPrivacyModule(deps: ModuleDeps): Module<PrivacyApi> {
  const { modules, database } = deps;

  async function exportData(userId: string) {
    return {
      exportedAt: new Date().toISOString(),
      format: 'campusmarkt-export/1',
      account: await modules.identity.exportData(userId),
      listings: await modules.listings.exportForUser(userId),
      favorites: await modules.search.exportForUser(userId),
      messagesSent: await modules.messaging.exportForUser(userId),
      contactConsents: await modules.messaging.exportContactConsents(userId),
      trust: await modules.trust.exportForUser(userId),
    };
  }

  const api: PrivacyApi = {
    async purgeDueAccounts() {
      const due = await modules.identity.dueDeletions();
      for (const user of due) {
        await database.tx(async (tx) => {
          await modules.listings.deleteAllForOwner(tx, user.id);
          await modules.messaging.deleteForUser(tx, user.id);
          await modules.trust.deleteForUser(tx, user.id);
          await modules.notifications.email(tx, { address: user.email }, 'deletion_completed', { name: user.displayName });
          await modules.identity.deleteUser(tx, user.id);
        });
        await modules.search.deleteForUser(user.id);
        deps.logger.info({ userId: user.id }, 'Konto endgültig gelöscht');
      }
      return due.length;
    },
  };

  const routes: FastifyPluginAsyncTypebox = async (app) => {
    const tags = ['privacy'];

    app.get('/me/export', { schema: { tags } }, async (req, reply) => {
      const auth = requireAuth(req);
      const data = await exportData(auth.userId);
      return reply
        .header('content-disposition', `attachment; filename="campusmarkt-export-${new Date().toISOString().slice(0, 10)}.json"`)
        .type('application/json')
        .send(JSON.stringify(data, null, 2));
    });

    app.post('/me/delete', { schema: { tags, body: DeleteAccountBody, response: { 202: Accepted } } }, async (req, reply) => {
      const auth = requireAuth(req);
      await modules.identity.requestDeletion(auth.userId, req.body.password);
      reply.clearCookie(SESSION_COOKIE, { path: '/' });
      return reply.status(202).send({
        message: 'Dein Konto wird in 14 Tagen gelöscht. Melde dich bis dahin an, um die Löschung abzubrechen.',
      });
    });
  };

  return {
    api,
    routes,
    async registerJobs(withWorkers) {
      await deps.jobs.defineQueue(PRIVACY_PURGE, { retryLimit: 2, expireInSeconds: 600 });
      if (!withWorkers) return;
      await deps.jobs.work(PRIVACY_PURGE, async () => {
        const count = await api.purgeDueAccounts();
        if (count) deps.logger.info({ count }, 'Fällige Kontolöschungen ausgeführt');
        // Zähler mit IP-Hashes nach spätestens 7 Tagen löschen (REQ-PRIV-002); Fenster sind ≤ 1 h
        await deps.rateLimit.purge(86_400);
      });
      await deps.jobs.schedule(PRIVACY_PURGE, '17 3 * * *');
    },
  };
}
