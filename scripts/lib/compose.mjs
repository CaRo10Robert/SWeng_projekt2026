/**
 * Gemeinsame Helfer für Betriebsskripte (Backup, Restore, Restore-Test).
 * Nur Node-Bordmittel; ruft `docker compose` im Repo-Wurzelverzeichnis auf (Windows Git Bash und Linux).
 */
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const DB_USER = 'campusmarkt';
export const DB_NAME = 'campusmarkt';

/** Einfacher Argument-Parser: `--name wert`, `--flag`, Rest positional. */
export function parseArgs(argv, flags = []) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) {
      out._.push(a);
      continue;
    }
    const key = a.slice(2);
    if (flags.includes(key)) out[key] = true;
    else out[key] = argv[++i];
  }
  return out;
}

export function composeArgs(project, args) {
  return ['compose', ...(project ? ['-p', project] : []), ...args];
}

/** Führt `docker compose …` aus und liefert stdout als Text; wirft bei Exit-Code ≠ 0. */
export function compose(project, args, { input, allowFail = false } = {}) {
  const res = spawnSync('docker', composeArgs(project, args), { cwd: ROOT, input, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (res.status !== 0 && !allowFail) {
    throw new Error(`docker ${composeArgs(project, args).join(' ')} → Exit ${res.status}\n${res.stderr}`);
  }
  return { ok: res.status === 0, stdout: res.stdout ?? '', stderr: res.stderr ?? '' };
}

/** Streamt stdout eines Compose-Befehls in eine Datei (für Binärdaten wie pg_dump und tar). */
export function composeToFile(project, args, file) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn('docker', composeArgs(project, args), { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
    const out = createWriteStream(file);
    let stderr = '';
    let exitCode = null;
    let written = false;
    // Fertig erst, wenn der Prozess beendet UND die Datei vollständig geschrieben ist (Reihenfolge beliebig)
    const settle = () => {
      if (exitCode === null || !written) return;
      if (exitCode === 0) resolvePromise();
      else reject(new Error(`docker ${args.join(' ')} → Exit ${exitCode}\n${stderr}`));
    };
    child.stdout.pipe(out);
    out.on('finish', () => {
      written = true;
      settle();
    });
    out.on('error', reject);
    child.stderr.on('data', (d) => (stderr += d));
    child.on('error', reject);
    child.on('close', (code) => {
      exitCode = code ?? 1;
      settle();
    });
  });
}

/** Streamt eine Datei in stdin eines Compose-Befehls. */
export function composeFromFile(project, args, file) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn('docker', composeArgs(project, args), { cwd: ROOT, stdio: ['pipe', 'pipe', 'pipe'] });
    let stderr = '';
    let stdout = '';
    child.stdout.on('data', (d) => (stdout += d));
    child.stderr.on('data', (d) => (stderr += d));
    child.on('error', reject);
    child.on('close', (code) => (code === 0 ? resolvePromise(stdout) : reject(new Error(`docker ${args.join(' ')} → Exit ${code}\n${stderr}`))));
    createReadStream(file).pipe(child.stdin);
  });
}

export function sql(project, query, { allowFail = false } = {}) {
  return compose(project, ['exec', '-T', 'db', 'psql', '-U', DB_USER, '-d', DB_NAME, '-v', 'ON_ERROR_STOP=1', '-tAc', query], { allowFail });
}

export function sha256(file) {
  return new Promise((resolvePromise, reject) => {
    const hash = createHash('sha256');
    createReadStream(file).on('data', (d) => hash.update(d)).on('error', reject).on('end', () => resolvePromise(hash.digest('hex')));
  });
}

/** Neueste Migration im Code (Dateinamen sind sortierbar: NNNN_name.sql). */
export function latestCodeMigration() {
  return readdirSync(join(ROOT, 'apps/server/migrations')).filter((f) => f.endsWith('.sql')).sort().at(-1) ?? null;
}

export function containerId(project, service) {
  return compose(project, ['ps', '-q', service]).stdout.trim();
}

export function health(id) {
  const res = spawnSync('docker', ['inspect', '-f', '{{.State.Health.Status}}', id], { encoding: 'utf8' });
  return res.stdout.trim();
}

export async function waitHealthy(project, service, timeoutMs = 180_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const id = containerId(project, service);
    if (id && health(id) === 'healthy') return Date.now() - start;
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`${service} wurde nicht innerhalb von ${timeoutMs / 1000} s „healthy“`);
}

/** UTC-Zeitstempel, sortierbar und als Verzeichnisname geeignet, z. B. 20261024T193000Z. */
export function timestamp(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export const TIMESTAMP_RE = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/;

export function parseTimestamp(name) {
  const m = TIMESTAMP_RE.exec(name);
  return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6])) : null;
}

const DAY = 86_400_000;

/**
 * Aufbewahrung (docs/07-betrieb/backup-restore.md, ADR-0018): alle Sicherungen der letzten 7 Tage,
 * danach je Kalenderwoche (endet Sonntag) die neueste für 4 Wochen; ältere werden gelöscht (höchstens 30 Tage).
 * Die neueste Sicherung bleibt immer erhalten. Liefert die Namen der zu löschenden Verzeichnisse.
 */
export function selectForDeletion(names, now = new Date(), { dailyDays = 7, weeklyWeeks = 4 } = {}) {
  const backups = names
    .map((name) => ({ name, at: parseTimestamp(name) }))
    .filter((b) => b.at)
    .sort((a, b) => b.at - a.at);
  const keep = new Set(backups.slice(0, 1).map((b) => b.name));
  const weeks = new Set();
  for (const b of backups) {
    const age = now - b.at;
    if (age <= dailyDays * DAY) {
      keep.add(b.name);
    } else if (age <= weeklyWeeks * 7 * DAY) {
      // Wochenschlüssel: Montag der Woche (UTC); die erste (= neueste) Sicherung je Woche bleibt
      const monday = new Date(b.at);
      monday.setUTCHours(0, 0, 0, 0);
      monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
      const week = monday.toISOString().slice(0, 10);
      if (!weeks.has(week)) {
        weeks.add(week);
        keep.add(b.name);
      }
    }
  }
  return backups.filter((b) => !keep.has(b.name)).map((b) => b.name);
}
