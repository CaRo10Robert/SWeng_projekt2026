#!/usr/bin/env node
/**
 * Lasttests mit k6 gegen das Docker-Beispiel (REQ-PERF-001…004, Guideline Kap. 09, GL-11).
 *
 *   node tests/load/run.mjs <search|chat|create-listing|signup|all> [--base http://localhost:8080]
 *        [--mailpit http://localhost:8025] [--project <compose-projekt>] [--duration 5m] [--warmup 1m]
 *
 * k6 läuft als Container (Image-Version unten, per Digest gepinnt). Unter Linux mit `--network host`, unter
 * Docker Desktop (Windows/macOS) über host.docker.internal. Ergebnisse landen in tests/load/results/<name>.json.
 *
 * Voraussetzungen am Stack:
 *   - RATE_LIMIT_FACTOR=100 und DEMO_MODE=true (Grenzen für den Test angehoben, REQ-PERF-002/-004)
 *   - für „search“: 10.000 Anzeigen; der Runner ergänzt fehlende Lasttest-Anzeigen per SQL (Markierung im
 *     Attribut `loadtest`, entfernbar mit --cleanup)
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, parseArgs, sql } from '../../scripts/lib/compose.mjs';

export const K6_IMAGE = 'grafana/k6:2.3.0@sha256:2dd4756ec6e14e62778916e1eb850108e4b499304c02df56760fa0bdb0fba0b8';
const SCENARIOS = ['search', 'chat', 'create-listing', 'signup'];
const TARGET_LISTINGS = 10_000;

const args = parseArgs(process.argv.slice(2), ['cleanup']);
const which = args._[0] ?? 'all';
const base = args.base ?? 'http://localhost:8080';
const mailpit = args.mailpit ?? 'http://localhost:8025';
const project = args.project;
const linux = process.platform === 'linux';
const reachable = (url) => (linux ? url : url.replace(/\/\/(localhost|127\.0\.0\.1)/, '//host.docker.internal'));

/** Ergänzt aktive Anzeigen bis zur Zielzahl, indem vorhandene Seed-Anzeigen mit neuem Titel vervielfältigt werden. */
function seedListings() {
  const count = Number(sql(project, `SELECT count(*) FROM listings.listing WHERE status = 'active'`).stdout.trim());
  const missing = TARGET_LISTINGS - count;
  if (missing <= 0) {
    console.log(`Suche: ${count} aktive Anzeigen vorhanden`);
    return;
  }
  sql(project, `
    WITH src AS (
      SELECT row_number() OVER (ORDER BY id) AS rn, * FROM listings.listing WHERE status = 'active' AND NOT (attributes ? 'loadtest')
    ), n AS (SELECT count(*) AS c FROM src)
    INSERT INTO listings.listing (owner_id, institution_id, kind, title, description, category_id, price_type, price_cents,
                                  condition, attributes, location_ids, status, expires_at)
    SELECT s.owner_id, s.institution_id, s.kind, left(s.title, 66) || ' (Last ' || g || ')', s.description, s.category_id,
           s.price_type, s.price_cents, s.condition, s.attributes || '{"loadtest": true}'::jsonb, s.location_ids, 'active',
           now() + interval '60 days'
    FROM generate_series(1, ${missing}) g CROSS JOIN n JOIN src s ON s.rn = (g % n.c) + 1`);
  sql(project, 'ANALYZE listings.listing');
  console.log(`Suche: ${missing} Lasttest-Anzeigen ergänzt (Ziel ${TARGET_LISTINGS})`);
}

function cleanup() {
  const out = sql(project, `DELETE FROM listings.listing WHERE attributes ? 'loadtest' OR title LIKE 'Lasttest Anzeige %'`);
  console.log(`Lasttest-Anzeigen entfernt ${out.stdout.trim()}`);
}

function run(name) {
  const results = join(ROOT, 'tests/load/results');
  mkdirSync(results, { recursive: true });
  const env = {
    BASE_URL: reachable(base),
    MAILPIT_URL: reachable(mailpit),
    DURATION: args.duration ?? '5m',
    WARMUP: args.warmup ?? '1m',
  };
  const dockerArgs = [
    'run', '--rm', '-i',
    ...(linux ? ['--network', 'host'] : ['--add-host', 'host.docker.internal:host-gateway']),
    '-v', `${join(ROOT, 'tests/load')}:/scripts:ro`, '-v', `${results}:/results`,
    ...Object.entries(env).flatMap(([k, v]) => ['-e', `${k}=${v}`]),
    K6_IMAGE, 'run', '--quiet', `/scripts/${name}.js`,
  ];
  console.log(`\n▶ k6 ${name} (${env.DURATION})`);
  const res = spawnSync('docker', dockerArgs, { stdio: 'inherit', env: { ...process.env, MSYS_NO_PATHCONV: '1' } });
  return res.status === 0;
}

if (args.cleanup) {
  cleanup();
  process.exit(0);
}
const list = which === 'all' ? SCENARIOS : [which];
if (list.some((n) => !SCENARIOS.includes(n))) {
  console.error(`Unbekanntes Szenario: ${which} (erlaubt: ${SCENARIOS.join(', ')}, all)`);
  process.exit(2);
}
if (list.includes('search')) seedListings();
const failed = list.filter((n) => !run(n));
console.log(failed.length ? `\nSchwellen verfehlt: ${failed.join(', ')}` : '\nAlle Lasttests innerhalb der Schwellen');
process.exit(failed.length ? 1 : 0);
