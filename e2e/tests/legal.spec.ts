import AxeBuilder from '@axe-core/playwright';
import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { activate, apiSession, createListing, DEMO, gotoTop, keyboardLogin, typeInto } from './helpers';

/**
 * Rechtsseiten, Startseite, Hilfe, Fehlerseiten und Speicher auf dem Endgerät
 * (REQ-LEGAL-001…005, REQ-LEGAL-010, REQ-UX-003…006, REQ-OPS-007). Die Inhalte sind Muster mit Platzhaltern (Q-23).
 */

const footerLinkNames = ['Impressum', 'Datenschutz', 'Nutzungsbedingungen', 'Barrierefreiheit', 'Kontakt', 'Hilfe'];
const footer = (page: Page) => page.getByRole('navigation', { name: 'Rechtliches und Hilfe' });

async function expectHeadings(page: Page, names: (string | RegExp)[]) {
  for (const name of names) await expect(page.getByRole('heading', { name }).first(), String(name)).toBeVisible();
}

const SAMPLE_NOTE = 'Muster im Rahmen einer Übungsaufgabe';

/** Text eines Abschnitts von seiner Überschrift bis zur nächsten gleichrangigen Überschrift. */
const sectionText = (page: Page, id: string) =>
  page.evaluate((headingId) => {
    const start = document.getElementById(headingId);
    let text = '';
    for (let el = start?.nextElementSibling; el && el.tagName !== start?.tagName; el = el.nextElementSibling) text += ' ' + (el.textContent ?? '');
    return text;
  }, id);

