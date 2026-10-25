import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { hash as argonHash, verify as argonVerify } from '@node-rs/argon2';
import type { AdminUser, Locale, Me, NotificationPrefs, PublicUser, RegisterBody, Role, UpdateMeBody, UserType } from '@campusmarkt/contracts';
import { audit } from '../../platform/audit.js';
import type { Db, Tx } from '../../platform/db.js';
import { AppError, badRequest, conflict, notFound, rateLimited, unprocessable } from '../../platform/errors.js';
import type { AuthContext } from '../../platform/http/auth.js';
import { sql } from '../../platform/sql.js';
import type { ModuleDeps } from '../shared.js';
import { checkPassword, checkRegistrationEmail, hashToken, newToken, normalizeEmail, type DomainRule } from './domain.js';
import { resolveLogin, type IdentityProviderPort } from './identity-provider.js';

// OWASP Password Storage Cheat Sheet: Argon2id, m = 19 MiB, t = 2, p = 1 (REQ-SEC-002)
const ARGON = { memoryCost: 19_456, timeCost: 2, parallelism: 1 };
const VERIFY_TTL_HOURS = 24;
const RESET_TTL_HOURS = 1;
const DELETION_GRACE_DAYS = 14;

interface UserRow {
  id: string;
  institution_id: string;
  email: string;
  email_canonical: string;
  password_hash: string;
  display_name: string;
  user_type: UserType;
  role: Role;
  status: 'unverified' | 'active' | 'suspended' | 'pending_deletion';
  study_program: string | null;
  preferred_location_ids: string[];
  notification_prefs: NotificationPrefs;
  locale: Locale;
  created_at: string;
  deletion_requested_at: string | null;
}

export interface Contact {
  email: string;
  displayName: string;
  status: UserRow['status'];
  notificationPrefs: NotificationPrefs;
  locale: Locale;
}

const toMe = (u: UserRow, terms: { accepted: string | null; current: string }): Me => ({
  id: u.id,
  email: u.email,
  displayName: u.display_name,
  userType: u.user_type,
  role: u.role,
  studyProgram: u.study_program,
  preferredLocationIds: u.preferred_location_ids,
  notificationPrefs: u.notification_prefs,
  locale: u.locale,
  termsAcceptedVersion: terms.accepted,
  termsRequired: terms.accepted !== terms.current,
  createdAt: u.created_at,
});

/** Zuletzt zugestimmte Fassung der Nutzungsbedingungen (REQ-PRIV-001, REQ-LEGAL-003). */
const LATEST_TERMS = (userId: unknown) => sql`
  SELECT version FROM identity.consent WHERE user_id = ${userId} AND kind = 'terms_privacy'
  ORDER BY given_at DESC LIMIT 1`;

