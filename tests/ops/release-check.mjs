#!/usr/bin/env node
/**
 * Release-Prüfung (REQ-OPS-013, ADR-0022, Nachweis AT-OPS-013). Ohne Abhängigkeiten, läuft lokal und in CI.
 *
 *   node tests/ops/release-check.mjs              Jeder CI-Lauf: alle package.json tragen dieselbe Version (SemVer)
 *   node tests/ops/release-check.mjs v0.5.0       Release-Job: zusätzlich Tag = Version, Tag-Commit liegt auf main,
 *                                                 der Changelog hat einen Abschnitt für die Version
 *
 * Eine Version, eine Quelle: Release-Tag, Image-Tag (ghcr.io/…/campusmarkt:X.Y.Z), OpenAPI und /health/live
 * leiten sich aus den package.json ab (apps/server/src/platform/version.ts).
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const ROOT = new URL('../../', import.meta.url);
const PACKAGES = ['package.json', 'apps/server/package.json', 'apps/web/package.json', 'packages/contracts/package.json', 'e2e/package.json'];
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

let failures = 0;
const check = (name, ok, info = '') => {
  console.log(`${ok ? '✔' : '✘'} ${name}${ok ? '' : `  ${info}`}`);
  if (!ok) failures++;
};

const versions = Object.fromEntries(
  PACKAGES.map((p) => [p, JSON.parse(readFileSync(new URL(p, ROOT), 'utf8')).version]),
);
const version = versions['package.json'];
check('[AT-OPS-013] Version ist SemVer X.Y.Z', SEMVER.test(version ?? ''), version);
check(
  '[AT-OPS-013] alle package.json tragen dieselbe Version',
  Object.values(versions).every((v) => v === version),
  JSON.stringify(versions),
);

const tag = process.argv[2];
if (tag) {
  check('[AT-OPS-013] Tag hat die Form vX.Y.Z', /^v\d+\.\d+\.\d+$/.test(tag), tag);
  check('[AT-OPS-013] Tag = Version aus package.json', tag === `v${version}`, `${tag} ≠ v${version}`);
  let onMain = false;
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', 'HEAD', 'origin/main'], { cwd: ROOT, stdio: 'ignore' });
    onMain = true;
  } catch {
    onMain = false;
  }
  check('[AT-OPS-013] Tag-Commit liegt auf main (geprüft und gemergt)', onMain, 'Commit ist nicht in origin/main');
  const changelog = readFileSync(new URL('CHANGELOG.md', ROOT), 'utf8');
  check(
    '[AT-OPS-013] Changelog hat einen Abschnitt für die Version',
    new RegExp(`^## \\[${version.replaceAll('.', '\\.')}\\]`, 'm').test(changelog),
    `kein "## [${version}]" in CHANGELOG.md`,
  );
}

console.log(failures ? `${failures} Prüfung(en) fehlgeschlagen` : 'Release-Prüfung bestanden');
process.exit(failures ? 1 : 0);
