import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadConfig } from '../../config.js';
import { createLogger } from '../logger.js';
import { createMetrics } from '../metrics.js';
import { createOps } from '../ops.js';
import type { SettingsStore } from '../settings.js';
import { isSameOrigin } from './auth.js';
import { buildSecurityTxt, createHttpServer, cspFor, inlineScriptHashes, isPageRequest, requestIdFrom, requestLogEntry } from './server.js';

function memorySettings(): SettingsStore {
  const values = new Map<string, unknown>();
  return {
    get: async <T>(key: string) => (values.get(key) as T) ?? null,
    set: async (key, value) => void values.set(key, value),
    remove: async (key) => void values.delete(key),
  };
}

async function server(settings = memorySettings(), webDistDir = '/does-not-exist') {
  process.env.WEB_DIST_DIR = webDistDir;
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
  it('[AT-OPS-013-2] /health/live und OpenAPI nennen die Version aus package.json (REQ-OPS-013)', async () => {
    const { version } = JSON.parse(readFileSync(new URL('../../../package.json', import.meta.url), 'utf8')) as {
      version: string;
    };
    const app = await server();
    expect((await app.inject({ method: 'GET', url: '/health/live' })).json()).toEqual({ status: 'ok', version });
    expect(app.swagger().info.version).toBe(version);
    await app.close();
  });
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

/** Kleine SPA im Temp-Verzeichnis: index.html mit Inline-Skript (Farbschema) und Modul-Skript. */
const THEME_SCRIPT = "\n(function(){document.documentElement.classList.add('dark')})();\n";
function fakeSpa() {
  const dir = mkdtempSync(join(tmpdir(), 'cm-spa-'));
  writeFileSync(
    join(dir, 'index.html'),
    `<!doctype html><html><head><script>${THEME_SCRIPT}</script><script type="module" crossorigin src="/assets/index.js"></script></head><body><div id="root"></div></body></html>`,
  );
  return dir;
}

describe('[AT-UX-008-4] CSP erlaubt das Farbschema-Skript der Startseite per Hash, ohne unsafe-inline (REQ-UX-008)', () => {
  it('Hash genau der Inline-Skripte; Skripte mit src zählen nicht', () => {
    const html = `<script>${THEME_SCRIPT}</script><script type="module" src="/a.js"></script><script>  </script>`;
    expect(inlineScriptHashes(html)).toEqual([`'sha256-${createHash('sha256').update(THEME_SCRIPT).digest('base64')}'`]);
  });

  it('jede Antwort trägt den Hash aus der ausgelieferten index.html in script-src', async () => {
    const app = await server(memorySettings(), fakeSpa());
    const res = await app.inject({ method: 'GET', url: '/gibt-es-nicht', headers: { accept: 'text/html' } });
    expect(res.statusCode).toBe(404);
    const csp = String(res.headers['content-security-policy']);
    expect(csp).toContain(`script-src 'self' 'sha256-${createHash('sha256').update(THEME_SCRIPT).digest('base64')}'`);
    expect(csp).not.toContain('unsafe-inline');
    await app.close();
  });

  it('die Startseite der Web-App hat genau ein Inline-Skript (das für das Farbschema)', () => {
    const html = readFileSync(resolve(import.meta.dirname, '../../../../web/index.html'), 'utf8');
    expect(inlineScriptHashes(html)).toHaveLength(1);
    expect(html).toContain("localStorage.getItem('cm_theme')");
  });
});

describe('[AT-UX-009-3] Unbekannte Pfade: Seite oder JSON je nach Anfrage (REQ-UX-003, REQ-UX-009)', () => {
  it.each([
    ['GET', '/gibt-es-nicht', '*/*', true],
    ['HEAD', '/gibt-es-nicht', undefined, true],
    ['GET', '/alte-seite.html', 'text/html,application/xhtml+xml', true],
    ['GET', '/alte-seite.html', '*/*', false],
    ['GET', '/bild.png', 'image/avif,image/webp,*/*', false],
    ['GET', '/assets/alt-abc123.js', '*/*', false],
    ['GET', '/api', 'text/html', false],
    ['GET', '/api/v1/gibt-es-nicht', 'text/html', false],
    ['GET', '/health/foo', 'text/html', false],
    ['GET', '/metrics/foo', 'text/html', false],
    ['GET', '/apixyz', 'text/html', true],
    ['POST', '/gibt-es-nicht', 'text/html', false],
  ])('%s %s (Accept %s) → Seite=%s', (method, url, accept, page) => {
    expect(isPageRequest(method, url, accept)).toBe(page);
  });

  it('Seitenaufruf einer fehlenden .html-Datei → 404 mit der SPA; Bild → JSON-404; /api → JSON-404', async () => {
    const app = await server(memorySettings(), fakeSpa());
    const page = await app.inject({ method: 'GET', url: '/alte-seite.html', headers: { accept: 'text/html' } });
    expect(page.statusCode).toBe(404);
    expect(page.headers['content-type']).toContain('text/html');
    expect(page.body).toContain('<div id="root">');
    const image = await app.inject({ method: 'GET', url: '/bild.png', headers: { accept: 'image/*' } });
    expect(image.statusCode).toBe(404);
    expect(image.json().code).toBe('not_found');
    const api = await app.inject({ method: 'GET', url: '/api', headers: { accept: 'text/html' } });
    expect(api.statusCode).toBe(404);
    expect(api.json().code).toBe('not_found');
    const known = await app.inject({ method: 'GET', url: '/impressum', headers: { accept: 'text/html' } });
    expect(known.statusCode).toBe(200);
    await app.close();
  });
});
