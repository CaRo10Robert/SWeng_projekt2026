import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { loadConfig } from '../../config.js';
import { createLogger } from '../logger.js';
import { createMetrics } from '../metrics.js';
import { createOps } from '../ops.js';
import type { SettingsStore } from '../settings.js';
import { isSameOrigin } from './auth.js';
import { buildSecurityTxt, createHttpServer, cspFor, requestIdFrom, requestLogEntry } from './server.js';

function memorySettings(): SettingsStore {
  const values = new Map<string, unknown>();
  return {
    get: async <T>(key: string) => (values.get(key) as T) ?? null,
    set: async (key, value) => void values.set(key, value),
    remove: async (key) => void values.delete(key),
  };
}

async function server(settings = memorySettings()) {
  process.env.WEB_DIST_DIR = '/does-not-exist';
  const config = loadConfig();
  const ops = createOps({
    maintenanceFromEnv: false,
    maintenanceUntilFromEnv: null,
    settings,
    checkDatabase: async () => true,
    checkMail: async () => false,
  });
  const app = await createHttpServer({
    config,
    logger: createLogger('silent'),
    metrics: createMetrics(),
    resolveSession: async () => null,
    isReady: async () => true,
    ops,
  });
  app.get('/api/v1/boom', async () => {
    throw new Error('connect ECONNREFUSED 10.0.0.5:5432 at Pool.connect (/app/server/node_modules/pg/lib/index.js)');
  });
  return app;
}

describe('[AT-UX-003-2] Unerwarteter Fehler: 500 mit Request-ID, ohne interne Details (REQ-UX-003)', () => {
  it('liefert Problem Details mit Fehlerkennung, aber weder Meldung noch Stacktrace', async () => {
    const app = await server();
    const res = await app.inject({ method: 'GET', url: '/api/v1/boom' });
    const body = res.json();
    expect(res.statusCode).toBe(500);
    expect(body.code).toBe('internal');
    expect(body.requestId).toBe(res.headers['x-request-id']);
    expect(res.body).not.toMatch(/ECONNREFUSED|10\.0\.0\.5|node_modules|at Pool/);
    await app.close();
  });

  it('unbekannter API-Pfad → JSON-404', async () => {
    const app = await server();
    const res = await app.inject({ method: 'GET', url: '/api/v1/gibt-es-nicht' });
    expect(res.statusCode).toBe(404);
    expect(res.json().code).toBe('not_found');
    await app.close();
  });
});

describe('Betriebs-Endpunkte (REQ-PRIV-008, REQ-SEC-012, REQ-OPS-006/007)', () => {
  it('robots.txt sperrt alles, X-Robots-Tag auf jeder Antwort', async () => {
    const app = await server();
    const res = await app.inject({ method: 'GET', url: '/robots.txt' });
    expect(res.body).toContain('Disallow: /');
    expect(res.headers['x-robots-tag']).toBe('noindex, nofollow');
    await app.close();
  });

  it('security.txt nach RFC 9116 mit Expires in der Zukunft (≤ 1 Jahr)', () => {
    const now = new Date('2026-10-24T12:00:00Z');
    const txt = buildSecurityTxt('https://campusmarkt.example', 'mailto:security@hwg-lu.example', now);
    expect(txt).toMatch(/^Contact: mailto:security@hwg-lu\.example$/m);
    const expires = new Date(/^Expires: (.+)$/m.exec(txt)![1]!);
    expect(expires > now && expires.getTime() - now.getTime() < 365 * 86_400_000).toBe(true);
    expect(txt).toMatch(/^Preferred-Languages: de, en$/m);
    expect(txt).toMatch(/^Canonical: https:\/\/campusmarkt\.example\/\.well-known\/security\.txt$/m);
  });

  it('security.txt ohne HTTPS: keine Web-URIs (RFC 9116, RV-A-17)', () => {
    const txt = buildSecurityTxt('http://localhost:8080', 'mailto:security@hwg-lu.example');
    expect(txt).not.toMatch(/^(Policy|Canonical):/m);
    expect(txt).toMatch(/^Contact: /m);
  });

  it('Wartungsmodus aus der Einstellung: API 503 mit Retry-After, Status und Health erreichbar', async () => {
    const settings = memorySettings();
    await settings.set('maintenance', { on: true, until: null }, null);
    const app = await server(settings);
    const api = await app.inject({ method: 'GET', url: '/api/v1/listings' });
    expect(api.statusCode).toBe(503);
    expect(api.headers['retry-after']).toBe('300');
    expect(api.json().code).toBe('maintenance');
    const status = await app.inject({ method: 'GET', url: '/api/v1/status' });
    expect(status.statusCode).toBe(200);
    expect(status.json()).toMatchObject({ status: 'maintenance', maintenance: { active: true } });
    expect((await app.inject({ method: 'GET', url: '/health/live' })).statusCode).toBe(200);
    await app.close();
  });

  it('Statusseite ohne interne Details; gestörter Dienst → „degraded“', async () => {
    const app = await server();
    const res = await app.inject({ method: 'GET', url: '/api/v1/status' });
    const body = res.json();
    expect(body.status).toBe('degraded');
    expect(body.services).toContainEqual({ id: 'email', status: 'disrupted' });
    expect(res.body).not.toMatch(/version|host|error|postgres|smtp/i);
    await app.close();
  });
});

