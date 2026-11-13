#!/usr/bin/env node
/**
 * AT-OPS-001-2 (REQ-OPS-001 Kriterien 2 und 3): Geordnetes Herunterfahren unter Last.
 *   node tests/ops/shutdown-test.mjs [http://localhost:8080] [--project <compose-projekt>]
 *
 * Messverfahren (REQ-OPS-001 v2.4):
 *   - Last: 16 parallele Clients im Docker-Netz des Stacks senden dauerhaft Anfragen direkt an `app:8080`
 *     (je Anfrage eine neue Verbindung). Die Last läuft bewusst nicht über den Port des Hosts: Der Port-Proxy von
 *     Docker Desktop hält beim Stopp halb übertragene Anfragen offen und verfälscht das Ergebnis.
 *   - `docker compose stop app` (SIGTERM) nach einigen Sekunden Last.
 *   - Kriterium 2: Stoppsignal bis Prozessende ≤ 30 s.
 *   - Kriterium 3: 0 abgebrochene Anfragen. Abgebrochen ist eine von der App angenommene Anfrage ohne vollständige
 *     Antwort. Belege: Exit-Code 0 und „Beendet“ im Log (die App hat alle laufenden Anfragen abgeschlossen, kein
 *     Abbruch durch das Shutdown-Zeitlimit) und keine Antwort, die begonnen und dann abgerissen ist. Verbindungen,
 *     die nur der Kernel angenommen hatte und beim Schließen des Listeners zurücksetzt, hat die App nie gesehen; sie
 *     zählen wie ECONNREFUSED als abgewiesen (der Client kann sie gefahrlos wiederholen) und werden nur berichtet.
 *   - Keine 5xx-Antworten außer 503: Anfragen, die während des Schließens eintreffen, weist die App mit 503 ab
 *     (`return503OnClosing`); auch sie sind beantwortet und wiederholbar, nicht abgebrochen.
 * Danach wird die App mit derselben Konfiguration wieder gestartet und muss bereit werden. Dauer etwa 1 min.
 *
 * Intern: mit `--worker <url> <ms>` läuft das Skript als Lastgenerator im Container und gibt eine JSON-Zeile aus.
 */
import { execFileSync, spawn } from 'node:child_process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import http from 'node:http';

const args = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Eine Anfrage ohne Keep-Alive. */
function request(base, path, connectTimeoutMs = 3_000) {
  return new Promise((resolve) => {
    let responseStarted = false;
    const req = http.get({ host: base.hostname, port: base.port || 80, path, agent: false }, (res) => {
      responseStarted = true;
      const expected = Number(res.headers['content-length'] ?? -1);
      let received = 0;
      res.on('data', (c) => (received += c.length));
      res.on('end', () =>
        resolve(res.complete && (expected < 0 || received === expected) ? { kind: 'ok', status: res.statusCode } : { kind: 'aborted', why: 'unvollständige Antwort' }));
      res.on('error', (e) => resolve({ kind: 'aborted', why: e.code ?? e.message }));
    });
    const timer = setTimeout(() => req.destroy(Object.assign(new Error('connect timeout'), { code: 'ECONNTIMEOUT' })), connectTimeoutMs);
    req.on('socket', (s) => s.once('connect', () => clearTimeout(timer)));
    req.on('response', () => clearTimeout(timer));
    req.on('error', (e) => {
      clearTimeout(timer);
      if (responseStarted) resolve({ kind: 'aborted', why: e.code ?? e.message });
      else resolve({ kind: 'notAccepted', why: e.code ?? e.message });
    });
  });
}

// ------------------------------------------------------------------ Lastgenerator (im Container)
if (args[0] === '--worker') {
  const base = new URL(args[1]);
  const until = Date.now() + Number(args[2]);
  // Ohne /api/v1/status: dessen eigenes Rate-Limit (50 je 10 s) würde nur 429 erzeugen
  const paths = ['/api/v1/meta', '/health/live', '/', '/health/ready'];
  const result = { ok: 0, notAccepted: {}, aborted: {}, statuses: {} };
  await Promise.all(
    Array.from({ length: 16 }, async (_, w) => {
      for (let i = 0; Date.now() < until; i++) {
        const r = await request(base, paths[(w + i) % paths.length]);
        if (r.kind === 'ok') {
          result.ok++;
          result.statuses[r.status] = (result.statuses[r.status] ?? 0) + 1;
        } else {
          result[r.kind][r.why] = (result[r.kind][r.why] ?? 0) + 1;
          if (r.kind === 'notAccepted') await sleep(50);
        }
      }
    }),
  );
  console.log(JSON.stringify(result));
  process.exit(0);
}

