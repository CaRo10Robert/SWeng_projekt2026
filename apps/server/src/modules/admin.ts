import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import {
  Accepted,
  AnnouncementBody,
  AuditEntry,
  EndSessionsBody,
  EndSessionsResult,
  EvidenceHold,
  IdParams,
  JobOverview,
  MaintenanceBody,
  SystemStatus,
} from '@campusmarkt/contracts';
import { audit } from '../platform/audit.js';
import { notFound, unprocessable } from '../platform/errors.js';
import { requireRole, SESSION_COOKIE } from '../platform/http/auth.js';
import { SETTING } from '../platform/settings.js';
import { sql } from '../platform/sql.js';
import { LISTINGS_MAINTENANCE } from './listings/index.js';
import { PRIVACY_PURGE } from './privacy/index.js';
import type { ModuleDeps } from './shared.js';

/**
 * Admin-Bereich: Audit-Log, Job-Übersicht inkl. Dead-Letter-Queue, Demo-Werkzeug (REQ-DEMO-002),
 * Wartungsmodus und Ankündigung (REQ-OPS-006), Beweissicherung (REQ-LEGAL-008).
 */
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

    // ---------------------------------------------------------- Notfall: alle Sitzungen beenden (Incident-Prozess, T-2/T-5)
    app.post(
      '/admin/security/end-sessions',
      { schema: { tags, body: EndSessionsBody, response: { 200: EndSessionsResult } } },
      async (req, reply) => {
        const auth = requireRole(req, 'admin');
        const result = await deps.modules.identity.endAllSessions(auth, req.body.forcePasswordChange);
        // Auch die eigene Sitzung ist beendet
        reply.clearCookie(SESSION_COOKIE, { path: '/' });
        return result;
      },
    );

    // ---------------------------------------------------------- Wartungsmodus und Ankündigung (REQ-OPS-006)
    app.put('/admin/maintenance', { schema: { tags, body: MaintenanceBody, response: { 200: SystemStatus } } }, async (req) => {
      const auth = requireRole(req, 'admin');
      if (!req.body.on && deps.config.maintenanceMode) {
        throw unprocessable('maintenance_env', 'Der Wartungsmodus ist per MAINTENANCE_MODE gesetzt und endet erst mit einem Neustart.');
      }
      if (req.body.on) await deps.settings.set(SETTING.maintenance, { on: true, until: req.body.until ?? null }, auth.userId);
      else await deps.settings.remove(SETTING.maintenance);
      await audit(db, {
        actorId: auth.userId,
        action: req.body.on ? 'maintenance.on' : 'maintenance.off',
        targetType: 'setting',
        targetId: SETTING.maintenance,
        details: { until: req.body.until ?? null },
      });
      return deps.ops.status();
    });

    app.put('/admin/announcement', { schema: { tags, body: AnnouncementBody, response: { 200: SystemStatus } } }, async (req) => {
      const auth = requireRole(req, 'admin');
      const value = { text: req.body.text.trim(), startsAt: req.body.startsAt ?? null, endsAt: req.body.endsAt ?? null };
      if (value.startsAt && value.endsAt && value.endsAt <= value.startsAt) {
        throw unprocessable('invalid_period', 'Das Ende muss nach dem Beginn liegen.');
      }
      await deps.settings.set(SETTING.announcement, value, auth.userId);
      await audit(db, { actorId: auth.userId, action: 'announcement.set', targetType: 'setting', targetId: SETTING.announcement, details: value });
      return deps.ops.status();
    });

    app.delete('/admin/announcement', { schema: { tags, response: { 200: SystemStatus } } }, async (req) => {
      const auth = requireRole(req, 'admin');
      await deps.settings.remove(SETTING.announcement);
      await audit(db, { actorId: auth.userId, action: 'announcement.removed', targetType: 'setting', targetId: SETTING.announcement });
      return deps.ops.status();
    });

    // ---------------------------------------------------------- Beweissicherung (REQ-LEGAL-008)
    app.get('/admin/evidence-holds', { schema: { tags, response: { 200: Type.Array(EvidenceHold) } } }, async (req) => {
      requireRole(req, 'admin');
      return deps.modules.trust.evidenceHolds();
    });

    app.post('/admin/evidence-holds/:id/release', { schema: { tags, params: IdParams } }, async (req, reply) => {
      const auth = requireRole(req, 'admin');
      await deps.modules.trust.releaseEvidenceHold(auth, req.params.id);
      return reply.status(204).send();
    });
  };
}
