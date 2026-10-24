/**
 * DAC7 / Plattformen-Steuertransparenzgesetz (REQ-LEGAL-009, Q-26, docs/06-recht/dac7-konzept.md).
 * Reine Funktionen: Schwellen, Zählung je Anbieter und Quartal, CSV ohne Formel-Injektion.
 */

/** Bagatellgrenze § 4 Abs. 5 PStTG: meldepflichtig ab 30 Verkäufen ODER ab 2.000 € Gegenleistung im Jahr. */
export const DAC7_THRESHOLDS = { sales: 30, amountCents: 200_000 };

export function isReportable(sales: number, amountCents: number): boolean {
  return sales >= DAC7_THRESHOLDS.sales || amountCents >= DAC7_THRESHOLDS.amountCents;
}

export interface Sale {
  sellerId: string;
  priceCents: number;
  completedAt: string;
}

export interface SellerTotals {
  sellerId: string;
  sales: number;
  amountCents: number;
  quarters: { quarter: number; sales: number; amountCents: number }[];
}

/** Quartal nach deutscher Zeit (Abschluss am 31.12. 23:30 MEZ zählt noch zum 4. Quartal). */
export function quarterOf(iso: string): number {
  const month = Number(
    new Date(iso).toLocaleString('en-US', { timeZone: 'Europe/Berlin', month: 'numeric' }),
  );
  return Math.floor((month - 1) / 3) + 1;
}

/** Summen je Anbieter; nur Verkäufe mit Gegenleistung (zu verschenken und Tausch zählen nicht). */
export function aggregateSales(sales: readonly Sale[]): SellerTotals[] {
  const bySeller = new Map<string, SellerTotals>();
  for (const sale of sales) {
    if (!(sale.priceCents > 0)) continue;
    const totals =
      bySeller.get(sale.sellerId) ??
      {
        sellerId: sale.sellerId,
        sales: 0,
        amountCents: 0,
        quarters: [1, 2, 3, 4].map((quarter) => ({ quarter, sales: 0, amountCents: 0 })),
      };
    totals.sales++;
    totals.amountCents += sale.priceCents;
    const q = totals.quarters[quarterOf(sale.completedAt) - 1]!;
    q.sales++;
    q.amountCents += sale.priceCents;
    bySeller.set(sale.sellerId, totals);
  }
  return [...bySeller.values()]
    .filter((t) => isReportable(t.sales, t.amountCents))
    .sort((a, b) => b.amountCents - a.amountCents);
}

/** Gültiges Meldejahr: abgeschlossen oder laufend, nicht in der Zukunft. */
export function isValidReportYear(year: number, now = new Date()): boolean {
  return Number.isInteger(year) && year >= 2023 && year <= now.getUTCFullYear();
}

/** CSV (Semikolon, für Tabellenkalkulationen im deutschen Format); Zellen gegen Formel-Injektion geschützt. */
export function toCsv(rows: readonly (readonly (string | number)[])[]): string {
  const cell = (value: string | number) => {
    let text = String(value);
    if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return /[;"\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return rows.map((r) => r.map(cell).join(';')).join('\r\n') + '\r\n';
}

export const euro = (cents: number) => (cents / 100).toFixed(2).replace('.', ',');