test('[AT-LEGAL-001] Impressum ohne Anmeldung aus dem Seitenfuß, Direktaufruf 200, Pflichtabschnitte und Muster-Hinweis', async ({ page, request }) => {
  await gotoTop(page, '/');
  await activate(page, footer(page).getByRole('link', { name: 'Impressum' }));
  await expect(page).toHaveURL(/\/impressum$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Impressum' })).toBeVisible();
  await expectHeadings(page, [
    'Anbieter',
    'Vertretungsberechtigt',
    'Kontakt',
    'Zuständige Aufsichtsbehörde',
    'Umsatzsteuer-Identifikationsnummer',
    'Inhaltlich verantwortlich',
    /Zentrale Kontaktstelle/,
  ]);
  await expect(page.getByRole('main').getByText(SAMPLE_NOTE)).toBeVisible();
  expect((await request.get('/impressum')).status()).toBe(200);
});

test('[AT-LEGAL-002] Datenschutzerklärung aus der Registrierung verlinkt, Abschnitte und Version', async ({ page }) => {
  await page.goto('/register');
  const link = page.getByRole('link', { name: /Datenschutzhinweis/ });
  await expect(link).toHaveAttribute('href', '/datenschutz');
  await expect(link).toHaveAttribute('target', '_blank');
  await page.goto('/datenschutz');
  await expect(page.getByRole('heading', { level: 1, name: 'Datenschutzerklärung' })).toBeVisible();
  await expectHeadings(page, [
    /^1\. Verantwortlicher/,
    /^2\. Datenschutzbeauftragte/,
    /^3\. Grundsätze/,
    /^4\. Verarbeitungen im Einzelnen/,
    /^5\. Empfänger/,
    /^6\. Übermittlung in Drittländer/,
    /^7\. Pflicht zur Bereitstellung/,
    /^8\. Automatisierte Entscheidungen/,
    /^9\. Cookies und lokale Speicherung/,
    /^10\. Ihre Rechte/,
    /^11\. Beschwerderecht/,
    /^12\. Änderungen/,
  ]);
  await expect(page.getByText(/^Version \d{4}-\d{2}/)).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Inhaltsverzeichnis' })).toBeVisible();
});

test('[AT-LEGAL-003] Nutzungsbedingungen und Community-Regeln ohne Anmeldung, Version, aus der Registrierung verlinkt', async ({ page, request }) => {
  const meta = (await (await request.get('/api/v1/meta')).json()) as { termsVersion: string };
  await page.goto('/register');
  await expect(page.getByRole('link', { name: /Nutzungsbedingungen/ }).first()).toHaveAttribute('href', '/nutzungsbedingungen');
  await page.goto('/nutzungsbedingungen');
  await expect(page.getByRole('heading', { level: 1, name: 'Nutzungsbedingungen' })).toBeVisible();
  // Die angezeigte Version ist die, der bei der Registrierung zugestimmt wird (eine Quelle, ADR-0015)
  await expect(page.getByText(`Version ${meta.termsVersion}`)).toBeVisible();
  await expectHeadings(page, [/Melden, Moderation und Widerspruch/, /Änderungen dieser Bedingungen/]);
  await page.goto('/community-regeln');
  await expect(page.getByRole('heading', { level: 1, name: 'Community-Regeln' })).toBeVisible();
  await expectHeadings(page, ['Verbotene Artikel und Inhalte', 'Fair kommunizieren', 'Sicher übergeben']);
});

test('[AT-LEGAL-003-2] Mitglied mit alter Zustimmung sieht den Dialog zu neuen Nutzungsbedingungen', async ({ browser }) => {
  // Tim hat im Seed einer älteren Fassung zugestimmt. Nicht zustimmen: der Smoke-Test prüft danach AT-LEGAL-003-2.
  const context = await browser.newContext({ locale: 'de-DE' });
  const page = await context.newPage();
  await keyboardLogin(page, DEMO.tim);
  const dialog = page.getByRole('dialog', { name: 'Neue Nutzungsbedingungen' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('link', { name: /Nutzungsbedingungen lesen/ })).toHaveAttribute('target', '_blank');
  await expect(dialog.getByRole('button', { name: 'Zustimmen' })).toBeVisible();
  await activate(page, dialog.getByRole('button', { name: 'Später' }));
  await expect(dialog).toBeHidden();
  await context.close();
});

// RV-R-08: neue Fassung der Datenschutzerklärung → Hinweis (keine Einwilligung); „zur Kenntnis genommen“ speichert die Version
test('[AT-LEGAL-002-3] Neue Fassung der Datenschutzerklärung: Hinweis mit Link, Kenntnisnahme per Tastatur wird im Konto gespeichert', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'de-DE' });
  const page = await context.newPage();
  await keyboardLogin(page, DEMO.tim);
  // Der Dialog zu den Nutzungsbedingungen liegt darüber; erst schließen
  const terms = page.getByRole('dialog', { name: 'Neue Nutzungsbedingungen' });
  if (await terms.isVisible()) await activate(page, terms.getByRole('button', { name: 'Später' }));
  const banner = page.getByRole('region', { name: 'Neue Fassung der Datenschutzerklärung' });
  await expect(banner).toBeVisible();
  await expect(banner.getByRole('link', { name: 'Datenschutzerklärung lesen' })).toHaveAttribute('href', '/datenschutz');
  await activate(page, banner.getByRole('button', { name: 'Zur Kenntnis genommen' }));
  await expect(banner).toBeHidden();
  const me = await (await page.request.get('/api/v1/me')).json();
  expect(me.privacyNoticeVersion).toBeNull();
  await page.reload();
  await expect(page.getByRole('region', { name: 'Neue Fassung der Datenschutzerklärung' })).toHaveCount(0);
  await context.close();
});

test('[AT-LEGAL-004] Erklärung zur Barrierefreiheit per Tastatur aus dem Seitenfuß, 5 Abschnitte, Kontakt', async ({ page }) => {
  for (const start of ['/login', '/hilfe']) {
    await gotoTop(page, start);
    await activate(page, footer(page).getByRole('link', { name: 'Barrierefreiheit' }));
    await expect(page).toHaveURL(/\/barrierefreiheit$/);
  }
  await expect(page.getByRole('heading', { level: 1, name: 'Erklärung zur Barrierefreiheit' })).toBeVisible();
  await expectHeadings(page, [
    'Stand der Vereinbarkeit',
    'Bekannte Einschränkungen',
    'Erstellung dieser Erklärung',
    /Barrieren melden/,
    'Durchsetzungsverfahren',
  ]);
  // Kontaktmöglichkeit im Abschnitt „Barrieren melden“ (E-Mail-Adresse bzw. Platzhalter dafür)
  expect(await sectionText(page, 'barrieren-melden-feedback-und-kontakt')).toMatch(/@|Platzhalter: .*E-Mail/);
});

