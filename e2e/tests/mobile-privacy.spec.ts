import { expect, test } from '@playwright/test';
import { apiSession, DEMO, keyboardLogin, liveConversation, type Conversation } from './helpers';

test('[AT-UX-001] Kein horizontales Scrollen bei 360 px Breite', async ({ browser, request, baseURL }) => {
  const lea = await apiSession(request, baseURL!, DEMO.lea);
  const listingId = (await lea.call<{ items: { id: string }[] }>('GET', '/listings?q=Statistik')).items[0]!.id;
  const conversationId = liveConversation(await lea.call<Conversation[]>('GET', '/conversations')).id;

  const context = await browser.newContext({ viewport: { width: 360, height: 780 }, locale: 'de-DE' });
  const page = await context.newPage();
  await keyboardLogin(page, DEMO.lea);
  const overflow: string[] = [];
  for (const path of ['/', `/listings/${listingId}`, '/listings/new', `/messages/${conversationId}`]) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)) overflow.push(path);
  }
  await context.close();
  expect(overflow).toEqual([]);
});

test('[AT-PRIV-006] Keine Anfragen an fremde Hosts und nur das Sitzungs-Cookie', async ({ browser, baseURL, request }) => {
  const lea = await apiSession(request, baseURL!, DEMO.lea);
  const listingId = (await lea.call<{ items: { id: string }[] }>('GET', '/listings?q=Statistik')).items[0]!.id;

  const context = await browser.newContext({ locale: 'de-DE' });
  const page = await context.newPage();
  const origin = new URL(baseURL!).origin;
  const foreign = new Set<string>();
  page.on('request', (req) => {
    const url = req.url();
    if (!url.startsWith(origin) && !url.startsWith('data:') && !url.startsWith('blob:')) foreign.add(url);
  });

  await page.goto('/login');
  await keyboardLogin(page, DEMO.lea);
  for (const path of ['/', `/listings/${listingId}`, '/listings/new', '/messages', '/profile']) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
  }
  const cookies = (await context.cookies()).map((c) => c.name);
  await context.close();
  expect([...foreign]).toEqual([]);
  expect(cookies).toEqual(['cm_session']);
});
