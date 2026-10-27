import { expect, test, type Page } from '@playwright/test';
import {
  activate,
  apiSession,
  createListing,
  DEMO,
  gotoTop,
  keyboardLogin,
  linkFrom,
  PNG,
  tabTo,
  typeInto,
  waitForMail,
} from './helpers';

/**
 * AT-A11Y-002 (REQ-A11Y-002, Fallstudie FS-C2): Die neun Kernabläufe sind ausschließlich mit der Tastatur
 * bedienbar; der Fokus ist an jedem Halt sichtbar. Keine Mausaktionen. Die Auswahl der Datei im Systemdialog
 * ist der manuelle Nachweis MAN-A11Y-002; hier wird nur die Upload-Schaltfläche per Tastatur ausgelöst.
 */
test.describe.configure({ mode: 'serial' });

const stamp = Date.now();
const newUser = { email: `e2e.${stamp}@studmail.hwg-lu.de`, password: 'tastatur-test-passwort-1', newPassword: 'tastatur-test-passwort-2' };

test('[AT-A11Y-002] Registrierung nur per Tastatur', async ({ page, request }) => {
  await gotoTop(page, '/register');
  await typeInto(page, page.getByLabel('Hochschul-E-Mail'), newUser.email);
  await typeInto(page, page.getByLabel('Anzeigename'), 'Tastatur-Test');
  await typeInto(page, page.locator('input[type="password"]'), newUser.password);
  await tabTo(page, page.getByRole('checkbox'));
  await page.keyboard.press('Space');
  await expect(page.getByRole('checkbox')).toBeChecked();
  await activate(page, page.getByRole('button', { name: 'Registrieren' }));
  await expect(page.getByRole('heading', { name: 'Fast geschafft' })).toBeVisible();

  const mail = await waitForMail(request, newUser.email, 'bestätige');
  await page.goto(linkFrom(mail.Text, '/verify'));
  await expect(page.getByRole('button', { name: 'Abmelden' }).or(page.getByRole('button', { name: 'Menü' }))).toBeVisible();
});

test('[AT-A11Y-002] Anmelden und Abmelden nur per Tastatur', async ({ page }) => {
  await keyboardLogin(page, DEMO.lea);
  await activate(page, page.getByRole('button', { name: 'Abmelden' }));
  await expect(page).toHaveURL(/\/login/);
});

test('[AT-A11Y-002] Passwort zurücksetzen nur per Tastatur', async ({ page, request }) => {
  await gotoTop(page, '/forgot-password');
  await typeInto(page, page.getByLabel('Hochschul-E-Mail'), newUser.email);
  await activate(page, page.getByRole('button', { name: 'Link anfordern' }));
  const mail = await waitForMail(request, newUser.email, 'Passwort');
  await gotoTop(page, linkFrom(mail.Text, '/reset-password'));
  await typeInto(page, page.getByLabel('Neues Passwort'), newUser.newPassword);
  await typeInto(page, page.getByLabel('Passwort wiederholen'), newUser.newPassword);
  await activate(page, page.getByRole('button', { name: /Passwort/ }));
  await expect(page.getByRole('heading', { name: 'Passwort geändert' })).toBeVisible();
  await keyboardLogin(page, newUser.email, newUser.newPassword);
});

test('[AT-A11Y-002] Suchen und filtern nur per Tastatur', async ({ page }) => {
  await keyboardLogin(page, DEMO.mia);
  await gotoTop(page, '/');
  await typeInto(page, page.getByRole('searchbox'), 'Statistik');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('link', { name: /Statistik-Buch/ }).first()).toBeVisible();
  // Filter „Art“ per Pfeiltaste ändern
  await tabTo(page, page.getByLabel('Art'));
  await page.keyboard.press('ArrowDown');
  await expect(page).toHaveURL(/kind=/);
  await tabTo(page, page.getByRole('link', { name: /Statistik-Buch/ }).first());
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1, name: /Statistik-Buch/ })).toBeVisible();
});

let createdId = '';

test('[AT-A11Y-002] Anzeige erstellen inklusive Bild nur per Tastatur', async ({ page }) => {
  await keyboardLogin(page, DEMO.lea);
  await gotoTop(page, '/listings/new');
  await typeInto(page, page.getByLabel('Titel'), `Tastatur-Lampe ${stamp}`);
  await typeInto(page, page.getByLabel('Beschreibung'), 'Schreibtischlampe, per Tastatur eingestellt.');
  await tabTo(page, page.getByLabel('Kategorie'));
  await page.keyboard.press('ArrowDown');
  await typeInto(page, page.getByLabel('Preis in €'), '7,50');
  await tabTo(page, page.getByRole('checkbox', { name: 'Ludwigshafen Hauptcampus' }));
  await page.keyboard.press('Space');
  await tabTo(page, page.getByRole('button', { name: 'Bilder hinzufügen' }));
  const chooser = page.waitForEvent('filechooser');
  await page.keyboard.press('Enter');
  await (await chooser).setFiles({ name: 'lampe.png', mimeType: 'image/png', buffer: PNG });
  await expect(page.getByRole('button', { name: 'Bild 1 entfernen' })).toBeVisible();
  await activate(page, page.getByRole('button', { name: 'Veröffentlichen' }));
  await expect(page).toHaveURL(/\/listings\/[0-9a-f-]{36}$/);
  createdId = page.url().split('/').pop()!;
  await expect(page.getByRole('heading', { level: 1, name: `Tastatur-Lampe ${stamp}` })).toBeVisible();
});