test('[AT-LEGAL-005] Kontaktseite ohne Anmeldung mit allen Anliegen', async ({ page }) => {
  await page.goto('/kontakt');
  await expect(page.getByRole('heading', { level: 1, name: 'Kontakt' })).toBeVisible();
  await expectHeadings(page, [
    /Zentrale Kontaktstelle/,
    'Hilfe zur Nutzung',
    'Inhalte melden',
    'Datenschutz',
    'Barrierefreiheit',
    'Sicherheitslücken',
    'Behörden',
  ]);
});

test('[AT-UX-003] Unbekannte Seite: 404 mit „Seite nicht gefunden“ und Links; unbekannte API: JSON-404', async ({ page, request }) => {
  const res = await page.goto('/gibt-es-nicht-' + Date.now());
  expect(res?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1, name: 'Seite nicht gefunden' })).toBeVisible();
  const main = page.getByRole('main');
  for (const name of ['Zur Startseite', 'Hilfe und häufige Fragen', 'Kontakt']) await expect(main.getByRole('link', { name })).toBeVisible();
  await expect(footer(page).getByRole('link', { name: 'Impressum' })).toBeVisible();

  const api = await request.get('/api/v1/gibt-es-nicht');
  expect(api.status()).toBe(404);
  expect(api.headers()['content-type']).toContain('json');
});

test('[AT-UX-004] Startseite für Gäste mit Zugangsregel, drei Schritten und Aktionen; Mitglied sieht die Suche', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Campus');
  await expect(page.getByText(/Nur für Hochschulangehörige/)).toBeVisible();
  await expect(page.getByText('@studmail.hwg-lu.de')).toBeVisible();
  await expect(page.getByRole('region', { name: 'So funktioniert es' }).getByRole('listitem')).toHaveCount(3);
  const main = page.getByRole('main');
  await expect(main.getByRole('link', { name: 'Registrieren' })).toBeVisible();
  await expect(main.getByRole('link', { name: 'Anmelden' })).toBeVisible();
  await expect(page.locator('img[src*="/media/"]')).toHaveCount(0);
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => v.id)).toEqual([]);

  await keyboardLogin(page, DEMO.lea);
  await page.goto('/');
  await expect(page.getByRole('search')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'So funktioniert es' })).toHaveCount(0);
});

