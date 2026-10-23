import { Link } from '@tanstack/react-router';
import type { ListingCard as Card, ListingStatus } from '@campusmarkt/contracts';
import { formatDate, formatPrice, kindLabels, statusLabels } from '../lib/format';
import { Badge, type Tone } from './ui';

const statusTone: Record<ListingStatus, Tone> = {
  draft: 'neutral',
  in_review: 'warning',
  active: 'success',
  paused: 'neutral',
  reserved: 'info',
  completed: 'neutral',
  expired: 'warning',
  removed: 'danger',
};

export function StatusBadge({ status }: { status: ListingStatus }) {
  return <Badge tone={statusTone[status]}>{statusLabels[status]}</Badge>;
}

export function PriceTag({ listing, className }: { listing: Pick<Card, 'priceType' | 'priceCents' | 'currency'>; className?: string }) {
  return <span className={className ?? 'font-bold text-brand-800'}>{formatPrice(listing.priceType, listing.priceCents, listing.currency)}</span>;
}

export function ImagePlaceholder({ label = 'Kein Bild' }: { label?: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-slate-100 text-sm text-slate-600" role="img" aria-label={label}>
      <span aria-hidden="true" className="text-3xl">
        📦
      </span>
    </div>
  );
}

export function ListingCard({ listing, showStatus }: { listing: Card; showStatus?: boolean }) {
  return (
    <li className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow focus-within:shadow-md hover:shadow-md">
      <Link to="/listings/$id" params={{ id: listing.id }} className="block h-full">
        <div className="aspect-[4/3] bg-slate-100">
          {listing.thumbnailUrl ? (
            <img src={listing.thumbnailUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <ImagePlaceholder />
          )}
        </div>
        <div className="space-y-1 p-3">
          <div className="flex flex-wrap items-center gap-1">
            {listing.kind === 'wanted' && <Badge tone="info">{kindLabels.wanted}</Badge>}
            {(showStatus || listing.status !== 'active') && <StatusBadge status={listing.status} />}
          </div>
          <h3 className="line-clamp-2 font-semibold text-slate-900">{listing.title}</h3>
          <p>
            <PriceTag listing={listing} />
          </p>
          <p className="text-xs text-slate-600">{formatDate(listing.createdAt)}</p>
        </div>
      </Link>
    </li>
  );
}

export function ListingGrid({ items, showStatus }: { items: Card[]; showStatus?: boolean }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((l) => (
        <ListingCard key={l.id} listing={l} showStatus={showStatus} />
      ))}
    </ul>
  );
}
