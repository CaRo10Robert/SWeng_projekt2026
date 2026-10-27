import { useState, type FormEvent } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import type { Condition, ListingKind, PriceType, SearchSort } from '@campusmarkt/contracts';
import { useMeta } from '../api/auth';
import { useSearch as useListingSearch, type SearchFilters } from '../api/listings';
import { errorMessage } from '../api/client';
import { ListingGrid } from '../components/ListingCard';
import { Alert, Button, EmptyState, Field, Loading, Select } from '../components/ui';
import { centsToEuroInput, conditionLabels, kindLabels, parseEuroToCents, priceTypeLabels } from '../lib/format';
import { t, type MessageKey } from '../i18n';

const str = (v: unknown) => (typeof v === 'string' && v ? v : undefined);
const int = (v: unknown) => {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
  return Number.isInteger(n) && n >= 0 ? n : undefined;
};
const oneOf = <T extends string>(v: unknown, values: readonly T[]) => (values.includes(v as T) ? (v as T) : undefined);

const kinds = ['offer', 'wanted'] as const satisfies readonly ListingKind[];
const priceTypes = ['fixed', 'negotiable', 'free', 'swap'] as const satisfies readonly PriceType[];
const conditions = ['new', 'like_new', 'good', 'acceptable', 'defective'] as const satisfies readonly Condition[];
const sorts = ['relevance', 'newest', 'price_asc', 'price_desc'] as const satisfies readonly SearchSort[];
const sortLabels: Record<SearchSort, MessageKey> = {
  relevance: 'search.sort.relevance',
  newest: 'search.sort.newest',
  price_asc: 'search.sort.price_asc',
  price_desc: 'search.sort.price_desc',
};

export function validateSearchFilters(s: Record<string, unknown>): SearchFilters {
  return {
    q: str(s.q),
    categoryId: str(s.categoryId),
    kind: oneOf(s.kind, kinds),
    priceType: oneOf(s.priceType, priceTypes),
    minPriceCents: int(s.minPriceCents),
    maxPriceCents: int(s.maxPriceCents),
    locationId: str(s.locationId),
    condition: oneOf(s.condition, conditions),
    sort: oneOf(s.sort, sorts),
  };
}

function clean(f: SearchFilters): SearchFilters {
  return Object.fromEntries(Object.entries(f).filter(([, v]) => v !== undefined && v !== '')) as SearchFilters;
}

