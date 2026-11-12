import { expect, test, type Page } from '@playwright/test';
import { apiSession, DEMO, keyboardLogin, liveConversation, type Conversation } from './helpers';

/**
 * Website-Hygiene (REQ-UX-010): Icon-Satz und Manifest, Metadaten im Kopf, keine Indexierung, eindeutiger Seitentitel
 * je Seite, `lang` folgt der Sprache, keine Konsolenfehler – ohne externe Ressourcen (ADR-0010).
 */

const APP = 'CampusMarkt HWG LU';

test('[AT-UX-010] Icon-Satz, Manifest mit Farben und Icons, Metadaten und noindex', async ({ page, request }) => {
  for (const [path, type] of [
    ['/favicon.ico', /image\/(x-icon|vnd\.microsoft\.icon)/],
    ['/icon.svg', /image\/svg\+xml/],
    ['/apple-touch-icon.png', /image\/png/],
    ['/icon-192.png', /image\/png/],
    ['/icon-512.png', /image\/png/],
    ['/icon-maskable-512.png', /image\/png/],
  ] as const) {
    const res = await request.get(path);
    expect(res.status(), path).toBe(200);
    expect(res.headers()['content-type'], path).toMatch(type);
  }

  const manifest = (await (await request.get('/manifest.webmanifest')).json()) as {
    name: string; short_name: string; lang: string; start_url: string; display: string; theme_color: string; background_color: string;
    icons: { src: string; sizes: string; purpose?: string }[];
  };
  expect(manifest).toMatchObject({ short_name: 'CampusMarkt', lang: 'de', start_url: '/', display: 'standalone' });
  expect(manifest.theme_color).toMatch(/^#[0-9a-f]{6}$/i);
  expect(manifest.background_color).toMatch(/^#[0-9a-f]{6}$/i);
  for (const size of ['192x192', '512x512']) expect(manifest.icons.some((i) => i.sizes === size && i.purpose !== 'maskable'), size).toBe(true);
  expect(manifest.icons.some((i) => i.purpose === 'maskable')).toBe(true);

  const res = await page.goto('/');
  expect(res?.headers()['x-robots-tag']).toBe('noindex, nofollow');
  const head = page.locator('head');
  await expect(head.locator('meta[name="description"]')).toHaveAttribute('content', /CampusMarkt/);
  await expect(head.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  await expect(head.locator('meta[name="color-scheme"]')).toHaveAttribute('content', 'light dark');
  await expect(head.locator('meta[name="theme-color"][media*="light"]')).toHaveCount(1);
  await expect(head.locator('meta[name="theme-color"][media*="dark"]')).toHaveCount(1);
  await expect(head.locator('link[rel="icon"][href="/favicon.ico"]')).toHaveCount(1);
  await expect(head.locator('link[rel="icon"][type="image/svg+xml"]')).toHaveCount(1);
  await expect(head.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
  await expect(head.locator('link[rel="manifest"]')).toHaveCount(1);
  expect(await (await request.get('/robots.txt')).text()).toContain('Disallow: /');
});

/** Sammelt Konsolenfehler und unbehandelte Ausnahmen; Netzwerkmeldungen zu erwarteten Statuscodes (401, 404) zählen nicht. */
function watchConsole(page: Page, errors: string[]) {
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !msg.text().startsWith('Failed to load resource')) errors.push(`${page.url()}: ${msg.text()}`);
  });
  page.on('pageerror', (err) => errors.push(`${page.url()}: ${err.message}`));
}

test('[AT-UX-010] Jede Seite hat einen eigenen Titel, lang folgt der Sprache, keine Konsolenfehler (hell und dunkel)', async ({ browser, request, baseURL }) => {
  const lea = await apiSession(request, baseURL!, DEMO.lea);
  const listingId = (await lea.call<{ items: { id: string }[] }>('GET', '/listings?q=Statistik')).items[0]!.id;
  const conversationId = liveConversation(await lea.call<Conversation[]>('GET', '/conversations')).id;
  const errors: string[] = [];
  const titles = new Map<string, string>();

  for (const colorScheme of ['light', 'dark'] as const) {
    const visit = async (page: Page, path: string, who: string) => {
      await page.goto(path);
      await expect(page.getByRole('main')).not.toBeEmpty();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveTitle(new RegExp(`. – ${APP}$`));
      titles.set(`${who} ${path}`, await page.title());
    };
    const guestContext = await browser.newContext({ locale: 'de-DE', colorScheme });
    const guest = await guestContext.newPage();
    watchConsole(guest, errors);
    for (const path of ['/', '/login', '/register', '/forgot-password', '/hilfe', '/impressum', '/datenschutz', '/status', '/gibt-es-nicht'])
      await visit(guest, path, 'Gast');
    await expect(guest.locator('html')).toHaveAttribute('lang', 'de');
    await guestContext.close();

    const memberContext = await browser.newContext({ locale: 'de-DE', colorScheme });
    const member = await memberContext.newPage();
    watchConsole(member, errors);
    await keyboardLogin(member, DEMO.lea);
    for (const path of ['/', `/listings/${listingId}`, '/listings/new', '/messages', `/messages/${conversationId}`, '/me/listings', '/me/favorites', '/me/notices', '/profile', '/admin'])
      await visit(member, path, 'Mitglied');
    await memberContext.close();

    const adminContext = await browser.newContext({ locale: 'de-DE', colorScheme });
    const admin = await adminContext.newPage();
    watchConsole(admin, errors);
    await keyboardLogin(admin, DEMO.admin);
    for (const path of ['/admin', '/moderation']) await visit(admin, path, 'Admin');
    await adminContext.close();
  }

  // Eindeutig: verschiedene Seiten tragen verschiedene Titel (gleiche Seite für Gast/Mitglied/Admin zählt einmal)
  const byTitle = new Map<string, string[]>();
  for (const [page, title] of titles) byTitle.set(title, [...(byTitle.get(title) ?? []), page]);
  const duplicates = [...byTitle.entries()].filter(([, pages]) => new Set(pages.map((p) => p.split(' ')[1])).size > 1);
  expect(duplicates).toEqual([]);
  expect(errors).toEqual([]);

  // Englisch: lang und Titel folgen der Sprache
  const en = await browser.newContext({ locale: 'en-GB' });
  const page = await en.newPage();
  await page.goto('/login');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page).toHaveTitle(`Log in – ${APP}`);
  await en.close();
});
