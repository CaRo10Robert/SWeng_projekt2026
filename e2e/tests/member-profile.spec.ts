import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { activate, apiSession, DEMO, gotoTop, keyboardLogin, liveConversation, type Conversation } from './helpers';

type Meta = { locations: { id: string; name: string }[] };
type Listing = { id: string; owner: { id: string; displayName: string } };

test('[AT-ACC-005] Profil aus Anzeige (Maus und Tastatur) und Konversation öffnen, Angaben und aktive Anzeigen sichtbar, keine Kontaktdaten', async ({ page, request, baseURL }) => {
  // Ben pflegt Studiengang (Seed) und einen bevorzugten Übergabeort
  const ben = await apiSession(request, baseURL!, DEMO.ben);
  const meta = await ben.call<Meta>('GET', '/meta');
  const location = meta.locations[0]!;
  await ben.call('PATCH', '/me', { preferredLocationIds: [location.id] });

  const lea = await apiSession(request, baseURL!, DEMO.lea);
  const hit = (await lea.call<{ items: { id: string }[] }>('GET', '/listings?q=Statistik')).items[0]!;
  const listing = await lea.call<Listing>('GET', `/listings/${hit.id}`);
  const owner = listing.owner;
  const conversation = liveConversation(await lea.call<Conversation[]>('GET', '/conversations'));

  await keyboardLogin(page, DEMO.lea);

  // 1. Maus: Anbietername in der Anzeige
  await page.goto(`/listings/${listing.id}`);
  await page.getByRole('link', { name: owner.displayName }).click();
  await expect(page).toHaveURL(new RegExp(`/users/${owner.id}$`));
  await expect(page.getByRole('heading', { level: 1, name: owner.displayName })).toBeVisible();
  const main = page.getByRole('main');
  await expect(main).toContainText('Mitglied seit');
  await expect(main).toContainText(/Studierende|Beschäftigte/);
  await expect(main).toContainText(location.name);
  await expect(page.getByRole('heading', { name: 'Aktive Anzeigen' })).toBeVisible();
  await expect(main.getByRole('link').filter({ hasText: /Statistik/ }).first()).toBeVisible();
  await expect(page).toHaveTitle(new RegExp(owner.displayName));
  // Keine Kontaktdaten in der Seite
  expect(await page.content()).not.toMatch(/@(studmail\.)?hwg-lu\.de/);

  // Barrierefreiheit der neuen Seite (REQ-A11Y-001)
  await page.waitForLoadState('networkidle');
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => v.id)).toEqual([]);

  // 2. Tastatur: Link per Tab erreichen und mit Enter öffnen
  await gotoTop(page, `/listings/${listing.id}`);
  await activate(page, page.getByRole('link', { name: owner.displayName }));
  await expect(page).toHaveURL(new RegExp(`/users/${owner.id}$`));

  // 3. Konversation: Name im Kopf führt zum Profil des Gegenübers
  await page.goto(`/messages/${conversation.id}`);
  const header = page.getByRole('heading', { level: 1 }).getByRole('link');
  const counterpart = (await header.textContent())!.trim();
  await header.click();
  await expect(page).toHaveURL(/\/users\/[0-9a-f-]+$/);
  await expect(page.getByRole('heading', { level: 1, name: counterpart })).toBeVisible();
});