export function SearchPage() {
  const filters = useSearch({ strict: false }) as SearchFilters;
  const navigate = useNavigate();
  const { data: meta } = useMeta();
  const search = useListingSearch(clean(filters));
  const [q, setQ] = useState(filters.q ?? '');
  const [minPrice, setMinPrice] = useState(centsToEuroInput(filters.minPriceCents));
  const [maxPrice, setMaxPrice] = useState(centsToEuroInput(filters.maxPriceCents));
  const [showFilters, setShowFilters] = useState(false);

  const update = (patch: Partial<SearchFilters>) =>
    void navigate({ to: '/', search: clean({ ...filters, ...patch }), replace: true });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    update({
      q: q.trim() || undefined,
      minPriceCents: parseEuroToCents(minPrice) ?? undefined,
      maxPriceCents: parseEuroToCents(maxPrice) ?? undefined,
    });
  };

  const reset = () => {
    setQ('');
    setMinPrice('');
    setMaxPrice('');
    void navigate({ to: '/', search: {}, replace: true });
  };

  const items = search.data?.pages.flatMap((p) => p.items) ?? [];
  const degraded = search.data?.pages.some((p) => p.degraded);

  return (
    <div className="space-y-4">
      <h1 className="sr-only">{t('search.title')}</h1>
      <form role="search" onSubmit={submit} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex gap-2">
          <div className="flex-1">
            <label htmlFor="q" className="sr-only">
              {t('search.term')}
            </label>
            <input
              id="q"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              maxLength={100}
              placeholder={t('search.placeholder')}
              className="block w-full rounded-lg border border-slate-400 px-3 py-2 text-base"
            />
          </div>
          <Button type="submit">{t('common.search')}</Button>
        </div>
        <button
          type="button"
          className="text-sm font-medium text-brand-700 underline md:hidden"
          aria-expanded={showFilters}
          aria-controls="filters"
          onClick={() => setShowFilters((s) => !s)}
        >
          {showFilters ? t('search.hideFilters') : t('search.showFilters')}
        </button>
        <fieldset id="filters" className={`${showFilters ? 'grid' : 'hidden'} grid-cols-1 gap-3 sm:grid-cols-2 md:grid lg:grid-cols-4`}>
          <legend className="sr-only">{t('search.filters')}</legend>
          <Select
            label={t('search.category')}
            placeholder={t('search.allCategories')}
            value={filters.categoryId ?? ''}
            onChange={(e) => update({ categoryId: e.target.value || undefined })}
            options={(meta?.categories ?? []).map((c) => ({ value: c.id, label: c.name }))}
          />
          <Select
            label={t('search.kind')}
            placeholder={t('search.allKinds')}
            value={filters.kind ?? ''}
            onChange={(e) => update({ kind: (e.target.value || undefined) as ListingKind | undefined })}
            options={kinds.map((k) => ({ value: k, label: kindLabels[k] }))}
          />
          <Select
            label={t('search.priceType')}
            placeholder={t('search.allPriceTypes')}
            value={filters.priceType ?? ''}
            onChange={(e) => update({ priceType: (e.target.value || undefined) as PriceType | undefined })}
            options={priceTypes.map((p) => ({ value: p, label: priceTypeLabels[p] }))}
          />
          <Select
            label={t('search.location')}
            placeholder={t('search.allLocations')}
            value={filters.locationId ?? ''}
            onChange={(e) => update({ locationId: e.target.value || undefined })}
            options={(meta?.locations ?? []).map((l) => ({ value: l.id, label: l.name }))}
          />
          <Select
            label={t('search.condition')}
            placeholder={t('search.anyCondition')}
            value={filters.condition ?? ''}
            onChange={(e) => update({ condition: (e.target.value || undefined) as Condition | undefined })}
            options={conditions.map((c) => ({ value: c, label: conditionLabels[c] }))}
          />
          <Field label={t('search.priceFrom')} inputMode="decimal" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} onBlur={() => update({ minPriceCents: parseEuroToCents(minPrice) ?? undefined })} />
          <Field label={t('search.priceTo')} inputMode="decimal" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} onBlur={() => update({ maxPriceCents: parseEuroToCents(maxPrice) ?? undefined })} />
          <Select
            label={t('search.sort')}
            value={filters.sort ?? (filters.q ? 'relevance' : 'newest')}
            onChange={(e) => update({ sort: e.target.value as SearchSort })}
            options={sorts.map((s) => ({ value: s, label: t(sortLabels[s]) }))}
          />
          <div className="flex items-end">
            <Button variant="ghost" onClick={reset}>
              {t('search.resetFilters')}
            </Button>
          </div>
        </fieldset>
      </form>

      {degraded && <Alert tone="warning">{t('search.degraded')}</Alert>}

      <section aria-labelledby="results-heading" aria-busy={search.isFetching}>
        <h2 id="results-heading" className="mb-3 text-lg font-semibold">
          {filters.q ? t('search.resultsFor', { q: filters.q }) : t('search.latest')}
        </h2>
        {search.isPending ? (
          <Loading />
        ) : search.isError ? (
          <Alert tone="error">{errorMessage(search.error)}</Alert>
        ) : items.length === 0 ? (
          <EmptyState>{t('search.noResults')}</EmptyState>
        ) : (
          <>
            <ListingGrid items={items} />
            {search.hasNextPage && (
              <div className="mt-4 flex justify-center">
                <Button variant="secondary" busy={search.isFetchingNextPage} onClick={() => void search.fetchNextPage()}>
                  {t('search.loadMore')}
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
