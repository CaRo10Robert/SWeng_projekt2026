import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { Accepted, AuditEntry, JobOverview } from '@campusmarkt/contracts';
import { audit } from '../platform/audit.js';
import { notFound } from '../platform/errors.js';
import { requireRole } from '../platform/http/auth.js';
import { sql } from '../platform/sql.js';
import { LISTINGS_MAINTENANCE } from './listings/index.js';
import { PRIVACY_PURGE } from './privacy/index.js';
import type { ModuleDeps } from './shared.js';

/** Admin-Bereich: Audit-Log, Job-Übersicht inkl. Dead-Letter-Queue, Demo-Werkzeug (REQ-DEMO-002). */
export function adminRoutes(deps: ModuleDeps): FastifyPluginAsyncTypebox {
  const { db } = deps.database;
  return async (app) => {
    const tags = ['admin'];

    app.get('/admin/audit', { schema: { tags, response: { 200: Type.Array(AuditEntry) } } }, async (req) => {
      requireRole(req, 'admin');
      const rows = await db.query<{
        id: string;
        actor_id: string | null;
        action: string;
        target_type: string;
        target_id: string | null;
        details: Record<string, unknown>;
        created_at: string;
      }>(sql`SELECT * FROM platform.audit_log ORDER BY created_at DESC LIMIT 200`);
      const actors = await deps.modules.identity.getPublicUsers(
        [...new Set(rows.map((r) => r.actor_id).filter((id): id is string => !!id))],
      );
      return rows.map((r) => ({
        id: r.id,
        actorId: r.actor_id,
        actorName: r.actor_id ? (actors.get(r.actor_id)?.displayName ?? null) : null,
        action: r.action,
        targetType: r.target_type,
        targetId: r.target_id,
        details: r.details,
        createdAt: r.created_at,
      }));
    });

    app.get('/admin/jobs', { schema: { tags, response: { 200: JobOverview } } }, async (req) => {
      requireRole(req, 'admin');
      return deps.jobs.overview();
    });

    app.post('/admin/demo/run-due-jobs', { schema: { tags, response: { 202: Accepted } } }, async (req, reply) => {
      const auth = requireRole(req, 'admin');
      if (!deps.config.demoMode) throw notFound();
      await deps.jobs.enqueue(LISTINGS_MAINTENANCE, {});
      await deps.jobs.enqueue(PRIVACY_PURGE, {});
      await audit(db, { actorId: auth.userId, action: 'demo.run_due_jobs', targetType: 'jobs' });
      return reply.status(202).send({ message: 'Wartungsjobs wurden angestoßen.' });
    });
  };
}
