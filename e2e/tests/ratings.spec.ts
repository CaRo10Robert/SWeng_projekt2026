import { randomUUID } from 'node:crypto';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { activate, apiSession, createListing, DEMO, gotoTop, keyboardLogin, typeInto } from './helpers';

test('[AT-MOD-006] Bewertung im Chat per Tastatur abgeben; nach beiden Bewertungen im Profil getrennt nach Rolle sichtbar', async ({ page, request, baseURL }) => {
  const stamp = Date.now();
  const ben = await apiSession(request, baseURL!, DEMO.ben);
  const lea = await apiSession(request, baseURL!, DEMO.lea);
  const listing = await createListing(ben, `Bewertung E2E ${stamp}`);
  const { conversationId } = await lea.call<{ conversationId: string }>('POST', '/conversations', {
    listingId: listing.id, body: 'Ich nehme es gern.', clientMsgId: randomUUID(),
  });
  const deal = await ben.call<{ id: string }>('POST', `/conversations/${conversationId}/deal`, { action: 'complete' });

  await keyboardLogin(page, DEMO.lea);
  await gotoTop(page, `/messages/${conversationId}`);
  const box = page.getByRole('region', { name: /bewerten/ });
  await expect(box).toBeVisible();
  await page.waitForLoadState('networkidle');
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => v.id)).toEqual([]);
  await activate(page, box.getByRole('radio', { name: 'Positiv' }), 'Space');
  await typeInto(page, box.getByLabel(/Kommentar/), `Pünktlich und wie beschrieben ${stamp}`);
  await activate(page, box.getByRole('button', { name: 'Bewertung abgeben' }));
  await expect(box.getByText(/bleibt verdeckt/)).toBeVisible();

  // Ben bewertet ebenfalls → beide Bewertungen werden sichtbar
  await ben.call('POST', `/deals/${deal.id}/rating`, { score: 'positive' });
  const benId = (await lea.call<{ owner: { id: string } }>('GET', `/listings/${listing.id}`)).owner.id;
  await gotoTop(page, `/users/${benId}`);
  const ratings = page.getByRole('region', { name: 'Bewertungen' });
  await expect(ratings.getByRole('heading', { name: 'Als Verkäufer' })).toBeVisible();
  await expect(ratings.getByRole('heading', { name: 'Als Käufer' })).toBeVisible();
  await expect(ratings.getByText(`Pünktlich und wie beschrieben ${stamp}`)).toBeVisible();
  await expect(ratings.getByText(`„Bewertung E2E ${stamp}“`, { exact: false })).toBeVisible();
});
