import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { apiSession, createListing, DEMO, keyboardLogin } from './helpers';

test('[AT-CHAT-003-2] Bei getrennter Echtzeitverbindung erscheint eine neue Nachricht durch Aktualisierung (Polling)', async ({ page, request, baseURL }) => {
  const ben = await apiSession(request, baseURL!, DEMO.ben);
  const lea = await apiSession(request, baseURL!, DEMO.lea);
  const listing = await createListing(ben, `Polling-Test ${Date.now()}`);
  const { conversationId } = await lea.call<{ conversationId: string }>('POST', '/conversations', {
    listingId: listing.id,
    body: 'Erste Nachricht vor der Trennung',
    clientMsgId: randomUUID(),
  });

  // Jede WebSocket-Verbindung wird sofort geschlossen: die App läuft im Degradationsmodus (ADR-0004)
  let attempts = 0;
  await page.routeWebSocket(/\/ws$/, (ws) => {
    attempts++;
    ws.close();
  });

  await keyboardLogin(page, DEMO.ben);
  await page.goto(`/messages/${conversationId}`);
  const history = page.getByRole('region', { name: 'Nachrichtenverlauf' });
  await expect(history.getByText('Erste Nachricht vor der Trennung')).toBeVisible();
  await expect(page.getByText(/Echtzeitverbindung getrennt/)).toBeVisible();

  // Lea schreibt, während Ben keine Echtzeitverbindung hat; ohne Neuladen muss die Nachricht per Polling erscheinen
  await lea.call('POST', `/conversations/${conversationId}/messages`, {
    body: 'Zweite Nachricht während der Trennung',
    clientMsgId: randomUUID(),
  });
  await expect(history.getByText('Zweite Nachricht während der Trennung')).toBeVisible({ timeout: 25_000 });
  expect(attempts).toBeGreaterThanOrEqual(1);

  await ben.call('DELETE', `/listings/${listing.id}`);
});
