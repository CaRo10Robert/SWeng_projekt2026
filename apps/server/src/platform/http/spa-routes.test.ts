import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { isKnownSpaPath, isLegalPage } from './spa-routes.js';
import { isMaintenanceExempt, maintenancePage, retryAfterSeconds } from './maintenance.js';
import { requiresCurrentTerms } from './terms.js';

describe('SPA-Routen und HTTP-Statuscodes (REQ-UX-003)', () => {
  it.each([
    ['/', true],
    ['/login', true],
    ['/impressum', true],
    ['/hilfe', true],
    ['/status', true],
    ['/widerspruch?token=abc', true],
    ['/listings/0b5f2c4e-1111-4222-8333-444455556666', true],
    ['/listings/0b5f2c4e-1111-4222-8333-444455556666/edit', true],
    ['/messages/abc-123', true],
    ['/me/notices', true],
    ['/admin/', true],
    ['/gibt-es-nicht', false],
    ['/listings/a/b/c', false],
    ['/impressum/unterseite', false],
    ['/../etc/passwd', false],
  ])('%s → bekannt=%s', (path, known) => {
    expect(isKnownSpaPath(path)).toBe(known);
  });

  it('kennt jede Route aus apps/web/src/router.tsx (Liste und Router bleiben synchron)', () => {
    const router = readFileSync(resolve(import.meta.dirname, '../../../../web/src/router.tsx'), 'utf8');
    const paths = [...router.matchAll(/path:\s*'([^']+)'/g)].map((m) => m[1]!).filter((p) => p.startsWith('/'));
    expect(paths.length).toBeGreaterThan(10);
    for (const path of paths) {
      expect(isKnownSpaPath(path.replace(/\$[a-zA-Z]+/g, '0b5f2c4e-1111-4222-8333-444455556666')), path).toBe(true);
    }
  });

  it('erkennt Rechtsseiten', () => {
    expect(isLegalPage('/datenschutz')).toBe(true);
    expect(isLegalPage('/datenschutz/')).toBe(true);
    expect(isLegalPage('/profile')).toBe(false);
  });
});

describe('Wartungsmodus: Ausnahmen (REQ-OPS-006)', () => {
  it.each([
    ['/health/ready', 'GET', null, true],
    ['/metrics', 'GET', null, true],
    ['/status', 'GET', null, true],
    ['/api/v1/status', 'GET', null, true],
    ['/impressum', 'GET', null, true],
    ['/assets/index-abc.js', 'GET', null, true],
    ['/robots.txt', 'GET', null, true],
    ['/.well-known/security.txt', 'GET', null, true],
    ['/login', 'GET', null, true],
    ['/api/v1/auth/login', 'POST', null, true],
    ['/api/v1/meta', 'GET', null, true],
    ['/api/v1/me', 'GET', 'member', true],
    ['/api/v1/me', 'PATCH', 'member', false],
    ['/', 'GET', null, false],
    ['/api/v1/listings', 'POST', 'member', false],
    ['/api/v1/listings', 'GET', 'moderator', false],
    ['/api/v1/listings', 'POST', 'admin', true],
    ['/', 'GET', 'admin', true],
  ] as const)('%s %s (%s) → erreichbar=%s', (url, method, role, exempt) => {
    expect(isMaintenanceExempt({ url, method, role })).toBe(exempt);
  });

  it('Retry-After aus dem angekündigten Ende, begrenzt auf 60 s bis 1 Tag', () => {
    const now = new Date('2026-10-24T10:00:00Z');
    expect(retryAfterSeconds(null, now)).toBe(300);
    expect(retryAfterSeconds('2026-10-24T10:30:00Z', now)).toBe(1800);
    expect(retryAfterSeconds('2026-10-24T09:00:00Z', now)).toBe(60);
    expect(retryAfterSeconds('2026-12-24T10:00:00Z', now)).toBe(86_400);
  });

  it('Wartungsseite ohne Skripte und externe Ressourcen, mit Rechtslinks', () => {
    const html = maintenancePage('2026-10-24T18:00:00Z');
    expect(html).not.toMatch(/<script|https?:\/\//);
    expect(html).toContain('href="/impressum"');
    expect(html).toContain('href="/status"');
  });
});

describe('[AT-LEGAL-003-2] Neue Nutzungsbedingungen sperren schreibende Aktionen (REQ-LEGAL-003)', () => {
  it.each([
    ['POST', '/api/v1/listings', true],
    ['PATCH', '/api/v1/me', true],
    ['POST', '/api/v1/conversations/1/messages', true],
    ['GET', '/api/v1/listings', false],
    ['GET', '/api/v1/me/export', false],
    ['POST', '/api/v1/me/terms', false],
    ['POST', '/api/v1/me/delete', false],
    ['POST', '/api/v1/auth/logout', false],
    ['POST', '/api/v1/moderation/decisions/abc/appeal', false],
    ['POST', '/api/v1/notifications/unsubscribe?token=x', false],
    ['POST', '/api/v1/me/privacy-ack', false],
    ['POST', '/api/v1/appeals/token/info', false],
    // RV-C-06: Schutzrechte bleiben ohne aktuelle Zustimmung möglich
    ['POST', '/api/v1/reports', false],
    ['PUT', '/api/v1/users/abc/block', false],
    ['DELETE', '/api/v1/users/abc/block', false],
  ])('%s %s → Zustimmung nötig=%s', (method, url, required) => {
    expect(requiresCurrentTerms({ method, url })).toBe(required);
  });

  it.each([
    [{ notificationPrefs: { newMessage: false, listingExpiry: true } }, false],
    [{ locale: 'en' }, false],
    [{ locale: 'en', displayName: 'Neu' }, true],
    [{}, true],
  ])('PATCH /me %j → Zustimmung nötig=%s', (body, required) => {
    expect(requiresCurrentTerms({ method: 'PATCH', url: '/api/v1/me', body })).toBe(required);
  });

  it.each([
    ['withdraw', false],
    ['decline', false],
    ['grant', true],
  ])('Kontaktfreigabe %s → Zustimmung nötig=%s', (action, required) => {
    expect(requiresCurrentTerms({ method: 'POST', url: '/api/v1/conversations/abc/contact', body: { action } })).toBe(required);
  });
});
