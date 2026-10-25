import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { activate, gotoTop, linkFrom, waitForMail } from './helpers';

/**
 * Englische Oberfläche (REQ-UX-007, ADR-0016, Q-25). Eigenes, frisch registriertes Konto, damit die Sprachwahl
 * keine Demo-Konten verändert, auf die andere Tests deutsche Texte erwarten.
 */
test.describe.configure({ mode: 'serial' });

const stamp = Date.now();
const user = { email: `i18n.${stamp}@studmail.hwg-lu.de`, password: 'englisch-test-passwort-1' };

/** Deutsche Wörter, die auf englischen Kernseiten nicht vorkommen dürfen (Stichprobe). */
const GERMAN = /\b(Anmelden|Registrieren|Suchen|Nachrichten|Anzeige|Merkliste|Profil speichern|Hilfe und häufige Fragen|Impressum|Datenschutz|Nutzungsbedingungen|Zum Inhalt springen)\b/;

test('[AT-UX-007] Sprachwechsel auf Englisch ändert Texte, lang und Formate; die Wahl bleibt nach Neuladen erhalten', async ({ page }) => {
  await gotoTop(page, '/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Kaufen, verkaufen und tauschen – direkt auf dem Campus');

  // Sprachwahl im Seitenkopf per Tastatur; jede Sprache ist in sich selbst benannt
  const english = page.getByRole('group', { name: 'Sprache' }).getByRole('button', { name: /English/ });
  await expect(english).toHaveAttribute('lang', 'en');
  await activate(page, english);

  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Buy, sell and swap – right on campus');
  await expect(page.getByRole('group', { name: 'Language' }).getByRole('button', { name: /English/ })).toHaveAttribute('aria-pressed', 'true');

  // Gespeichert wird nur die ausdrückliche Wahl (REQ-LEGAL-010, Allowlist)
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual(['cm_locale']);
  expect(await page.evaluate(() => Object.keys(sessionStorage))).toEqual([]);

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Buy, sell and swap – right on campus');

  // Stichprobe der Kernseiten: keine deutschen Reste in der Oberfläche
  for (const path of ['/', '/login', '/register', '/forgot-password', '/status', '/gibt-es-nicht']) {
    await page.goto(path);
    await expect(page.locator('main')).not.toBeEmpty();
    await page.waitForLoadState('networkidle');
    const chrome = await page.locator('header, footer, main').allInnerTexts();
    expect(chrome.join('\n'), path).not.toMatch(GERMAN);
  }
  await page.goto('/gibt-es-nicht');
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();

  // Englische Seiten ohne Verstöße serious/critical (z. B. fehlende lang-Attribute)
  await page.goto('/');
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => v.id)).toEqual([]);
});

test('[AT-UX-007] Registrierung auf Englisch: Wahl geht ins Konto, Formate und E-Mails folgen der Kontosprache', async ({ page, request }) => {
  // Neuer Kontext dieses Tests: Sprache zuerst wählen, dann registrieren
  await gotoTop(page, '/register');
  await activate(page, page.getByRole('button', { name: /English/ }));
  await expect(page.getByRole('heading', { name: 'Create account' })).toBeVisible();
  await page.getByLabel('University email').fill(user.email);
  await page.getByLabel('Display name').fill('Intl Test');
  await page.locator('input[type="password"]').fill(user.password);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Sign up' }).click();
  await expect(page.getByRole('heading', { name: 'Almost done' })).toBeVisible();

  // Die Bestätigungsmail entsteht vor jeder Sprachwahl im Konto und ist deshalb deutsch (bekannte Grenze)
  const verify = await waitForMail(request, user.email, 'bestätige');
  await page.goto(linkFrom(verify.Text, '/verify'));
  await expect(page.getByRole('button', { name: 'Log out' }).or(page.getByRole('button', { name: 'Menu' }))).toBeVisible();

  // Die ausdrückliche Wahl auf diesem Gerät wird ins Konto übernommen (PATCH /me)
  await expect
    .poll(async () => (await (await page.request.get('/api/v1/me')).json()).locale as string, { timeout: 10_000 })
    .toBe('en');

  await page.goto('/profile');
  await expect(page.getByRole('heading', { level: 1, name: 'Profile' })).toBeVisible();
  // Datumsformat Englisch (Tag Monatsname Jahr), nicht „24.10.2026“
  await expect(page.getByText(/Member since \d{1,2} [A-Z][a-z]{2} \d{4}/)).toBeVisible();

  // E-Mails folgen der Kontosprache: Passwort-Reset als Beispiel
  await page.request.post('/api/v1/auth/password-reset/request', { headers: { 'x-campusmarkt-csrf': '1' }, data: { email: user.email } });
  const reset = await waitForMail(request, user.email, 'Reset your password');
  expect(reset.Text).toContain('Hi Intl Test');
  expect(reset.Text).toContain('Legal notice');
  expect(reset.Text).not.toMatch(/Hallo|Passwort|Impressum/);
});

test('[AT-UX-007-3] Englische Rechtstexte zeigen den Hinweis auf die verbindliche deutsche Fassung; Anker bleiben gleich', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('cm_locale', 'en'));
  for (const [path, title] of [
    ['/impressum', 'Legal notice'],
    ['/datenschutz', 'Privacy policy'],
    ['/nutzungsbedingungen', 'Terms of use'],
    ['/community-regeln', 'Community rules'],
    ['/barrierefreiheit', 'Accessibility statement'],
    ['/kontakt', 'Contact'],
    ['/hilfe', 'Help and FAQ'],
  ] as const) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
    await expect(page.getByText('Only the German version is legally binding.').first()).toBeVisible();
    await expect(page.locator('article')).toHaveAttribute('lang', 'en');
  }

  // Regel-Links und E-Mails verwenden die deutschen Anker; sie zeigen auch in der Übersetzung auf denselben Abschnitt
  await page.goto('/nutzungsbedingungen#8-melden-moderation-und-widerspruch');
  await expect(page.locator('[id="8-melden-moderation-und-widerspruch"]')).toHaveText('8. Reporting, moderation and appeals');
  await page.goto('/hilfe#welche-betrugsmaschen-gibt-es');
  await expect(page.locator('#welche-betrugsmaschen-gibt-es')).toHaveText('What scams are there?');
  await expect(page.locator('#welche-betrugsmaschen-gibt-es')).toBeFocused();

  // Speicherung auf Englisch weiterhin in der Datenschutzerklärung aufgeführt (Abschnitt 9)
  await page.goto('/datenschutz');
  await expect(page.locator('[id="9-cookies-und-lokale-speicherung"]')).toBeVisible();
  await expect(page.locator('main')).toContainText('cm_locale');
});
