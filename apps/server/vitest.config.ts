import { execSync } from 'node:child_process';
import { defineConfig } from 'vitest/config';

/**
 * Integrationstests brauchen Docker (Testcontainers). In CI ist Docker Pflicht; lokal ohne Docker werden sie
 * übersprungen (Hinweis im Lauf), und es gelten nur die Schwellen der Unit-Tests.
 */
function dockerAvailable(): boolean {
  if (process.env.CI) return true;
  try {
    execSync('docker info', { stdio: 'ignore', timeout: 10_000 });
    return true;
  } catch {
    return false;
  }
}
const withIntegration = dockerAvailable();

export default defineConfig({
  test: {
    // Unit-Tests (*.test.ts) und Integrationstests gegen PostgreSQL (*.integration.test.ts, Testcontainers) in einem Lauf,
    // damit beide Ebenen der Testpyramide in die Coverage einfließen (Guideline Kap. 09, REQ-MAINT-001, B-64).
    include: ['src/**/*.test.ts'],
    environment: 'node',
    globalSetup: ['test/integration/global-setup.ts'],
    hookTimeout: 120_000,
    testTimeout: 30_000,
    // CTRL-COVERAGE (REQ-MAINT-001): Fachmodule gesamt (gemessen 2026-10-26: 88,4 % Zeilen, 72,0 % Zweige,
    // 88,8 % Funktionen; Schwelle = Messwert − 2 Pp). Geschäftsregeln (domain.ts) als kritische Pfade ≥ 95 % inkl. Zweige.
    coverage: {
      provider: 'v8',
      include: ['src/modules/**/*.ts'],
      exclude: ['**/*.test.ts'],
      reporter: ['text-summary', 'json-summary', 'html'],
      reportsDirectory: 'coverage',
      thresholds: {
        ...(withIntegration ? { lines: 86, branches: 70, functions: 86 } : { lines: 13 }),
        'src/modules/**/domain.ts': { lines: 95, branches: 95, functions: 95 },
      },
    },
  },
});
