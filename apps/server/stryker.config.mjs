// CTRL-MUTATION (REQ-MAINT-001): Mutation-Score der Geschäftsregeln (domain.ts der Module) ≥ 60 %.
// Läuft in CI wöchentlich und auf Anforderung (Job „mutation“), nicht bei jedem Push.
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  packageManager: 'pnpm',
  testRunner: 'vitest',
  plugins: ['@stryker-mutator/vitest-runner'],
  mutate: ['src/modules/*/domain.ts', 'src/platform/pseudonym.ts'],
  vitest: { configFile: 'vitest.mutation.config.ts' },
  reporters: ['clear-text', 'progress', 'html', 'json'],
  htmlReporter: { fileName: 'reports/mutation/index.html' },
  jsonReporter: { fileName: 'reports/mutation/mutation.json' },
  thresholds: { high: 80, low: 60, break: 60 },
  coverageAnalysis: 'perTest',
  tempDirName: '.stryker-tmp',
  concurrency: 4,
  timeoutMS: 10000,
};
