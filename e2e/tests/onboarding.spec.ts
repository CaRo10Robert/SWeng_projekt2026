import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { activate, createListing, gotoTop, keyboardLogin, linkFrom, typeInto, waitForMail } from './helpers';

test('[AT-UX-011] Erste Schritte: neues Mitglied sieht sie, Ausblenden wirkt kontoweit, Wiederaufruf über die Hilfe, Schritte per Tastatur, kein Browser-Speicher', async ({ browser, request, baseURL }) => {
  const email = `neu.${Date.now()}@studmail.hwg-lu.de`;
  const password = 'Erste-Schritte-2026!';
  const meta = (await (await request.get('/api/v1/meta')).json()) as { termsVersion: string };
  const reg = await request.post('/api/v1/auth/register', {
    headers: { 'x-campusmarkt-csrf': '1' },
    data: { email, password, displayName: 'Neu', acceptTerms: true, termsVersion: meta.termsVersion },
  });
  expect(reg.status()).toBe(202);
  const verify = await waitForMail(request, email, 'bestätige');
  const token = new URLSearchParams(linkFrom(verify.Text, '/verify').split('?')[1]).get('token');
  expect((await request.post('/api/v1/auth/verify', { headers: { 'x-campusmarkt-csrf': '1' }, data: { token } })).status()).toBeLessThan(300);

  // 1. Erste Anmeldung: Bereich mit drei Schritten, barrierefrei
  const first = await browser.newContext({ locale: 'de-DE' });
  const page = await first.newPage();
  await keyboardLogin(page, email, password);
  const panel = page.getByRole('region', { name: 'Erste Schritte' });
  await expect(panel).toBeVisible();
  await expect(panel.getByRole('listitem')).toHaveCount(3);
  await page.waitForLoadState('networkidle');
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => v.id)).toEqual([]);

  // 2. Ausblenden per Tastatur wirkt auch in einer zweiten Sitzung (Zustand im Konto)
  await gotoTop(page, '/');
  await activate(page, panel.getByRole('button', { name: 'Ausblenden' }));
  await expect(panel).toHaveCount(0);
  expect(await page.evaluate(() => Object.keys(localStorage).filter((k) => !['cm_theme', 'cm_locale'].includes(k)))).toEqual([]);
  const second = await browser.newContext({ locale: 'de-DE' });
  const page2 = await second.newPage();
  await keyboardLogin(page2, email, password);
  await expect(page2.getByRole('region', { name: 'Erste Schritte' })).toHaveCount(0);

  // 3. Wiederaufruf über die Hilfe; das Öffnen der Hilfe zählt als „Sicherheitstipps gelesen“
  await gotoTop(page2, '/hilfe');
  await activate(page2, page2.getByRole('button', { name: 'Erste Schritte anzeigen' }));
  await expect(page2.getByText('Die ersten Schritte erscheinen wieder')).toBeVisible();
  await gotoTop(page2, '/');
  const panel2 = page2.getByRole('region', { name: 'Erste Schritte' });
  await expect(panel2.getByRole('listitem').filter({ hasText: 'Sicherheitstipps lesen' })).toContainText('erledigt');

  // 4. Profil ergänzen per Tastatur
  await activate(page2, panel2.getByRole('link', { name: 'Profil ergänzen' }));
  await typeInto(page2, page2.getByLabel(/Studiengang/), 'Wirtschaftsinformatik');
  await activate(page2, page2.getByRole('button', { name: 'Speichern' }).first());
  await expect(page2.getByText('Gespeichert.')).toBeVisible();
  await gotoTop(page2, '/');
  await expect(panel2.getByRole('listitem').filter({ hasText: 'Profil ergänzen' })).toContainText('erledigt');

  // 5. Erste Anzeige → alle Schritte erledigt, der Bereich verschwindet
  const session = { cookie: '', call: async <T,>(method: string, path: string, data?: unknown): Promise<T> => {
    const res = await page2.request.fetch(`/api/v1${path}`, { method, data, headers: { 'x-campusmarkt-csrf': '1' } });
    return (await res.json()) as T;
  } };
  await createListing(session, 'Meine erste Anzeige');
  await page2.reload();
  await expect(page2.getByRole('heading', { name: 'Erste Schritte' })).toHaveCount(0);
  expect(baseURL).toBeTruthy();
  await first.close();
  await second.close();
});
