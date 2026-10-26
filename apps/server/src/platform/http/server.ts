import { createHash, randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import Fastify, { LogController, type FastifyError } from 'fastify';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import websocket from '@fastify/websocket';
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { API_PREFIX, CSRF_HEADER, SystemStatus } from '@campusmarkt/contracts';
import type { Config } from '../../config.js';
import { AppError } from '../errors.js';
import type { Logger } from '../logger.js';
import type { Metrics } from '../metrics.js';
import type { Ops } from '../ops.js';
import { isSameOrigin, SESSION_COOKIE, type AuthContext } from './auth.js';
import { isMaintenanceExempt, maintenancePage, retryAfterSeconds } from './maintenance.js';
import { isKnownSpaPath } from './spa-routes.js';
import { requiresCurrentTerms } from './terms.js';

export interface HttpServerOptions {
  config: Config;
  logger: Logger;
  metrics: Metrics;
  resolveSession(token: string): Promise<AuthContext | null>;
  isReady(): Promise<boolean>;
  ops: Ops;
}

/** One-Click-Abmeldung aus Mail-Programmen (RFC 8058) kommt ohne CSRF-Header; geschützt durch das signierte Token. */
const CSRF_EXEMPT = new Set([`${API_PREFIX}/notifications/unsubscribe`]);

const PROBLEM_BASE = 'https://campusmarkt.local/problems/';
const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const CSP = [
  "default-src 'self'",
  "img-src 'self' blob: data:",
  "style-src 'self'",
  "script-src 'self'",
  "connect-src 'self'",
  "font-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

/**
 * CSP je Antwort: Serverseitig erzeugte HTML-Seiten (Wartung, Abmeldung) bringen ihr CSS als festen <style>-Block mit.
 * Statt 'unsafe-inline' wird genau dieser Block per SHA-256 erlaubt (ZAP 10055, Pentest PT-HDR-01).
 */
export function cspFor(payload: unknown, contentType: string | undefined): string {
  if (typeof payload !== 'string' || !contentType?.startsWith('text/html')) return CSP;
  const hashes = [...payload.matchAll(/<style>([\s\S]*?)<\/style>/g)].map(
    (m) => `'sha256-${createHash('sha256').update(m[1]!).digest('base64')}'`,
  );
  return hashes.length ? CSP.replace("style-src 'self'", `style-src 'self' ${hashes.join(' ')}`) : CSP;
}

export async function createHttpServer(options: HttpServerOptions) {
  const { config, logger, metrics } = options;

  const app = Fastify({
    loggerInstance: logger,
    // Fremde Request-IDs nur als UUID übernehmen; sonst könnten Clients beliebigen Text ins Log schreiben (MAN-OPS-002, P-1)
    requestIdHeader: false,
    genReqId: (req) => requestIdFrom(req.headers['x-request-id']),
    bodyLimit: 1024 * 1024,
    return503OnClosing: true,
    // Genau ein vertrauenswürdiger Hop (Caddy im Profil proxy); weitere X-Forwarded-For-Einträge zählen nicht (RV-A-07)
    trustProxy: config.trustProxy ? (_address: string, hop: number) => hop < 1 : false,
    // Eigenes Request-Log ohne IP-Adresse, Port und Query-Werte (REQ-OPS-002, RV-R-01, RV-C-07)
    logController: new LogController({ disableRequestLogging: true }),
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
  if (config.apiDocs) await app.register(swaggerUi, { routePrefix: '/api/docs' });

  app.decorateRequest('auth', null);

  // Formular-POST der One-Click-Abmeldung (List-Unsubscribe-Post: List-Unsubscribe=One-Click)
  app.addContentTypeParser('application/x-www-form-urlencoded', { parseAs: 'string' }, (_req, body, done) => {
    done(null, Object.fromEntries(new URLSearchParams(body as string)));
  });

  app.addHook('onRequest', async (req, reply) => {
    reply.header('x-request-id', req.id);
    const token = req.cookies[SESSION_COOKIE];
    req.auth = token ? await options.resolveSession(token) : null;

    // CSRF: zustandsändernde API-Requests brauchen den Custom Header (nicht cross-origin setzbar)
    // und, falls vorhanden, einen Origin des eigenen Hosts (REQ-SEC-004).
    if (UNSAFE_METHODS.has(req.method) && req.url.startsWith('/api/') && !CSRF_EXEMPT.has(req.url.split('?')[0]!)) {
      if (req.headers[CSRF_HEADER] !== '1' || !isSameOrigin(req.headers.origin, req.headers.host)) {
        throw new AppError(403, 'csrf', 'Anfrage wurde aus Sicherheitsgründen abgelehnt (CSRF).');
      }
    }

    // Wartungsmodus (REQ-OPS-006): 503 mit Retry-After, Ausnahmen siehe maintenance.ts
    const maintenance = await options.ops.maintenance().catch(() => ({ active: false, until: null }));
    if (maintenance.active && !isMaintenanceExempt({ url: req.url, method: req.method, role: req.auth?.role ?? null })) {
      const retryAfter = retryAfterSeconds(maintenance.until);
      if (req.url.startsWith('/api/') || req.method !== 'GET') {
        throw Object.assign(
          new AppError(503, 'maintenance', 'CampusMarkt wird gerade gewartet. Bitte versuche es später erneut.'),
          { retryAfterSeconds: retryAfter },
        );
      }
      return reply
        .status(503)
        .header('retry-after', String(retryAfter))
        .header('cache-control', 'no-store')
        .type('text/html; charset=utf-8')
        .send(maintenancePage(maintenance.until));
    }

  });

  // Neue Nutzungsbedingungen: schreibende Aktionen erst nach erneuter Zustimmung (REQ-LEGAL-003); nach dem
  // Body-Parsing, weil bei PATCH /me und der Kontaktfreigabe der Inhalt entscheidet (RV-C-06)
  app.addHook('preHandler', async (req) => {
    if (req.auth && !req.auth.termsCurrent && requiresCurrentTerms({ method: req.method, url: req.url, body: req.body })) {
      throw new AppError(403, 'terms_required', 'Bitte stimme zuerst den aktuellen Nutzungsbedingungen zu.');
    }
  });

  app.addHook('onSend', async (req, reply, payload) => {
    reply.header('x-content-type-options', 'nosniff');
    reply.header('referrer-policy', 'same-origin');
    reply.header('x-frame-options', 'DENY');
    reply.header('permissions-policy', 'camera=(), microphone=(), geolocation=()');
    // Prozess-Isolation gegen Spectre-artige Angriffe; alle Ressourcen kommen vom eigenen Ursprung (ZAP 90004)
    reply.header('cross-origin-opener-policy', 'same-origin');
    reply.header('cross-origin-resource-policy', 'same-origin');
    if (!req.url.startsWith('/api/docs')) reply.header('cross-origin-embedder-policy', 'require-corp');
    // Keine Indexierung durch Suchmaschinen (REQ-PRIV-008)
    reply.header('x-robots-tag', 'noindex, nofollow');
    if (!req.url.startsWith('/api/docs')) {
      reply.header('content-security-policy', cspFor(payload, reply.getHeader('content-type') as string | undefined));
    }
    if (req.url.startsWith('/api/') && !reply.hasHeader('cache-control')) reply.header('cache-control', 'no-store');
    return payload;
  });

  app.addHook('onResponse', async (req, reply) => {
    metrics.httpDuration
      .labels(req.method, req.routeOptions.url ?? 'unmatched', String(reply.statusCode))
      .observe(reply.elapsedTime / 1000);
    req.log.info(requestLogEntry(req, reply.statusCode, reply.elapsedTime), 'request');
  });

  app.setErrorHandler((error: FastifyError | AppError, req, reply) => {
    if (error instanceof AppError) {
      // Abgelehnte Zugriffe als Sicherheitsereignis, ohne Personenbezug (ASVS 7.2.2); Request-ID steht in den Bindings
      if (error.status === 401 || error.status === 403) {
        req.log.info({ event: 'access_denied', status: error.status, code: error.code, route: req.routeOptions?.url ?? 'unmatched' }, 'Zugriff abgelehnt');
      }
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
          requestId: req.id,
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
          requestId: req.id,
        });
    }
    const status = error.statusCode && error.statusCode < 500 ? error.statusCode : 500;
    if (status >= 500) req.log.error({ err: error }, 'Unbehandelter Fehler');
    // REQ-UX-003: nie Stacktrace oder interne Meldungen ausliefern; Details stehen im Log unter der Request-ID
    return reply
      .status(status)
      .type('application/problem+json')
      .send({
        type: PROBLEM_BASE + (status === 500 ? 'internal' : 'request_error'),
        title: status === 500 ? 'Etwas ist schiefgelaufen' : error.message,
        status,
        code: status === 500 ? 'internal' : (error.code ?? 'request_error').toLowerCase(),
        ...(status === 500 ? { detail: `Bitte versuche es erneut. Fehlerkennung: ${req.id}` } : {}),
        requestId: req.id,
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

  // Statusseite (REQ-OPS-007), öffentlich und auch im Wartungsmodus erreichbar
  // Grobe Begrenzung je Prozess: die Prüfungen selbst laufen höchstens einmal gleichzeitig (ops.ts, RV-A-11)
  const statusLimiter = { windowStart: 0, count: 0 };
  app.get(
    `${API_PREFIX}/status`,
    { schema: { tags: ['ops'], security: [], response: { 200: SystemStatus } } },
    async (_req, reply) => {
      const now = Date.now();
      if (now - statusLimiter.windowStart > 10_000) Object.assign(statusLimiter, { windowStart: now, count: 0 });
      if (++statusLimiter.count > STATUS_REQUESTS_PER_10S) {
        throw Object.assign(new AppError(429, 'rate_limited', 'Zu viele Anfragen. Bitte versuche es gleich erneut.'), {
          retryAfterSeconds: 10,
        });
      }
      reply.header('cache-control', 'no-store');
      return options.ops.status();
    },
  );

  // Keine Indexierung (REQ-PRIV-008) und Meldeweg für Sicherheitslücken nach RFC 9116 (REQ-SEC-012)
  app.get('/robots.txt', { schema: { hide: true } }, async (_req, reply) =>
    reply.type('text/plain; charset=utf-8').send('User-agent: *\nDisallow: /\n'),
  );
  const securityTxt = buildSecurityTxt(config.publicUrl, config.securityContact);
  app.get('/.well-known/security.txt', { schema: { hide: true } }, async (_req, reply) =>
    reply.type('text/plain; charset=utf-8').send(securityTxt),
  );

  // React-SPA als statische Dateien (ADR-0002), Fallback auf index.html für Client-Routen
  const spaAvailable = existsSync(config.webDistDir);
  if (spaAvailable) {
    await app.register(fastifyStatic, { root: config.webDistDir, wildcard: false, index: ['index.html'] });
  }
  // Bekannte SPA-Routen → 200, sonstige Seitenaufrufe → 404 mit der SPA, die „Seite nicht gefunden“ zeigt (REQ-UX-003)
  app.setNotFoundHandler((req, reply) => {
    const isApi = req.url.startsWith(API_PREFIX) || req.url.startsWith('/api/') || req.url.startsWith('/health');
    const pageRequest = req.method === 'GET' || req.method === 'HEAD';
    if (spaAvailable && pageRequest && !isApi && !/\.[a-z0-9]+$/i.test(req.url.split('?')[0] ?? '')) {
      return reply
        .status(isKnownSpaPath(req.url) ? 200 : 404)
        .header('cache-control', 'no-cache')
        .sendFile('index.html');
    }
    return reply
      .status(404)
      .type('application/problem+json')
      .send({ type: PROBLEM_BASE + 'not_found', title: 'Nicht gefunden', status: 404, code: 'not_found', requestId: req.id });
  });

  return app;
}

export type App = Awaited<ReturnType<typeof createHttpServer>>;

const STATUS_REQUESTS_PER_10S = 50;

/**
 * Ein Eintrag je Anfrage: Methode, Routenmuster (bzw. Pfad ohne Query), Status, Dauer; die Request-ID steht in den
 * Bindings von req.log. Keine IP-Adresse, kein Port, keine Query-Werte (Tokens in Einmal- und Abmeldelinks).
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Übernimmt eine vom Client oder Proxy gesetzte Request-ID nur, wenn sie eine UUID ist. */
export function requestIdFrom(header: string | string[] | undefined): string {
  const value = Array.isArray(header) ? header[0] : header;
  return value && UUID.test(value) ? value.toLowerCase() : randomUUID();
}

export function requestLogEntry(
  req: { method: string; url: string; routeOptions?: { url?: string } },
  statusCode: number,
  elapsedMs: number,
) {
  return {
    method: req.method,
    // Unbekannte Pfade nicht roh protokollieren, sie können Adressen oder Tokens enthalten (MAN-OPS-002, P-2)
    route: req.routeOptions?.url ?? (isKnownSpaPath(req.url) ? req.url.split('?')[0] : 'unmatched'),
    status: statusCode,
    ms: Math.round(elapsedMs),
  };
}

/**
 * RFC 9116: Pflichtfelder Contact und Expires; Expires höchstens ein Jahr, hier 180 Tage ab Start. Web-URIs (Policy,
 * Canonical) nur bei HTTPS, weil die Datei sonst nicht vertrauenswürdig ausgeliefert wird (RV-A-17).
 */
export function buildSecurityTxt(publicUrl: string, contact: string, now = new Date()): string {
  const expires = new Date(now.getTime() + 180 * 86_400_000);
  expires.setUTCHours(0, 0, 0, 0);
  const https = publicUrl.startsWith('https://');
  return [
    `Contact: ${contact}`,
    `Expires: ${expires.toISOString()}`,
    'Preferred-Languages: de, en',
    ...(https ? [`Policy: ${publicUrl}/kontakt`, `Canonical: ${publicUrl}/.well-known/security.txt`] : []),
    '',
  ].join('\n');
}
