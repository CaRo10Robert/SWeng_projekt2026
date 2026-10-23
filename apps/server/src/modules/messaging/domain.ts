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

export interface ContactView {
  mine: ContactRowState | 'none';
  theirs: ContactRowState | 'none';
  /** Adressen sind gegenseitig sichtbar. */
  visible: boolean;
  canGrant: boolean;
  retryAfter: Date | null;
  requestsLeft: number;
}

/** Sicht eines Teilnehmers auf die Kontaktfreigabe. Reine Funktion, tabellarisch getestet. */
export function contactView(ctx: ContactContext): ContactView {
  const mine = ctx.mine?.state ?? 'none';
  const theirs = ctx.theirs?.state ?? 'none';
  const requestsLeft = Math.max(0, CONTACT_RULES.maxRequests - (ctx.mine?.requestCount ?? 0));
  const open = !ctx.blocked && ctx.bothActive;
  const visible = open && mine === 'granted' && theirs === 'granted';

  let canGrant = open && mine !== 'granted';
  let retryAfter: Date | null = null;
  // Zustimmen auf eine offene Anfrage ist immer möglich; eine eigene Anfrage unterliegt Sperrfrist und Höchstzahl
  if (canGrant && theirs !== 'granted') {
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
    const accepting = view.theirs === 'granted';
    return { ok: true, set: 'mine', state: 'granted', countsAsRequest: !accepting, exchanged: accepting };
  }
  if (action === 'withdraw') {
    if (view.mine !== 'granted') return { ok: false, code: 'invalid_contact_action' };
    return { ok: true, set: 'mine', state: 'withdrawn', countsAsRequest: false, exchanged: false };
  }
  // decline: nur eine offene Anfrage des Gegenübers kann abgelehnt werden
  if (view.theirs !== 'granted' || view.mine === 'granted') return { ok: false, code: 'invalid_contact_action' };
  return { ok: true, set: 'theirs', state: 'declined', countsAsRequest: false, exchanged: false };
}
