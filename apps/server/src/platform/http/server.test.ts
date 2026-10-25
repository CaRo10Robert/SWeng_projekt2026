import { describe, expect, it } from 'vitest';
import { loadConfig } from '../../config.js';
import { createLogger } from '../logger.js';
import { createMetrics } from '../metrics.js';
import { createOps } from '../ops.js';
import type { SettingsStore } from '../settings.js';
import { buildSecurityTxt, createHttpServer, requestLogEntry } from './server.js';

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

  it('auch ohne Routenmuster (404) nur der Pfad ohne Query', () => {
    expect(requestLogEntry({ method: 'GET', url: '/widerspruch?token=abc' }, 200, 1).route).toBe('/widerspruch');
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
});
