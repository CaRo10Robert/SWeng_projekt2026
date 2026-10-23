import { Link } from '@tanstack/react-router';
import { useFavorites, useMyListings } from '../api/listings';
import { errorMessage } from '../api/client';
import { ListingGrid } from '../components/ListingCard';
import { Alert, buttonClass, EmptyState, Loading, PageHeader } from '../components/ui';

export function MyListingsPage() {
  const { data, isPending, isError, error } = useMyListings();
  return (
    <div>
      <PageHeader
        title="Meine Anzeigen"
        actions={
          <Link to="/listings/new" className={buttonClass('primary')}>
            Neue Anzeige
          </Link>
        }
      />
      {isPending ? (
        <Loading />
      ) : isError ? (
        <Alert tone="error">{errorMessage(error)}</Alert>
      ) : data.length === 0 ? (
        <EmptyState>Du hast noch keine Anzeigen. Was liegt bei dir herum, das jemand anderes brauchen könnte?</EmptyState>
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
      <PageHeader title="Merkliste" />
      {isPending ? (
        <Loading />
      ) : isError ? (
        <Alert tone="error">{errorMessage(error)}</Alert>
      ) : data.length === 0 ? (
        <EmptyState>Noch nichts gemerkt. Tippe in einer Anzeige auf „Merken“.</EmptyState>
      ) : (
        <ListingGrid items={data} />
      )}
    </div>
  );
}
