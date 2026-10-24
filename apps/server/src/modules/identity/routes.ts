import type { FastifyReply } from 'fastify';
import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import {
  AcceptTermsBody,
  Accepted,
  AdminUser,
  EmailBody,
  IdParams,
  LoginBody,
  Me,
  RegisterBody,
  ResetConfirmBody,
  SetRoleBody,
  TokenBody,
  UpdateMeBody,
} from '@campusmarkt/contracts';
import type { Config } from '../../config.js';
import { requireAuth, requireRole, SESSION_COOKIE } from '../../platform/http/auth.js';
import type { IdentityService } from './service.js';

const NEUTRAL = 'Falls die Angaben stimmen, haben wir dir eine E-Mail geschickt. Bitte prüfe dein Postfach.';

export function identityRoutes(service: IdentityService, config: Config): FastifyPluginAsyncTypebox {
  const setSession = (reply: FastifyReply, token: string) =>
    reply.setCookie(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: config.cookieSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: config.sessionTtlDays * 86_400,
    });

  return async (app) => {
    const tags = ['identity'];

    app.post(
      '/auth/register',
      { schema: { tags, body: RegisterBody, response: { 202: Accepted } } },
      async (req, reply) => {
        await service.register(req.body, req.ip);
        return reply.status(202).send({ message: NEUTRAL });
      },
    );

    app.post('/auth/verify', { schema: { tags, body: TokenBody, response: { 200: Me } } }, async (req, reply) => {
      const { me, sessionToken } = await service.verify(req.body.token);
      setSession(reply, sessionToken);
      return me;
    });

    app.post(
      '/auth/resend-verification',
      { schema: { tags, body: EmailBody, response: { 202: Accepted } } },
      async (req, reply) => {
        await service.resendVerification(req.body.email);
        return reply.status(202).send({ message: NEUTRAL });
      },
    );

    app.post('/auth/login', { schema: { tags, body: LoginBody, response: { 200: Me } } }, async (req, reply) => {
      const { me, sessionToken } = await service.login(req.body.email, req.body.password, req.ip);
      setSession(reply, sessionToken);
      return me;
    });

    app.post('/auth/logout', { schema: { tags } }, async (req, reply) => {
      if (req.auth) await service.logout(req.auth.sessionHash);
      reply.clearCookie(SESSION_COOKIE, { path: '/' });
      return reply.status(204).send();
    });

    app.post(
      '/auth/password-reset/request',
      { schema: { tags, body: EmailBody, response: { 202: Accepted } } },
      async (req, reply) => {
        await service.requestPasswordReset(req.body.email);
        return reply.status(202).send({ message: NEUTRAL });
      },
    );

    app.post('/auth/password-reset/confirm', { schema: { tags, body: ResetConfirmBody } }, async (req, reply) => {
      await service.confirmPasswordReset(req.body.token, req.body.password);
      return reply.status(204).send();
    });

    app.get('/me', { schema: { tags, response: { 200: Me } } }, async (req) => {
      return service.getMe(requireAuth(req).userId);
    });

    app.patch('/me', { schema: { tags, body: UpdateMeBody, response: { 200: Me } } }, async (req) => {
      return service.updateMe(requireAuth(req).userId, req.body);
    });

    app.post('/me/terms', { schema: { tags, body: AcceptTermsBody, response: { 200: Me } } }, async (req) => {
      return service.acceptTerms(requireAuth(req).userId, req.body.version);
    });

    app.get(
      '/admin/users',
      { schema: { tags: ['admin'], querystring: Type.Object({ q: Type.Optional(Type.String({ maxLength: 100 })) }), response: { 200: Type.Array(AdminUser) } } },
      async (req) => {
        requireRole(req, 'admin');
        return service.listUsers(req.query.q);
      },
    );

    app.post(
      '/admin/users/:id/role',
      { schema: { tags: ['admin'], params: IdParams, body: SetRoleBody } },
      async (req, reply) => {
        const actor = requireRole(req, 'admin');
        await service.setRole(actor, req.params.id, req.body.role);
        return reply.status(204).send();
      },
    );
  };
}