test('[AT-UX-005] Hilfe ohne Anmeldung mit allen Themen; Sicherheitshinweis im Chat führt zu „Betrugsmaschen“', async ({ page, request, baseURL }) => {
  await page.goto('/hilfe');
  await expect(page.getByRole('heading', { level: 1, name: /Hilfe/ })).toBeVisible();
  await expectHeadings(page, [
    'Registrieren und Anmelden',
    'Wie erstelle ich eine Anzeige?',
    'Sehen andere meine E-Mail-Adresse?',
    'Wie übergebe ich sicher?',
    'Welche Betrugsmaschen gibt es?',
    'Melden und Widerspruch',
    'Ihre Daten',
    /Barriere/,
  ]);
  await expect(page.getByRole('navigation', { name: 'Inhaltsverzeichnis' })).toBeVisible();

  // Ben schreibt Lea mit Link und IBAN → Sicherheitshinweis (REQ-CHAT-006) mit Verweis auf die Hilfe
  const ben = await apiSession(request, baseURL!, DEMO.ben);
  const lea = await apiSession(request, baseURL!, DEMO.lea);
  const listing = await createListing(lea, `Hilfe-Test ${Date.now()}`);
  const started = await ben.call<{ conversationId: string }>('POST', '/conversations', {
    listingId: listing.id,
    body: 'Zahl bitte vorab auf DE89 3704 0044 0532 0130 00, Infos unter https://example.com',
    clientMsgId: crypto.randomUUID(),
  });
  try {
    await keyboardLogin(page, DEMO.lea);
    await page.goto(`/messages/${started.conversationId}`);
    await page.getByRole('link', { name: 'Mehr zu Betrugsmaschen' }).click();
    await expect(page).toHaveURL(/\/hilfe#welche-betrugsmaschen-gibt-es$/);
    await expect(page.getByRole('heading', { name: 'Welche Betrugsmaschen gibt es?' })).toBeInViewport();
  } finally {
    await lea.call('DELETE', `/listings/${listing.id}`);
  }
});

test('[AT-UX-006] Seitenfuß mit sechs Pflichtlinks auf öffentlichen, internen und Fehlerseiten', async ({ browser }) => {
  const missing: string[] = [];
  const check = async (page: Page, path: string) => {
    await page.goto(path);
    await expect(page.getByRole('main')).toBeVisible();
    for (const name of footerLinkNames) {
      if ((await footer(page).getByRole('link', { name, exact: true }).count()) !== 1) missing.push(`${path}: ${name}`);
    }
  };
  const contexts: BrowserContext[] = [];
  const open = async () => {
    const c = await browser.newContext({ locale: 'de-DE' });
    contexts.push(c);
    return c.newPage();
  };

  const guest = await open();
  for (const path of [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/impressum',
    '/datenschutz',
    '/nutzungsbedingungen',
    '/community-regeln',
    '/barrierefreiheit',
    '/kontakt',
    '/hilfe',
    '/status',
    '/widerspruch',
    '/gibt-es-nicht',
  ])
    await check(guest, path);

  const member = await open();
  await keyboardLogin(member, DEMO.lea);
  for (const path of ['/', '/listings/new', '/messages', '/me/listings', '/me/favorites', '/me/notices', '/profile']) await check(member, path);

  const admin = await open();
  await keyboardLogin(admin, DEMO.admin);
  for (const path of ['/moderation', '/admin']) await check(admin, path);

  await Promise.all(contexts.map((c) => c.close()));
  expect(missing).toEqual([]);
});

test('[AT-OPS-007] Statusseite ohne Anmeldung mit Zustand je Dienst und Zeitpunkt, ohne technische Details', async ({ page }) => {
  await page.goto('/status');
  await expect(page.getByRole('heading', { level: 1, name: 'Systemstatus' })).toBeVisible();
  await expect(page.getByText(/Gesamtstatus/)).toBeVisible();
  await expect(page.getByText(/Zuletzt geprüft/)).toBeVisible();
  for (const service of ['Website und Anwendung', 'Datenbank', 'E-Mail-Versand', 'Chat in Echtzeit']) {
    await expect(page.getByRole('listitem').filter({ hasText: service })).toContainText(/in Betrieb|gestört/);
  }
  const text = (await page.getByRole('main').innerText()).toLowerCase();
  for (const leak of ['postgres', 'version 1', 'node', 'error', 'stack', 'localhost']) expect(text).not.toContain(leak);
});

// ------------------------------------------------------------------ Speicherung auf dem Endgerät (REQ-LEGAL-010)

type AllowEntry = { type: 'cookie' | 'localStorage' | 'sessionStorage' | 'indexedDB' | 'cache'; pattern: string; privacyTerm: string };
const allowlist = (JSON.parse(readFileSync(new URL('../storage-allowlist.json', import.meta.url), 'utf8')) as { entries: AllowEntry[] }).entries;

async function collectStorage(context: BrowserContext, page: Page) {
  const found: { type: AllowEntry['type']; name: string }[] = (await context.cookies()).map((c) => ({ type: 'cookie', name: c.name }));
  const inPage = await page.evaluate(async () => ({
    localStorage: Object.keys(localStorage),
    sessionStorage: Object.keys(sessionStorage),
    indexedDB: 'databases' in indexedDB ? (await indexedDB.databases()).map((d) => d.name ?? '') : [],
    cache: 'caches' in window ? await caches.keys() : [],
  }));
  for (const [type, names] of Object.entries(inPage)) for (const name of names) found.push({ type: type as AllowEntry['type'], name });
  return found;
}

test('[AT-LEGAL-010] Nach Gast- und Mitgliederabläufen nur Speicherungen aus der Allowlist, kein Cookie-Banner', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'de-DE' });
  const page = await context.newPage();
  for (const path of ['/', '/hilfe', '/datenschutz', '/status', '/register']) await page.goto(path);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByText(/cookie/i)).toHaveCount(0);

  await keyboardLogin(page, DEMO.lea);
  for (const path of ['/', '/listings/new', '/messages', '/me/notices', '/profile']) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
  }
  // Service Worker kurz Zeit geben, seinen Precache anzulegen
  await page.waitForTimeout(1500);
  const found = await collectStorage(context, page);
  await context.close();

  const unexpected = found.filter((f) => !allowlist.some((a) => a.type === f.type && new RegExp(a.pattern).test(f.name)));
  expect(unexpected).toEqual([]);
  expect(found.some((f) => f.type === 'cookie' && f.name === 'cm_session')).toBe(true);
});

