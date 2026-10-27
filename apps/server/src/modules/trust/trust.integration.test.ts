import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { integrationAvailable, startHarness, type Client, type Harness } from '../../../test/integration/harness.js';

type Member = Client & { userId: string; email: string };
type Case = { id: string; targetId: string; targetType: string; messageContext: unknown[] | null };

describe.skipIf(!integrationAvailable)('Integration trust und DSA (PostgreSQL)', () => {
  let h: Harness;
  let lea: Member;
  let ben: Member;
  let mod: Member;
  let mod2: Member;

  const listing = async (owner: Member, title = 'Fahrrad 28 Zoll') => {
    const meta = (await owner.call('GET', '/meta')).data;
    return (
      await owner.call('POST', '/listings', {
        kind: 'offer', title, description: 'Gut gepflegt, neue Bremsen.', categoryId: meta.categories[0].id,
        priceType: 'fixed', priceCents: 12_000, condition: 'good', locationIds: [meta.locations[0].id],
      })
    ).data.id as string;
  };
  const openCase = async (targetId: string) =>
    ((await mod.call('GET', '/moderation/cases?status=open')).data as Case[]).find((c) => c.targetId === targetId)!;
  const remove = (c: Member, caseId: string, extra: Record<string, unknown> = {}) =>
    c.call('POST', `/moderation/cases/${caseId}/decision`, {
      decision: 'remove', reason: 'Die Anzeige verstößt nach Prüfung gegen die Community-Regeln.', ruleRef: 'community_prohibited_items', ...extra,
    });

  beforeAll(async () => {
    h = await startHarness();
  });
  afterAll(async () => h?.close());
  beforeEach(async () => {
    await h.reset();
    lea = await h.member('lea@studmail.hwg-lu.de');
    ben = await h.member('ben@studmail.hwg-lu.de');
    mod = await h.staff('mod@hwg-lu.de', 'moderator');
    mod2 = await h.staff('mod2@hwg-lu.de', 'moderator');
  });

  it('Meldung erzeugt Fall; doppelte Meldung 409; eigene Inhalte 422; Mitglieder sehen die Queue nicht', async () => {
    const id = await listing(lea);
    expect((await ben.call('POST', '/reports', { targetType: 'listing', targetId: id, reason: 'spam' })).status).toBe(201);
    expect((await ben.call('POST', '/reports', { targetType: 'listing', targetId: id, reason: 'spam' })).status).toBe(409);
    expect((await lea.call('POST', '/reports', { targetType: 'listing', targetId: id, reason: 'spam' })).status).toBe(422);
    expect((await ben.call('GET', '/moderation/cases')).status).toBe(403);
    expect(await openCase(id)).toBeDefined();
  });

  it('Entscheidung verlangt Regel und Begründung ≥ 20 Zeichen; Betroffene und Meldende erhalten Mitteilung und Mail', async () => {
    const id = await listing(lea, 'Lehrbuch mit Lösungen');
    await ben.call('POST', '/reports', { targetType: 'listing', targetId: id, reason: 'other', details: 'Enthält Klausurlösungen' });
    const c = await openCase(id);
    expect((await remove(mod, c.id, { ruleRef: undefined })).data.code).toBe('rule_required');
    // Schema (minLength) oder Fachregel lehnen ab, beides mit 422
    const short = await remove(mod, c.id, { reason: 'Zu kurz' });
    expect(short.status).toBe(422);
    expect(['reason_too_short', 'validation_failed']).toContain(short.data.code);
    expect((await remove(mod, c.id, { ruleRef: 'illegal_content' })).data.code).toBe('legal_ground_required');
    expect((await remove(mod, c.id)).status).toBe(204);
    await h.jobs.drain();
    const notices = (await lea.call('GET', '/me/notices')).data as { recipientRole: string; decision: { ruleRef: string }; appeal: { possible: boolean } }[];
    expect(notices[0]).toMatchObject({ recipientRole: 'subject', decision: { ruleRef: 'community_prohibited_items' }, appeal: { possible: true } });
    expect((await ben.call('GET', '/me/notices')).data[0].recipientRole).toBe('reporter');
    expect(h.mail.to('lea@studmail.hwg-lu.de').some((m) => m.text.includes('Lehrbuch mit Lösungen'))).toBe(true);
    // Keine Meldenden-Identität in der Mitteilung an Betroffene
    expect(JSON.stringify(notices)).not.toMatch(/ben@|Ben\b/);
    expect((await ben.call('GET', `/listings/${id}`)).status).toBe(404);
  });

  it('[AT-MOD-003-2] Entscheidungs- und Audit-Protokoll sind unveränderlich', async () => {
    const id = await listing(lea);
    await ben.call('POST', '/reports', { targetType: 'listing', targetId: id, reason: 'spam' });
    await remove(mod, (await openCase(id)).id);
    await expect(h.sql(`UPDATE trust.decision SET reason = 'nachträglich geändert'`)).rejects.toThrow(/append-only/);
    expect((await h.sql(`SELECT count(*)::int AS n FROM platform.audit_log`))[0].n).toBeGreaterThan(0);
    await expect(h.sql(`UPDATE platform.audit_log SET action = 'manipuliert'`)).rejects.toThrow(/append-only/);
  });

  it('Widerspruch: Frist, einmal je Person, Vier-Augen; Stattgabe stellt die Anzeige wieder her, beide Seiten erfahren es', async () => {
    const id = await listing(lea, 'Gebrauchtes Lehrbuch');
    await ben.call('POST', '/reports', { targetType: 'listing', targetId: id, reason: 'other', details: 'Verdacht' });
    await remove(mod, (await openCase(id)).id);
    const decisionId = (await lea.call('GET', '/me/notices')).data[0].decision.id as string;
    const reason = 'Das Buch enthält keine Lösungen, nur eigene Notizen am Rand.';
    expect((await lea.call('POST', `/moderation/decisions/${decisionId}/appeal`, { reason: ' '.repeat(30) })).status).toBe(422);
    const appeal = await lea.call('POST', `/moderation/decisions/${decisionId}/appeal`, { reason });
    expect(appeal.status).toBe(201);
    expect((await lea.call('POST', `/moderation/decisions/${decisionId}/appeal`, { reason })).data.code).toBe('appeal_exists');
    expect((await mia(h)).call('POST', `/moderation/decisions/${decisionId}/appeal`, { reason }).then((r) => r.status)).resolves.toBe(404);
    // Vier-Augen: der ursprüngliche Entscheider darf nicht entscheiden
    const own = await mod.call('POST', `/moderation/appeals/${appeal.data.id}/decision`, { outcome: 'reversed', reason: 'Ich prüfe meine eigene Entscheidung.' });
    expect(own.status).toBe(403);
    expect(own.data.code).toBe('four_eyes');
    const decided = await mod2.call('POST', `/moderation/appeals/${appeal.data.id}/decision`, { outcome: 'reversed', reason: 'Kein Verstoß erkennbar, Notizen sind zulässig.' });
    expect(decided.status).toBe(204);
    expect((await ben.call('GET', `/listings/${id}`)).data.status).toBe('active');
    const leaResult = ((await lea.call('GET', '/me/notices')).data as { kind: string }[]).some((n) => n.kind === 'appeal_result');
    const benResult = ((await ben.call('GET', '/me/notices')).data as { kind: string }[]).some((n) => n.kind === 'appeal_result');
    expect([leaResult, benResult]).toEqual([true, true]);
  });

  it('Widerspruch nach Ablauf der 6-Monats-Frist wird abgelehnt', async () => {
    const id = await listing(lea);
    await ben.call('POST', '/reports', { targetType: 'listing', targetId: id, reason: 'spam' });
    await remove(mod, (await openCase(id)).id);
    const decisionId = (await lea.call('GET', '/me/notices')).data[0].decision.id as string;
    await h.sql(`ALTER TABLE trust.decision DISABLE TRIGGER decision_append_only`);
    await h.sql(`UPDATE trust.decision SET notified_at = now() - interval '7 months', created_at = now() - interval '7 months'`);
    await h.sql(`ALTER TABLE trust.decision ENABLE TRIGGER decision_append_only`);
    const late = await lea.call('POST', `/moderation/decisions/${decisionId}/appeal`, { reason: 'Ich widerspreche, auch wenn es spät ist.' });
    expect(late.data.code).toBe('appeal_expired');
  });

  it('Sperre per Entscheidung beendet Sitzungen; Einmal-Link erlaubt den Widerspruch ohne Anmeldung, aber nur einmal', async () => {
    await lea.call('POST', '/reports', { targetType: 'user', targetId: ben.userId, reason: 'fraud', details: 'Vorkasse' });
    const c = await openCase(ben.userId);
    expect((await mod.call('POST', `/moderation/cases/${c.id}/decision`, {
      decision: 'ban', reason: 'Wiederholter Betrug mit Vorkasse, Konto gesperrt.', ruleRef: 'terms_member_duties',
    })).status).toBe(204);
    expect((await ben.call('GET', '/me')).status).toBe(401);
    await h.jobs.drain();
    const token = h.mail.token('ben@studmail.hwg-lu.de', '/widerspruch');
    const anon = h.client();
    expect((await anon.call('POST', '/appeals/token/info', { token })).status).toBe(200);
    const reason = 'Ich habe nie Vorkasse verlangt, bitte prüfen Sie den Chat erneut.';
    expect((await anon.call('POST', '/appeals/token', { token, reason })).status).toBe(201);
    expect((await anon.call('POST', '/appeals/token', { token, reason })).status).toBe(410);
    expect((await anon.call('POST', '/appeals/token/info', { token: 'x'.repeat(43) })).status).toBe(404);
  });

  it('[AT-PRIV-004] gemeldete Nachricht: Moderation sieht höchstens 11 Nachrichten, der Zugriff steht im Audit-Log', async () => {
    const id = await listing(lea);
    const conv = (await ben.call('POST', '/conversations', { listingId: id, body: 'Nachricht 0', clientMsgId: randomUUID() })).data.conversationId as string;
    const ids: string[] = [];
    for (let i = 1; i <= 20; i++) {
      const sender = i % 2 ? lea : ben;
      ids.push((await sender.call('POST', `/conversations/${conv}/messages`, { body: `Nachricht ${i}`, clientMsgId: randomUUID() })).data.id);
    }
    const target = ids[9]!; // Nachricht 10 von Ben
    await lea.call('POST', '/reports', { targetType: 'message', targetId: target, reason: 'harassment' });
    const c = await openCase(target);
    expect(c.messageContext!.length).toBeLessThanOrEqual(11);
    expect(c.messageContext!.length).toBe(11);
    const audit = await h.sql(`SELECT 1 FROM platform.audit_log WHERE action = 'message_context.viewed'`);
    expect(audit.length).toBeGreaterThan(0);
  });

  it('Straftatverdacht: Pflichtbegründung, Beweissicherung mit Kontext, Alarm an Admins, Freigabe durch Admin', async () => {
    const admin = await h.staff('admin@hwg-lu.de', 'admin');
    const id = await listing(lea, 'Gefälschte Tickets');
    await ben.call('POST', '/reports', { targetType: 'listing', targetId: id, reason: 'fraud', details: 'Betrug' });
    const c = await openCase(id);
    const body = {
      decision: 'remove', reason: 'Betrugsversuch mit Vorkasse und gefälschten Belegen.', ruleRef: 'illegal_content',
      legalGround: '§ 263 StGB (Betrug): Vorkasse ohne Absicht zu liefern.', criminalSuspicion: 'suspected',
    };
    expect((await mod.call('POST', `/moderation/cases/${c.id}/decision`, body)).data.code).toBe('criminal_reason_required');
    expect((await mod.call('POST', `/moderation/cases/${c.id}/decision`, { ...body, criminalSuspicionReason: 'Mehrere Meldungen zu Vorkasse ohne Ware.' })).status).toBe(204);
    await h.jobs.drain();
    expect(h.mail.to('admin@hwg-lu.de').length).toBeGreaterThan(0);
    // Die Kennzeichnung erscheint nie in der Mitteilung an Betroffene
    expect(JSON.stringify((await lea.call('GET', '/me/notices')).data)).not.toContain('suspected');
    const holds = (await admin.call('GET', '/admin/evidence-holds')).data;
    const hold = (holds.items ?? holds).find((x: { targetId: string }) => x.targetId === id);
    expect(hold).toBeDefined();
    expect((await mod.call('POST', `/admin/evidence-holds/${hold.id}/release`)).status).toBe(403);
    expect((await admin.call('POST', `/admin/evidence-holds/${hold.id}/release`)).status).toBeLessThan(300);
  });

  it('Vorläufiges Ausblenden ab drei Meldungen mit Mitteilung an Betroffene', async () => {
    const id = await listing(lea, 'Strittige Anzeige');
    for (const email of ['r1@studmail.hwg-lu.de', 'r2@studmail.hwg-lu.de', 'r3@studmail.hwg-lu.de']) {
      const reporter = await h.member(email);
      await reporter.call('POST', '/reports', { targetType: 'listing', targetId: id, reason: 'other', details: 'Prüfen' });
    }
    const search = (await ben.call('GET', '/listings?q=Strittige')).data.items as { id: string }[];
    expect(search.map((i) => i.id)).not.toContain(id);
    const notice = ((await lea.call('GET', '/me/notices')).data as { kind: string }[]).find((n) => n.kind === 'provisional_hide');
    expect(notice).toBeDefined();
  });
});

async function mia(h: Harness) {
  return h.member('mia@studmail.hwg-lu.de');
}
