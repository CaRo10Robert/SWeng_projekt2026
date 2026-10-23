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
