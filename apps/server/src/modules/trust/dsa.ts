import type {
  Appeal,
  AppealDecisionBody,
  AppealReceipt,
  CriminalSuspicion,
  DecisionBody,
  DecisionStatement,
  EvidenceHold,
  ModerationDecisionType,
  ModerationNotice,
  ModerationRule,
  ReportTargetType,
  TokenAppealInfo,
} from '@campusmarkt/contracts';
import { audit } from '../../platform/audit.js';
import type { Tx } from '../../platform/db.js';
import { AppError, conflict, isUniqueViolation, notFound, rateLimited, unprocessable } from '../../platform/errors.js';
import type { AuthContext } from '../../platform/http/auth.js';
import { sql } from '../../platform/sql.js';
import type { ModuleDeps } from '../shared.js';
import {
  addMonths,
  APPEAL_RATE,
  APPEAL_WINDOW_MONTHS,
  appealDeadline,
  appealRole,
  canReviewAppeal,
  checkAppeal,
  checkDecision,
  EVIDENCE_HOLD_MONTHS,
  hashAppealToken,
  newAppealToken,
  type AppealRole,
} from './domain.js';

/**
 * DSA-Pflichten der Moderation (docs/06-recht/dsa-prozesse.md): Begründung an Betroffene und Meldende (Art. 16/17,
 * REQ-LEGAL-006), Widerspruch mit Vier-Augen-Prinzip (Art. 20, REQ-LEGAL-007), Kennzeichnung bei Verdacht auf
 * Straftaten mit Beweissicherung (Art. 18, REQ-LEGAL-008).
 */

// Texte für Maßnahme, Ziel, Regel und Kennzeichnung setzt die Mail-Vorlage in der Sprache des Empfängers
// (modules/notifications/templates.ts, ADR-0016); hier werden nur Codes übergeben.

const DECISION_MESSAGES = {
  reason_too_short: 'Bitte begründe die Entscheidung mit mindestens 20 Zeichen (Tatsachen und Umstände).',
  rule_required: 'Bitte wähle die verletzte Regel aus.',
  criminal_reason_required: 'Bitte begründe die Kennzeichnung „Verdacht auf Straftat“ mit mindestens 20 Zeichen.',
};

interface DecisionRow {
  id: string;
  case_id: string;
  moderator_id: string;
  decision: ModerationDecisionType;
  reason: string;
  rule_ref: ModerationRule | null;
  automated_detection: boolean;
  created_at: string;
  notified_at: string | null;
  target_type: ReportTargetType;
  target_id: string;
  subject_user_id: string | null;
}

const DECISION_WITH_CASE = sql`
  SELECT d.id, d.case_id, d.moderator_id, d.decision, d.reason, d.rule_ref, d.automated_detection, d.created_at,
         d.notified_at, c.target_type, c.target_id, c.subject_user_id
  FROM trust.decision d JOIN trust.moderation_case c ON c.id = d.case_id`;

export interface DsaDeps {
  openCase(tx: Tx, targetType: ReportTargetType, targetId: string, subjectUserId: string | null): Promise<{ id: string }>;
}

