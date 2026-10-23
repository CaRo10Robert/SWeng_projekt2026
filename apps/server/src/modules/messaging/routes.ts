import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import {
  ConversationSummary,
  Deal,
  DealActionBody,
  IdParams,
  Message,
  MessagesQuery,
  SendMessageBody,
  StartConversationBody,
  StartConversationResult,
  UnreadCount,
  type ClientEvent,
  type ServerEvent,
} from '@campusmarkt/contracts';
import { AppError } from '../../platform/errors.js';
import { requireAuth } from '../../platform/http/auth.js';
import type { ModuleDeps } from '../shared.js';
import type { MessagingService } from './service.js';

export function messagingRoutes(service: MessagingService, deps: ModuleDeps): FastifyPluginAsyncTypebox {
  return async (app) => {
    const tags = ['messaging'];

    app.get('/conversations', { schema: { tags, response: { 200: Type.Array(ConversationSummary) } } }, async (req) =>
      service.list(requireAuth(req)),
    );

    app.post(
      '/conversations',
      { schema: { tags, body: StartConversationBody, response: { 201: StartConversationResult } } },
      async (req, reply) => {
        const { listingId, body, clientMsgId } = req.body;
        return reply.status(201).send(await service.start(requireAuth(req), listingId, body, clientMsgId));
      },
    );

    app.get('/conversations/:id', { schema: { tags, params: IdParams, response: { 200: ConversationSummary } } }, async (req) =>
      service.get(requireAuth(req), req.params.id),
    );

    app.get(
      '/conversations/:id/messages',
      { schema: { tags, params: IdParams, querystring: MessagesQuery, response: { 200: Type.Array(Message) } } },
      async (req) => service.messages(requireAuth(req), req.params.id, req.query.after, req.query.limit),
    );

    app.post(
      '/conversations/:id/messages',
      { schema: { tags, params: IdParams, body: SendMessageBody, response: { 201: Message } } },
      async (req, reply) =>
        reply.status(201).send(await service.send(requireAuth(req), req.params.id, req.body.body, req.body.clientMsgId)),
    );

    app.post('/conversations/:id/read', { schema: { tags, params: IdParams } }, async (req, reply) => {
      await service.markRead(requireAuth(req), req.params.id);
      return reply.status(204).send();
    });

    app.post(
      '/conversations/:id/deal',
      { schema: { tags, params: IdParams, body: DealActionBody, response: { 200: Deal } } },
      async (req) => service.deal(requireAuth(req), req.params.id, req.body),
    );

    app.get('/me/unread', { schema: { tags, response: { 200: UnreadCount } } }, async (req) => ({
      count: await service.unreadCount(requireAuth(req)),
    }));
  };
}

/**
 * WebSocket-Gateway `/ws` (ADR-0004). Authentifizierung über das Session-Cookie beim Handshake
 * plus Origin-Prüfung. Der Client lädt Verpasstes nach einem Reconnect per REST (`?after=`).
 */
export function websocketRoute(service: MessagingService, deps: ModuleDeps): FastifyPluginAsyncTypebox {
  return async (app) => {
    app.get('/ws', { websocket: true, schema: { hide: true } }, (socket, req) => {
      const origin = req.headers.origin;
      if (!req.auth || (origin && new URL(origin).host !== req.headers.host)) {
        socket.close(4401, 'unauthenticated');
        return;
      }
      const auth = req.auth;
      const send = (event: ServerEvent) => {
        if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(event));
      };
      const unsubscribe = deps.realtime.subscribe(auth.userId, send);
      deps.metrics.wsConnections.inc();
      send({ type: 'hello', userId: auth.userId });

      socket.on('message', async (raw) => {
        let event: ClientEvent;
        try {
          event = JSON.parse(raw.toString()) as ClientEvent;
        } catch {
          return send({ type: 'error', code: 'bad_request', detail: 'Ungültiges JSON' });
        }
        try {
          if (event.type === 'send') {
            if (typeof event.body !== 'string' || event.body.length < 1 || event.body.length > 2000) {
              return send({ type: 'error', clientMsgId: event.clientMsgId, code: 'validation_failed', detail: '1–2000 Zeichen' });
            }
            const message = await service.send(auth, event.conversationId, event.body, event.clientMsgId);
            send({ type: 'ack', clientMsgId: event.clientMsgId, message });
          } else if (event.type === 'read') {
            await service.markRead(auth, event.conversationId);
          }
        } catch (error) {
          const appError = error instanceof AppError ? error : null;
          if (!appError) req.log.error({ err: error }, 'WebSocket-Fehler');
          send({
            type: 'error',
            clientMsgId: event.type === 'send' ? event.clientMsgId : undefined,
            code: appError?.code ?? 'internal',
            detail: appError?.message ?? 'Interner Fehler',
          });
        }
      });

      socket.on('close', () => {
        unsubscribe();
        deps.metrics.wsConnections.dec();
      });
    });
  };
}
