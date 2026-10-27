#!/usr/bin/env node
/**
 * Smoke-Test für das Compose-Profil `proxy` (REQ-OPS-009, ADR-0017, Nachweis AT-OPS-009).
 *   docker compose --profile proxy up -d
 *   node tests/ops/proxy-test.mjs [--project <compose-projekt>] [--https-port 8443] [--http-port 8088]
 *
 * Verbindet sich mit campusmarkt.localhost über 127.0.0.1 (kein DNS nötig) und prüft das Zertifikat
 * gegen die lokale CA von Caddy, die aus dem Container gelesen wird.
 */
import http from 'node:http';
import https from 'node:https';
import { compose, parseArgs } from '../../scripts/lib/compose.mjs';

const args = parseArgs(process.argv.slice(2));
const project = args.project ?? process.env.COMPOSE_PROJECT_NAME;
const HOST = 'campusmarkt.localhost';
const HTTPS_PORT = Number(args['https-port'] ?? process.env.PROXY_HTTPS_PORT ?? 8443);
const HTTP_PORT = Number(args['http-port'] ?? process.env.PROXY_HTTP_PORT ?? 8088);
const lookup = (_host, options, cb) => (options?.all ? cb(null, [{ address: '127.0.0.1', family: 4 }]) : cb(null, '127.0.0.1', 4));

let failures = 0;
const check = (name, ok, info = '') => {
  console.log(`${ok ? '✔' : '✘'} ${name}${ok ? '' : `  ${typeof info === 'string' ? info : JSON.stringify(info)}`}`);
  if (!ok) failures++;
};

const ca = compose(project, ['exec', '-T', 'proxy', 'cat', '/data/caddy/pki/authorities/local/root.crt']).stdout;

function request(mod, { port, path, method = 'GET', headers = {}, body, ...tls }) {
  return new Promise((resolve, reject) => {
    const req = mod.request({ host: HOST, servername: HOST, port, path, method, headers, lookup, ...tls }, (res) => {
      let data = '';
      res.on('data', (d) => (data += d));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

// Zertifikat muss für den Hostnamen gelten und von der lokalen CA stammen (keine abgeschaltete Prüfung)
const ready = await request(https, { port: HTTPS_PORT, path: '/health/ready', ca });
const hsts = ready.headers['strict-transport-security'] ?? '';
check('HTTPS mit gültigem Zertifikat der lokalen CA, /health/ready 200', ready.status === 200, ready.status);

const redirect = await request(http, { port: HTTP_PORT, path: '/login?x=1' });
check('HTTP wird dauerhaft auf HTTPS umgeleitet (308, gleicher Pfad)',
  redirect.status === 308 && redirect.headers.location === `https://${HOST}:${HTTPS_PORT}/login?x=1`, { status: redirect.status, location: redirect.headers.location });

const metrics = await request(https, { port: HTTPS_PORT, path: '/metrics', ca });
check('/metrics ist am Proxy gesperrt (404)', metrics.status === 404, metrics.status);

const body = JSON.stringify({ email: 'lea@studmail.hwg-lu.de', password: 'CampusMarkt-Demo-2026' });
const login = await request(https, {
  port: HTTPS_PORT,
  path: '/api/v1/auth/login',
  method: 'POST',
  headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body), 'x-campusmarkt-csrf': '1', origin: `https://${HOST}:${HTTPS_PORT}` },
  body,
  ca,
});
const cookie = [login.headers['set-cookie'] ?? []].flat().join(';');

check('[AT-OPS-009] Proxy: HTTP → HTTPS (308), HSTS ohne includeSubDomains/preload, Anmeldung über HTTPS mit Secure-Cookie',
  ready.status === 200 && redirect.status === 308 && /^max-age=31536000$/.test(hsts) && login.status === 200 && /;\s*Secure/i.test(cookie),
  { hsts, login: login.status, cookie: cookie.replace(/=[^;]+/, '=…') });

console.log(failures ? `\n${failures} Prüfung(en) fehlgeschlagen` : '\nAlle Prüfungen bestanden');
process.exit(failures ? 1 : 0);