test('[AT-A11Y-002] Anzeige verwalten (pausieren, reaktivieren) nur per Tastatur', async ({ page, request, baseURL }) => {
  await keyboardLogin(page, DEMO.lea);
  await gotoTop(page, `/listings/${createdId}`);
  await activate(page, page.getByRole('button', { name: 'Pausieren' }));
  await expect(page.getByText('Pausiert').first()).toBeVisible();
  await activate(page, page.getByRole('button', { name: 'Reaktivieren' }));
  await expect(page.getByRole('button', { name: 'Pausieren' })).toBeVisible();
  // Aufräumen per API
  const lea = await apiSession(request, baseURL!, DEMO.lea);
  await lea.call('DELETE', `/listings/${createdId}`);
});

async function freshConversation(page: Page, request: Parameters<typeof apiSession>[0], baseURL: string, label: string) {
  const ben = await apiSession(request, baseURL, DEMO.ben);
  const listing = await createListing(ben, `${label} ${stamp}`);
  return { ben, listing };
}

test('[AT-A11Y-002] Nachricht senden nur per Tastatur', async ({ page, request, baseURL }) => {
  const { ben, listing } = await freshConversation(page, request, baseURL!, 'Tastatur-Chat');
  await keyboardLogin(page, DEMO.lea);
  await gotoTop(page, `/listings/${listing.id}`);
  await typeInto(page, page.getByLabel('Nachricht an den Anbieter'), 'Hallo, ist das noch da?');
  await activate(page, page.getByRole('button', { name: 'Nachricht schreiben' }));
  await expect(page).toHaveURL(/\/messages\//);
  await typeInto(page, page.getByLabel('Nachricht', { exact: true }), 'Zweite Nachricht per Tastatur');
  await page.keyboard.press('Enter');
  await expect(page.getByText('Zweite Nachricht per Tastatur')).toBeVisible();
  await ben.call('DELETE', `/listings/${listing.id}`);
});

test('[AT-A11Y-002] Melden nur per Tastatur', async ({ page, request, baseURL }) => {
  const { ben, listing } = await freshConversation(page, request, baseURL!, 'Tastatur-Meldung');
  await keyboardLogin(page, DEMO.lea);
  await gotoTop(page, `/listings/${listing.id}`);
  await activate(page, page.getByRole('button', { name: 'Melden', exact: true }));
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await tabTo(page, dialog.getByLabel('Grund'));
  await page.keyboard.press('ArrowDown');
  await typeInto(page, dialog.getByLabel('Details (optional)'), 'Test der Tastaturbedienung');
  await activate(page, dialog.getByRole('button', { name: 'Meldung senden' }));
  await expect(dialog.getByText(/Danke! Deine Meldung/)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await ben.call('DELETE', `/listings/${listing.id}`);
});

test('[AT-A11Y-002] Kontaktdaten freigeben nur per Tastatur (zwei Mitglieder)', async ({ browser, request, baseURL }) => {
  const ben = await apiSession(request, baseURL!, DEMO.ben);
  const lea = await apiSession(request, baseURL!, DEMO.lea);
  const listing = await createListing(ben, `Tastatur-Kontakt ${stamp}`);
  const { conversationId } = await lea.call<{ conversationId: string }>('POST', '/conversations', {
    listingId: listing.id,
    body: 'Können wir Kontaktdaten tauschen?',
    clientMsgId: crypto.randomUUID(),
  });

  const leaContext = await browser.newContext({ locale: 'de-DE' });
  const leaPage = await leaContext.newPage();
  await keyboardLogin(leaPage, DEMO.lea);
  await gotoTop(leaPage, `/messages/${conversationId}`);
  await activate(leaPage, leaPage.getByRole('button', { name: 'Kontaktdaten teilen' }));
  const dlg = leaPage.getByRole('dialog');
  await expect(dlg).toBeVisible();
  await activate(leaPage, dlg.getByRole('button', { name: 'Teilen' }));
  await expect(leaPage.getByRole('region', { name: 'Kontaktdaten' }).getByText(/Warte auf Zustimmung/).first()).toBeVisible();
  await expect(leaPage.getByRole('link', { name: DEMO.ben })).toHaveCount(0);
  // Die Schaltfläche verschwindet nach der Aktion; der Fokus darf nicht auf body zurückfallen (WCAG 2.4.3)
  await expect.poll(() => leaPage.evaluate(() => document.activeElement !== document.body)).toBe(true);

  const benContext = await browser.newContext({ locale: 'de-DE' });
  const benPage = await benContext.newPage();
  await keyboardLogin(benPage, DEMO.ben);
  await gotoTop(benPage, `/messages/${conversationId}`);
  await expect(benPage.getByRole('region', { name: 'Kontaktdaten' }).getByText(/möchte Kontaktdaten austauschen/).first()).toBeVisible();
  await activate(benPage, benPage.getByRole('button', { name: 'Zustimmen' }));
  await activate(benPage, benPage.getByRole('dialog').getByRole('button', { name: 'Zustimmen' }));
  await expect(benPage.getByRole('link', { name: DEMO.lea })).toBeVisible();
  await expect(leaPage.getByRole('link', { name: DEMO.ben })).toBeVisible();
  await expect.poll(() => benPage.evaluate(() => document.activeElement !== document.body)).toBe(true);

  await Promise.all([leaContext.close(), benContext.close()]);
  await ben.call('DELETE', `/listings/${listing.id}`);
});
