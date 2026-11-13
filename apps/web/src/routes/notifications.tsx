import { Link, useNavigate } from '@tanstack/react-router';
import type { AppNotification, NotificationKind } from '@campusmarkt/contracts';
import { errorMessage } from '../api/client';
import { useMarkAllNotifications, useMarkNotification, useNotificationList, useUnreadNotifications } from '../api/notifications';
import { ErrorView } from '../components/ErrorPages';
import { Alert, Badge, Button, cx, EmptyState, Loading, PageHeader } from '../components/ui';
import { formatDateTime, formatMoney } from '../lib/format';
import { t, type MessageKey } from '../i18n';

const TEXT: Record<NotificationKind, MessageKey> = {
  listing_expiry: 'notifications.kind.listing_expiry',
  reservation_expired: 'notifications.kind.reservation_expired',
  moderation_notice: 'notifications.kind.moderation_notice',
  appeal_result: 'notifications.kind.appeal_result',
  offer_received: 'notifications.kind.offer_received',
  offer_countered: 'notifications.kind.offer_countered',
  offer_accepted: 'notifications.kind.offer_accepted',
  offer_declined: 'notifications.kind.offer_declined',
  offer_unavailable: 'notifications.kind.offer_unavailable',
  rating_possible: 'notifications.kind.rating_possible',
  listing_renewal_due: 'notifications.kind.listing_renewal_due',
  listing_auto_paused: 'notifications.kind.listing_auto_paused',
  listing_deleted: 'notifications.kind.listing_deleted',
  deal_reserved: 'notifications.kind.deal_reserved',
  deal_cancelled: 'notifications.kind.deal_cancelled',
  deal_completed: 'notifications.kind.deal_completed',
};

/** Ziel beim Öffnen (REQ-NOTI-008, Tabelle „Arten“). */
function target(n: AppNotification): { to: string; params?: Record<string, string> } {
  if (n.kind === 'moderation_notice' || n.kind === 'appeal_result') return { to: '/me/notices' };
  if (n.data.conversationId) return { to: '/messages/$id', params: { id: n.data.conversationId } };
  if (n.kind === 'listing_auto_paused' || n.kind === 'listing_deleted') return { to: '/me/listings' };
  if (n.data.listingId) return { to: '/listings/$id', params: { id: n.data.listingId } };
  return { to: '/' };
}

function text(n: AppNotification): string {
  return t(TEXT[n.kind], {
    title: n.data.listingTitle ?? t('notifications.yourListing'),
    amount: n.data.amountCents != null ? formatMoney(n.data.amountCents, n.data.currency ?? 'EUR') : '',
    date: n.data.dueAt ? formatDateTime(n.data.dueAt) : '',
  });
}

export function NotificationsPage() {
  const list = useNotificationList();
  const { data: unread } = useUnreadNotifications();
  const mark = useMarkNotification();
  const markAll = useMarkAllNotifications();
  const navigate = useNavigate();

  if (list.isPending) return <Loading />;
  if (list.isError) return <ErrorView error={list.error} onRetry={() => void list.refetch()} />;
  const items = list.data.pages.flatMap((p) => p.items);
  const count = unread?.count ?? items.filter((n) => !n.readAt).length;

  const open = (n: AppNotification) => {
    const go = () => void navigate(target(n) as never);
    if (n.readAt) go();
    else mark.mutate({ id: n.id, read: true }, { onSettled: go });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader
        title={t('notifications.title')}
        actions={
          count > 0 && (
            <Button variant="secondary" busy={markAll.isPending} onClick={() => markAll.mutate()}>
              {t('notifications.markAllRead')}
            </Button>
          )
        }
      />
      <p className="text-sm text-slate-600" aria-live="polite">
        {count > 0 ? t('notifications.unreadCount', { count }) : t('notifications.allRead')}
      </p>
      {(mark.isError || markAll.isError) && <Alert tone="error">{errorMessage(mark.error ?? markAll.error)}</Alert>}
      {items.length === 0 ? (
        <EmptyState>{t('notifications.empty')}</EmptyState>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
          {items.map((n) => (
            <li key={n.id} className={cx('flex flex-wrap items-start gap-3 p-3', !n.readAt && 'bg-brand-50')}>
              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => open(n)}
                  className={cx('text-left text-brand-700 underline', !n.readAt && 'font-bold')}
                >
                  {text(n)}
                </button>
                <p className="mt-1 flex items-center gap-2 text-xs text-slate-600">
                  {!n.readAt && <Badge tone="info">{t('notifications.new')}</Badge>}
                  <time dateTime={n.createdAt}>{formatDateTime(n.createdAt)}</time>
                </p>
              </div>
              <Button variant="ghost" onClick={() => mark.mutate({ id: n.id, read: !n.readAt })}>
                {n.readAt ? t('notifications.markUnread') : t('notifications.markRead')}
              </Button>
            </li>
          ))}
        </ul>
      )}
      {list.hasNextPage && (
        <div className="flex justify-center">
          <Button variant="secondary" busy={list.isFetchingNextPage} onClick={() => void list.fetchNextPage()}>
            {t('search.loadMore')}
          </Button>
        </div>
      )}
      <p className="text-sm">
        <Link to="/profile" className="text-brand-700 underline">
          {t('notifications.settings')}
        </Link>
      </p>
    </div>
  );
}
