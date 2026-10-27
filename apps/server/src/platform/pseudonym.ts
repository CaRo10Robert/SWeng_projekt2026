import { createHmac, randomBytes } from 'node:crypto';
import type { Db } from './db.js';
import { sql } from './sql.js';

/**
 * Pseudonymisierung von IP- und E-Mail-Adressen in Rate-Limit-Schlüsseln (ADR-0014, REQ-PRIV-002):
 * HMAC-SHA256 mit zufälligem, täglich rotiertem Schlüssel aus `platform.ip_pepper`, gekürzt auf 128 Bit.
 * Es gibt keinen Standardschlüssel im Code oder in der Konfiguration.
 */
export const PEPPER_ROTATION_MS = 24 * 3_600_000;
/** Der Vorgänger bleibt bis zum Ende des längsten Zählfensters (1 h) bestehen und wird danach gelöscht. */
export const PEPPER_GRACE_MS = 3_600_000;

export function hmacPseudonym(key: Buffer, value: string): string {
  return createHmac('sha256', key).update(value).digest('hex').slice(0, 32);
}

/** Reine Funktion: Ist ein neuer Schlüssel fällig, und welche alten Schlüssel dürfen weg? */
export function pepperPlan(
  keys: readonly { id: number; validFrom: Date }[],
  now: Date,
): { rotate: boolean; deleteIds: number[] } {
  const sorted = [...keys].sort((a, b) => b.validFrom.getTime() - a.validFrom.getTime());
  const newest = sorted[0];
  const rotate = !newest || now.getTime() - newest.validFrom.getTime() >= PEPPER_ROTATION_MS;
  const graceOver = !!newest && now.getTime() - newest.validFrom.getTime() >= PEPPER_GRACE_MS;
  return { rotate, deleteIds: graceOver ? sorted.slice(1).map((k) => k.id) : [] };
}

export interface Pseudonymizer {
  pseudonymize(value: string): Promise<string>;
}

/** Schlüssel wird beim ersten Gebrauch erzeugt bzw. rotiert und für 5 Minuten zwischengespeichert. */
export function createPseudonymizer(db: Db, clock: () => Date = () => new Date()): Pseudonymizer {
  let cached: { key: Buffer; loadedAt: number } | null = null;

  async function currentKey(): Promise<Buffer> {
    const now = clock();
    if (cached && now.getTime() - cached.loadedAt < 5 * 60_000) return cached.key;
    const rows = await db.query<{ id: number; key: Buffer; valid_from: string }>(sql`
      SELECT id, key, valid_from FROM platform.ip_pepper ORDER BY valid_from DESC`);
    const plan = pepperPlan(rows.map((r) => ({ id: r.id, validFrom: new Date(r.valid_from) })), now);
    let key = rows[0]?.key;
    if (plan.rotate) {
      key = randomBytes(32);
      await db.exec(sql`INSERT INTO platform.ip_pepper (key, valid_from) VALUES (${key}, now())`);
    }
    if (plan.deleteIds.length) await db.exec(sql`DELETE FROM platform.ip_pepper WHERE id = ANY(${plan.deleteIds}::bigint[])`);
    cached = { key: key!, loadedAt: now.getTime() };
    return key!;
  }

  return {
    async pseudonymize(value) {
      return hmacPseudonym(await currentKey(), value);
    },
  };
}

/**
 * Geheimnis aus `platform.setting` (z. B. für Abmeldelinks, RV-C-02): beim ersten Start zufällig erzeugt und
 * gespeichert, damit es keinen öffentlich bekannten Standardwert gibt; bleibt über Neustarts gleich.
 */
export async function ensureSecret(db: Db, key: string): Promise<string> {
  await db.exec(sql`
    INSERT INTO platform.setting (key, value) VALUES (${key}, ${JSON.stringify({ secret: randomBytes(32).toString('base64url') })}::jsonb)
    ON CONFLICT (key) DO NOTHING`);
  const row = await db.one<{ value: { secret: string } }>(sql`SELECT value FROM platform.setting WHERE key = ${key}`);
  return row!.value.secret;
}
