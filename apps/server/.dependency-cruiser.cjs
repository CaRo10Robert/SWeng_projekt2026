/**
 * Fitness Functions für die Modulgrenzen (REQ-MAINT-002, REQ-ARCH-006, ADR-0001).
 * Ausführen: pnpm lint:deps
 */
module.exports = {
  forbidden: [
    {
      name: 'module-internals',
      comment: 'Module dürfen andere Module nur über deren index.ts (öffentliches API) importieren.',
      severity: 'error',
      from: { path: '^src/modules/([^/]+)/' },
      to: {
        path: '^src/modules/([^/]+)/',
        pathNot: ['^src/modules/$1/', '^src/modules/[^/]+/index\\.ts$'],
      },
    },
    {
      name: 'modules-only-know-ports',
      comment: 'Fachmodule kennen nur Ports, nie konkrete Adapter (Nodemailer, fs, pg-boss …).',
      severity: 'error',
      from: { path: '^src/modules/' },
      to: { path: '^src/platform/adapters/' },
    },
    {
      name: 'no-infrastructure-libs-in-modules',
      comment: 'Infrastruktur-Bibliotheken nur in Adaptern (Bildverarbeitung mit sharp ist erlaubt).',
      severity: 'error',
      from: { path: '^src/modules/' },
      to: { path: 'node_modules/(nodemailer|pg-boss|pg)/' },
    },
    {
      name: 'no-payment-sdk-in-modules',
      comment:
        'Zahlungsdienstleister nur hinter dem PaymentPort in einem Adapter (ADR-0006, QS-5); Fachmodule importieren keine PSP-SDKs.',
      severity: 'error',
      from: { path: '^src/modules/' },
      to: { path: ['^(stripe|mollie|@mollie/|@paypal/|@adyen/|@braintree/|braintree)', 'node_modules/(stripe|@mollie|@paypal|@adyen|@braintree|braintree)/'] },
    },
    {
      name: 'domain-is-pure',
      comment: 'domain.ts importiert keine Frameworks und keine Plattform.',
      severity: 'error',
      from: { path: '^src/modules/[^/]+/domain\\.ts$' },
      to: { path: ['^src/platform/', 'node_modules/(fastify|@fastify|pg|pg-boss|sharp)/'] },
    },
    {
      name: 'platform-independent-of-modules',
      comment: 'Die Plattform kennt keine Fachmodule.',
      severity: 'error',
      from: { path: '^src/platform/' },
      to: { path: '^src/modules/' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    exclude: { path: '\\.test\\.ts$' },
  },
};
