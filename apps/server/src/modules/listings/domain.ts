import type { ListingAction, ListingStatus, PriceType } from '@campusmarkt/contracts';

/** Gespeicherter Status: API-Status plus `deleted` (Soft Delete, wird nie ausgeliefert). */
export type StoredStatus = ListingStatus | 'deleted';

export const MAX_ACTIVE_LISTINGS = 30;
/**
 * Erneuerung aktiver Anzeigen (REQ-LST-013, Q-32): nach 14 Tagen Hinweis, 24 h später automatisch pausiert,
 * 2 Tage danach gelöscht. Jede Rückkehr nach „aktiv“ startet eine neue Frist.
 */
export const LISTING_LIFETIME_DAYS = 14;
export const RENEWAL_GRACE_HOURS = 24;
export const AUTO_PAUSE_DELETE_DAYS = 2;
/** Eine selbst gewählte Pause hält bis zu 90 Tage und folgt danach der automatischen Pause. */
export const OWNER_PAUSE_MAX_DAYS = 90;

/** Fristen für die Anzeige beim Anbieter: „bis … erneuern“ bzw. „wird am … gelöscht“. */
export function lifecycleDates(r: {
  status: StoredStatus;
  reminderSentAt: Date | null;
  pausedReason: 'owner' | 'auto' | null;
  statusChangedAt: Date;
}): { renewBy: Date | null; autoDeleteAt: Date | null } {
  const renewBy = r.status === 'active' && r.reminderSentAt ? new Date(r.reminderSentAt.getTime() + RENEWAL_GRACE_HOURS * 3_600_000) : null;
  const autoDeleteAt =
    r.status === 'paused' && r.pausedReason === 'auto' ? new Date(r.statusChangedAt.getTime() + AUTO_PAUSE_DELETE_DAYS * 86_400_000) : null;
  return { renewBy, autoDeleteAt };
}
/** Reservierungen fallen nach 30 Tagen ohne Abgabe auf „aktiv“ zurück (REQ-LST-008, REQ-PRIV-003). */
export const RESERVATION_FALLBACK_DAYS = 30;

/** true, wenn eine reservierte Anzeige wieder aktiv werden muss. Grenzfall: genau 30 Tage zählen noch nicht. */
export function reservationLapsed(status: StoredStatus, statusChangedAt: Date, now: Date): boolean {
  return status === 'reserved' && now.getTime() - statusChangedAt.getTime() > RESERVATION_FALLBACK_DAYS * 86_400_000;
}
/** Höchstens so viele Bilder je Mitglied und Stunde (ASVS 12.1.3). */
export const UPLOAD_QUOTA = { limit: 100, windowSeconds: 3600 };
/** Status, die gegen das Limit von 30 aktiven Anzeigen zählen (REQ-LST-011). */
export const COUNTED_STATUSES: StoredStatus[] = ['in_review', 'active', 'paused', 'reserved'];
/** Für andere Mitglieder sichtbare Status. */
export const PUBLIC_STATUSES: StoredStatus[] = ['active', 'reserved', 'completed'];
export const EDITABLE_STATUSES: StoredStatus[] = ['draft', 'in_review', 'active', 'paused', 'reserved', 'expired'];

/** Zustandsmodell Anzeige (Anforderungskatalog §1.2), Übergänge durch den Anbieter. */
const transitions: Record<ListingAction, { from: StoredStatus[]; to: ListingStatus }> = {
  pause: { from: ['active'], to: 'paused' },
  resume: { from: ['paused'], to: 'active' },
  reserve: { from: ['active'], to: 'reserved' },
  unreserve: { from: ['reserved'], to: 'active' },
  complete: { from: ['active', 'reserved'], to: 'completed' },
  extend: { from: ['active', 'expired'], to: 'active' },
};

export function nextStatus(current: StoredStatus, action: ListingAction): ListingStatus | null {
  const t = transitions[action];
  return t.from.includes(current) ? t.to : null;
}

export type PriceCheck = { ok: true; priceCents: number | null } | { ok: false; message: string };

/** REQ-LST-002: Festpreis/VB 0 < Preis ≤ 10.000 €, sonst kein Preis. */
export function checkPrice(priceType: PriceType, priceCents: number | null | undefined): PriceCheck {
  if (priceType === 'free' || priceType === 'swap') return { ok: true, priceCents: null };
  if (priceCents === null || priceCents === undefined) return { ok: false, message: 'Bitte gib einen Preis an.' };
  if (!Number.isInteger(priceCents) || priceCents < 1 || priceCents > 1_000_000) {
    return { ok: false, message: 'Der Preis muss zwischen 0,01 € und 10.000 € liegen.' };
  }
  return { ok: true, priceCents };
}

/**
 * Verbotsliste (REQ-LST-010). Treffer leiten die Anzeige vor der Veröffentlichung in die Moderation.
 * Bewusst konservativ; die Liste ist Konfiguration und würde im Echtbetrieb gepflegt.
 */
export const PROHIBITED_TERMS = [
  'waffe', 'waffen', 'pistole', 'revolver', 'gewehr', 'munition', 'schreckschuss', 'butterflymesser',
  'drogen', 'kokain', 'cannabis', 'marihuana', 'haschisch', 'ecstasy', 'mdma', 'lsd',
  'rezeptpflichtig', 'verschreibungspflichtig', 'tilidin', 'oxycodon', 'ritalin', 'medikinet', 'tramadol',
  'prüfungslösung', 'prüfungslösungen', 'klausurlösung', 'klausurlösungen', 'klausurfragen vorab',
  'ghostwriting', 'ghostwriter', 'hausarbeit schreiben lassen',
  'gefälscht', 'fälschung', 'studentenausweis', 'personalausweis',
];

const normalize = (text: string) =>
  ` ${text.toLowerCase().replace(/ß/g, 'ss').replace(/[^a-z0-9äöü]+/g, ' ')} `;

export function findProhibitedTerms(...texts: string[]): string[] {
  const haystack = normalize(texts.join(' '));
  return PROHIBITED_TERMS.filter((term) => haystack.includes(normalize(term)));
}

/** Magic Bytes statt Dateiendung/MIME-Header (REQ-SEC-007). */
export function sniffImageType(buffer: Buffer): 'jpeg' | 'png' | 'webp' | 'heic' | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpeg';
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  if (buffer.toString('ascii', 4, 8) === 'ftyp' && /^(heic|heix|hevc|mif1|msf1)$/.test(buffer.toString('ascii', 8, 12))) {
    return 'heic';
  }
  return null;
}

export const IMAGE_SIZES = { sm: 400, md: 900, lg: 1600 } as const;
