import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { BlockedUser, CreateReportBody, DecisionBody, IdParams, ModerationCase } from '@campusmarkt/contracts';
import { requireAuth, requireRole } from '../../platform/http/auth.js';
import type { Module, ModuleDeps } from '../shared.js';
import { createTrustService, type TrustService } from './service.js';

export type TrustApi = TrustService;

/** Modul trust: Meldungen, Moderation, Blockieren (REQ-MOD-*, DSA Art. 16/17). */
export function createTrustModule(deps: ModuleDeps): Module<TrustApi> {
  const service = createTrustService(deps);

  const routes: FastifyPluginAsyncTypebox = async (app) => {
    const tags = ['trust'];

    app.post(
      '/reports',
      { schema: { tags, body: CreateReportBody, response: { 201: Type.Object({ id: Type.String() }) } } },
      async (req, reply) => reply.status(201).send(await service.report(requireAuth(req), req.body)),
    );

    app.get('/me/blocks', { schema: { tags, response: { 200: Type.Array(BlockedUser) } } }, async (req) =>
      service.blocks(requireAuth(req)),
    );

    app.put('/users/:id/block', { schema: { tags, params: IdParams } }, async (req, reply) => {
      await service.block(requireAuth(req), req.params.id);
      return reply.status(204).send();
    });

    app.delete('/users/:id/block', { schema: { tags, params: IdParams } }, async (req, reply) => {
      await service.unblock(requireAuth(req), req.params.id);
      return reply.status(204).send();
    });

    app.get(
      '/moderation/cases',
      {
        schema: {
          tags: ['moderation'],
          querystring: Type.Object({ status: Type.Optional(Type.Union([Type.Literal('open'), Type.Literal('decided')])) }),
          response: { 200: Type.Array(ModerationCase) },
        },
      },
      async (req) => service.cases(requireRole(req, 'moderator'), req.query.status ?? 'open'),
    );

    app.post(
      '/moderation/cases/:id/decision',
      { schema: { tags: ['moderation'], params: IdParams, body: DecisionBody } },
      async (req, reply) => {
        await service.decide(requireRole(req, 'moderator'), req.params.id, req.body.decision, req.body.reason);
        return reply.status(204).send();
      },
    );
  };

  return { api: service, routes };
}
