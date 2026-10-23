import type {
  Condition,
  ListingKind,
  ListingStatus,
  PriceType,
  ReportReason,
  Role,
  UserType,
} from '@campusmarkt/contracts';

export function formatMoney(cents: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(cents / 100);
}

export function formatPrice(priceType: PriceType, priceCents: number | null, currency = 'EUR'): string {
  switch (priceType) {
    case 'free':
      return 'Zu verschenken';
    case 'swap':
      return 'Tausch';
    case 'negotiable':
      return priceCents != null ? `${formatMoney(priceCents, currency)} VB` : 'VB';
    case 'fixed':
      return priceCents != null ? formatMoney(priceCents, currency) : '–';
  }
}

const dateFmt = new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium' });
const dateTimeFmt = new Intl.DateTimeFormat('de-DE', { dateStyle: 'short', timeStyle: 'short' });
const timeFmt = new Intl.DateTimeFormat('de-DE', { timeStyle: 'short' });

export const formatDate = (iso: string) => dateFmt.format(new Date(iso));
export const formatDateTime = (iso: string) => dateTimeFmt.format(new Date(iso));

export function formatChatTime(iso: string): string {
  const d = new Date(iso);
  return d.toDateString() === new Date().toDateString() ? timeFmt.format(d) : dateTimeFmt.format(d);
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

export const kindLabels: Record<ListingKind, string> = { offer: 'Angebot', wanted: 'Gesuch' };

export const priceTypeLabels: Record<PriceType, string> = {
  fixed: 'Festpreis',
  negotiable: 'Verhandlungsbasis (VB)',
  free: 'Zu verschenken',
  swap: 'Tausch',
};

export const conditionLabels: Record<Condition, string> = {
  new: 'Neu',
  like_new: 'Wie neu',
  good: 'Gut',
  acceptable: 'Akzeptabel',
  defective: 'Defekt',
};

export const statusLabels: Record<ListingStatus, string> = {
  draft: 'Entwurf',
  in_review: 'In Prüfung',
  active: 'Aktiv',
  paused: 'Pausiert',
  reserved: 'Reserviert',
  completed: 'Abgegeben',
  expired: 'Abgelaufen',
  removed: 'Entfernt',
};

export const userTypeLabels: Record<UserType, string> = { student: 'Studierende/r', staff: 'Beschäftigte/r' };

export const roleLabels: Record<Role, string> = { member: 'Mitglied', moderator: 'Moderation', admin: 'Administration' };

export const reasonLabels: Record<ReportReason, string> = {
  prohibited_item: 'Verbotener Artikel',
  fraud: 'Betrugsverdacht',
  harassment: 'Belästigung / Beleidigung',
  spam: 'Spam',
  wrong_category: 'Falsche Kategorie',
  other: 'Sonstiges',
  auto_filter: 'Automatischer Wortfilter',
};

export function newId(): string {
  return crypto.randomUUID();
}