export function createIdentityService(deps: ModuleDeps) {
  const { database, rateLimit, config } = deps;
  const { db } = database;
  const blocklist = loadBlocklist(config.passwordBlocklistFile);
  // Für gleiche Antwortzeiten, wenn ein Konto nicht existiert (REQ-AUTH-004)
  const dummyHash = argonHash('timing-equalizer-not-a-password', ARGON);

  const ipKey = (ip: string) => createHash('sha256').update(config.ipHashSalt + ip).digest('hex').slice(0, 32);
  const link = (path: string, token: string) => `${config.publicUrl}${path}?token=${encodeURIComponent(token)}`;
  const notify = deps.modules;

  async function meOf(executor: Db, user: UserRow): Promise<Me> {
    const terms = await executor.one<{ version: string }>(LATEST_TERMS(user.id));
    return toMe(user, { accepted: terms?.version ?? null, current: config.termsVersion });
  }

  /** Passwortverfahren als interner Adapter des IdentityProviderPort (ADR-0013 Nr. 2). */
  const passwordProvider: IdentityProviderPort = {
    id: 'password',
    async begin() {
      return { kind: 'form' };
    },
    async complete(input) {
      const { email: rawEmail, password } = input as { email: string; password: string };
      const email = normalizeEmail(rawEmail);
      const user = email ? await findByCanonical(email.canonical) : undefined;
      // Hash auch bei unbekannter Adresse prüfen: gleiche Antwortzeit (REQ-AUTH-004)
      const valid = await argonVerify(user?.password_hash ?? (await dummyHash), password);
      return user && valid ? { email: user.email, attributes: {} } : null;
    },
  };

  async function limit(key: string, max: number, windowSeconds: number) {
    const result = await rateLimit.hit(key, max, windowSeconds);
    if (!result.allowed) throw rateLimited(result.retryAfterSeconds);
  }

  async function domainRules(): Promise<DomainRule[]> {
    return db.query<DomainRule>(sql`
      SELECT domain, institution_id AS "institutionId", user_type AS "userType", active FROM identity.allowed_domain`);
  }

  async function findByCanonical(canonical: string) {
    return db.one<UserRow>(sql`SELECT * FROM identity."user" WHERE email_canonical = ${canonical}`);
  }

  async function issueToken(tx: Tx, userId: string, purpose: 'verify' | 'reset', ttlHours: number) {
    const { token, hash } = newToken();
    // Reset: nur der neueste Link gilt. Verifikation: frühere Links bleiben bis zum Ablauf gültig,
    // sonst meldet eine ältere Mail fälschlich „bereits verwendet“; nach der ersten Nutzung ist das Konto aktiv.
    if (purpose === 'reset') {
      await tx.db.exec(sql`
        UPDATE identity.token SET used_at = now() WHERE user_id = ${userId} AND purpose = 'reset' AND used_at IS NULL`);
    }
    await tx.db.exec(sql`
      INSERT INTO identity.token (token_hash, user_id, purpose, expires_at)
      VALUES (${hash}, ${userId}, ${purpose}, now() + make_interval(hours => ${ttlHours}))`);
    return token;
  }

  async function createSession(tx: Tx, userId: string) {
    const { token, hash } = newToken();
    await tx.db.exec(sql`
      INSERT INTO identity.session (token_hash, user_id, expires_at)
      VALUES (${hash}, ${userId}, now() + make_interval(days => ${config.sessionTtlDays}))`);
    return token;
  }

  async function consumeToken(tx: Tx, token: string, purpose: 'verify' | 'reset') {
    const row = await tx.db.one<{ user_id: string; expired: boolean; used: boolean }>(sql`
      SELECT user_id, expires_at < now() AS expired, used_at IS NOT NULL AS used
      FROM identity.token WHERE token_hash = ${hashToken(token)} AND purpose = ${purpose} FOR UPDATE`);
    if (!row) throw badRequest('token_invalid', 'Der Link ist ungültig.');
    if (row.used) throw badRequest('token_used', 'Der Link wurde bereits verwendet.');
    if (row.expired) throw badRequest('token_expired', 'Der Link ist abgelaufen.');
    await tx.db.exec(sql`UPDATE identity.token SET used_at = now() WHERE token_hash = ${hashToken(token)}`);
    return row.user_id;
  }

  return {
    async register(body: RegisterBody, ip: string): Promise<void> {
      // REQ-SEC-005 / Q-18: großzügig je IP (Campus-NAT), streng je Adresse
      await limit(`register-ip:${ipKey(ip)}`, 30, 3600);
      const normalized = normalizeEmail(body.email);
      if (normalized) await limit(`register-addr:${normalized.canonical}`, 3, 3600);
      const check = checkRegistrationEmail(body.email, await domainRules());
      if (!check.ok) {
        throw unprocessable(
          check.reason,
          check.reason === 'invalid_format'
            ? 'Bitte gib eine gültige E-Mail-Adresse ein.'
            : 'Registrierung nur mit einer E-Mail-Adresse der HWG LU möglich.',
          [{ path: 'email', message: 'Domain nicht zugelassen' }],
        );
      }
      if (body.termsVersion !== config.termsVersion) {
        throw unprocessable('terms_outdated', 'Bitte bestätige die aktuellen Nutzungsbedingungen.');
      }
      const pw = checkPassword(body.password, { blocklist, email: check.email.email });
      if (!pw.ok) throw unprocessable('weak_password', pw.reason, [{ path: 'password', message: pw.reason }]);

      // Hash immer berechnen, damit die Antwortzeit nicht verrät, ob das Konto existiert
      const passwordHash = await argonHash(body.password, ARGON);
      const { email, canonical } = check.email;

      await database.tx(async (tx) => {
        const banned = await tx.db.one(sql`SELECT 1 FROM identity.banned_email WHERE email_canonical = ${canonical}`);
        if (banned) return; // REQ-AUTH-008, neutrale Antwort

        const existing = await tx.db.one<UserRow>(
          sql`SELECT * FROM identity."user" WHERE email_canonical = ${canonical} FOR UPDATE`,
        );
        if (existing?.status === 'unverified') {
          const token = await issueToken(tx, existing.id, 'verify', VERIFY_TTL_HOURS);
          await notify.notifications.email(tx, { address: existing.email, locale: existing.locale }, 'verify', {
            name: existing.display_name,
            link: link('/verify', token),
          });
          return;
        }
        if (existing) {
          await notify.notifications.email(tx, { address: existing.email, locale: existing.locale }, 'account_exists', {
            name: existing.display_name,
            loginLink: `${config.publicUrl}/login`,
            resetLink: `${config.publicUrl}/forgot-password`,
          });
          return;
        }

        const user = await tx.db.one<{ id: string }>(sql`
          INSERT INTO identity."user" (institution_id, email, email_canonical, password_hash, display_name, user_type)
          VALUES (${check.institutionId}, ${email}, ${canonical}, ${passwordHash}, ${body.displayName.trim()}, ${check.userType})
          RETURNING id`);
        await tx.db.exec(sql`
          INSERT INTO identity.consent (user_id, kind, version) VALUES (${user!.id}, 'terms_privacy', ${body.termsVersion})`);
        const token = await issueToken(tx, user!.id, 'verify', VERIFY_TTL_HOURS);
        await notify.notifications.email(tx, { address: email }, 'verify', {
          name: body.displayName.trim(),
          link: link('/verify', token),
        });
      });
    },

    async verify(token: string): Promise<{ me: Me; sessionToken: string }> {
      return database.tx(async (tx) => {
        const userId = await consumeToken(tx, token, 'verify');
        const user = await tx.db.one<UserRow>(sql`
          UPDATE identity."user" SET status = 'active', verified_at = now(), updated_at = now()
          WHERE id = ${userId} AND status = 'unverified' RETURNING *`);
        if (!user) throw badRequest('token_used', 'Das Konto ist bereits bestätigt.');
        const sessionToken = await createSession(tx, userId);
        return { me: await meOf(tx.db, user), sessionToken };
      });
    },

    async resendVerification(rawEmail: string): Promise<void> {
      const email = normalizeEmail(rawEmail);
      if (!email) return;
      await limit(`resend:${email.canonical}`, 3, 3600);
      await database.tx(async (tx) => {
        const user = await tx.db.one<UserRow>(
          sql`SELECT * FROM identity."user" WHERE email_canonical = ${email.canonical} AND status = 'unverified'`,
        );
        if (!user) return;
        const token = await issueToken(tx, user.id, 'verify', VERIFY_TTL_HOURS);
        await notify.notifications.email(tx, { address: user.email, locale: user.locale }, 'verify', {
          name: user.display_name,
          link: link('/verify', token),
        });
      });
    },

    async login(rawEmail: string, password: string, ip: string): Promise<{ me: Me; sessionToken: string }> {
      const email = normalizeEmail(rawEmail);
      const failKey = `login-fail:${email?.canonical ?? rawEmail.toLowerCase()}:${ipKey(ip)}`;
      // REQ-SEC-005: 5 Fehlversuche / 15 min pro Konto + IP. Erst atomar zählen, dann prüfen, damit parallele
      // Versuche das Limit nicht gemeinsam unterlaufen; eine erfolgreiche Anmeldung setzt den Zähler zurück.
      const attempt = await rateLimit.hit(failKey, 5, 900);
      if (!attempt.allowed) throw rateLimited(attempt.retryAfterSeconds);

      const outcome = await resolveLogin(passwordProvider, { email: rawEmail, password }, {
        rules: await domainRules(),
        findByCanonical,
      });
      if (!outcome.ok) {
        if (outcome.code === 'invalid_credentials' || outcome.code === 'domain_not_allowed') {
          throw new AppError(401, 'invalid_credentials', 'E-Mail-Adresse oder Passwort ist falsch.');
        }
        if (outcome.code === 'not_verified') {
          throw new AppError(403, 'not_verified', 'Bitte bestätige zuerst deine E-Mail-Adresse.');
        }
        throw new AppError(403, 'account_suspended', 'Dieses Konto ist gesperrt.');
      }
      const user = outcome.account;
      await rateLimit.reset(failKey);

      return database.tx(async (tx) => {
        let deletionCancelled = false;
        if (user.status === 'pending_deletion') {
          // Login innerhalb der Karenzzeit bricht die Löschung ab (REQ-ACC-002)
          await tx.db.exec(sql`
            UPDATE identity."user" SET status = 'active', deletion_requested_at = NULL, updated_at = now()
            WHERE id = ${user.id}`);
          deletionCancelled = true;
        }
        const sessionToken = await createSession(tx, user.id);
        return { me: { ...(await meOf(tx.db, user)), deletionCancelled }, sessionToken };
      });
    },

    async logout(sessionHash: string) {
      await db.exec(sql`DELETE FROM identity.session WHERE token_hash = ${sessionHash}`);
    },

    async resolveSession(token: string): Promise<AuthContext | null> {
      const sessionHash = hashToken(token);
      const row = await db.one<{ id: string; role: Role; institution_id: string; display_name: string; terms_version: string | null }>(sql`
        SELECT u.id, u.role, u.institution_id, u.display_name, (${LATEST_TERMS(sql`u.id`)}) AS terms_version
        FROM identity.session s JOIN identity."user" u ON u.id = s.user_id
        WHERE s.token_hash = ${sessionHash} AND s.expires_at > now() AND u.status = 'active'`);
      if (!row) return null;
      return {
        userId: row.id,
        role: row.role,
        institutionId: row.institution_id,
        displayName: row.display_name,
        sessionHash,
        termsCurrent: row.terms_version === config.termsVersion,
      };
    },

    async requestPasswordReset(rawEmail: string): Promise<void> {
      const email = normalizeEmail(rawEmail);
      if (!email) return;
      await limit(`reset:${email.canonical}`, 3, 3600);
      await database.tx(async (tx) => {
        const user = await tx.db.one<UserRow>(
          sql`SELECT * FROM identity."user" WHERE email_canonical = ${email.canonical} AND status = 'active'`,
        );
        if (!user) return;
        const token = await issueToken(tx, user.id, 'reset', RESET_TTL_HOURS);
        await notify.notifications.email(tx, { address: user.email, locale: user.locale }, 'password_reset', {
          name: user.display_name,
          link: link('/reset-password', token),
        });
      });
    },

    async confirmPasswordReset(token: string, password: string): Promise<void> {
      await database.tx(async (tx) => {
        const userId = await consumeToken(tx, token, 'reset');
        const user = await tx.db.one<UserRow>(sql`SELECT * FROM identity."user" WHERE id = ${userId}`);
        const pw = checkPassword(password, { blocklist, email: user?.email });
        if (!pw.ok) throw unprocessable('weak_password', pw.reason, [{ path: 'password', message: pw.reason }]);
        const passwordHash = await argonHash(password, ARGON);
        await tx.db.exec(sql`
          UPDATE identity."user" SET password_hash = ${passwordHash}, updated_at = now() WHERE id = ${userId}`);
        // Alle Sitzungen widerrufen
        await tx.db.exec(sql`DELETE FROM identity.session WHERE user_id = ${userId}`);
      });
    },

    async getMe(userId: string): Promise<Me> {
      const user = await db.one<UserRow>(sql`SELECT * FROM identity."user" WHERE id = ${userId}`);
      if (!user) throw notFound();
      return meOf(db, user);
    },

    /** REQ-LEGAL-003: Zustimmung zur aktuellen Fassung der Nutzungsbedingungen, versioniert gespeichert. */
    async acceptTerms(userId: string, version: string): Promise<Me> {
      if (version !== config.termsVersion) {
        throw conflict('terms_outdated', 'Diese Fassung ist nicht mehr aktuell. Bitte lade die Seite neu.');
      }
      const user = await db.one<UserRow>(sql`SELECT * FROM identity."user" WHERE id = ${userId}`);
      if (!user) throw notFound();
      const current = await db.one<{ version: string }>(LATEST_TERMS(userId));
      if (current?.version !== version) {
        await db.exec(sql`
          INSERT INTO identity.consent (user_id, kind, version) VALUES (${userId}, 'terms_privacy', ${version})`);
      }
      return meOf(db, user);
    },

    async updateMe(userId: string, body: UpdateMeBody): Promise<Me> {
      if (body.preferredLocationIds && !(await deps.modules.listings.locationsExist(body.preferredLocationIds))) {
        throw unprocessable('invalid_location', 'Unbekannter Übergabeort.');
      }
      const user = await db.one<UserRow>(sql`
        UPDATE identity."user" SET
          display_name = COALESCE(${body.displayName?.trim() ?? null}, display_name),
          study_program = CASE WHEN ${body.studyProgram !== undefined} THEN ${body.studyProgram ?? null} ELSE study_program END,
          preferred_location_ids = COALESCE(${body.preferredLocationIds ?? null}::uuid[], preferred_location_ids),
          notification_prefs = COALESCE(${body.notificationPrefs ? JSON.stringify(body.notificationPrefs) : null}::jsonb, notification_prefs),
          locale = COALESCE(${body.locale ?? null}, locale),
          updated_at = now()
        WHERE id = ${userId} RETURNING *`);
      if (!user) throw notFound();
      return meOf(db, user);
    },

    async getPublicUsers(ids: string[]): Promise<Map<string, PublicUser>> {
      if (ids.length === 0) return new Map();
      const rows = await db.query<{ id: string; display_name: string; user_type: UserType; created_at: string }>(sql`
        SELECT id, display_name, user_type, created_at FROM identity."user" WHERE id = ANY(${ids}::uuid[])`);
      return new Map(
        rows.map((r) => [r.id, { id: r.id, displayName: r.display_name, userType: r.user_type, memberSince: r.created_at }]),
      );
    },

    async getContact(userId: string): Promise<Contact | null> {
      const row = await db.one<UserRow>(sql`SELECT * FROM identity."user" WHERE id = ${userId}`);
      if (!row) return null;
      return {
        email: row.email,
        displayName: row.display_name,
        status: row.status,
        notificationPrefs: row.notification_prefs,
        locale: row.locale,
      };
    },

    /** Abmeldung einer Benachrichtigungskategorie über den signierten Link (REQ-NOTI-003, REQ-OPS-010). */
    async disableNotification(userId: string, category: keyof NotificationPrefs): Promise<boolean> {
      const changed = await db.exec(sql`
        UPDATE identity."user"
        SET notification_prefs = jsonb_set(notification_prefs, ${`{${category}}`}::text[], 'false'::jsonb), updated_at = now()
        WHERE id = ${userId}`);
      return changed > 0;
    },

    /** Aktive Administratoren, z. B. für die Eskalation nach DSA Art. 18 (REQ-LEGAL-008). */
    async adminIds(): Promise<string[]> {
      const rows = await db.query<{ id: string }>(sql`
        SELECT id FROM identity."user" WHERE role = 'admin' AND status = 'active'`);
      return rows.map((r) => r.id);
    },

    /**
     * Schmales API für die Kontaktfreigabe (REQ-CHAT-010, Architektur §8.1): nur die bei der Registrierung
     * eingegebene Adresse eines aktiven Kontos. Die Zustimmungsprüfung liegt im Modul messaging.
     */
    async getSharedContactAddresses(userIds: string[]): Promise<Map<string, string>> {
      if (userIds.length === 0) return new Map();
      const rows = await db.query<{ id: string; email: string }>(sql`
        SELECT id, email FROM identity."user" WHERE id = ANY(${userIds}::uuid[]) AND status = 'active'`);
      return new Map(rows.map((r) => [r.id, r.email]));
    },

    /** Aktive Konten unter den angegebenen, gesammelt für Konversationslisten. */
    async activeUserIds(userIds: string[]): Promise<Set<string>> {
      if (userIds.length === 0) return new Set();
      const rows = await db.query<{ id: string }>(sql`
        SELECT id FROM identity."user" WHERE id = ANY(${userIds}::uuid[]) AND status = 'active'`);
      return new Set(rows.map((r) => r.id));
    },

    async isActive(userId: string): Promise<boolean> {
      return !!(await db.one(sql`SELECT 1 FROM identity."user" WHERE id = ${userId} AND status = 'active'`));
    },

    async allowedDomains(): Promise<string[]> {
      const rows = await db.query<{ domain: string }>(
        sql`SELECT domain FROM identity.allowed_domain WHERE active ORDER BY domain DESC`,
      );
      return rows.map((r) => r.domain);
    },

    /** Sperre (Moderation, REQ-MOD-002): Sitzungen widerrufen, Adresse für Neuregistrierung sperren. */
    async suspend(tx: Tx, userId: string, reason: string): Promise<void> {
      const user = await tx.db.one<UserRow>(sql`
        UPDATE identity."user" SET status = 'suspended', updated_at = now() WHERE id = ${userId} RETURNING *`);
      if (!user) throw notFound();
      await tx.db.exec(sql`DELETE FROM identity.session WHERE user_id = ${userId}`);
      await tx.db.exec(sql`
        INSERT INTO identity.banned_email (email_canonical, reason) VALUES (${user.email_canonical}, ${reason})
        ON CONFLICT DO NOTHING`);
    },

    /** Sperre aufheben, z. B. nach erfolgreichem Widerspruch (REQ-LEGAL-007). */
    async unsuspend(tx: Tx, userId: string): Promise<void> {
      const user = await tx.db.one<UserRow>(sql`
        UPDATE identity."user" SET status = 'active', updated_at = now()
        WHERE id = ${userId} AND status = 'suspended' RETURNING *`);
      if (user) await tx.db.exec(sql`DELETE FROM identity.banned_email WHERE email_canonical = ${user.email_canonical}`);
    },

    async listUsers(query: string | undefined): Promise<AdminUser[]> {
      const pattern = `%${(query ?? '').replace(/[%_\\]/g, '\\$&')}%`;
      const rows = await db.query<UserRow>(sql`
        SELECT * FROM identity."user"
        WHERE email ILIKE ${pattern} OR display_name ILIKE ${pattern}
        ORDER BY created_at DESC LIMIT 100`);
      return rows.map((u) => ({
        id: u.id,
        email: u.email,
        displayName: u.display_name,
        role: u.role,
        status: u.status,
        userType: u.user_type,
        createdAt: u.created_at,
      }));
    },

    /** REQ-MOD-007: Rollen vergeben und entziehen, protokolliert. */
    async setRole(actor: AuthContext, userId: string, role: Role): Promise<void> {
      if (actor.userId === userId) throw unprocessable('own_role', 'Die eigene Rolle kann nicht geändert werden.');
      await database.tx(async (tx) => {
        const before = await tx.db.one<{ role: Role }>(
          sql`SELECT role FROM identity."user" WHERE id = ${userId} FOR UPDATE`,
        );
        if (!before) throw notFound();
        await tx.db.exec(sql`UPDATE identity."user" SET role = ${role}, updated_at = now() WHERE id = ${userId}`);
        if (role !== before.role) await tx.db.exec(sql`DELETE FROM identity.session WHERE user_id = ${userId}`);
        await audit(tx.db, {
          actorId: actor.userId,
          action: 'role.changed',
          targetType: 'user',
          targetId: userId,
          details: { from: before.role, to: role },
        });
      });
    },

    /** REQ-ACC-002: Löschung mit 14 Tagen Karenz beantragen. */
    async requestDeletion(userId: string, password: string): Promise<void> {
      const user = await db.one<UserRow>(sql`SELECT * FROM identity."user" WHERE id = ${userId}`);
      if (!user || !(await argonVerify(user.password_hash, password))) {
        throw new AppError(401, 'invalid_credentials', 'Das Passwort ist falsch.');
      }
      await database.tx(async (tx) => {
        await tx.db.exec(sql`
          UPDATE identity."user" SET status = 'pending_deletion', deletion_requested_at = now(), updated_at = now()
          WHERE id = ${userId}`);
        await tx.db.exec(sql`DELETE FROM identity.session WHERE user_id = ${userId}`);
        const dateIso = new Date(Date.now() + DELETION_GRACE_DAYS * 86_400_000).toISOString();
        await notify.notifications.email(tx, { address: user.email, locale: user.locale }, 'deletion_scheduled', {
          name: user.display_name,
          dateIso,
          loginLink: `${config.publicUrl}/login`,
        });
      });
    },

    async dueDeletions(): Promise<{ id: string; email: string; displayName: string; locale: Locale }[]> {
      return db.query(sql`
        SELECT id, email, display_name AS "displayName", locale FROM identity."user"
        WHERE status = 'pending_deletion'
          AND deletion_requested_at < now() - make_interval(days => ${DELETION_GRACE_DAYS})`);
    },

    async deleteUser(tx: Tx, userId: string): Promise<void> {
      // Sessions, Tokens und Einwilligungen werden per ON DELETE CASCADE entfernt
      await tx.db.exec(sql`DELETE FROM identity."user" WHERE id = ${userId}`);
    },

    async exportData(userId: string) {
      const user = await db.one<UserRow>(sql`SELECT * FROM identity."user" WHERE id = ${userId}`);
      if (!user) throw notFound();
      const consents = await db.query(sql`
        SELECT kind, version, given_at AS "givenAt" FROM identity.consent WHERE user_id = ${userId} ORDER BY given_at`);
      const sessions = await db.query(sql`
        SELECT created_at AS "createdAt", expires_at AS "expiresAt" FROM identity.session WHERE user_id = ${userId}`);
      return { profile: await meOf(db, user), status: user.status, consents, sessions };
    },

    /** Für den Seed: Konto direkt aktiv anlegen. */
    async createVerifiedUser(tx: Tx, input: {
      email: string;
      password: string;
      displayName: string;
      role: Role;
      studyProgram?: string;
      termsVersion?: string;
    }): Promise<string> {
      const check = checkRegistrationEmail(input.email, await domainRules());
      if (!check.ok) throw new Error(`Seed-Adresse ${input.email} nicht zugelassen`);
      const passwordHash = await argonHash(input.password, ARGON);
      const row = await tx.db.one<{ id: string }>(sql`
        INSERT INTO identity."user" (institution_id, email, email_canonical, password_hash, display_name, user_type,
                                     role, status, verified_at, study_program)
        VALUES (${check.institutionId}, ${check.email.email}, ${check.email.canonical}, ${passwordHash},
                ${input.displayName}, ${check.userType}, ${input.role}, 'active', now(), ${input.studyProgram ?? null})
        RETURNING id`);
      await tx.db.exec(sql`
        INSERT INTO identity.consent (user_id, kind, version) VALUES (${row!.id}, 'terms_privacy', ${input.termsVersion ?? config.termsVersion})`);
      return row!.id;
    },
  };
}

function loadBlocklist(file: string): Set<string> {
  try {
    return new Set(
      readFileSync(file, 'utf8')
        .split(/\r?\n/)
        .map((l) => l.trim().toLowerCase())
        .filter((l) => l && !l.startsWith('#')),
    );
  } catch {
    return new Set();
  }
}

export type IdentityService = ReturnType<typeof createIdentityService>;
