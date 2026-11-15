import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { activate, apiSession, DEMO, gotoTop, keyboardLogin } from './helpers';

type Conversation = { id: string; role: 'buyer' | 'seller'; counterpart: { displayName: string }; listing: { title: string; status: string } };

test('[AT-NOTI-008-2] Zähler im Seitenkopf, „Neu“, Öffnen führt zum Ziel und senkt den Zähler, alle als gelesen – per Tastatur, ohne axe-Verstöße', async ({ page, request, baseURL }) => {
  // Ben (Anbieter) hebt die Reservierung für Lea auf und reserviert erneut: Lea hat beides nicht selbst ausgelöst
  const ben = await apiSession(request, baseURL!, DEMO.ben);
  // Bens reservierte Anzeige mit Lea als Käuferin (Seed: Statistik-Buch)
  const conv = (await ben.call<Conversation[]>('GET', '/conversations')).find(
    (c) => c.role === 'seller' && c.listing.status === 'reserved' && c.counterpart.displayName.startsWith('Lea'),
  )!;
  expect(conv, 'reservierte Konversation Ben → Lea im Seed').toBeDefined();
  await ben.call('POST', `/conversations/${conv.id}/deal`, { action: 'cancel' });
  await ben.call('POST', `/conversations/${conv.id}/deal`, { action: 'reserve' });
  const lea = await apiSession(request, baseURL!, DEMO.lea);
  const before = (await lea.call<{ count: number }>('GET', '/me/notifications/unread')).count;
  expect(before).toBeGreaterThanOrEqual(2);

  await keyboardLogin(page, DEMO.lea);
  await page.setViewportSize({ width: 1400, height: 900 });
  const navLink = page.getByRole('navigation', { name: /Hauptnavigation|Haupt/ }).getByRole('link', { name: /Benachrichtigungen/ });
  await expect(navLink).toContainText(String(before > 99 ? '99+' : before));
  await expect(navLink).toContainText('ungelesen'); // Screenreader-Text

  await gotoTop(page, '/');
  await activate(page, navLink);
  await expect(page).toHaveURL(/\/me\/notifications$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Benachrichtigungen' })).toBeVisible();
  const first = page.getByRole('listitem').filter({ hasText: 'für dich reserviert' }).first();
  await expect(first.getByText('Neu', { exact: true })).toBeVisible();

  await page.waitForLoadState('networkidle');
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => v.id)).toEqual([]);

  // Öffnen per Tastatur: führt zur Konversation und markiert als gelesen
  await activate(page, first.getByRole('button', { name: /für dich reserviert/ }));
  await expect(page).toHaveURL(new RegExp(`/messages/${conv.id}$`));
  await expect.poll(async () => (await lea.call<{ count: number }>('GET', '/me/notifications/unread')).count).toBe(before - 1);

  // Alle als gelesen
  await page.goto('/me/notifications');
  await activate(page, page.getByRole('button', { name: 'Alle als gelesen markieren' }));
  await expect(page.getByText('Alles gelesen.')).toBeVisible();
  await expect(page.getByText('Neu', { exact: true })).toHaveCount(0);
  await expect(navLink).not.toContainText('ungelesen');
});
