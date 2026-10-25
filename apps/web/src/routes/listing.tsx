import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import type { ListingAction, ListingDetail, ListingStatus } from '@campusmarkt/contracts';
import { useMeta } from '../api/auth';
import { useDeleteListing, useListing, useListingAction, useToggleFavorite } from '../api/listings';
import { useStartConversation } from '../api/messaging';
import { useSetBlock } from '../api/trust';
import { ApiError, errorMessage } from '../api/client';
import { Dialog } from '../components/Dialog';
import { ImagePlaceholder, PriceTag, StatusBadge } from '../components/ListingCard';
import { ReportDialog } from '../components/ReportDialog';
import { Alert, Badge, Button, buttonClass, Card, FormError, Loading, TextArea } from '../components/ui';
import { conditionLabels, formatDate, kindLabels, newId, userTypeLabels } from '../lib/format';
import { t, type MessageKey } from '../i18n';

const actionLabels: Record<ListingAction, MessageKey> = {
  pause: 'listing.action.pause',
  resume: 'listing.action.resume',
  reserve: 'listing.action.reserve',
  unreserve: 'listing.action.unreserve',
  complete: 'listing.action.complete',
  extend: 'listing.action.extend',
};

const actionsByStatus: Partial<Record<ListingStatus, ListingAction[]>> = {
  active: ['reserve', 'complete', 'pause'],
  paused: ['resume'],
  reserved: ['complete', 'unreserve'],
  expired: ['extend'],
};

const editable: ListingStatus[] = ['draft', 'in_review', 'active', 'paused', 'reserved', 'expired'];