// ------------------------------------------------------------------ Steuerung (auf dem Host)
const BASE = new URL(args.find((a) => a.startsWith('http')) ?? 'http://localhost:8080');
const projectIdx = args.indexOf('--project');
const project = projectIdx >= 0 ? ['-p', args[projectIdx + 1]] : [];
const compose = (...a) => execFileSync('docker', ['compose', ...project, ...a], { stdio: 'pipe' }).toString();
const docker = (...a) => execFileSync('docker', a, { stdio: 'pipe' }).toString().trim();

let failures = 0;
function check(name, ok, detail) {
  if (!ok) failures++;
  console.log(`${ok ? '✔' : '✘'} ${name}${ok || detail === undefined ? '' : `  ${JSON.stringify(detail)}`}`);
}

async function waitReady(timeoutMs) {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    const r = await request(BASE, '/health/ready');
    if (r.kind === 'ok' && r.status === 200) return true;
    await sleep(1_000);
  }
  return false;
}

if (!(await waitReady(30_000))) {
  console.error('✘ Ausgangslage: App nicht bereit – Test nicht aussagekräftig, Abbruch');
  process.exit(2);
}
check('Ausgangslage: bereit', true);

const appId = compose('ps', '-q', 'app').trim();
const image = docker('inspect', '-f', '{{.Config.Image}}', appId);
const network = Object.keys(JSON.parse(docker('inspect', '-f', '{{json .NetworkSettings.Networks}}', appId)))[0];
const LOAD_MS = 20_000;
const worker = spawn(
  'docker',
  ['run', '--rm', '--network', network, '--entrypoint', 'node', '-v', `${dirname(fileURLToPath(import.meta.url))}:/ops:ro`,
    image, '/ops/shutdown-test.mjs', '--worker', 'http://app:8080', String(LOAD_MS)],
  { stdio: ['ignore', 'pipe', 'inherit'] },
);
let workerOut = '';
worker.stdout.on('data', (c) => (workerOut += c));
const workerDone = new Promise((resolve) => worker.on('close', resolve));

await sleep(8_000);
const logSince = new Date().toISOString();
const t0 = Date.now();
compose('stop', 'app');
const stopSeconds = (Date.now() - t0) / 1000;
await workerDone;

const exitCode = Number(docker('inspect', '-f', '{{.State.ExitCode}}', appId));
const logs = compose('logs', '--no-color', '--since', logSince, 'app');
const load = JSON.parse(workerOut.trim().split('\n').at(-1) ?? '{}');
const sum = (o) => Object.values(o ?? {}).reduce((a, b) => a + b, 0);

console.log(`Last aus dem Docker-Netz (${network}): ${load.ok} beantwortet, ${sum(load.notAccepted)} nicht angenommen ${JSON.stringify(load.notAccepted)}, ${sum(load.aborted)} abgebrochen; Status ${JSON.stringify(load.statuses)}`);
check('Last lief vor dem Stopp (> 500 Anfragen beantwortet)', load.ok > 500, load.ok);
check(`Stoppsignal bis Prozessende ≤ 30 s (gemessen ${stopSeconds.toFixed(1)} s)`, stopSeconds <= 30, stopSeconds);
check('Prozess endet geordnet: Exit-Code 0, „Beendet“ im Log, kein Shutdown-Zeitlimit',
  exitCode === 0 && /"msg":"Beendet"/.test(logs) && !/Shutdown-Timeout/.test(logs), { exitCode });
check('0 abgebrochene Anfragen (keine begonnene Antwort abgerissen)', sum(load.aborted) === 0, load.aborted);
// 503 ist die gewollte Abweisung während des Schließens (Fastify `return503OnClosing`, mit `Connection: close`)
check('Keine 5xx-Antworten außer 503 (Abweisung beim Schließen)', !Object.keys(load.statuses ?? {}).some((s) => Number(s) >= 500 && Number(s) !== 503), load.statuses);

compose('up', '-d', '--wait', '--no-recreate', 'app');
check('App nach dem Neustart wieder bereit', await waitReady(90_000));

console.log(`${failures ? '✘' : '✔'} [AT-OPS-001-2] Stopp unter Last ≤ 30 s, geordnet und ohne abgebrochene Anfragen`);
process.exit(failures ? 1 : 0);
