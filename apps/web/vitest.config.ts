import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

/** Komponententests (Guideline Kap. 09, Testpyramide): React Testing Library in jsdom, ohne Browser. */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.tsx', 'src/**/*.test.ts'],
    setupFiles: ['src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/components/**/*.tsx', 'src/lib/**/*.ts', 'src/i18n/**/*.tsx'],
      reporter: ['text-summary', 'json-summary'],
      reportsDirectory: 'coverage',
    },
  },
});
