import type {
  Condition,
  ListingKind,
  ListingStatus,
  PriceType,
  ReportReason,
  Role,
  UserType,
} from '@campusmarkt/contracts';
import { intlLocale, t, type MessageKey } from '../i18n';

// Formate folgen der gewählten Sprache (REQ-UX-007); Formatierer je Sprache zwischengespeichert
const formatters = new Map<string, Intl.NumberFormat | Intl.DateTimeFormat>();
function cached<F extends Intl.NumberFormat | Intl.DateTimeFormat>(key: string, make: (locale: string) => F): F {
  const locale = intlLocale();
  const id = `${locale}|${key}`;
  let f = formatters.get(id);
  if (!f) formatters.set(id, (f = make(locale)));
  return f as F;
}

export function formatMoney(cents: number, currency = 'EUR'): string {
  return cached(`money:${currency}`, (l) => new Intl.NumberFormat(l, { style: 'currency', currency })).format(cents / 100);
}

export function formatPrice(priceType: PriceType, priceCents: number | null, currency = 'EUR'): string {
  switch (priceType) {
    case 'free':
      return t('price.free');
    case 'swap':
      return t('price.swap');
    case 'negotiable':
      return priceCents != null ? t('price.negotiableAmount', { amount: formatMoney(priceCents, currency) }) : t('price.negotiableShort');
    case 'fixed':
      return priceCents != null ? formatMoney(priceCents, currency) : '–';
  }
}

const dateFmt = () => cached('date', (l) => new Intl.DateTimeFormat(l, { dateStyle: 'medium' }));
const dateTimeFmt = () => cached('datetime', (l) => new Intl.DateTimeFormat(l, { dateStyle: 'short', timeStyle: 'short' }));
const timeFmt = () => cached('time', (l) => new Intl.DateTimeFormat(l, { timeStyle: 'short' }));

export const formatDate = (iso: string) => dateFmt().format(new Date(iso));
export const formatDateTime = (iso: string) => dateTimeFmt().format(new Date(iso));

export function formatChatTime(iso: string): string {
  const d = new Date(iso);
  return d.toDateString() === new Date().toDateString() ? timeFmt().format(d) : dateTimeFmt().format(d);
}

/** "12,50" oder "12.5" → 1250; leer/ungültig → null */
export function parseEuroToCents(input: string): number | null {
  const normalized = input.trim().replace(/\s|€/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
  if (!normalized) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  return Math.round(Number(normalized) * 100);
}

export const centsToEuroInput = (cents: number | null | undefined) =>
  cents == null ? '' : (cents / 100).toFixed(2).replace('.', ',');

/**
 * Beschriftungen als Getter: Sie werden beim Zugriff übersetzt, nicht beim Laden des Moduls, und folgen so der
 * gewählten Sprache. `Object.entries` liefert die übersetzten Werte.
 */
export function labels<K extends string>(keys: Record<K, MessageKey>): Record<K, string> {
  const out = {} as Record<K, string>;
  for (const [k, id] of Object.entries(keys) as [K, MessageKey][]) {
    Object.defineProperty(out, k, { enumerable: true, get: () => t(id) });
  }
  return out;
}

export const kindLabels = labels<ListingKind>({ offer: 'listing.kind.offer', wanted: 'listing.kind.wanted' });

export const priceTypeLabels = labels<PriceType>({
  fixed: 'listing.priceType.fixed',
  negotiable: 'listing.priceType.negotiable',
  free: 'listing.priceType.free',
  swap: 'listing.priceType.swap',
});

export const conditionLabels = labels<Condition>({
  new: 'listing.condition.new',
  like_new: 'listing.condition.like_new',
  good: 'listing.condition.good',
  acceptable: 'listing.condition.acceptable',
  defective: 'listing.condition.defective',
});

export const statusLabels = labels<ListingStatus>({
  draft: 'listing.status.draft',
  in_review: 'listing.status.in_review',
  active: 'listing.status.active',
  paused: 'listing.status.paused',
  reserved: 'listing.status.reserved',
  completed: 'listing.status.completed',
  expired: 'listing.status.expired',
  removed: 'listing.status.removed',
});

export const userTypeLabels = labels<UserType>({ student: 'user.type.student', staff: 'user.type.staff' });

export const roleLabels = labels<Role>({ member: 'user.role.member', moderator: 'user.role.moderator', admin: 'user.role.admin' });

export const reasonLabels = labels<ReportReason>({
  prohibited_item: 'report.reason.prohibited_item',
  fraud: 'report.reason.fraud',
  harassment: 'report.reason.harassment',
  spam: 'report.reason.spam',
  wrong_category: 'report.reason.wrong_category',
  other: 'report.reason.other',
  auto_filter: 'report.reason.auto_filter',
});

export function newId(): string {
  return crypto.randomUUID();
}
