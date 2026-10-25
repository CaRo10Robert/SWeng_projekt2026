import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Dac7Query, Dac7Report } from '@campusmarkt/contracts';
import { audit } from '../../platform/audit.js';
import { unprocessable } from '../../platform/errors.js';
import { requireRole } from '../../platform/http/auth.js';
import type { Module, ModuleDeps } from '../shared.js';
import { aggregateSales, DAC7_THRESHOLDS, euro, isValidReportYear, toCsv } from './domain.js';

const NOTE = {
  de:
    'Auswertung für die Meldepflicht nach dem Plattformen-Steuertransparenzgesetz (DAC7). Das Beispiel erhebt die für ' +
    'die Meldung nötigen Angaben (vollständiger Name, Anschrift, Geburtsdatum, Steuer-ID) nicht; sie sind vor einer ' +
    'Meldung beim Anbieter anzufordern. Keine Übermittlung an das BZSt im Beispiel (Q-26). Die Hochschuladresse steht ' +
    'nur im CSV-Export für die Meldestelle.',
  en:
    'Evaluation for the reporting obligation under the German Platform Tax Transparency Act (DAC7). The example does not ' +
    'collect the data required for reporting (full name, address, date of birth, tax ID); request them from the seller ' +
    'before reporting. No transmission to the Federal Central Tax Office in the example (Q-26). The university e-mail ' +
    'address is only included in the CSV export for the reporting office.',
} as const;

/** Modul reporting: Auswertungen für Betreiberpflichten, nur lesend (REQ-LEGAL-009). */
export function createReportingModule(deps: ModuleDeps): Module<Record<string, never>> {
  const { modules, database } = deps;

  const routes: FastifyPluginAsyncTypebox = async (app) => {
    app.get(
      '/admin/reports/dac7',
      { schema: { tags: ['admin'], querystring: Dac7Query, response: { 200: Dac7Report } } },
      async (req, reply) => {
        const auth = requireRole(req, 'admin');
        const { year, format = 'json' } = req.query;
        if (!isValidReportYear(year)) throw unprocessable('invalid_year', 'Bitte gib ein vergangenes oder das laufende Jahr an.');

        const totals = aggregateSales(await modules.messaging.completedSales(year));
        const users = await modules.identity.getPublicUsers(totals.map((t) => t.sellerId));
        const sellers = totals.map((t) => ({
          userId: t.sellerId,
          displayName: users.get(t.sellerId)?.displayName ?? 'Ehemaliges Mitglied',
          sales: t.sales,
          amountCents: t.amountCents,
          quarters: t.quarters,
        }));
        // Enthält personenbezogene Daten: jeder Abruf wird protokolliert, nichts zwischengespeichert
        await audit(database.db, {
          actorId: auth.userId,
          action: 'report.dac7',
          targetType: 'report',
          details: { year, format, sellers: sellers.length },
        });
        reply.header('cache-control', 'no-store');

        if (format === 'csv') {
          // Adresse nur im Export für die Meldestelle, nicht in der Ansicht (architektur.md §8.1, RV-C-12)
          const emails = new Map<string, string>();
          for (const s of sellers) emails.set(s.userId, (await modules.identity.getContact(s.userId))?.email ?? '');
          const csv = toCsv([
            ['Konto-ID', 'Anzeigename', 'Hochschuladresse', 'Verkäufe', 'Summe (EUR)',
              'Q1 Verkäufe', 'Q1 Summe', 'Q2 Verkäufe', 'Q2 Summe', 'Q3 Verkäufe', 'Q3 Summe', 'Q4 Verkäufe', 'Q4 Summe'],
            ...sellers.map((s) => [
              s.userId, s.displayName, emails.get(s.userId) ?? '', s.sales, euro(s.amountCents),
              ...s.quarters.flatMap((q) => [q.sales, euro(q.amountCents)]),
            ]),
          ]);
          return reply
            .type('text/csv; charset=utf-8')
            .header('content-disposition', `attachment; filename="dac7-${year}.csv"`)
            // Text statt JSON: Das Antwortschema gilt nur für application/json
            .send(`\uFEFF${csv}` as never);
        }
        const lang = (await modules.identity.getContact(auth.userId))?.locale ?? 'de';
        return { year, thresholds: DAC7_THRESHOLDS, note: NOTE[lang], sellers };
      },
    );
  };

  return { api: {}, routes };
}
