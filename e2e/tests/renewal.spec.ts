import { execFileSync } from 'node:child_process';
import { expect, test } from '@playwright/test';
import { activate, apiSession, createListing, DEMO, gotoTop, keyboardLogin } from './helpers';

/** Zeit vorstellen wie in tests/ops/retention-test.mjs: direkt in der Datenbank des Docker-Beispiels. */
function psql(query: string) {
  const project = process.env.E2E_COMPOSE_PROJECT ? ['-p', process.env.E2E_COMPOSE_PROJECT] : [];
  execFileSync('docker', ['compose', ...project, 'exec', '-T', 'db', 'psql', '-U', 'campusmarkt', '-d', 'campusmarkt', '-qAt', '-c', query], {
    stdio: 'pipe',
  });
}

test('[AT-LST-013-3] Erneuern in der Anzeige und Reaktivieren mit Löschdatum, per Tastatur; automatisch pausierte Anzeige für andere 404', async ({ page, request, baseURL }) => {
  const lea = await apiSession(request, baseURL!, DEMO.lea);
  const ben = await apiSession(request, baseURL!, DEMO.ben);
  const { id } = await createListing(lea, `Erneuerung E2E ${Date.now()}`);
  expect(id).toMatch(/^[0-9a-f-]{36}$/);

  // Tag 14: Hinweis gesetzt → Anbieterin sieht die Frist und erneuert per Tastatur
  psql(`UPDATE listings.listing SET expires_at = now() - interval '1 minute', reminder_sent_at = now() WHERE id = '${id}'`);
  await keyboardLogin(page, DEMO.lea);
  await gotoTop(page, `/listings/${id}`);
  await expect(page.getByText(/Bitte erneuere die Anzeige bis/)).toBeVisible();
  await activate(page, page.getByRole('button', { name: 'Erneuern (14 Tage)' }));
  await expect(page.getByText(/Bitte erneuere die Anzeige bis/)).toHaveCount(0);
  await expect(page.getByText(/Online bis/)).toBeVisible();

  // Tag 15: automatisch pausiert → für andere 404, beim Anbieter mit Löschdatum
  psql(`UPDATE listings.listing SET status = 'paused', paused_reason = 'auto', status_changed_at = now() WHERE id = '${id}'`);
  const foreign = await request.get(`/api/v1/listings/${id}`, { headers: { cookie: ben.cookie } });
  expect(foreign.status()).toBe(404);
  await page.goto('/me/listings');
  const card = page.getByRole('listitem').filter({ hasText: 'Erneuerung E2E' });
  await expect(card.getByText(/Wird am .* gelöscht/)).toBeVisible();
  await gotoTop(page, `/listings/${id}`);
  await expect(page.getByText(/Wird am .* gelöscht – reaktiviere sie/)).toBeVisible();
  await activate(page, page.getByRole('button', { name: 'Reaktivieren' }));
  await expect(page.getByText(/Online bis/)).toBeVisible();
  expect((await request.get(`/api/v1/listings/${id}`, { headers: { cookie: ben.cookie } })).status()).toBe(200);
});
