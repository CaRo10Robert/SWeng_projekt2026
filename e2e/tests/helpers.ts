import { expect, type APIRequestContext, type Locator, type Page } from '@playwright/test';

export const MAILPIT = process.env.E2E_MAILPIT_URL ?? 'http://localhost:8025';
export const PASSWORD = 'CampusMarkt-Demo-2026';
export const DEMO = {
  lea: 'lea@studmail.hwg-lu.de',
  ben: 'ben@studmail.hwg-lu.de',
  mia: 'mia@studmail.hwg-lu.de',
  mod: 'mod@hwg-lu.de',
  admin: 'admin@hwg-lu.de',
};

/** Kleine gültige PNG (2×2 Pixel) für den Bild-Upload. */
export const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP8z8DAwMDAxMDAwMDAAAANHQEDasKb6QAAAABJRU5ErkJggg==',
  'base64',
);

/** Prüft, dass das fokussierte Element einen sichtbaren Fokusindikator hat (WCAG 2.4.7). */
export async function expectFocusVisible(page: Page) {
  const info = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return { ok: false, what: 'kein Fokus' };
    const style = getComputedStyle(el);
    const outline = style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0;
    const shadow = style.boxShadow !== 'none';
    return { ok: outline || shadow, what: `${el.tagName} ${el.textContent?.trim().slice(0, 40) ?? ''}` };
  });
  expect(info.ok, `Fokus nicht sichtbar auf ${info.what}`).toBe(true);
}

/**
 * Bewegt den Fokus nur mit Tab (bzw. Umschalt+Tab) auf das Ziel. Schlägt fehl, wenn es nicht erreichbar ist
 * (Tastaturfalle oder nicht fokussierbar). Prüft an jedem Halt den sichtbaren Fokus.
 */
export async function tabTo(page: Page, target: Locator, { max = 80, backwards = false } = {}) {
  await expect(target).toBeVisible();
  for (let i = 0; i < max; i++) {
    if (await target.evaluate((el) => el === document.activeElement || el.contains(document.activeElement)).catch(() => false)) {
      await expectFocusVisible(page);
      return;
    }
    await page.keyboard.press(backwards ? 'Shift+Tab' : 'Tab');
  }
  throw new Error(`Element per Tastatur nicht erreichbar: ${target.toString()}`);
}

/** Feld per Tab erreichen und Text tippen. */
export async function typeInto(page: Page, target: Locator, text: string) {
  await tabTo(page, target);
  await page.keyboard.press('Control+A');
  await page.keyboard.type(text);
}

/** Schaltfläche oder Link per Tab erreichen und mit Enter auslösen. */
export async function activate(page: Page, target: Locator, key: 'Enter' | 'Space' = 'Enter') {
  await tabTo(page, target);
  await page.keyboard.press(key);
}

/** Startet am Seitenanfang, damit Tab-Reihenfolgen reproduzierbar sind. */
export async function gotoTop(page: Page, path: string) {
  await page.goto(path);
  await page.locator('body').evaluate((b) => {
    (document.activeElement as HTMLElement | null)?.blur();
    b.focus();
  });
}

export async function keyboardLogin(page: Page, email: string, password = PASSWORD) {
  await gotoTop(page, '/login');
  await typeInto(page, page.getByLabel('Hochschul-E-Mail'), email);
  await typeInto(page, page.locator('input[type="password"]'), password);
  await activate(page, page.getByRole('button', { name: 'Anmelden' }));
  await expect(page).not.toHaveURL(/\/login/);
}

/** Wartet auf Mails an `to` mit Betreff-Teil; liefert die neueste. */
export async function waitForMail(request: APIRequestContext, to: string, subjectPart: string) {
  for (let i = 0; i < 60; i++) {
    const res = await request.get(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`);
    const data = (await res.json()) as { messages?: { ID: string; Subject: string; Created: string }[] };
    const hit = (data.messages ?? []).filter((m) => m.Subject.includes(subjectPart)).sort((a, b) => b.Created.localeCompare(a.Created))[0];
    if (hit) return (await (await request.get(`${MAILPIT}/api/v1/message/${hit.ID}`)).json()) as { Text: string };
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Keine Mail „${subjectPart}“ an ${to}`);
}

export const linkFrom = (text: string, path: string) => {
  const m = text.match(new RegExp(`https?://[^\\s]+${path}\\?token=[A-Za-z0-9_\\-%]+`));
  if (!m) throw new Error(`Kein Link ${path} in der Mail`);
  return new URL(m[0]).pathname + new URL(m[0]).search;
};

/** API-Sitzung für Testvorbereitung (nicht Teil des geprüften Ablaufs). */
export async function apiSession(request: APIRequestContext, baseURL: string, email: string) {
  const res = await request.post(`${baseURL}/api/v1/auth/login`, {
    headers: { 'x-campusmarkt-csrf': '1' },
    data: { email, password: PASSWORD },
  });
  expect(res.status(), `Login ${email}`).toBe(200);
  const cookie = (res.headers()['set-cookie'] ?? '').split(';')[0]!;
  const call = async <T>(method: string, path: string, data?: unknown): Promise<T> => {
    const r = await request.fetch(`${baseURL}/api/v1${path}`, {
      method,
      headers: { cookie, 'x-campusmarkt-csrf': '1' },
      data,
    });
    expect(r.ok(), `${method} ${path} → ${r.status()} ${await r.text()}`).toBe(true);
    return (r.status() === 204 ? undefined : await r.json()) as T;
  };
  return { cookie, call };
}

export type Session = Awaited<ReturnType<typeof apiSession>>;

/** Legt eine frische Anzeige an (Testvorbereitung). */
export async function createListing(s: Session, title: string) {
  const meta = await s.call<{ categories: { id: string }[]; locations: { id: string }[] }>('GET', '/meta');
  return s.call<{ id: string }>('POST', '/listings', {
    kind: 'offer',
    title,
    description: 'Testanzeige aus den automatisierten Browser-Tests.',
    categoryId: meta.categories[0]!.id,
    priceType: 'fixed',
    priceCents: 500,
    locationIds: [meta.locations[0]!.id],
  });
}
