import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { activate, apiSession, createListing, DEMO, gotoTop, keyboardLogin, typeInto } from './helpers';

async function axeSerious(page: Page) {
  await page.waitForLoadState('networkidle');
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  return result.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => v.id);
}

test('[AT-CHAT-009-3] „Nehm ich“ und „Angebot senden“ in der Anzeige, Kaufangebot beim Anbieter, Akzeptieren und Gegenangebot per Tastatur', async ({ browser, request, baseURL }) => {
  const stamp = Date.now();
  const ben = await apiSession(request, baseURL!, DEMO.ben);
  const fixed = await createListing(ben, `Festpreis E2E ${stamp}`);
  const meta = await ben.call<{ categories: { id: string }[]; locations: { id: string }[] }>('GET', '/meta');
  const vb = await ben.call<{ id: string }>('POST', '/listings', {
    kind: 'offer', title: `VB E2E ${stamp}`, description: 'Testanzeige mit Verhandlungsbasis.', categoryId: meta.categories[0]!.id,
    priceType: 'negotiable', priceCents: 2_000, locationIds: [meta.locations[0]!.id],
  });

  // Lea: „Nehm ich“ per Tastatur mit Bestätigung
  const leaContext = await browser.newContext({ locale: 'de-DE' });
  const leaPage = await leaContext.newPage();
  await keyboardLogin(leaPage, DEMO.lea);
  await gotoTop(leaPage, `/listings/${fixed.id}`);
  expect(await axeSerious(leaPage)).toEqual([]);
  await activate(leaPage, leaPage.getByRole('button', { name: 'Nehm ich' }));
  await activate(leaPage, leaPage.getByRole('dialog').getByRole('button', { name: 'Kaufangebot senden' }));
  await expect(leaPage).toHaveURL(/\/messages\/[0-9a-f-]+$/);
  const fixedConversation = leaPage.url().split('/').at(-1)!;
  await expect(leaPage.getByRole('region', { name: 'Kaufangebot' }).getByText('offen')).toBeVisible();

  // Lea: Preisangebot bei VB
  await gotoTop(leaPage, `/listings/${vb.id}`);
  await typeInto(leaPage, leaPage.getByLabel('Dein Angebot (€)'), '15,50');
  await activate(leaPage, leaPage.getByRole('button', { name: 'Angebot senden' }));
  await expect(leaPage).toHaveURL(/\/messages\/[0-9a-f-]+$/);
  const vbConversation = leaPage.url().split('/').at(-1)!;
  await expect(leaPage.getByRole('region', { name: 'Kaufangebot' })).toContainText('15,50');

  // Ben: Gegenangebot per Tastatur auf das VB-Angebot
  const benContext = await browser.newContext({ locale: 'de-DE' });
  const benPage = await benContext.newPage();
  await keyboardLogin(benPage, DEMO.ben);
  await gotoTop(benPage, `/messages/${vbConversation}`);
  const leaOffer = benPage.getByRole('region', { name: 'Kaufangebot' });
  await expect(leaOffer.getByRole('button', { name: 'Akzeptieren' })).toBeVisible();
  expect(await axeSerious(benPage)).toEqual([]);
  await activate(benPage, leaOffer.getByRole('button', { name: 'Gegenangebot' }));
  await typeInto(benPage, benPage.getByLabel('Dein Gegenangebot (€)'), '18');
  await activate(benPage, benPage.getByRole('button', { name: 'Gegenangebot senden' }));
  await expect(benPage.getByRole('region', { name: 'Gegenangebot' })).toContainText('18,00');
  await expect(leaOffer.getByText('beantwortet')).toBeVisible();

  // Ben: Festpreis-Angebot per Tastatur akzeptieren → reserviert für Lea
  await gotoTop(benPage, `/messages/${fixedConversation}`);
  await activate(benPage, benPage.getByRole('region', { name: 'Kaufangebot' }).getByRole('button', { name: 'Akzeptieren' }));
  await expect(benPage.getByRole('region', { name: 'Kaufangebot' }).getByText('angenommen')).toBeVisible();
  const listing = await ben.call<{ status: string }>('GET', `/listings/${fixed.id}`);
  expect(listing.status).toBe('reserved');

  // Lea sieht das Gegenangebot und kann es annehmen
  const lea = await apiSession(request, baseURL!, DEMO.lea);
  const unread = await lea.call<{ items: { kind: string }[] }>('GET', '/me/notifications');
  expect(unread.items.map((n) => n.kind)).toEqual(expect.arrayContaining(['offer_accepted', 'offer_countered']));
  await leaContext.close();
  await benContext.close();
});
