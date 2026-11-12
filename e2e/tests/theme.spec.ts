import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { activate, apiSession, DEMO, gotoTop, keyboardLogin, liveConversation, type Conversation } from './helpers';

/**
 * Farbschema hell/dunkel (REQ-UX-008, ADR-0021): Systemeinstellung als Voreinstellung, Wahl im Seitenkopf, kein
 * Aufblitzen, Inline-Skript per CSP-Hash erlaubt, Kontrast im dunklen Schema auf allen Seitentypen (REQ-A11Y-001).
 */

const groupName = 'Farbschema';

/** Protokolliert, ob die Klasse `dark` gesetzt war, bevor React den ersten Inhalt in #root geschrieben hat. */
async function recordFirstPaintOrder(page: Page) {
  await page.addInitScript(() => {
    const log: string[] = [];
    (window as unknown as { __themeLog: string[] }).__themeLog = log;
    new MutationObserver(() => {
      if (document.documentElement.classList.contains('dark') && !log.includes('dark')) log.push('dark');
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    new MutationObserver(() => {
      if (document.getElementById('root')?.firstChild && !log.includes('content')) log.push('content');
    }).observe(document, { childList: true, subtree: true });
  });
}

const cspViolations = (page: Page) => {
  const found: string[] = [];
  page.on('console', (msg) => {
    if (/Content Security Policy|Refused to (execute|apply|load)/i.test(msg.text())) found.push(msg.text());
  });
  return found;
};

async function seriousViolations(page: Page) {
  await page.waitForLoadState('networkidle');
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  return result.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target.join(' ')).slice(0, 3) }));
}

test('[AT-UX-008-3] Systemeinstellung dunkel: dunkles Schema ohne Aufblitzen, Skript per CSP erlaubt, nichts gespeichert', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'de-DE', colorScheme: 'dark' });
  const page = await context.newPage();
  const csp = cspViolations(page);
  await recordFirstPaintOrder(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __themeLog: string[] }).__themeLog)).toEqual(['dark', 'content']);
  await expect(page.locator('html')).toHaveClass(/\bdark\b/);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe('dark');
  // Seitenhintergrund wirklich dunkel (Luminanz grob < 0,1)
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const [r, g, b] = bg.match(/\d+/g)!.map(Number);
  expect((0.2126 * r! + 0.7152 * g! + 0.0722 * b!) / 255).toBeLessThan(0.1);
  await expect(page.getByRole('group', { name: groupName }).getByRole('button', { name: 'Wie im System' })).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
  expect(csp).toEqual([]);
  await context.close();
});

test('[AT-UX-008-3] Wahl per Tastatur im Seitenkopf wird gespeichert, gilt nach Neuladen und gegen die Systemeinstellung', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'de-DE', colorScheme: 'light' });
  const page = await context.newPage();
  await gotoTop(page, '/hilfe');
  await expect(page.locator('html')).not.toHaveClass(/\bdark\b/);
  const group = page.getByRole('group', { name: groupName });
  await activate(page, group.getByRole('button', { name: 'Dunkel' }));
  await expect(page.locator('html')).toHaveClass(/\bdark\b/);
  await expect(group.getByRole('button', { name: 'Dunkel' })).toHaveAttribute('aria-pressed', 'true');
  // Gespeichert wird nur die ausdrückliche Wahl (REQ-LEGAL-010, Allowlist)
  expect(await page.evaluate(() => ({ ...localStorage }))).toEqual({ cm_theme: 'dark' });
  await expect(page.locator('meta[name="theme-color"]').first()).toHaveAttribute('content', '#111a2b');

  await recordFirstPaintOrder(page);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __themeLog: string[] }).__themeLog)).toEqual(['dark', 'content']);

  await activate(page, page.getByRole('group', { name: groupName }).getByRole('button', { name: 'Wie im System' }));
  await expect(page.locator('html')).not.toHaveClass(/\bdark\b/);
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
  await context.close();
});

test('[AT-UX-008-3] Dunkles Schema: alle Seitentypen ohne Verstöße serious/critical (axe-core, inkl. Kontrast)', async ({ browser, request, baseURL }) => {
  const lea = await apiSession(request, baseURL!, DEMO.lea);
  const listingId = (await lea.call<{ items: { id: string }[] }>('GET', '/listings?q=Statistik')).items[0]!.id;
  const conversationId = liveConversation(await lea.call<Conversation[]>('GET', '/conversations')).id;
  const findings: Record<string, unknown[]> = {};
  const check = async (page: Page, path: string) => {
    await page.goto(path);
    await expect(page.locator('html')).toHaveClass(/\bdark\b/);
    const bad = await seriousViolations(page);
    if (bad.length) findings[path] = bad;
  };
  const open = async () => (await browser.newContext({ locale: 'de-DE', colorScheme: 'dark' })).newPage();

  const guest = await open();
  for (const path of ['/', '/login', '/register', '/hilfe', '/datenschutz', '/status', '/gibt-es-nicht']) await check(guest, path);

  const member = await open();
  await keyboardLogin(member, DEMO.lea);
  for (const path of ['/', `/listings/${listingId}`, '/listings/new', '/messages', `/messages/${conversationId}`, '/me/listings', '/profile', '/admin'])
    await check(member, path);

  const admin = await open();
  await keyboardLogin(admin, DEMO.admin);
  for (const path of ['/admin', '/moderation']) await check(admin, path);

  for (const p of [guest, member, admin]) await p.context().close();
  expect(findings).toEqual({});
});
