import type { FastifyRequest } from 'fastify';
import type { Role } from '@campusmarkt/contracts';
import { forbidden, unauthenticated } from '../errors.js';

export interface AuthContext {
  userId: string;
  role: Role;
  institutionId: string;
  displayName: string;
  sessionHash: string;
  /** Zustimmung zur aktuellen Fassung der Nutzungsbedingungen liegt vor (REQ-LEGAL-003). */
  termsCurrent: boolean;
}

declare module 'fastify' {
  interface FastifyRequest {
    auth: AuthContext | null;
  }
}

export function requireAuth(req: FastifyRequest): AuthContext {
  if (!req.auth) throw unauthenticated();
  return req.auth;
}

const rank: Record<Role, number> = { member: 0, moderator: 1, admin: 2 };

/** Deny by default: Rolle muss mindestens `min` sein (REQ-SEC-006). */
export function requireRole(req: FastifyRequest, min: Role): AuthContext {
  const auth = requireAuth(req);
  if (rank[auth.role] < rank[min]) throw forbidden();
  return auth;
}

export const SESSION_COOKIE = 'cm_session';
