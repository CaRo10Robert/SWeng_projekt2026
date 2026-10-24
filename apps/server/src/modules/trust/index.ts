import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import {
  Appeal,
  AppealBody,
  AppealDecisionBody,
  AppealReceipt,
  BlockedUser,
  CreateReportBody,
  DecisionBody,
  IdParams,
  ModerationCase,
  ModerationNotice,
  TokenAppealBody,
  TokenAppealInfo,
} from '@campusmarkt/contracts';
import { requireAuth, requireRole } from '../../platform/http/auth.js';
import type { Module, ModuleDeps } from '../shared.js';
import { createTrustService, type TrustService } from './service.js';

export type TrustApi = TrustService;

/** Modul trust: Meldungen, Moderation, Blockieren, Widerspruch (REQ-MOD-*, REQ-LEGAL-006..008, DSA Art. 16–20). */
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
        await service.decide(requireRole(req, 'moderator'), req.params.id, req.body);
        return reply.status(204).send();
      },
    );

    // ---------------------------------------------------------- DSA: Mitteilungen und Widerspruch
    app.get('/me/notices', { schema: { tags, response: { 200: Type.Array(ModerationNotice) } } }, async (req) =>
      service.notices(requireAuth(req)),
    );

    app.post('/me/notices/read', { schema: { tags } }, async (req, reply) => {
      await service.markNoticesRead(requireAuth(req));
      return reply.status(204).send();
    });

    app.post(
      '/moderation/decisions/:id/appeal',
      { schema: { tags, params: IdParams, body: AppealBody, response: { 201: AppealReceipt } } },
      async (req, reply) => reply.status(201).send(await service.appeal(requireAuth(req), req.params.id, req.body.reason)),
    );

    const tokenQuery = Type.Object({ token: Type.String({ minLength: 10, maxLength: 200 }) });
    app.get(
      '/appeals/token',
      { schema: { tags, security: [], querystring: tokenQuery, response: { 200: TokenAppealInfo } } },
      async (req) => service.tokenAppealInfo(req.query.token),
    );

    app.post(
      '/appeals/token',
      { schema: { tags, security: [], body: TokenAppealBody, response: { 201: AppealReceipt } } },
      async (req, reply) => reply.status(201).send(await service.tokenAppeal(req.body.token, req.body.reason)),
    );

    app.get(
      '/moderation/appeals',
      {
        schema: {
          tags: ['moderation'],
          querystring: Type.Object({ status: Type.Optional(Type.Union([Type.Literal('open'), Type.Literal('decided')])) }),
          response: { 200: Type.Array(Appeal) },
        },
      },
      async (req) => service.appeals(requireRole(req, 'moderator'), req.query.status ?? 'open'),
    );

    app.post(
      '/moderation/appeals/:id/decision',
      { schema: { tags: ['moderation'], params: IdParams, body: AppealDecisionBody } },
      async (req, reply) => {
        await service.decideAppeal(requireRole(req, 'moderator'), req.params.id, req.body);
        return reply.status(204).send();
      },
    );
  };

  return { api: service, routes };
}
