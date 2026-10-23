/**
 * PaymentPort (ADR-0006, REQ-ARCH-001/002) – BACKLOG EPIC-09, im MVP bewusst ohne Implementierung.
 *
 * Das spätere Modul `payments` konsumiert die Domain Events `DealAgreed`, `DealCompleted` und
 * `DealCancelled` aus der Queue `deal-events` (Modul messaging) und spricht einen lizenzierten
 * Zahlungsdienstleister über diesen Port an. Die Plattform hält nie Gelder und speichert keine
 * Kartendaten. Beträge immer als Integer in Cent plus ISO-4217-Währung.
 */
export interface Money {
  amountCents: number;
  currency: string;
}

export type PaymentStatus = 'pending' | 'authorized' | 'captured' | 'released' | 'disputed' | 'refunded' | 'failed';

export interface PaymentPort {
  /** KYC/Onboarding des Anbieters beim PSP; liefert eine gehostete Onboarding-URL. */
  onboardSeller(input: { sellerId: string; returnUrl: string }): Promise<{ accountRef: string; onboardingUrl: string }>;
  /** Gehosteter Checkout für einen Deal (opt-in, nie voreingestellt). */
  createCheckout(input: {
    dealId: string;
    sellerAccountRef: string;
    amount: Money;
    idempotencyKey: string;
    returnUrl: string;
  }): Promise<{ paymentRef: string; checkoutUrl: string }>;
  releaseFunds(input: { paymentRef: string; idempotencyKey: string }): Promise<void>;
  refund(input: { paymentRef: string; amount?: Money; idempotencyKey: string }): Promise<void>;
  getStatus(paymentRef: string): Promise<PaymentStatus>;
}
