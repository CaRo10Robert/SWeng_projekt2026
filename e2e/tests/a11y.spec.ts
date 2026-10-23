import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { apiSession, DEMO, keyboardLogin, liveConversation, type Conversation } from './helpers';

/** Dokumentierte, befristete Ausnahmen für `serious` außerhalb der Kernseiten (REQ-A11Y-001). */
const exceptions = JSON.parse(readFileSync(new URL('../a11y-exceptions.json', import.meta.url), 'utf8')) as {
  rule: string;
  page: string;
  reason: string;
  expires: string;
}[];

async function scan(page: Page) {
  await page.waitForLoadState('networkidle');
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  return result.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, targets: v.nodes.map((n) => n.target.join(' ')).slice(0, 3) }));
}

async function ids(request: Parameters<typeof apiSession>[0], baseURL: string) {
  const lea = await apiSession(request, baseURL, DEMO.lea);
  const search = await lea.call<{ items: { id: string }[] }>('GET', '/listings?q=Statistik');
  const conversations = await lea.call<Conversation[]>('GET', '/conversations');
  return { listingId: search.items[0]!.id, conversationId: liveConversation(conversations).id };
}

test('[AT-A11Y-002-2] Kernseiten ohne Verstöße der Stufen serious/critical (axe-core)', async ({ page, request, baseURL }) => {
  const { listingId, conversationId } = await ids(request, baseURL!);
  const findings: Record<string, unknown[]> = {};
  for (const path of ['/login', '/register']) {
    await page.goto(path);
    findings[path] = (await scan(page)).filter((v) => v.impact === 'serious' || v.impact === 'critical');
  }
  await keyboardLogin(page, DEMO.lea);
  for (const path of ['/', `/listings/${listingId}`, '/listings/new', '/messages', `/messages/${conversationId}`, '/profile']) {
    await page.goto(path);
    findings[path] = (await scan(page)).filter((v) => v.impact === 'serious' || v.impact === 'critical');
  }
  expect(Object.fromEntries(Object.entries(findings).filter(([, v]) => v.length))).toEqual({});
});

test('[AT-A11Y-001] Übrige Seiten ohne critical; serious nur mit dokumentierter Ausnahme (axe-core)', async ({ browser }) => {
  const today = new Date().toISOString().slice(0, 10);
  const findings: Record<string, unknown[]> = {};
  const allowed = (path: string, rule: string) =>
    exceptions.some((e) => e.page === path && e.rule === rule && e.expires >= today);
  const check = async (page: Page, path: string) => {
    await page.goto(path);
    const bad = (await scan(page)).filter(
      (v) => v.impact === 'critical' || (v.impact === 'serious' && !allowed(path, v.id)),
    );
    if (bad.length) findings[path] = bad;
  };

  const contexts = await Promise.all([1, 2, 3, 4].map(() => browser.newContext({ locale: 'de-DE' })));
  const guest = await contexts[0]!.newPage();
  for (const path of ['/forgot-password', '/verify?token=ungueltig-0123456789', '/reset-password?token=ungueltig-0123456789']) await check(guest, path);

  const member = await contexts[1]!.newPage();
  await keyboardLogin(member, DEMO.lea);
  for (const path of ['/me/favorites', '/me/listings']) await check(member, path);

  const mod = await contexts[2]!.newPage();
  await keyboardLogin(mod, DEMO.mod);
  await check(mod, '/moderation');

  const admin = await contexts[3]!.newPage();
  await keyboardLogin(admin, DEMO.admin);
  await check(admin, '/admin');
  await Promise.all(contexts.map((c) => c.close()));

  expect(findings).toEqual({});
});
