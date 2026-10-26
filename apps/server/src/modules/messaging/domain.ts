import type { SystemCode } from '@campusmarkt/contracts';
const LINK = /\b(https?:\/\/|www\.)\S+/i;
const IBAN = /\b[A-Z]{2}\d{2}(?:\s?[A-Z0-9]{4}){3,7}(?:\s?[A-Z0-9]{1,3})?\b/i;
const PHONE = /(?:\+|00)\d{2}[\s/-]?\d{2,5}[\s/-]?\d{3,}|\b0\d{2,5}[\s/-]?\d{4,}/;

/** REQ-CHAT-006: Sicherheitshinweis bei externen Links, IBAN oder Telefonnummern. */
export function needsSafetyHint(body: string): boolean {
  return LINK.test(body) || IBAN.test(body) || PHONE.test(body);
}

export const MESSAGE_RATE = { limit: 60, windowSeconds: 60 };
export const NEW_CONVERSATION_RATE = { limit: 20, windowSeconds: 3600 };
/** REQ-NOTI-002: höchstens eine E-Mail pro Konversation in 15 Minuten. */
export const NOTIFY_DELAY_SECONDS = 15 * 60;

// ------------------------------------------------------------------ Kontaktfreigabe (REQ-CHAT-010)

export type ContactRowState = 'granted' | 'withdrawn' | 'declined';
export type ContactAction = 'grant' | 'withdraw' | 'decline';

export interface ContactRow {
  state: ContactRowState;
  requestCount: number;
  changedAt: Date;
}

export interface ContactContext {
  mine?: ContactRow;
  theirs?: ContactRow;
  /** Einer hat den anderen blockiert. */
  blocked: boolean;
  /** Beide Konten sind aktiv (nicht gesperrt, nicht gelöscht). */
  bothActive: boolean;
  now: Date;
}

export const CONTACT_RULES = { maxRequests: 3, cooldownHours: 24 };
/** Obergrenze für Kontaktaktionen je Nutzer, unabhängig von der fachlichen Sperrfrist. */
export const CONTACT_ACTION_RATE = { limit: 20, windowSeconds: 3600 };

export interface ContactView {
  mine: ContactRowState | 'none';
  theirs: ContactRowState | 'none';
  /** Adressen sind gegenseitig sichtbar. */
  visible: boolean;
  canGrant: boolean;
  retryAfter: Date | null;
  requestsLeft: number;
}

const isOwnRequest = (mine: ContactView['mine'], theirs: ContactView['theirs']) => theirs !== 'granted' || mine === 'withdrawn';

/** Sicht eines Teilnehmers auf die Kontaktfreigabe. Reine Funktion, tabellarisch getestet. */
export function contactView(ctx: ContactContext): ContactView {
  const mine = ctx.mine?.state ?? 'none';
  const theirs = ctx.theirs?.state ?? 'none';
  const requestsLeft = Math.max(0, CONTACT_RULES.maxRequests - (ctx.mine?.requestCount ?? 0));
  const open = !ctx.blocked && ctx.bothActive;
  const visible = open && mine === 'granted' && theirs === 'granted';

  let canGrant = open && mine !== 'granted';
  let retryAfter: Date | null = null;
  // Zustimmen auf eine offene Anfrage ist möglich; eine eigene Anfrage unterliegt Sperrfrist und Höchstzahl.
  // Nach eigenem Widerruf zählt erneutes Zustimmen immer als eigene Anfrage, auch wenn das Gegenüber noch zustimmt.
  if (canGrant && isOwnRequest(mine, theirs)) {
    if (requestsLeft === 0) canGrant = false;
    if ((mine === 'declined' || mine === 'withdrawn') && ctx.mine) {
      const until = new Date(ctx.mine.changedAt.getTime() + CONTACT_RULES.cooldownHours * 3_600_000);
      if (until > ctx.now) {
        canGrant = false;
        retryAfter = until;
      }
    }
  }
  return { mine, theirs, visible, canGrant, retryAfter, requestsLeft };
}

export type ContactDecision =
  | { ok: true; set: 'mine' | 'theirs'; state: ContactRowState; countsAsRequest: boolean; exchanged: boolean }
  | { ok: false; code: 'contact_not_possible' | 'contact_request_limit' | 'invalid_contact_action' };

/** Entscheidet, ob eine Aktion erlaubt ist und welche Zeile sie ändert. */
export function decideContactAction(action: ContactAction, ctx: ContactContext): ContactDecision {
  const view = contactView(ctx);
  if (action === 'grant') {
    if (ctx.blocked || !ctx.bothActive) return { ok: false, code: 'contact_not_possible' };
    if (view.mine === 'granted') return { ok: false, code: 'invalid_contact_action' };
    if (!view.canGrant) return { ok: false, code: 'contact_request_limit' };
    const exchanged = view.theirs === 'granted';
    return { ok: true, set: 'mine', state: 'granted', countsAsRequest: isOwnRequest(view.mine, view.theirs), exchanged };
  }
  if (action === 'withdraw') {
    if (view.mine !== 'granted') return { ok: false, code: 'invalid_contact_action' };
    return { ok: true, set: 'mine', state: 'withdrawn', countsAsRequest: false, exchanged: false };
  }
  // decline: nur eine offene Anfrage des Gegenübers kann abgelehnt werden
  if (view.theirs !== 'granted' || view.mine === 'granted') return { ok: false, code: 'invalid_contact_action' };
  return { ok: true, set: 'theirs', state: 'declined', countsAsRequest: false, exchanged: false };
}

// ------------------------------------------------------------------ Systemnachrichten (ADR-0016, MAN-UX-002 T-2)

/** Deutscher Klartext je Code: steht in body (Export, Moderation, ältere Clients); der Client übersetzt per Code. */
export const SYSTEM_TEXT: Record<SystemCode, string> = {
  contact_exchanged: 'Kontaktdaten wurden ausgetauscht. Ihr seht die Hochschul-E-Mail-Adresse des anderen oben im Chat.',
  deal_reserved: 'Die Anzeige wurde für dich reserviert.',
  deal_completed: 'Die Anzeige wurde als an dich abgegeben markiert.',
  deal_cancelled: 'Die Reservierung wurde aufgehoben.',
  message_removed: '[Nachricht wurde von der Moderation entfernt]',
  message_deleted: '[Nachricht gelöscht – Konto des Absenders wurde gelöscht]',
};

// ------------------------------------------------------------------ Domain Events (ADR-0006, MAN-ARCH-001 B-2)

export type DealEventType = 'DealAgreed' | 'DealCompleted' | 'DealCancelled';

export interface DealEventSource {
  id: string;
  listing_id: string;
  seller_id: string;
  buyer_id: string;
  agreed_price_cents: number | null;
  currency: string;
  status: string;
  created_at: string;
}

/**
 * Jedes Ereignis trägt eine eigene eventId (UUID): Ein späterer Konsument (payments) erkennt Wiederholungen der Queue
 * daran und verarbeitet idempotent; dealId allein reicht nicht, weil ein Deal mehrere Ereignisse erzeugt.
 */
export function dealEvent(type: DealEventType, deal: DealEventSource, newId: () => string, now: Date = new Date()) {
  return {
    eventId: newId(),
    type,
    occurredAt: now.toISOString(),
    id: deal.id,
    dealId: deal.id,
    listingId: deal.listing_id,
    sellerId: deal.seller_id,
    buyerId: deal.buyer_id,
    agreedPriceCents: deal.agreed_price_cents,
    currency: deal.currency.trim(),
    status: deal.status,
    createdAt: deal.created_at,
  };
}