function Gallery({ listing }: { listing: ListingDetail }) {
  const [index, setIndex] = useState(0);
  const images = listing.images;
  const current = images[index];
  return (
    <div className="space-y-2">
      <div className="aspect-[4/3] overflow-hidden rounded-xl bg-slate-100">
        {!current ? (
          <ImagePlaceholder />
        ) : current.status === 'ready' ? (
          <a href={`${current.url}/lg`} target="_blank" rel="noreferrer" aria-label={t('listing.openImage', { n: index + 1 })}>
            <img src={`${current.url}/md`} alt={t('listing.imageAlt', { title: listing.title, n: index + 1, total: images.length })} className="h-full w-full object-contain" />
          </a>
        ) : (
          <ImagePlaceholder label={current.status === 'processing' ? t('listing.imageProcessing') : t('listing.imageFailed')} />
        )}
      </div>
      {images.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto" aria-label={t('listing.chooseImage')}>
          {images.map((img, i) => (
            <li key={img.id}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={t('listing.showImage', { n: i + 1 })}
                aria-current={i === index}
                className={`h-16 w-16 overflow-hidden rounded-lg border-2 ${i === index ? 'border-brand-700' : 'border-transparent'}`}
              >
                {img.status === 'ready' ? <img src={`${img.url}/sm`} alt="" className="h-full w-full object-cover" /> : <ImagePlaceholder label="" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ContactBox({ listing }: { listing: ListingDetail }) {
  const navigate = useNavigate();
  const start = useStartConversation();
  const [body, setBody] = useState(() => t('listing.contact.defaultMessage'));
  const [clientMsgId] = useState(newId);

  if (listing.conversationId) {
    return (
      <Link to="/messages/$id" params={{ id: listing.conversationId }} className={buttonClass('primary', 'w-full')}>
        {t('listing.contact.toConversation')}
      </Link>
    );
  }
  if (listing.status !== 'active' && listing.status !== 'reserved') return null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    start.mutate(
      { listingId: listing.id, body: body.trim(), clientMsgId },
      { onSuccess: (res) => void navigate({ to: '/messages/$id', params: { id: res.conversationId } }) },
    );
  };

  const error = start.isError
    ? start.error instanceof ApiError && start.error.code === 'contact_not_possible'
      ? t('apiError.contact_not_possible')
      : errorMessage(start.error)
    : null;

  return (
    <form onSubmit={submit} className="space-y-2">
      <TextArea label={t('listing.contact.label')} rows={3} required maxLength={2000} value={body} onChange={(e) => setBody(e.target.value)} />
      <FormError error={error} />
      <Button type="submit" className="w-full" busy={start.isPending} disabled={!body.trim()}>
        {t('listing.contact.submit')}
      </Button>
    </form>
  );
}

function OwnerActions({ listing }: { listing: ListingDetail }) {
  const navigate = useNavigate();
  const action = useListingAction(listing.id);
  const remove = useDeleteListing(listing.id);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const actions = actionsByStatus[listing.status] ?? [];

  return (
    <Card className="space-y-3">
      <h2 className="font-semibold">{t('listing.owner.manage')}</h2>
      {listing.status === 'in_review' && <Alert tone="warning">{t('listing.owner.inReview')}</Alert>}
      {listing.status === 'removed' && <Alert tone="error">{t('listing.owner.removed')}</Alert>}
      {listing.expiresAt && listing.status === 'active' && <p className="text-sm text-slate-600">{t('listing.owner.expiresOn', { date: formatDate(listing.expiresAt) })}</p>}
      <div className="flex flex-col gap-2">
        {editable.includes(listing.status) && (
          <Link to="/listings/$id/edit" params={{ id: listing.id }} className={buttonClass('secondary')}>
            {t('listing.owner.edit')}
          </Link>
        )}
        {actions.map((a) => (
          <Button key={a} variant="secondary" busy={action.isPending && action.variables === a} onClick={() => action.mutate(a)}>
            {t(actionLabels[a])}
          </Button>
        ))}
        {listing.status !== 'removed' && (
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>
            {t('listing.owner.delete')}
          </Button>
        )}
      </div>
      <FormError error={action.isError ? errorMessage(action.error) : null} />
      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)} title={t('listing.owner.deleteTitle')}>
        <p>{t('listing.owner.deleteText', { title: listing.title })}</p>
        <FormError error={remove.isError ? errorMessage(remove.error) : null} />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
            {t('common.cancel')}
          </Button>
          <Button variant="danger" busy={remove.isPending} onClick={() => remove.mutate(undefined, { onSuccess: () => void navigate({ to: '/me/listings' }) })}>
            {t('listing.owner.deleteConfirm')}
          </Button>
        </div>
      </Dialog>
    </Card>
  );
}

export function ListingPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const { data: listing, isPending, isError, error } = useListing(id);
  const { data: meta } = useMeta();
  const favorite = useToggleFavorite(id);
  const block = useSetBlock();
  const [reportOpen, setReportOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);

  if (isPending) return <Loading />;
  if (isError) {
    return (
      <Alert tone="error" title={t('listing.unavailable')}>
        {error instanceof ApiError && error.status === 404 ? t('listing.notFound') : errorMessage(error)}
      </Alert>
    );
  }

  const category = meta?.categories.find((c) => c.id === listing.categoryId);
  const locations = listing.locationIds.map((lid) => meta?.locations.find((l) => l.id === lid)?.name).filter(Boolean);
  const attrs = listing.attributes;

  return (
    <article className="grid gap-6 md:grid-cols-[3fr_2fr]">
      <div className="space-y-4">
        <Gallery listing={listing} />
        <section aria-labelledby="desc-heading" className="space-y-2">
          <h2 id="desc-heading" className="text-lg font-semibold">
            {t('listing.description')}
          </h2>
          <p className="whitespace-pre-line text-slate-800">{listing.description}</p>
        </section>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          {category && (
            <>
              <dt className="font-medium text-slate-600">{t('search.category')}</dt>
              <dd>{category.name}</dd>
            </>
          )}
          {listing.condition && (
            <>
              <dt className="font-medium text-slate-600">{t('search.condition')}</dt>
              <dd>{conditionLabels[listing.condition]}</dd>
            </>
          )}
          {attrs.studyProgram && (
            <>
              <dt className="font-medium text-slate-600">{t('listing.studyProgram')}</dt>
              <dd>{attrs.studyProgram}</dd>
            </>
          )}
          {attrs.module && (
            <>
              <dt className="font-medium text-slate-600">{t('listing.module')}</dt>
              <dd>{attrs.module}</dd>
            </>
          )}
          {attrs.isbn && (
            <>
              <dt className="font-medium text-slate-600">ISBN</dt>
              <dd>{attrs.isbn}</dd>
            </>
          )}
          <dt className="font-medium text-slate-600">{t('listing.handover')}</dt>
          <dd>{locations.join(', ') || '–'}</dd>
          <dt className="font-medium text-slate-600">{t('listing.posted')}</dt>
          <dd>{formatDate(listing.createdAt)}</dd>
        </dl>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1">
            <Badge tone="info">{kindLabels[listing.kind]}</Badge>
            <StatusBadge status={listing.status} />
          </div>
          <h1 className="text-2xl font-bold">{listing.title}</h1>
          <p className="text-2xl">
            <PriceTag listing={listing} />
          </p>
        </div>

        <Card className="space-y-1">
          <h2 className="font-semibold">{t('listing.seller')}</h2>
          <p>{listing.owner.displayName}</p>
          <p className="text-sm text-slate-600">
            {userTypeLabels[listing.owner.userType]} · {t('profile.memberSince', { date: formatDate(listing.owner.memberSince) })}
          </p>
        </Card>

        {listing.isOwner ? (
          <OwnerActions listing={listing} />
        ) : (
          <>
            <ContactBox listing={listing} />
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" aria-pressed={listing.isFavorite} busy={favorite.isPending} onClick={() => favorite.mutate(!listing.isFavorite)}>
                {listing.isFavorite ? t('listing.saved') : t('listing.save')}
              </Button>
              <Button variant="ghost" onClick={() => setReportOpen(true)}>
                {t('listing.report')}
              </Button>
              <Button variant="ghost" onClick={() => setBlockOpen(true)}>
                {t('listing.blockSeller')}
              </Button>
            </div>
            <ReportDialog open={reportOpen} onClose={() => setReportOpen(false)} targetType="listing" targetId={listing.id} />
            <Dialog open={blockOpen} onClose={() => setBlockOpen(false)} title={t('listing.block.title', { name: listing.owner.displayName })}>
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
                    <Button variant="danger" busy={block.isPending} onClick={() => block.mutate({ userId: listing.owner.id, blocked: true })}>
                      {t('listing.block.submit')}
                    </Button>
                  </div>
                </>
              )}
            </Dialog>
          </>
        )}
      </div>
    </article>
  );
}
