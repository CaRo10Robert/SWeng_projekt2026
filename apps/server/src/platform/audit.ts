import type { Db } from './db.js';
import { sql } from './sql.js';

export interface AuditEvent {
  actorId: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  details?: Record<string, unknown>;
}

/** Append-only Audit-Log für Admin- und Moderationsaktionen (REQ-MOD-003/007, REQ-PRIV-004). */
export async function audit(db: Db, event: AuditEvent): Promise<void> {
  await db.exec(sql`
    INSERT INTO platform.audit_log (actor_id, action, target_type, target_id, details)
    VALUES (${event.actorId}, ${event.action}, ${event.targetType}, ${event.targetId ?? null},
            ${JSON.stringify(event.details ?? {})}::jsonb)`);
}
