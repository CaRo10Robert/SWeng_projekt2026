import { describe, expect, it } from 'vitest';
import { aggregateSales, isReportable, isValidReportYear, quarterOf, toCsv } from './domain.js';

describe('[AT-LEGAL-009] DAC7-Schwellen (REQ-LEGAL-009)', () => {
  it.each([
    [29, 199_999, false],
    [30, 100, true],
    [1, 200_000, true],
    [0, 0, false],
  ])('%i Verkäufe, %i Cent → meldepflichtig=%s', (sales, cents, reportable) => {
    expect(isReportable(sales, cents)).toBe(reportable);
  });

  it('zählt nur Verkäufe mit Gegenleistung und ordnet Quartale nach deutscher Zeit zu', () => {
    const sales = [
      ...Array.from({ length: 30 }, (_, i) => ({ sellerId: 'a', priceCents: 100, completedAt: `2026-0${(i % 3) + 1}-10T12:00:00Z` })),
      // 1. Januar 00:30 MEZ: zählt zum 1. Quartal (die Jahresabgrenzung macht die Datenbankabfrage ebenfalls in MEZ)
      { sellerId: 'b', priceCents: 250_000, completedAt: '2026-12-31T23:30:00Z' },
      { sellerId: 'c', priceCents: 0, completedAt: '2026-05-01T10:00:00Z' },
      { sellerId: 'd', priceCents: 1_000, completedAt: '2026-05-01T10:00:00Z' },
    ];
    const result = aggregateSales(sales);
    expect(result.map((r) => r.sellerId)).toEqual(['b', 'a']);
    expect(result.find((r) => r.sellerId === 'a')).toMatchObject({ sales: 30, amountCents: 3_000 });
    expect(result.find((r) => r.sellerId === 'a')!.quarters[0]).toEqual({ quarter: 1, sales: 30, amountCents: 3_000 });
    expect(result.find((r) => r.sellerId === 'b')!.quarters[0]!.sales).toBe(1);
  });

  it('Quartal nach Europe/Berlin', () => {
    expect(quarterOf('2026-03-31T22:30:00Z')).toBe(2); // 1. April 00:30 MESZ
    expect(quarterOf('2026-06-30T12:00:00Z')).toBe(2);
    expect(quarterOf('2026-10-01T00:00:00Z')).toBe(4);
  });

  it('Jahr nicht in der Zukunft', () => {
    const now = new Date('2026-10-24T00:00:00Z');
    expect(isValidReportYear(2026, now)).toBe(true);
    expect(isValidReportYear(2027, now)).toBe(false);
    expect(isValidReportYear(2022, now)).toBe(false);
  });

  it('CSV schützt vor Formel-Injektion und maskiert Trennzeichen', () => {
    expect(toCsv([['=HYPERLINK("x")', 'Lea; Ben', 3]])).toBe(`"'=HYPERLINK(""x"")";"Lea; Ben";3\r\n`);
  });
});
