import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { integrationAvailable, startHarness, type Client, type Harness } from '../../test/integration/harness.js';

type Member = Client & { userId: string; email: string };

const MEMBER_ENDPOINTS: [string, string, unknown?][] = [
  ['GET', '/me'],
  ['PATCH', '/me', { displayName: 'Gast' }],
  ['GET', '/me/listings'],
  ['GET', '/me/favorites'],
  ['GET', '/me/notices'],
  ['GET', '/me/blocks'],
  ['GET', '/me/unread'],
  ['GET', '/me/export'],
  ['GET', '/conversations'],
  ['GET', '/listings'],
  ['POST', '/reports', { targetType: 'listing', targetId: randomUUID(), reason: 'spam' }],
];
const MODERATION_ENDPOINTS: [string, string, unknown?][] = [
  ['GET', '/moderation/cases'],
  ['GET', '/moderation/appeals?status=open'],
];
const ADMIN_ENDPOINTS: [string, string, unknown?][] = [
  ['GET', '/admin/users'],
  ['GET', '/admin/audit'],
  ['GET', '/admin/jobs'],
  ['GET', `/admin/reports/dac7?year=${new Date().getFullYear()}`],
  ['GET', '/admin/evidence-holds'],
  ['PUT', '/admin/maintenance', { on: false }],
  ['PUT', '/admin/announcement', { text: 'Wartung am Abend' }],
];

describe.skipIf(!integrationAvailable)('[AT-SEC-006-2] Autorisierungsmatrix REQ-SEC-006 (Integration, PostgreSQL)', () => {
  let h: Harness;
  let lea: Member;
  let ben: Member;
  let mia: Member;
  let mod: Member;
  let admin: Member;
  let listingId: string;
  let convId: string;

  beforeAll(async () => {
    h = await startHarness();
    lea = await h.member('lea@studmail.hwg-lu.de');
    ben = await h.member('ben@studmail.hwg-lu.de');
    mia = await h.member('mia@studmail.hwg-lu.de');
    mod = await h.staff('mod@hwg-lu.de', 'moderator');
    admin = await h.staff('admin@hwg-lu.de', 'admin');
    const meta = (await lea.call('GET', '/meta')).data;
    listingId = (
      await lea.call('POST', '/listings', {
        kind: 'offer', title: 'Fahrrad 28 Zoll', description: 'Gut gepflegt, neue Bremsen.', categoryId: meta.categories[0].id,
        priceType: 'fixed', priceCents: 12_000, condition: 'good', locationIds: [meta.locations[0].id],
      })
    ).data.id;
    convId = (await ben.call('POST', '/conversations', { listingId, body: 'Noch da?', clientMsgId: randomUUID() })).data.conversationId;
  });
  afterAll(async () => h?.close());

  it('Gast: jede Mitgliederfunktion → 401', async () => {
    const guest = h.client();
    for (const [method, path, body] of [...MEMBER_ENDPOINTS, ...MODERATION_ENDPOINTS, ...ADMIN_ENDPOINTS]) {
      expect(`${method} ${path} ${(await guest.call(method, path, body)).status}`).toBe(`${method} ${path} 401`);
    }
  });

  it('Mitglied: fremde Konversation lesen → 404', async () => {
    expect((await mia.call('GET', `/conversations/${convId}`)).status).toBe(404);
    expect((await mia.call('GET', `/conversations/${convId}/messages`)).status).toBe(404);
    expect((await mia.call('POST', `/conversations/${convId}/messages`, { body: 'Hallo', clientMsgId: randomUUID() })).status).toBe(404);
  });

  it('Mitglied: fremde Anzeige ändern, löschen, Status setzen → 404', async () => {
    expect((await mia.call('PATCH', `/listings/${listingId}`, { title: 'Übernommen' })).status).toBe(404);
    expect((await mia.call('DELETE', `/listings/${listingId}`)).status).toBe(404);
    expect((await mia.call('POST', `/listings/${listingId}/status`, { action: 'pause' })).status).toBe(404);
  });

  it('Interessent: Deal einer Konversation steuern → 403', async () => {
    for (const action of ['reserve', 'complete', 'cancel']) {
      expect((await ben.call('POST', `/conversations/${convId}/deal`, { action })).status).toBe(403);
    }
  });

  it('Mitglied: Moderations- oder Admin-Funktion → 403', async () => {
    for (const [method, path, body] of [...MODERATION_ENDPOINTS, ...ADMIN_ENDPOINTS]) {
      expect(`${method} ${path} ${(await mia.call(method, path, body)).status}`).toBe(`${method} ${path} 403`);
    }
  });

  it('Moderator: Admin-Funktion → 403, Moderation erlaubt', async () => {
    for (const [method, path, body] of ADMIN_ENDPOINTS) {
      expect(`${method} ${path} ${(await mod.call(method, path, body)).status}`).toBe(`${method} ${path} 403`);
    }
    for (const [method, path] of MODERATION_ENDPOINTS) expect((await mod.call(method, path)).status).toBe(200);
  });

  it('Moderator: eigenen Fall entscheiden → abgelehnt (selbst gemeldet)', async () => {
    await mod.call('POST', '/reports', { targetType: 'listing', targetId: listingId, reason: 'other', details: 'Selbst gemeldet' });
    const own = ((await mod.call('GET', '/moderation/cases?status=open')).data as { id: string; targetId: string }[]).find((c) => c.targetId === listingId)!;
    const res = await mod.call('POST', `/moderation/cases/${own.id}/decision`, {
      decision: 'remove', reason: 'Ich entscheide über meine eigene Meldung.', ruleRef: 'community_prohibited_items',
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  it('Admin: eigene Rolle ändern → abgelehnt', async () => {
    const res = await admin.call('POST', `/admin/users/${admin.userId}/role`, { role: 'member' });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
    expect((await admin.call('GET', '/admin/users')).status).toBe(200);
  });
});
