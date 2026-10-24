import type { BlockedUser, CreateReportBody, ModerationCase, ReportReason, ReportTargetType } from '@campusmarkt/contracts';
import { audit } from '../../platform/audit.js';
import type { Tx } from '../../platform/db.js';
import { conflict, notFound, unprocessable } from '../../platform/errors.js';
import type { AuthContext } from '../../platform/http/auth.js';
import { sql } from '../../platform/sql.js';
import type { ModuleDeps } from '../shared.js';
import { createDsa } from './dsa.js';

/** REQ-MOD-004: ab 3 Meldungen unterschiedlicher Mitglieder vorläufig ausblenden. */
export const HIDE_THRESHOLD = 3;

interface CaseRow {
  id: string;
  target_type: ReportTargetType;
  target_id: string;
  subject_user_id: string | null;
  status: 'open' | 'decided';
  hidden: boolean;
  created_at: string;
}


export function createTrustService(deps: ModuleDeps) {
  const { database, modules } = deps;
  const { db } = database;

  async function openCase(tx: Tx, targetType: ReportTargetType, targetId: string, subjectUserId: string | null) {
    const existing = await tx.db.one<CaseRow>(sql`
      SELECT * FROM trust.moderation_case WHERE target_type = ${targetType} AND target_id = ${targetId} AND status = 'open'
      FOR UPDATE`);
    if (existing) return existing;
    return (await tx.db.one<CaseRow>(sql`
      INSERT INTO trust.moderation_case (target_type, target_id, subject_user_id)
      VALUES (${targetType}, ${targetId}, ${subjectUserId}) RETURNING *`))!;
  }

  /** Ziel prüfen und betroffenes Mitglied ermitteln. Nicht sichtbare Ziele → 404. */
  async function resolveTarget(auth: AuthContext, type: ReportTargetType, id: string): Promise<string> {
    if (type === 'listing') {
      const listing = await modules.listings.summary(id);
      if (!listing || listing.deleted) throw notFound();
      if (listing.ownerId === auth.userId) throw unprocessable('own_content', 'Eigene Inhalte können nicht gemeldet werden.');
      return listing.ownerId;
    }
    if (type === 'message') {
      if (!(await modules.messaging.isParticipantOfMessage(auth.userId, id))) throw notFound();
      const context = await modules.messaging.messageContext(id);
      if (!context) throw notFound();
      if (context.senderId === auth.userId) throw unprocessable('own_content', 'Eigene Inhalte können nicht gemeldet werden.');
      return context.senderId;
    }
    if (id === auth.userId) throw unprocessable('own_content', 'Du kannst dich nicht selbst melden.');
    if (!(await modules.identity.getContact(id))) throw notFound();
    return id;
  }

  const dsa = createDsa(deps, { openCase });

  return {
    ...dsa,

    async report(auth: AuthContext, body: CreateReportBody): Promise<{ id: string }> {
      if (body.reason === 'auto_filter') throw unprocessable('invalid_reason', 'Ungültiger Grund.');
      const subject = await resolveTarget(auth, body.targetType, body.targetId);
      return database.tx(async (tx) => {
        const kase = await openCase(tx, body.targetType, body.targetId, subject);
        const report = await tx.db.one<{ id: string }>(sql`
          INSERT INTO trust.report (case_id, reporter_id, reason, details)
          VALUES (${kase.id}, ${auth.userId}, ${body.reason}, ${body.details ?? null})
          ON CONFLICT (case_id, reporter_id) WHERE reporter_id IS NOT NULL DO NOTHING RETURNING id`);
        if (!report) throw conflict('already_reported', 'Du hast diesen Inhalt bereits gemeldet.');
        const reporters = await tx.db.one<{ n: number }>(sql`
          SELECT count(DISTINCT reporter_id) AS n FROM trust.report WHERE case_id = ${kase.id} AND reporter_id IS NOT NULL`);
        if ((reporters?.n ?? 0) >= HIDE_THRESHOLD && !kase.hidden) {
          await tx.db.exec(sql`UPDATE trust.moderation_case SET hidden = true WHERE id = ${kase.id}`);
          if (body.targetType === 'listing') await modules.listings.setHidden(tx, body.targetId, true);
        }
        return { id: report.id };
      });
    },

    /** Systemmeldung, z. B. Wortfilter (REQ-LST-010). */
    async openSystemCase(
      tx: Tx,
      input: { targetType: ReportTargetType; targetId: string; subjectUserId: string; details: string },
    ): Promise<void> {
      const kase = await openCase(tx, input.targetType, input.targetId, input.subjectUserId);
      await tx.db.exec(sql`
        INSERT INTO trust.report (case_id, reporter_id, reason, details)
        VALUES (${kase.id}, NULL, 'auto_filter', ${input.details})`);
    },

    async cases(auth: AuthContext, status: 'open' | 'decided'): Promise<ModerationCase[]> {
      const rows = await db.query<CaseRow>(sql`
        SELECT * FROM trust.moderation_case WHERE status = ${status}
        ORDER BY ${status === 'open' ? sql`created_at ASC` : sql`decided_at DESC`} LIMIT 100`);
      const subjects = await modules.identity.getPublicUsers(
        rows.map((r) => r.subject_user_id).filter((id): id is string => !!id),
      );
      const result: ModerationCase[] = [];
      for (const row of rows) {
        const reports = await db.query<{ id: string; reason: ReportReason; details: string | null; created_at: string; reporter_id: string | null }>(sql`
          SELECT id, reason, details, created_at, reporter_id FROM trust.report WHERE case_id = ${row.id} ORDER BY created_at`);
        let listing: ModerationCase['listing'] = null;
        let messageContext: ModerationCase['messageContext'] = null;
        if (row.target_type === 'listing') {
          const summary = await modules.listings.summary(row.target_id);
          if (summary) {
            const { ownerId: _o, hidden: _h, ownerSuspended: _s, available: _a, deleted: _d, ...card } = summary;
            listing = card;
          }
        } else if (row.target_type === 'message' && status === 'open') {
          // REQ-PRIV-004: nur gemeldeter Kontext, jeder Zugriff wird protokolliert
          messageContext = (await modules.messaging.messageContext(row.target_id))?.messages ?? null;
          await audit(db, {
            actorId: auth.userId,
            action: 'message_context.viewed',
            targetType: 'moderation_case',
            targetId: row.id,
          });
        }
        const subject = row.subject_user_id ? subjects.get(row.subject_user_id) : undefined;
        result.push({
          id: row.id,
          targetType: row.target_type,
          targetId: row.target_id,
          status: row.status,
          hidden: row.hidden,
          subject: subject ? { id: subject.id, displayName: subject.displayName } : null,
          reports: reports.map((r) => ({
            id: r.id,
            reason: r.reason,
            details: r.details,
            createdAt: r.created_at,
            reporterId: r.reporter_id,
          })),
          listing,
          messageContext,
          createdAt: row.created_at,
        });
      }
      return result;
    },

    async isBlockedEither(a: string, b: string): Promise<boolean> {
      return !!(await db.one(sql`
        SELECT 1 FROM trust.block
        WHERE (blocker_id = ${a} AND blocked_id = ${b}) OR (blocker_id = ${b} AND blocked_id = ${a})`));
    },

    /** Alle Mitglieder, die ich blockiert habe oder die mich blockiert haben. */
    async blockRelations(userId: string): Promise<string[]> {
      const rows = await db.query<{ id: string }>(sql`
        SELECT blocked_id AS id FROM trust.block WHERE blocker_id = ${userId}
        UNION SELECT blocker_id FROM trust.block WHERE blocked_id = ${userId}`);
      return rows.map((r) => r.id);
    },

    async blocks(auth: AuthContext): Promise<BlockedUser[]> {
      const rows = await db.query<{ blocked_id: string; created_at: string }>(sql`
        SELECT blocked_id, created_at FROM trust.block WHERE blocker_id = ${auth.userId} ORDER BY created_at DESC`);
      const users = await modules.identity.getPublicUsers(rows.map((r) => r.blocked_id));
      return rows.map((r) => ({
        userId: r.blocked_id,
        displayName: users.get(r.blocked_id)?.displayName ?? 'Ehemaliges Mitglied',
        blockedAt: r.created_at,
      }));
    },

    async block(auth: AuthContext, userId: string): Promise<void> {
      if (userId === auth.userId) throw unprocessable('self_block', 'Du kannst dich nicht selbst blockieren.');
      if (!(await modules.identity.getContact(userId))) throw notFound();
      await db.exec(sql`
        INSERT INTO trust.block (blocker_id, blocked_id) VALUES (${auth.userId}, ${userId}) ON CONFLICT DO NOTHING`);
    },

    async unblock(auth: AuthContext, userId: string): Promise<void> {
      await db.exec(sql`DELETE FROM trust.block WHERE blocker_id = ${auth.userId} AND blocked_id = ${userId}`);
    },

    async deleteForUser(tx: Tx, userId: string): Promise<void> {
      await tx.db.exec(sql`DELETE FROM trust.block WHERE blocker_id = ${userId} OR blocked_id = ${userId}`);
      await tx.db.exec(sql`DELETE FROM trust.notice WHERE user_id = ${userId}`);
      await tx.db.exec(sql`DELETE FROM trust.appeal_token WHERE user_id = ${userId}`);
      await tx.db.exec(sql`UPDATE trust.appeal SET appellant_id = NULL WHERE appellant_id = ${userId}`);
      // Meldungen bleiben für die Aufbewahrungsfrist erhalten, aber ohne Bezug zur Person
      await tx.db.exec(sql`UPDATE trust.report SET reporter_id = NULL WHERE reporter_id = ${userId}`);
    },

    async exportForUser(userId: string) {
      const reports = await db.query(sql`
        SELECT r.reason, r.details, r.created_at AS "createdAt", c.target_type AS "targetType"
        FROM trust.report r JOIN trust.moderation_case c ON c.id = r.case_id WHERE r.reporter_id = ${userId}`);
      const blocks = await db.query(sql`
        SELECT blocked_id AS "userId", created_at AS "createdAt" FROM trust.block WHERE blocker_id = ${userId}`);
      // Widersprüche und Mitteilungen gehören zur eigenen Datenkopie (Art. 15), ohne Daten Dritter
      const appeals = await db.query(sql`
        SELECT a.decision_id AS "decisionId", a.appellant_role AS role, a.reason, a.status,
               a.outcome_reason AS "outcomeReason", a.created_at AS "createdAt", a.decided_at AS "decidedAt"
        FROM trust.appeal a WHERE a.appellant_id = ${userId}`);
      const notices = await db.query(sql`
        SELECT n.kind, n.recipient_role AS role, n.decision_id AS "decisionId", n.created_at AS "createdAt"
        FROM trust.notice n WHERE n.user_id = ${userId}`);
      return { reports, blocks, appeals, notices };
    },
  };
}

export type TrustService = ReturnType<typeof createTrustService>;
