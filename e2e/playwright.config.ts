import { defineConfig, devices } from '@playwright/test';

/**
 * Akzeptanztests im Browser gegen ein laufendes Docker-Beispiel (REQ-A11Y-001/002, REQ-UX-001, REQ-PRIV-006).
 *   E2E_BASE_URL     App, Standard http://localhost:8080
 *   E2E_MAILPIT_URL  Mailpit, Standard http://localhost:8025
 *   E2E_CHANNEL      lokal installierter Browser statt Chromium, z. B. msedge
 */
export default defineConfig({
  testDir: './tests',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  workers: 1,
  retries: 0,
  fullyParallel: false,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:8080',
    locale: 'de-DE',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], ...(process.env.E2E_CHANNEL ? { channel: process.env.E2E_CHANNEL } : {}) },
    },
  ],
});
