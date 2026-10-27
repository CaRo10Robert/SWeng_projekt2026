import { Link } from '@tanstack/react-router';
import { useFavorites, useMyListings } from '../api/listings';
import { errorMessage } from '../api/client';
import { ListingGrid } from '../components/ListingCard';
import { Alert, buttonClass, EmptyState, Loading, PageHeader } from '../components/ui';
import { t } from '../i18n';

export function MyListingsPage() {
  const { data, isPending, isError, error } = useMyListings();
  return (
    <div>
      <PageHeader
        title={t('nav.myListings')}
        actions={
          <Link to="/listings/new" className={buttonClass('primary')}>
            {t('myListings.new')}
          </Link>
        }
      />
      {isPending ? (
        <Loading />
      ) : isError ? (
        <Alert tone="error">{errorMessage(error)}</Alert>
      ) : data.length === 0 ? (
        <EmptyState>{t('myListings.empty')}</EmptyState>
      ) : (
        <ListingGrid items={data} showStatus />
      )}
    </div>
  );
}

export function FavoritesPage() {
  const { data, isPending, isError, error } = useFavorites();
  return (
    <div>
      <PageHeader title={t('nav.favorites')} />
      {isPending ? (
        <Loading />
      ) : isError ? (
        <Alert tone="error">{errorMessage(error)}</Alert>
      ) : data.length === 0 ? (
        <EmptyState>{t('favorites.empty')}</EmptyState>
      ) : (
        <ListingGrid items={data} />
      )}
    </div>
  );
}
