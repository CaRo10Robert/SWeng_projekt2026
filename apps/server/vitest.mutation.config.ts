import { defineConfig } from 'vitest/config';

// Für StrykerJS: nur die Tests der Geschäftsregeln, ohne Coverage-Schwellen (CTRL-MUTATION).
export default defineConfig({
  test: {
    include: ['src/modules/*/domain.test.ts', 'src/platform/pseudonym.test.ts'],
    environment: 'node',
  },
});
