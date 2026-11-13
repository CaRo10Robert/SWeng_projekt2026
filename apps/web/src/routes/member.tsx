import { useState } from 'react';
import { Link, useParams } from '@tanstack/react-router';
import { useMeta } from '../api/auth';
import { errorMessage } from '../api/client';
import { useMemberListings, useMemberProfile } from '../api/members';
import { useSetBlock } from '../api/trust';
import { Dialog } from '../components/Dialog';
import { ErrorView } from '../components/ErrorPages';
import { ListingGrid } from '../components/ListingCard';
import { ReportDialog } from '../components/ReportDialog';
import { Alert, Button, buttonClass, Card, EmptyState, FormError, Loading, PageHeader } from '../components/ui';
import { formatMonthYear, userTypeLabels } from '../lib/format';
import { t } from '../i18n';

/**
 * Profil eines anderen Mitglieds (REQ-ACC-005, UC-18): öffentliche Angaben und aktive Anzeigen, nie Kontaktdaten.
 * Erreichbar über den Anbieter in der Anzeige und das Gegenüber im Chat. Blockierte, gesperrte, gelöschte und
 * ausgeblendete Profile liefern „Profil nicht verfügbar“ (404).
 */
export function MemberProfilePage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const profile = useMemberProfile(id);
  const listings = useMemberListings(id, profile.isSuccess);
  const { data: meta } = useMeta();
  const block = useSetBlock();
  const [reportOpen, setReportOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);

  if (profile.isPending) return <Loading />;
  if (profile.isError) return <ErrorView error={profile.error} notFound="profileNotFound" onRetry={() => void profile.refetch()} />;

  const p = profile.data;
  const locations = p.preferredLocationIds.map((lid) => meta?.locations.find((l) => l.id === lid)?.name).filter(Boolean);
  const items = listings.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={p.displayName}
        actions={
          p.isSelf ? (
            <Link to="/profile" className={buttonClass('secondary')}>
              {t('member.editOwn')}
            </Link>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" onClick={() => setReportOpen(true)}>
                {t('member.report')}
              </Button>
              <Button variant="ghost" onClick={() => setBlockOpen(true)}>
                {t('member.block')}
              </Button>
            </div>
          )
        }
      />

      <Card>
        <h2 className="sr-only">{t('member.about')}</h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="font-medium text-slate-600">{t('member.userType')}</dt>
          <dd>{userTypeLabels[p.userType]}</dd>
          <dt className="font-medium text-slate-600">{t('member.since')}</dt>
          <dd>{formatMonthYear(p.memberSince)}</dd>
          {p.studyProgram && (
            <>
              <dt className="font-medium text-slate-600">{t('member.studyProgram')}</dt>
              <dd>{p.studyProgram}</dd>
            </>
          )}
          {locations.length > 0 && (
            <>
              <dt className="font-medium text-slate-600">{t('profile.locations')}</dt>
              <dd>{locations.join(', ')}</dd>
            </>
          )}
        </dl>
      </Card>

      <section aria-labelledby="member-listings" className="space-y-3">
        <h2 id="member-listings" className="text-lg font-semibold">
          {t('member.listings')}
        </h2>
        {listings.isPending ? (
          <Loading />
        ) : listings.isError ? (
          <Alert tone="error">{errorMessage(listings.error)}</Alert>
        ) : items.length === 0 ? (
          <EmptyState>{t('member.noListings')}</EmptyState>
        ) : (
          <>
            <ListingGrid items={items} showStatus />
            {listings.hasNextPage && (
              <div className="flex justify-center">
                <Button variant="secondary" busy={listings.isFetchingNextPage} onClick={() => void listings.fetchNextPage()}>
                  {t('search.loadMore')}
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      {!p.isSelf && (
        <>
          <ReportDialog open={reportOpen} onClose={() => setReportOpen(false)} targetType="user" targetId={p.id} />
          <Dialog open={blockOpen} onClose={() => setBlockOpen(false)} title={t('listing.block.title', { name: p.displayName })}>
            {block.isSuccess ? (
              <>
                <Alert tone="success">{t('listing.block.done')}</Alert>
                <Link to="/" className={buttonClass('primary')}>
                  {t('listing.block.toSearch')}
                </Link>
              </>
            ) : (
              <>
                <p>{t('listing.block.text')}</p>
                <FormError error={block.isError ? errorMessage(block.error) : null} />
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => setBlockOpen(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button variant="danger" busy={block.isPending} onClick={() => block.mutate({ userId: p.id, blocked: true })}>
                    {t('listing.block.submit')}
                  </Button>
                </div>
              </>
            )}
          </Dialog>
        </>
      )}
    </div>
  );
}
