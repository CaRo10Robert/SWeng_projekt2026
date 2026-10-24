import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Dac7Query, Dac7Report } from '@campusmarkt/contracts';
import { audit } from '../../platform/audit.js';
import { unprocessable } from '../../platform/errors.js';
import { requireRole } from '../../platform/http/auth.js';
import type { Module, ModuleDeps } from '../shared.js';
import { aggregateSales, DAC7_THRESHOLDS, euro, isValidReportYear, toCsv } from './domain.js';

const NOTE =
  'Auswertung für die Meldepflicht nach dem Plattformen-Steuertransparenzgesetz (DAC7). Das Beispiel erhebt die für ' +
  'die Meldung nötigen Angaben (vollständiger Name, Anschrift, Geburtsdatum, Steuer-ID) nicht; sie sind vor einer ' +
  'Meldung beim Anbieter anzufordern. Keine Übermittlung an das BZSt im Beispiel (Q-26).';

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
        const sellers = [];
        for (const t of totals) {
          const contact = await modules.identity.getContact(t.sellerId);
          sellers.push({
            userId: t.sellerId,
            displayName: users.get(t.sellerId)?.displayName ?? 'Ehemaliges Mitglied',
            email: contact?.email ?? '',
            sales: t.sales,
            amountCents: t.amountCents,
            quarters: t.quarters,
          });
        }
        // Enthält personenbezogene Daten: jeder Abruf wird protokolliert, nichts zwischengespeichert
        await audit(database.db, {
          actorId: auth.userId,
          action: 'report.dac7',
          targetType: 'report',
          details: { year, format, sellers: sellers.length },
        });
        reply.header('cache-control', 'no-store');

        if (format === 'csv') {
          const csv = toCsv([
            ['Konto-ID', 'Anzeigename', 'Hochschuladresse', 'Verkäufe', 'Summe (EUR)',
              'Q1 Verkäufe', 'Q1 Summe', 'Q2 Verkäufe', 'Q2 Summe', 'Q3 Verkäufe', 'Q3 Summe', 'Q4 Verkäufe', 'Q4 Summe'],
            ...sellers.map((s) => [
              s.userId, s.displayName, s.email, s.sales, euro(s.amountCents),
              ...s.quarters.flatMap((q) => [q.sales, euro(q.amountCents)]),
            ]),
          ]);
          return reply
            .type('text/csv; charset=utf-8')
            .header('content-disposition', `attachment; filename="dac7-${year}.csv"`)
            // Text statt JSON: Das Antwortschema gilt nur für application/json
            .send(`\uFEFF${csv}` as never);
        }
        return { year, thresholds: DAC7_THRESHOLDS, note: NOTE, sellers };
      },
    );
  };

  return { api: {}, routes };
}