test('[AT-LEGAL-002-2] Jede zulässige Speicherung steht in der Datenschutzerklärung unter „Cookies und lokale Speicherung“', async ({ page }) => {
  await page.goto('/datenschutz');
  const heading = page.getByRole('heading', { name: /Cookies und lokale Speicherung/ });
  await expect(heading).toBeVisible();
  const section = await sectionText(page, '9-cookies-und-lokale-speicherung');
  for (const entry of allowlist) expect(section, entry.privacyTerm).toContain(entry.privacyTerm);
});

// ------------------------------------------------------------------ Widerspruch per Tastatur (REQ-LEGAL-006/007)

test('[AT-LEGAL-007] Widerspruch aus der Mitteilung nur per Tastatur; ursprünglicher Entscheider sieht Vier-Augen-Hinweis', async ({ page, request, baseURL, browser }) => {
  const ben = await apiSession(request, baseURL!, DEMO.ben);
  const lea = await apiSession(request, baseURL!, DEMO.lea);
  const mod = await apiSession(request, baseURL!, DEMO.mod);
  const title = `Widerspruch-Test ${Date.now()}`;
  const listing = await createListing(ben, title);
  await lea.call('POST', '/reports', { targetType: 'listing', targetId: listing.id, reason: 'prohibited_item', details: 'E2E: Widerspruch per Tastatur' });
  const cases = await mod.call<{ id: string; targetId: string }[]>('GET', '/moderation/cases?status=open');
  const kase = cases.find((c) => c.targetId === listing.id)!;
  await mod.call('POST', `/moderation/cases/${kase.id}/decision`, {
    decision: 'remove',
    reason: 'Die Anzeige verstößt gegen die Liste verbotener Artikel (E2E-Test).',
    ruleRef: 'community_prohibited_items',
  });

  // Betroffener: Mitteilung mit Begründung, Regel und Frist; Widerspruch nur per Tastatur
  await keyboardLogin(page, DEMO.ben);
  await gotoTop(page, '/me/notices');
  // Innerste Karte mit Titel und Überschrift (Vorfahren enthalten beides ebenfalls, stehen im DOM aber davor)
  const card = page.locator('div').filter({ hasText: title }).filter({ hasText: 'Entscheidung der Moderation' }).last();
  await expect(card.getByText('Community-Regeln: Verbotene Artikel und Inhalte')).toBeVisible();
  await expect(card.getByText(/möglich bis/)).toBeVisible();
  await activate(page, card.getByRole('button', { name: 'Widerspruch einlegen' }));
  const dialog = page.getByRole('dialog', { name: 'Widerspruch einlegen' });
  await typeInto(page, dialog.getByLabel(/Warum ist die Entscheidung/), 'Das ist ein erlaubter Gegenstand, bitte erneut prüfen.');
  await activate(page, dialog.getByRole('button', { name: 'Widerspruch einlegen' }));
  await expect(card.getByText('Dein Widerspruch ist eingegangen.')).toBeVisible();

  // Moderator, der entschieden hat, darf nicht selbst entscheiden (Vier-Augen-Prinzip)
  const modContext = await browser.newContext({ locale: 'de-DE' });
  const modPage = await modContext.newPage();
  await keyboardLogin(modPage, DEMO.mod);
  await gotoTop(modPage, '/moderation');
  await activate(modPage, modPage.getByRole('tab', { name: 'Widersprüche', exact: true }));
  const appeal = modPage.locator('div').filter({ hasText: 'Das ist ein erlaubter Gegenstand' }).filter({ hasText: title }).last();
  await expect(appeal.getByText('Vier-Augen-Prinzip')).toBeVisible();
  await expect(appeal.getByRole('button', { name: 'Widerspruch entscheiden' })).toHaveCount(0);
  await modContext.close();
});
