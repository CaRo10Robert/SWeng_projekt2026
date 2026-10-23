import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import Fastify, { type FastifyError } from 'fastify';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import websocket from '@fastify/websocket';
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { API_PREFIX, CSRF_HEADER } from '@campusmarkt/contracts';
import type { Config } from '../../config.js';
import { AppError } from '../errors.js';
import type { Logger } from '../logger.js';
import type { Metrics } from '../metrics.js';
import { SESSION_COOKIE, type AuthContext } from './auth.js';

export interface HttpServerOptions {
  config: Config;
  logger: Logger;
  metrics: Metrics;
  resolveSession(token: string): Promise<AuthContext | null>;
  isReady(): Promise<boolean>;
}

const PROBLEM_BASE = 'https://campusmarkt.local/problems/';
const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const CSP = [
  "default-src 'self'",
  "img-src 'self' blob: data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self'",
  "connect-src 'self'",
  "font-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

export async function createHttpServer(options: HttpServerOptions) {
  const { config, logger, metrics } = options;

  const app = Fastify({
    loggerInstance: logger,
    requestIdHeader: 'x-request-id',
    genReqId: () => randomUUID(),
    bodyLimit: 1024 * 1024,
    return503OnClosing: true,
  }).withTypeProvider<TypeBoxTypeProvider>();

  await app.register(cookie);
  await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024, files: 8, fields: 5 } });
  await app.register(websocket, { options: { maxPayload: 16 * 1024 } });

  await app.register(swagger, {
    openapi: {
      openapi: '3.1.0',
      info: {
        title: 'CampusMarkt HWG LU API',
        version: '0.1.0',
        description: 'REST-API des CampusMarkt-MVP (ADR-0009). Fehler als RFC 9457 Problem Details.',
      },
      servers: [{ url: config.publicUrl }],
      components: {
        securitySchemes: { session: { type: 'apiKey', in: 'cookie', name: SESSION_COOKIE } },
      },
      security: [{ session: [] }],
    },
  });
  await app.register(swaggerUi, { routePrefix: '/api/docs' });

  app.decorateRequest('auth', null);

  app.addHook('onRequest', async (req, reply) => {
    reply.header('x-request-id', req.id);
    const token = req.cookies[SESSION_COOKIE];
    req.auth = token ? await options.resolveSession(token) : null;

    // CSRF: zustandsändernde API-Requests brauchen den Custom Header (nicht cross-origin setzbar)
    // und, falls vorhanden, einen Origin des eigenen Hosts (REQ-SEC-004).
    if (UNSAFE_METHODS.has(req.method) && req.url.startsWith('/api/')) {
      const origin = req.headers.origin;
      const sameOrigin = !origin || new URL(origin).host === req.headers.host;
      if (req.headers[CSRF_HEADER] !== '1' || !sameOrigin) {
        throw new AppError(403, 'csrf', 'Anfrage wurde aus Sicherheitsgründen abgelehnt (CSRF).');
      }
    }
  });

  app.addHook('onSend', async (req, reply, payload) => {
    reply.header('x-content-type-options', 'nosniff');
    reply.header('referrer-policy', 'same-origin');
    reply.header('x-frame-options', 'DENY');
    reply.header('permissions-policy', 'camera=(), microphone=(), geolocation=()');
    if (!req.url.startsWith('/api/docs')) reply.header('content-security-policy', CSP);
    if (req.url.startsWith('/api/') && !reply.hasHeader('cache-control')) reply.header('cache-control', 'no-store');
    return payload;
  });

  app.addHook('onResponse', async (req, reply) => {
    metrics.httpDuration
      .labels(req.method, req.routeOptions.url ?? 'unmatched', String(reply.statusCode))
      .observe(reply.elapsedTime / 1000);
  });

  app.setErrorHandler((error: FastifyError | AppError, req, reply) => {
    if (error instanceof AppError) {
      const retryAfter = (error as AppError & { retryAfterSeconds?: number }).retryAfterSeconds;
      if (retryAfter) reply.header('retry-after', String(retryAfter));
      return reply
        .status(error.status)
        .type('application/problem+json')
        .send({
          type: PROBLEM_BASE + error.code,
          title: error.message,
          status: error.status,
          detail: error.message,
          code: error.code,
          errors: error.errors,
        });
    }
    if ('validation' in error && error.validation) {
      return reply
        .status(422)
        .type('application/problem+json')
        .send({
          type: PROBLEM_BASE + 'validation_failed',
          title: 'Eingaben sind ungültig',
          status: 422,
          code: 'validation_failed',
          detail: error.message,
          errors: error.validation.map((v) => ({
            path: (v.instancePath || (v.params as { missingProperty?: string }).missingProperty || '').replace(/^\//, ''),
            message: v.message ?? 'ungültig',
          })),
        });
    }
    const status = error.statusCode && error.statusCode < 500 ? error.statusCode : 500;
    if (status >= 500) req.log.error({ err: error }, 'Unbehandelter Fehler');
    return reply
      .status(status)
      .type('application/problem+json')
      .send({
        type: PROBLEM_BASE + (status === 500 ? 'internal' : 'request_error'),
        title: status === 500 ? 'Interner Fehler' : error.message,
        status,
        code: status === 500 ? 'internal' : (error.code ?? 'request_error').toLowerCase(),
      });
  });

  // Health (REQ-OPS-001) und Metriken
  app.get('/health/live', { schema: { hide: true } }, async () => ({ status: 'ok' }));
  app.get('/health/ready', { schema: { hide: true } }, async (_req, reply) => {
    const ready = await options.isReady();
    return reply.status(ready ? 200 : 503).send({ status: ready ? 'ready' : 'not_ready' });
  });
  app.get('/metrics', { schema: { hide: true } }, async (_req, reply) => {
    reply.type(metrics.registry.contentType);
    return metrics.registry.metrics();
  });

  // React-SPA als statische Dateien (ADR-0002), Fallback auf index.html für Client-Routen
  const spaAvailable = existsSync(config.webDistDir);
  if (spaAvailable) {
    await app.register(fastifyStatic, { root: config.webDistDir, wildcard: false, index: ['index.html'] });
  }
  app.setNotFoundHandler((req, reply) => {
    const isApi = req.url.startsWith(API_PREFIX) || req.url.startsWith('/api/') || req.url.startsWith('/health');
    if (spaAvailable && req.method === 'GET' && !isApi && !/\.[a-z0-9]+$/i.test(req.url.split('?')[0] ?? '')) {
      return reply.header('cache-control', 'no-cache').sendFile('index.html');
    }
    return reply
      .status(404)
      .type('application/problem+json')
      .send({ type: PROBLEM_BASE + 'not_found', title: 'Nicht gefunden', status: 404, code: 'not_found' });
  });

  return app;
}

export type App = Awaited<ReturnType<typeof createHttpServer>>;
