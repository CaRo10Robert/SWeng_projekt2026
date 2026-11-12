import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { apiSession, DEMO, keyboardLogin } from './helpers';

/**
 * Fehlerseiten im Browser (REQ-UX-009, ergänzt REQ-UX-003): 403 bei fehlender Rolle, 404 für unbekannte Anzeige und
 * Unterhaltung, 429 mit Wartezeit, Offline-Hinweis; einheitlicher Aufbau mit Fehlercode, Titel, Wegen zurück und
 * Seitenfuß, in beiden Sprachen und Schemata ohne Verstöße serious/critical.
 */

const UNKNOWN = '00000000-0000-4000-8000-000000000000';
const footerHelp = (page: Page) => page.getByRole('navigation', { name: 'Rechtliches und Hilfe' }).getByRole('link', { name: 'Hilfe', exact: true });

async function expectErrorPage(page: Page, title: string, code: string | null) {
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
  await expect(page).toHaveTitle(`${title} – CampusMarkt HWG LU`);
  if (code) await expect(page.getByText(`Fehlercode ${code}`)).toBeVisible();
  await expect(page.getByRole('main').getByRole('link', { name: 'Zur Startseite' })).toBeVisible();
  await expect(footerHelp(page)).toBeVisible();
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => v.id)).toEqual([]);
}

test('[AT-UX-009-4] Fehlende Rolle, unbekannte Anzeige und Unterhaltung: eigene Fehlerseiten statt stiller Weiterleitung', async ({ page }) => {
  await keyboardLogin(page, DEMO.lea);
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/admin$/);
  await expectErrorPage(page, 'Kein Zugriff', '403');
  await page.goto('/moderation');
  await expectErrorPage(page, 'Kein Zugriff', '403');

  await page.goto(`/listings/${UNKNOWN}`);
  await expectErrorPage(page, 'Anzeige nicht gefunden', '404');
  await page.goto(`/listings/${UNKNOWN}/edit`);
  await expectErrorPage(page, 'Anzeige nicht gefunden', '404');
  await page.goto(`/messages/${UNKNOWN}`);
  await expectErrorPage(page, 'Unterhaltung nicht gefunden', '404');
});

test('[AT-UX-009-4] 429 vom Server: Fehlerseite mit Wartezeit aus Retry-After, „Erneut versuchen“ lädt neu', async ({ page, request, baseURL }) => {
  const lea = await apiSession(request, baseURL!, DEMO.lea);
  const listingId = (await lea.call<{ items: { id: string }[] }>('GET', '/listings?q=Statistik')).items[0]!.id;
  await keyboardLogin(page, DEMO.lea);
  let limited = true;
  await page.route(`**/api/v1/listings/${listingId}`, (route) =>
    limited
      ? route.fulfill({
          status: 429,
          headers: { 'retry-after': '30', 'content-type': 'application/problem+json' },
          body: JSON.stringify({ code: 'rate_limited', status: 429, title: 'Zu viele Anfragen' }),
        })
      : route.continue(),
  );
  await page.goto(`/listings/${listingId}`);
  await expectErrorPage(page, 'Zu viele Anfragen', '429');
  await expect(page.getByText('Bitte versuche es in 30 Sekunden erneut.')).toBeVisible();
  limited = false;
  await page.getByRole('button', { name: 'Erneut versuchen' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Statistik');
});

test('[AT-UX-009-4] Verbindung weg: Offline-Hinweis im Seitenkopf, Netzfehler beim Laden ergibt die Offline-Seite', async ({ page, context, request, baseURL }) => {
  const lea = await apiSession(request, baseURL!, DEMO.lea);
  const listingId = (await lea.call<{ items: { id: string }[] }>('GET', '/listings?q=Statistik')).items[0]!.id;
  await keyboardLogin(page, DEMO.lea);
  await page.goto('/me/favorites');
  await context.setOffline(true);
  await expect(page.getByRole('status').filter({ hasText: 'Du bist offline' })).toBeVisible();
  await context.setOffline(false);
  await expect(page.getByText('Du bist offline')).toHaveCount(0);

  // Netzfehler genau einer Abfrage (z. B. Funkloch beim Öffnen einer Anzeige)
  await page.route(`**/api/v1/listings/${listingId}`, (route) => route.abort('internetdisconnected'));
  await page.goto(`/listings/${listingId}`);
  await expect(page.getByRole('heading', { level: 1, name: 'Keine Verbindung' })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole('button', { name: 'Erneut versuchen' })).toBeVisible();
});

test('[AT-UX-009-4] Fehlerseiten auf Englisch und im dunklen Schema; Seitenaufruf einer fehlenden .html-Datei ergibt 404 mit Seite', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'en-GB', colorScheme: 'dark' });
  const page = await context.newPage();
  const res = await page.goto('/gibt-es-nicht.html');
  expect(res?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
  await expect(page).toHaveTitle('Page not found – CampusMarkt HWG LU');
  await expect(page.getByText('Error code 404')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('html')).toHaveClass(/\bdark\b/);
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => v.id)).toEqual([]);
  await context.close();
});
