import { expect, test } from '@playwright/test';
import { apiSession, DEMO, keyboardLogin, liveConversation, type Conversation } from './helpers';

test('[AT-UX-001] Kein horizontales Scrollen bei 360 px Breite', async ({ browser, request, baseURL }) => {
  const lea = await apiSession(request, baseURL!, DEMO.lea);
  const listingId = (await lea.call<{ items: { id: string }[] }>('GET', '/listings?q=Statistik')).items[0]!.id;
  const conversationId = liveConversation(await lea.call<Conversation[]>('GET', '/conversations')).id;

  const context = await browser.newContext({ viewport: { width: 360, height: 780 }, locale: 'de-DE' });
  const page = await context.newPage();
  const overflow: string[] = [];
  // Gastseiten mit Sprach- und Farbschema-Wahl im Seitenkopf (REQ-UX-008, REQ-UX-010)
  for (const path of ['/', '/login', '/register', '/hilfe', '/gibt-es-nicht']) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)) overflow.push(path);
  }
  await keyboardLogin(page, DEMO.lea);
  for (const path of ['/', `/listings/${listingId}`, '/listings/new', `/messages/${conversationId}`, '/admin']) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)) overflow.push(path);
  }
  await context.close();
  expect(overflow).toEqual([]);
});

test('[AT-UX-001-2] Installierbar: Manifest verlinkt, Service Worker registriert und aktiv, App-Shell offline verfügbar', async ({ browser, request }) => {
  const context = await browser.newContext({ viewport: { width: 360, height: 780 }, locale: 'de-DE' });
  const page = await context.newPage();
  await page.goto('/');

  // Installierbarkeitskriterien: Manifest mit Name, Start-URL, Anzeige „standalone“ und Icons ≥ 192 und 512 px
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(href).toBeTruthy();
  const res = await request.get(href!);
  expect(res.status()).toBe(200);
  const manifest = (await res.json()) as { name?: string; short_name?: string; start_url?: string; display?: string; icons: { src: string; sizes: string }[] };
  expect(manifest.name ?? manifest.short_name).toBeTruthy();
  expect(manifest).toMatchObject({ start_url: '/', display: 'standalone' });
  for (const size of ['192x192', '512x512']) {
    const icon = manifest.icons.find((i) => i.sizes === size);
    expect(icon, `Icon ${size}`).toBeDefined();
    expect((await request.get(new URL(icon!.src, new URL(href!, page.url())).href)).status(), `Icon ${size} abrufbar`).toBe(200);
  }

  // Service Worker: registriert, aktiv und für die ganze App zuständig
  const sw = await page.evaluate(async () => {
    const reg = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 15_000)),
    ]);
    if (!reg?.active) return null;
    // `ready` liefert den Worker schon während „activating“; auf den Abschluss warten
    const worker = reg.active;
    if (worker.state !== 'activated') {
      await Promise.race([
        new Promise<void>((resolve) => worker.addEventListener('statechange', () => worker.state === 'activated' && resolve())),
        new Promise<void>((resolve) => setTimeout(resolve, 15_000)),
      ]);
    }
    return { scope: reg.scope, state: worker.state };
  });
  expect(sw, 'Service Worker registriert').not.toBeNull();
  expect(sw!.state).toBe('activated');
  expect(new URL(sw!.scope).pathname).toBe('/');

  // Offline oder schwaches Netz: App-Shell kommt aus dem Cache statt einer leeren Seite (Fehler- und Missbrauchsfälle REQ-UX-001)
  await page.reload();
  await page.waitForLoadState('networkidle');
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('body')).not.toBeEmpty();
  await expect(page.getByRole('banner')).toBeVisible();
  await context.close();
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