describe('[AT-OPS-002] Request-Log ohne IP-Adresse und ohne Query-Werte (REQ-OPS-002, RV-R-01, RV-C-07)', () => {
  it('enthält Methode, Routenmuster, Status und Dauer, aber kein token= und keine IP', () => {
    const entry = requestLogEntry(
      { method: 'GET', url: '/api/v1/notifications/unsubscribe?token=geheim.abc', routeOptions: { url: '/api/v1/notifications/unsubscribe' } },
      200,
      12.4,
    );
    expect(entry).toEqual({ method: 'GET', route: '/api/v1/notifications/unsubscribe', status: 200, ms: 12 });
    expect(JSON.stringify(entry)).not.toMatch(/token=|geheim|\d+\.\d+\.\d+\.\d+/);
  });

  it('auch ohne Routenmuster (SPA-Seite) nur der Pfad ohne Query', () => {
    expect(requestLogEntry({ method: 'GET', url: '/widerspruch?token=abc' }, 200, 1).route).toBe('/widerspruch');
  });

  it('unbekannte Pfade erscheinen als „unmatched“, nicht roh (P-2)', () => {
    expect(requestLogEntry({ method: 'GET', url: '/api/v1/gibtsnicht/max@studmail.hwg-lu.de' }, 404, 1).route).toBe('unmatched');
    expect(requestLogEntry({ method: 'GET', url: '/irgendwas/max@studmail.hwg-lu.de' }, 404, 1).route).toBe('unmatched');
  });

  it('übernimmt eine fremde Request-ID nur als UUID (P-1)', () => {
    const id = '0f8fad5b-d9cb-469f-a165-70867728950e';
    expect(requestIdFrom(id)).toBe(id);
    expect(requestIdFrom('max@studmail.hwg-lu.de')).not.toContain('@');
    expect(requestIdFrom('max@studmail.hwg-lu.de')).toMatch(/^[0-9a-f-]{36}$/);
    expect(requestIdFrom(undefined)).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('der Server protokolliert über den eigenen Eintrag (Fastify-Request-Log ist abgeschaltet)', async () => {
    const lines: string[] = [];
    const { default: pino } = await import('pino');
    const logger = pino({ level: 'info' }, { write: (line: string) => void lines.push(line) });
    process.env.WEB_DIST_DIR = '/does-not-exist';
    const app = await createHttpServer({
      config: loadConfig(),
      logger,
      metrics: createMetrics(),
      resolveSession: async () => null,
      isReady: async () => true,
      ops: createOps({ maintenanceFromEnv: false, maintenanceUntilFromEnv: null, settings: memorySettings(), checkDatabase: async () => true, checkMail: async () => true }),
    });
    await app.inject({ method: 'GET', url: '/robots.txt?token=geheim', remoteAddress: '203.0.113.9' });
    await app.close();
    const all = lines.join(String.fromCharCode(10));
    expect(all).toContain('"route":"/robots.txt"');
    expect(all).not.toMatch(/geheim|203\.0\.113\.9|remoteAddress/);
  });

  it('abgelehnte Zugriffe erscheinen als Sicherheitsereignis ohne IP (ASVS 7.2.2)', async () => {
    const lines: string[] = [];
    const { default: pino } = await import('pino');
    const logger = pino({ level: 'info' }, { write: (line: string) => void lines.push(line) });
    process.env.WEB_DIST_DIR = '/does-not-exist';
    const app = await createHttpServer({
      config: loadConfig(),
      logger,
      metrics: createMetrics(),
      resolveSession: async () => null,
      isReady: async () => true,
      ops: createOps({ maintenanceFromEnv: false, maintenanceUntilFromEnv: null, settings: memorySettings(), checkDatabase: async () => true, checkMail: async () => true }),
    });
    await app.inject({ method: 'POST', url: '/api/v1/auth/logout', remoteAddress: '203.0.113.9' });
    await app.close();
    const denied = lines.map((l) => JSON.parse(l)).find((l) => l.event === 'access_denied');
    expect(denied).toMatchObject({ status: 403, code: 'csrf' });
    expect(JSON.stringify(denied)).not.toMatch(/203\.0\.113\.9/);
  });
});

describe('[AT-SEC-004] CSRF: Origin-Prüfung ohne Serverfehler (REQ-SEC-004, Pentest PT-CSRF-03)', () => {
  it.each([
    [undefined, true],
    ['http://localhost:8080', true],
    ['http://evil.example', false],
    ['null', false],
    ['kein url', false],
  ])('Origin %s → gleicher Ursprung %s', (origin, same) => {
    expect(isSameOrigin(origin, 'localhost:8080')).toBe(same);
  });

  it('setzt Isolations-Header (COOP, CORP, COEP) auf jeder Antwort', async () => {
    const app = await server();
    const res = await app.inject({ method: 'GET', url: '/robots.txt' });
    expect(res.headers['cross-origin-opener-policy']).toBe('same-origin');
    expect(res.headers['cross-origin-resource-policy']).toBe('same-origin');
    expect(res.headers['cross-origin-embedder-policy']).toBe('require-corp');
    await app.close();
  });

  it('Origin „null“ mit Schutz-Header → 403 csrf statt 500', async () => {
    const app = await server();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/logout',
      headers: { host: 'localhost:8080', origin: 'null', 'x-campusmarkt-csrf': '1' },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().code).toBe('csrf');
    await app.close();
  });
});

describe('[AT-PRIV-006-2] CSP ohne unsafe-inline, eigene Inline-Styles per Hash (ZAP 10055)', () => {
  it('erlaubt nur den Hash des <style>-Blocks einer serverseitigen HTML-Seite', () => {
    const csp = cspFor('<html><head><style>body{color:red}</style></head></html>', 'text/html; charset=utf-8');
    expect(csp).toContain("style-src 'self' 'sha256-");
    expect(csp).not.toContain('unsafe-inline');
  });

  it('JSON mit <style> im Inhalt ändert die CSP nicht', () => {
    expect(cspFor('{"description":"<style>x</style>"}', 'application/json')).not.toContain('sha256-');
  });

  it('Wartungsseite trägt eine CSP mit passendem Hash', async () => {
    const settings = memorySettings();
    await settings.set('maintenance', { on: true, until: null }, null);
    const app = await server(settings);
    const res = await app.inject({ method: 'GET', url: '/irgendeine-seite' });
    expect(res.statusCode).toBe(503);
    const style = res.body.match(/<style>([\s\S]*?)<\/style>/)![1]!;
    const hash = createHash('sha256').update(style).digest('base64');
    expect(String(res.headers['content-security-policy'])).toContain(`style-src 'self' 'sha256-${hash}'`);
    await app.close();
  });
});
