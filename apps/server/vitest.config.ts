import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    // CTRL-COVERAGE (REQ-MAINT-001): Zeilenabdeckung der Fachmodule, Bericht als CI-Artefakt.
    // Die Geschäftsregeln (domain.ts) erreichen das Ziel; Services sind datenbankgebunden und nur über
    // Smoke- und E2E-Tests abgedeckt. Die Gesamtschwelle ist deshalb der gemessene Wert (15,9 % mit Vitest 4) minus Puffer,
    // bis eine Messung der Smoke-Läufe dazukommt (Lücke zu 80 % im Testbericht dokumentiert).
    coverage: {
      provider: 'v8',
      include: ['src/modules/**/*.ts'],
      exclude: ['**/*.test.ts'],
      reporter: ['text-summary', 'json-summary', 'html'],
      reportsDirectory: 'coverage',
      thresholds: {
        lines: 13,
        'src/modules/**/domain.ts': { lines: 95, branches: 85, functions: 95 },
      },
    },
  },
});
