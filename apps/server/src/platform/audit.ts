import type { Db } from './db.js';
import { sql } from './sql.js';

export interface AuditEvent {
  actorId: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  details?: Record<string, unknown>;
}

/** Fristlöschung des Audit-Logs nach 24 Monaten (REQ-PRIV-003); Löschen ist erlaubt, Ändern nicht. */
export async function purgeAuditLog(db: Db, before: Date): Promise<number> {
  return db.exec(sql`DELETE FROM platform.audit_log WHERE created_at < ${before}`);
}

/** Append-only Audit-Log für Admin- und Moderationsaktionen (REQ-MOD-003/007, REQ-PRIV-004). */
export async function audit(db: Db, event: AuditEvent): Promise<void> {
  await db.exec(sql`
    INSERT INTO platform.audit_log (actor_id, action, target_type, target_id, details)
    VALUES (${event.actorId}, ${event.action}, ${event.targetType}, ${event.targetId ?? null},
            ${JSON.stringify(event.details ?? {})}::jsonb)`);
}