export function createDsa(deps: ModuleDeps, internal: DsaDeps) {
  const { database, modules, config, rateLimit } = deps;
  const { db } = database;
  const noticesLink = `${config.publicUrl}/me/notices`;

  async function titles(rows: { target_type: ReportTargetType; target_id: string }[]) {
    const ids = [...new Set(rows.filter((r) => r.target_type === 'listing').map((r) => r.target_id))];
    return modules.listings.summaries(ids);
  }

  function statement(row: DecisionRow, title: string | null): DecisionStatement {
    return {
      id: row.id,
      decision: row.decision,
      targetType: row.target_type,
      targetTitle: title,
      facts: row.reason,
      ruleRef: row.rule_ref,
      automatedDetection: row.automated_detection,
      decidedAt: row.created_at,
    };
  }

  async function reporterIds(executor: Tx['db'], caseId: string): Promise<string[]> {
    const rows = await executor.query<{ reporter_id: string }>(sql`
      SELECT DISTINCT reporter_id FROM trust.report WHERE case_id = ${caseId} AND reporter_id IS NOT NULL`);
    return rows.map((r) => r.reporter_id);
  }

  async function addNotice(
    tx: Tx,
    input: { userId: string; kind: 'decision' | 'appeal_result'; role: AppealRole; decisionId: string; appealId?: string },
  ) {
    await tx.db.exec(sql`
      INSERT INTO trust.notice (user_id, kind, recipient_role, decision_id, appeal_id)
      VALUES (${input.userId}, ${input.kind}, ${input.role}, ${input.decisionId}, ${input.appealId ?? null})`);
  }

  async function insertAppeal(
    tx: Tx,
    input: { decisionId: string; appellantId: string; role: AppealRole; reason: string },
  ): Promise<AppealReceipt> {
    try {
      const row = await tx.db.one<{ id: string; status: 'open'; created_at: string }>(sql`
        INSERT INTO trust.appeal (decision_id, appellant_id, appellant_role, reason)
        VALUES (${input.decisionId}, ${input.appellantId}, ${input.role}, ${input.reason.trim()})
        RETURNING id, status, created_at`);
      await audit(tx.db, {
        actorId: input.appellantId,
        action: 'appeal.created',
        targetType: 'decision',
        targetId: input.decisionId,
        details: { appealId: row!.id, role: input.role },
      });
      return { id: row!.id, status: row!.status, createdAt: row!.created_at };
    } catch (error) {
      if (isUniqueViolation(error)) throw conflict('appeal_exists', 'Du hast gegen diese Entscheidung bereits Widerspruch eingelegt.');
      throw error;
    }
  }

  async function appealLimit(userId: string) {
    const result = await rateLimit.hit(`appeal:${userId}`, APPEAL_RATE.limit, APPEAL_RATE.windowSeconds);
    if (!result.allowed) throw rateLimited(result.retryAfterSeconds);
  }

  const expired = () =>
    conflict(
      'appeal_expired',
      `Die Frist für den Widerspruch (${APPEAL_WINDOW_MONTHS} Monate) ist abgelaufen. Dir steht der Rechtsweg offen.`,
    );

  /** Gesperrte Konten: Token-Zeile prüfen (404 unbekannt, 410 benutzt/abgelaufen). */
  async function tokenRow(executor: Tx['db'], token: string, lock: boolean) {
    const row = await executor.one<{ decision_id: string; user_id: string; expired: boolean; used: boolean }>(sql`
      SELECT decision_id, user_id, expires_at < now() AS expired, used_at IS NOT NULL AS used
      FROM trust.appeal_token WHERE token_hash = ${hashAppealToken(token)} ${lock ? sql`FOR UPDATE` : sql``}`);
    if (!row) throw notFound('Der Link ist ungültig.');
    if (row.used) throw new AppError(410, 'token_used', 'Dieser Link wurde bereits verwendet.');
    if (row.expired) throw new AppError(410, 'token_expired', 'Dieser Link ist abgelaufen.');
    return row;
  }

  return {
    /** REQ-MOD-002/003, REQ-LEGAL-006/008: Entscheidung mit Pflichtangaben, Mitteilungen und Protokoll. */
    async decide(auth: AuthContext, caseId: string, body: DecisionBody): Promise<void> {
      const check = checkDecision(body);
      if (!check.ok) throw unprocessable(check.code, DECISION_MESSAGES[check.code], [{ path: check.path, message: DECISION_MESSAGES[check.code] }]);
      const suspicion = body.criminalSuspicion ?? 'none';

      await database.tx(async (tx) => {
        const kase = await tx.db.one<{ id: string; target_type: ReportTargetType; target_id: string; subject_user_id: string | null; status: string }>(sql`
          SELECT * FROM trust.moderation_case WHERE id = ${caseId} FOR UPDATE`);
        if (!kase) throw notFound();
        if (kase.status !== 'open') throw conflict('already_decided', 'Dieser Fall wurde bereits entschieden.');
        if (kase.subject_user_id === auth.userId) throw unprocessable('own_case', 'Eigene Fälle dürfen nicht entschieden werden.');

        const automated = !!(await tx.db.one(sql`
          SELECT 1 FROM trust.report WHERE case_id = ${caseId} AND reason = 'auto_filter'`));
        const reporters = await reporterIds(tx.db, caseId);
        const title =
          kase.target_type === 'listing' ? ((await modules.listings.summary(kase.target_id))?.title ?? null) : null;

        // notified_at = jetzt: Mitteilung und Mails werden in derselben Transaktion eingereiht (decision ist append-only)
        const decision = (await tx.db.one<{ id: string; notified_at: string }>(sql`
          INSERT INTO trust.decision (case_id, moderator_id, decision, reason, rule_ref, criminal_suspicion,
                                      criminal_suspicion_reason, automated_detection, notified_at)
          VALUES (${caseId}, ${auth.userId}, ${body.decision}, ${body.reason.trim()}, ${body.ruleRef ?? null}, ${suspicion},
                  ${suspicion === 'none' ? null : body.criminalSuspicionReason!.trim()}, ${automated}, now())
          RETURNING id, notified_at`))!;
        await tx.db.exec(sql`UPDATE trust.moderation_case SET status = 'decided', decided_at = now() WHERE id = ${caseId}`);

        const removeContent = body.decision === 'remove' || body.decision === 'ban';
        if (kase.target_type === 'listing') {
          if (removeContent) await modules.listings.removeByModeration(tx, kase.target_id);
          else {
            await modules.listings.approveFromReview(tx, kase.target_id);
            await modules.listings.setHidden(tx, kase.target_id, false);
          }
        }
        if (kase.target_type === 'message' && removeContent) await modules.messaging.removeByModeration(tx, kase.target_id);
        if (body.decision === 'ban' && kase.subject_user_id) {
          await modules.identity.suspend(tx, kase.subject_user_id, `Moderationsentscheidung ${caseId}`);
          await modules.listings.setOwnerSuspended(tx, kase.subject_user_id, true);
        }

        await audit(tx.db, {
          actorId: auth.userId,
          action: `moderation.${body.decision}`,
          targetType: kase.target_type,
          targetId: kase.target_id,
          details: { caseId, decisionId: decision.id, reason: body.reason, ruleRef: body.ruleRef ?? null, criminalSuspicion: suspicion },
        });

        const deadlineIso = appealDeadline(new Date(decision.notified_at)).toISOString();

        // Betroffene (DSA Art. 17); bei „keine Maßnahme“ nur, wenn ein Filter die Anzeige zurückgehalten hatte
        const autoFilterOnly = reporters.length === 0;
        if (kase.subject_user_id && (body.decision !== 'no_action' || autoFilterOnly)) {
          await addNotice(tx, { userId: kase.subject_user_id, kind: 'decision', role: 'subject', decisionId: decision.id });
          let appealLink: string | undefined;
          if (body.decision === 'ban') {
            // Gesperrte Konten können sich nicht anmelden: Einmal-Link, gültig bis zum Ende der Widerspruchsfrist
            const { token, hash } = newAppealToken();
            await tx.db.exec(sql`
              INSERT INTO trust.appeal_token (token_hash, decision_id, user_id, expires_at)
              VALUES (${hash}, ${decision.id}, ${kase.subject_user_id}, ${addMonths(new Date(decision.notified_at), APPEAL_WINDOW_MONTHS)})`);
            appealLink = `${config.publicUrl}/widerspruch?token=${encodeURIComponent(token)}`;
          } else if (body.decision !== 'no_action') {
            appealLink = noticesLink;
          }
          await modules.notifications.email(tx, { userId: kase.subject_user_id }, 'moderation_decision', {
            decision: body.decision,
            targetType: kase.target_type,
            ...(title ? { title } : {}),
            facts: body.reason.trim(),
            ...(body.ruleRef ? { ruleRef: body.ruleRef } : {}),
            automated: String(automated),
            deadlineIso,
            ...(appealLink ? { appealLink } : {}),
          });
        }

        // Meldende (DSA Art. 16 Abs. 5): Ergebnis, bei „keine Maßnahme“ mit Widerspruchsmöglichkeit; nie die Identität
        for (const reporterId of reporters) {
          await addNotice(tx, { userId: reporterId, kind: 'decision', role: 'reporter', decisionId: decision.id });
          await modules.notifications.email(tx, { userId: reporterId }, 'moderation_report_result', {
            decision: body.decision,
            targetType: kase.target_type,
            deadlineIso,
            ...(body.decision === 'no_action' ? { appealLink: noticesLink } : {}),
          });
        }

        // DSA Art. 18 (REQ-LEGAL-008): Kennzeichnung, Beweissicherung, Eskalation an die Administration
        if (suspicion !== 'none') {
          await tx.db.exec(sql`
            INSERT INTO trust.evidence_hold (decision_id, target_type, target_id, subject_user_id, urgent, held_until)
            VALUES (${decision.id}, ${kase.target_type}, ${kase.target_id}, ${kase.subject_user_id},
                    ${suspicion === 'imminent_danger'}, ${addMonths(new Date(), EVIDENCE_HOLD_MONTHS)})`);
          await audit(tx.db, {
            actorId: auth.userId,
            action: 'moderation.criminal_suspicion',
            targetType: kase.target_type,
            targetId: kase.target_id,
            details: { caseId, decisionId: decision.id, level: suspicion, reason: body.criminalSuspicionReason },
          });
          for (const adminId of await modules.identity.adminIds()) {
            await modules.notifications.email(tx, { userId: adminId }, 'criminal_suspicion_alert', {
              caseId,
              level: suspicion,
              urgent: String(suspicion === 'imminent_danger'),
              link: `${config.publicUrl}/admin`,
            });
          }
        }
      });
    },

    /** „Meine Mitteilungen“ (REQ-LEGAL-006): ohne Identität der Meldenden und ohne Art.-18-Kennzeichnung. */
    async notices(auth: AuthContext): Promise<ModerationNotice[]> {
      const rows = await db.query<DecisionRow & {
        notice_id: string;
        kind: 'decision' | 'appeal_result';
        recipient_role: AppealRole;
        notice_created_at: string;
        read_at: string | null;
        own_status: Appeal['status'] | null;
        own_outcome: string | null;
        result_status: Appeal['status'] | null;
        result_outcome: string | null;
      }>(sql`
        SELECT n.id AS notice_id, n.kind, n.recipient_role, n.created_at AS notice_created_at, n.read_at,
               d.id, d.case_id, d.moderator_id, d.decision, d.reason, d.rule_ref, d.automated_detection, d.created_at,
               d.notified_at, c.target_type, c.target_id, c.subject_user_id,
               own.status AS own_status, own.outcome_reason AS own_outcome,
               res.status AS result_status, res.outcome_reason AS result_outcome
        FROM trust.notice n
        JOIN trust.decision d ON d.id = n.decision_id
        JOIN trust.moderation_case c ON c.id = d.case_id
        LEFT JOIN trust.appeal own ON own.decision_id = d.id AND own.appellant_id = ${auth.userId}
        LEFT JOIN trust.appeal res ON res.id = n.appeal_id
        WHERE n.user_id = ${auth.userId}
        ORDER BY n.created_at DESC LIMIT 100`);
      const listingTitles = await titles(rows);
      const now = new Date();
      return rows.map((r) => {
        const deadline = appealDeadline(new Date(r.notified_at ?? r.created_at));
        const role = appealRole({
          userId: auth.userId,
          subjectUserId: r.recipient_role === 'subject' ? auth.userId : null,
          reporterIds: r.recipient_role === 'reporter' ? [auth.userId] : [],
          decision: r.decision,
        });
        const isResult = r.kind === 'appeal_result';
        const possible =
          !isResult && checkAppeal({ role, notifiedAt: new Date(r.notified_at ?? r.created_at), now, alreadyAppealed: !!r.own_status }).ok;
        return {
          id: r.notice_id,
          kind: r.kind,
          recipientRole: r.recipient_role,
          createdAt: r.notice_created_at,
          readAt: r.read_at,
          decision: statement(r, listingTitles.get(r.target_id)?.title ?? null),
          appeal: {
            possible,
            deadline: role ? deadline.toISOString() : null,
            status: isResult ? r.result_status : r.own_status,
            outcomeReason: isResult ? r.result_outcome : r.own_outcome,
          },
        };
      });
    },

    async markNoticesRead(auth: AuthContext): Promise<void> {
      await db.exec(sql`UPDATE trust.notice SET read_at = now() WHERE user_id = ${auth.userId} AND read_at IS NULL`);
    },

    /** REQ-LEGAL-007: Widerspruch aus der Mitteilung im Konto. */
    async appeal(auth: AuthContext, decisionId: string, reason: string): Promise<AppealReceipt> {
      await appealLimit(auth.userId);
      return database.tx(async (tx) => {
        const row = await tx.db.one<DecisionRow>(sql`${DECISION_WITH_CASE} WHERE d.id = ${decisionId}`);
        if (!row) throw notFound();
        const role = appealRole({
          userId: auth.userId,
          subjectUserId: row.subject_user_id,
          reporterIds: await reporterIds(tx.db, row.case_id),
          decision: row.decision,
        });
        const already = !!(await tx.db.one(sql`
          SELECT 1 FROM trust.appeal WHERE decision_id = ${decisionId} AND appellant_id = ${auth.userId}`));
        const check = checkAppeal({ role, notifiedAt: new Date(row.notified_at ?? row.created_at), now: new Date(), alreadyAppealed: already });
        if (!check.ok) {
          if (check.code === 'not_found') throw notFound();
          if (check.code === 'appeal_exists') throw conflict('appeal_exists', 'Du hast gegen diese Entscheidung bereits Widerspruch eingelegt.');
          throw expired();
        }
        return insertAppeal(tx, { decisionId, appellantId: auth.userId, role: role!, reason });
      });
    },

    /** Formular des Einmal-Links (gesperrte Konten, ohne Anmeldung). */
    async tokenAppealInfo(token: string): Promise<TokenAppealInfo> {
      const t = await tokenRow(db, token, false);
      const row = await db.one<DecisionRow>(sql`${DECISION_WITH_CASE} WHERE d.id = ${t.decision_id}`);
      if (!row) throw notFound();
      const listingTitles = await titles([row]);
      return {
        decision: statement(row, listingTitles.get(row.target_id)?.title ?? null),
        deadline: appealDeadline(new Date(row.notified_at ?? row.created_at)).toISOString(),
      };
    },

    async tokenAppeal(token: string, reason: string): Promise<AppealReceipt> {
      return database.tx(async (tx) => {
        const t = await tokenRow(tx.db, token, true);
        await appealLimit(t.user_id);
        const row = await tx.db.one<DecisionRow>(sql`${DECISION_WITH_CASE} WHERE d.id = ${t.decision_id}`);
        if (!row) throw notFound();
        const already = !!(await tx.db.one(sql`
          SELECT 1 FROM trust.appeal WHERE decision_id = ${t.decision_id} AND appellant_id = ${t.user_id}`));
        const check = checkAppeal({ role: 'subject', notifiedAt: new Date(row.notified_at ?? row.created_at), now: new Date(), alreadyAppealed: already });
        if (!check.ok) {
          if (check.code === 'appeal_exists') throw conflict('appeal_exists', 'Gegen diese Entscheidung wurde bereits Widerspruch eingelegt.');
          throw expired();
        }
        await tx.db.exec(sql`UPDATE trust.appeal_token SET used_at = now() WHERE token_hash = ${hashAppealToken(token)}`);
        return insertAppeal(tx, { decisionId: t.decision_id, appellantId: t.user_id, role: 'subject', reason });
      });
    },

    /** Widerspruchs-Queue (UC-36). `canDecide` = Vier-Augen-Prinzip erfüllt. */
    async appeals(auth: AuthContext, status: 'open' | 'decided'): Promise<Appeal[]> {
      const rows = await db.query<DecisionRow & {
        appeal_id: string;
        status: Appeal['status'];
        appellant_role: AppealRole;
        appeal_reason: string;
        appeal_created_at: string;
        decided_at: string | null;
        outcome_reason: string | null;
      }>(sql`
        SELECT a.id AS appeal_id, a.status, a.appellant_role, a.reason AS appeal_reason, a.created_at AS appeal_created_at,
               a.decided_at, a.outcome_reason,
               d.id, d.case_id, d.moderator_id, d.decision, d.reason, d.rule_ref, d.automated_detection, d.created_at,
               d.notified_at, c.target_type, c.target_id, c.subject_user_id
        FROM trust.appeal a JOIN trust.decision d ON d.id = a.decision_id JOIN trust.moderation_case c ON c.id = d.case_id
        WHERE ${status === 'open' ? sql`a.status = 'open'` : sql`a.status <> 'open'`}
        ORDER BY ${status === 'open' ? sql`a.created_at ASC` : sql`a.decided_at DESC`} LIMIT 100`);
      const listingTitles = await titles(rows);
      const subjects = await modules.identity.getPublicUsers(
        rows.map((r) => r.subject_user_id).filter((id): id is string => !!id),
      );
      return rows.map((r) => {
        const subject = r.subject_user_id ? subjects.get(r.subject_user_id) : undefined;
        return {
          id: r.appeal_id,
          status: r.status,
          appellantRole: r.appellant_role,
          reason: r.appeal_reason,
          createdAt: r.appeal_created_at,
          decidedAt: r.decided_at,
          outcomeReason: r.outcome_reason,
          canDecide: canReviewAppeal(auth.userId, r.moderator_id),
          decision: statement(r, listingTitles.get(r.target_id)?.title ?? null),
          subject: subject ? { id: subject.id, displayName: subject.displayName } : null,
        };
      });
    },

    /** Vier-Augen-Entscheidung über den Widerspruch; bei Stattgabe wird die Maßnahme zurückgenommen. */
    async decideAppeal(auth: AuthContext, appealId: string, body: AppealDecisionBody): Promise<void> {
      await database.tx(async (tx) => {
        const appeal = await tx.db.one<{ id: string; decision_id: string; appellant_id: string | null; appellant_role: AppealRole; status: string }>(sql`
          SELECT id, decision_id, appellant_id, appellant_role, status FROM trust.appeal WHERE id = ${appealId} FOR UPDATE`);
        if (!appeal) throw notFound();
        if (appeal.status !== 'open') throw conflict('already_decided', 'Dieser Widerspruch wurde bereits entschieden.');
        const row = (await tx.db.one<DecisionRow>(sql`${DECISION_WITH_CASE} WHERE d.id = ${appeal.decision_id}`))!;
        if (!canReviewAppeal(auth.userId, row.moderator_id)) {
          throw new AppError(403, 'four_eyes', 'Ein anderer Moderator muss über diesen Widerspruch entscheiden.');
        }

        await tx.db.exec(sql`
          UPDATE trust.appeal SET status = ${body.outcome}, reviewer_id = ${auth.userId}, outcome_reason = ${body.reason.trim()},
            decided_at = now()
          WHERE id = ${appealId}`);

        const reporters = await reporterIds(tx.db, row.case_id);
        if (body.outcome === 'reversed') {
          if (appeal.appellant_role === 'subject') {
            const removed = row.decision === 'remove' || row.decision === 'ban';
            if (row.target_type === 'listing' && removed) await modules.listings.restoreByModeration(tx, row.target_id);
            if (row.target_type === 'message' && removed) await modules.messaging.restoreByModeration(tx, row.target_id);
            if (row.decision === 'ban' && row.subject_user_id) {
              await modules.identity.unsuspend(tx, row.subject_user_id);
              await modules.listings.setOwnerSuspended(tx, row.subject_user_id, false);
            }
          } else {
            // Meldende/r hatte Recht: Der Fall wird neu geöffnet und von der Moderation neu entschieden
            const kase = await internal.openCase(tx, row.target_type, row.target_id, row.subject_user_id);
            await tx.db.exec(sql`
              INSERT INTO trust.report (case_id, reporter_id, reason, details)
              VALUES (${kase.id}, ${appeal.appellant_id}, 'other', ${`Wiederaufnahme nach Widerspruch: ${body.reason.trim()}`})
              ON CONFLICT (case_id, reporter_id) WHERE reporter_id IS NOT NULL DO NOTHING`);
          }
        }

        await audit(tx.db, {
          actorId: auth.userId,
          action: `appeal.${body.outcome}`,
          targetType: 'decision',
          targetId: row.id,
          details: { appealId, role: appeal.appellant_role, reason: body.reason },
        });

        const outcomeCode =
          body.outcome === 'reversed' ? (appeal.appellant_role === 'subject' ? 'reversed_subject' : 'reversed_reporter') : 'upheld';
        const recipients: { userId: string; role: AppealRole }[] = [];
        if (appeal.appellant_id) recipients.push({ userId: appeal.appellant_id, role: appeal.appellant_role });
        // Stattgabe zugunsten der Betroffenen: begründete Mitteilung an beide Seiten (REQ-LEGAL-007)
        if (body.outcome === 'reversed' && appeal.appellant_role === 'subject') {
          for (const reporterId of reporters) recipients.push({ userId: reporterId, role: 'reporter' });
        }
        for (const r of recipients) {
          await addNotice(tx, { userId: r.userId, kind: 'appeal_result', role: r.role, decisionId: row.id, appealId });
          await modules.notifications.email(tx, { userId: r.userId }, 'appeal_result', {
            targetType: row.target_type,
            outcomeCode,
            reason: body.reason.trim(),
            link: noticesLink,
          });
        }
      });
    },

    // ------------------------------------------------------------ Beweissicherung (REQ-LEGAL-008)
    async evidenceHolds(): Promise<EvidenceHold[]> {
      const rows = await db.query<{
        id: string;
        decision_id: string;
        target_type: ReportTargetType;
        target_id: string;
        urgent: boolean;
        held_until: string;
        released_at: string | null;
        created_at: string;
      }>(sql`SELECT * FROM trust.evidence_hold ORDER BY released_at NULLS FIRST, created_at DESC LIMIT 200`);
      return rows.map((r) => ({
        id: r.id,
        decisionId: r.decision_id,
        targetType: r.target_type,
        targetId: r.target_id,
        urgent: r.urgent,
        heldUntil: r.held_until,
        releasedAt: r.released_at,
        createdAt: r.created_at,
      }));
    },

    async releaseEvidenceHold(auth: AuthContext, id: string): Promise<void> {
      await database.tx(async (tx) => {
        const released = await tx.db.exec(sql`
          UPDATE trust.evidence_hold SET released_at = now(), released_by = ${auth.userId}
          WHERE id = ${id} AND released_at IS NULL`);
        if (!released) throw notFound();
        await audit(tx.db, { actorId: auth.userId, action: 'evidence_hold.released', targetType: 'evidence_hold', targetId: id });
      });
    },

    /** Gesicherte Ziele: von automatischen Löschfristen ausgenommen, höchstens 6 Monate. */
    async heldTargetIds(targetType: ReportTargetType): Promise<string[]> {
      const rows = await db.query<{ target_id: string }>(sql`
        SELECT DISTINCT target_id FROM trust.evidence_hold
        WHERE target_type = ${targetType} AND released_at IS NULL AND held_until > now()`);
      return rows.map((r) => r.target_id);
    },

    async hasActiveHoldForUser(userId: string): Promise<boolean> {
      return !!(await db.one(sql`
        SELECT 1 FROM trust.evidence_hold WHERE subject_user_id = ${userId} AND released_at IS NULL AND held_until > now()`));
    },
  };
}
