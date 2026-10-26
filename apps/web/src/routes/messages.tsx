import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useParams } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import type { ConversationSummary, DealStatus, Message, SystemCode } from '@campusmarkt/contracts';
import { useMe } from '../api/auth';
import { addMessageToCache, markRead, sendMessage, useConversation, useConversations, useDealAction, useMessages } from '../api/messaging';
import { useSetBlock } from '../api/trust';
import { ApiError, errorMessage, NetworkError } from '../api/client';
import { ImagePlaceholder, StatusBadge } from '../components/ListingCard';
import { ReportDialog } from '../components/ReportDialog';
import { ContactShare } from '../components/ContactShare';
import { Alert, Badge, Button, EmptyState, FormError, Loading, PageHeader, cx } from '../components/ui';
import { formatChatTime, newId } from '../lib/format';
import { t, type MessageKey } from '../i18n';

const dealLabels: Record<DealStatus, MessageKey> = {
  agreed: 'chat.deal.agreed',
  completed: 'chat.deal.completed',
  cancelled: 'chat.deal.cancelled',
};

/**
 * Systemnachrichten tragen einen Code (Migration 0005); der Client übersetzt per Code. Ältere Nachrichten ohne Code
 * werden über ihren deutschen Text erkannt, unbekannte Texte unverändert angezeigt.
 */
const systemCodes: Record<SystemCode, MessageKey> = {
  contact_exchanged: 'chat.system.contactExchanged',
  deal_reserved: 'chat.system.reserved',
  deal_completed: 'chat.system.completed',
  deal_cancelled: 'chat.system.cancelled',
  message_removed: 'chat.system.removed',
  message_deleted: 'chat.system.deleted',
};
const systemMessages: Record<string, MessageKey> = {
  'Kontaktdaten wurden ausgetauscht. Ihr seht die Hochschul-E-Mail-Adresse des anderen oben im Chat.': 'chat.system.contactExchanged',
  'Die Anzeige wurde für dich reserviert.': 'chat.system.reserved',
  'Die Anzeige wurde als an dich abgegeben markiert.': 'chat.system.completed',
  'Die Reservierung wurde aufgehoben.': 'chat.system.cancelled',
  '[Nachricht wurde von der Moderation entfernt]': 'chat.system.removed',
};
const systemText = (body: string, code?: SystemCode | null) => {
  const key = (code && systemCodes[code]) || systemMessages[body];
  return key ? t(key) : body;
};

export function ConversationsPage() {
  const { data, isPending, isError, error } = useConversations();
  const { data: me } = useMe();
  return (
    <div>
      <PageHeader title={t('nav.messages')} />
      {isPending ? (
        <Loading />
      ) : isError ? (
        <Alert tone="error">{errorMessage(error)}</Alert>
      ) : data.length === 0 ? (
        <EmptyState>{t('chat.empty')}</EmptyState>
      ) : (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {data.map((c) => (
            <li key={c.id}>
              <Link to="/messages/$id" params={{ id: c.id }} className="flex items-center gap-3 p-3 hover:bg-slate-50">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  {c.listing.thumbnailUrl ? <img src={c.listing.thumbnailUrl} alt="" className="h-full w-full object-cover" /> : <ImagePlaceholder label="" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className={cx('truncate', c.unreadCount > 0 && 'font-bold')}>{c.counterpart.displayName}</p>
                    {c.lastMessage && <time className="shrink-0 text-xs text-slate-600">{formatChatTime(c.lastMessage.createdAt)}</time>}
                  </div>
                  <p className="truncate text-sm text-slate-700">{c.listing.title}</p>
                  {c.lastMessage && (
                    <p className="truncate text-sm text-slate-600">
                      {c.lastMessage.senderId === me?.id && t('chat.you')}
                      {systemText(c.lastMessage.body)}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  {c.unreadCount > 0 && (
                    <span className="rounded-full bg-red-700 px-2 text-xs font-bold text-white">
                      {c.unreadCount}
                      <span className="sr-only"> {t('chat.unread')}</span>
                    </span>
                  )}
                  {c.deal && c.deal.status !== 'cancelled' && <Badge tone="info">{t(dealLabels[c.deal.status])}</Badge>}
                  {c.blocked && <Badge tone="danger">{t('chat.blocked')}</Badge>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface PendingMessage {
  clientMsgId: string;
  body: string;
  state: 'sending' | 'failed';
  error?: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function DealActions({ conversation }: { conversation: ConversationSummary }) {
  const deal = useDealAction(conversation.id);
  const status = conversation.deal?.status;
  const listingDone = conversation.listing.status === 'completed';
  if (conversation.role !== 'seller' || listingDone) return null;
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {status !== 'agreed' && conversation.listing.status === 'active' && (
          <Button variant="secondary" busy={deal.isPending} onClick={() => deal.mutate({ action: 'reserve' })}>
            {t('chat.deal.reserve')}
          </Button>
        )}
        {status === 'agreed' && (
          <>
            <Button variant="secondary" busy={deal.isPending} onClick={() => deal.mutate({ action: 'complete' })}>
              {t('listing.action.complete')}
            </Button>
            <Button variant="ghost" busy={deal.isPending} onClick={() => deal.mutate({ action: 'cancel' })}>
              {t('listing.action.unreserve')}
            </Button>
          </>
        )}
      </div>
      <FormError error={deal.isError ? errorMessage(deal.error) : null} />
    </div>
  );
}

function MessageBubble({ message, mine, onReport }: { message: Message; mine: boolean; onReport: () => void }) {
  if (message.kind === 'system') {
    return (
      <li className="my-2 text-center text-xs text-slate-600">
        <span className="rounded-full bg-slate-200 px-3 py-1">{systemText(message.body, message.systemCode)}</span>
      </li>
    );
  }
  return (
    <li className={cx('flex flex-col', mine ? 'items-end' : 'items-start')}>
      <div className={cx('max-w-[85%] rounded-2xl px-3 py-2', mine ? 'bg-brand-700 text-white' : 'bg-white text-slate-900 ring-1 ring-slate-200')}>
        <p className="whitespace-pre-wrap break-words">{message.body}</p>
      </div>
      {message.safetyHint && !mine && (
        <p className="mt-1 max-w-[85%] rounded bg-amber-50 px-2 py-1 text-xs text-amber-900" role="note">
          {t('chat.safetyHint')}{' '}
          <Link to="/hilfe" hash="welche-betrugsmaschen-gibt-es" className="font-medium underline">
            {t('chat.moreScams')}
          </Link>
        </p>
      )}
      <div className="mt-0.5 flex gap-2 text-xs text-slate-600">
        <time dateTime={message.createdAt}>{formatChatTime(message.createdAt)}</time>
        {mine && message.readAt && <span>· {t('chat.read')}</span>}
        {!mine && (
          <button type="button" className="underline" onClick={onReport}>
            {t('listing.report')}
          </button>
        )}
      </div>
    </li>
  );
}

export function ConversationPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const qc = useQueryClient();
  const { data: me } = useMe();
  const conversation = useConversation(id);
  const messages = useMessages(id);
  const block = useSetBlock();
  const [body, setBody] = useState('');
  const [pending, setPending] = useState<PendingMessage[]>([]);
  const [reportId, setReportId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const lastAnnounced = useRef<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const list = messages.data ?? [];
  const known = new Set(list.map((m) => m.clientMsgId));
  const visiblePending = pending.filter((p) => !known.has(p.clientMsgId));
  const unreadFromOther = list.some((m) => m.senderId !== me?.id && !m.readAt && m.kind === 'text');

  useEffect(() => {
    if (!unreadFromOther) return;
    void markRead(id).then(() => {
      void qc.invalidateQueries({ queryKey: ['unread'] });
      void qc.invalidateQueries({ queryKey: ['conversations'] });
    });
  }, [id, unreadFromOther, list.length, qc]);

  // Neue Nachrichten des Gegenübers für Screenreader ansagen und ans Ende scrollen
  const last = list.at(-1);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
    if (!last) return;
    if (lastAnnounced.current && last.id !== lastAnnounced.current && last.senderId !== me?.id) {
      setAnnouncement(t('chat.newMessage', { body: last.kind === 'system' ? systemText(last.body, last.systemCode) : last.body }));
    }
    lastAnnounced.current = last.id;
  }, [last, me?.id, visiblePending.length]);

  const deliver = async (msg: PendingMessage) => {
    setPending((prev) => [...prev.filter((p) => p.clientMsgId !== msg.clientMsgId), { ...msg, state: 'sending', error: undefined }]);
    for (let attempt = 0; ; attempt++) {
      try {
        const saved = await sendMessage(id, msg.body, msg.clientMsgId);
        addMessageToCache(qc, saved);
        setPending((prev) => prev.filter((p) => p.clientMsgId !== msg.clientMsgId));
        void qc.invalidateQueries({ queryKey: ['conversations'] });
        return;
      } catch (err) {
        // Netzfehler: mit derselben clientMsgId erneut senden (idempotent, REQ-CHAT-004)
        if (err instanceof NetworkError && attempt < 3) {
          await sleep(1000 * 2 ** attempt);
          continue;
        }
        const error =
          err instanceof ApiError && err.code === 'contact_not_possible' ? t('apiError.contact_not_possible') : errorMessage(err, t('chat.sendFailed'));
        setPending((prev) => prev.map((p) => (p.clientMsgId === msg.clientMsgId ? { ...p, state: 'failed', error } : p)));
        if (err instanceof ApiError && err.status === 403) void qc.invalidateQueries({ queryKey: ['conversation', id] });
        return;
      }
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    setBody('');
    void deliver({ clientMsgId: newId(), body: text, state: 'sending' });
  };

  if (conversation.isPending || messages.isPending) return <Loading />;
  if (conversation.isError) {
    return (
      <Alert tone="error" title={t('chat.unavailable')}>
        {errorMessage(conversation.error)}
      </Alert>
    );
  }
  const c = conversation.data;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-3">
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
        <Link to="/messages" className="text-sm text-brand-700 underline">
          <span aria-hidden="true">←</span> {t('chat.all')}
        </Link>
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
          {c.listing.thumbnailUrl ? <img src={c.listing.thumbnailUrl} alt="" className="h-full w-full object-cover" /> : <ImagePlaceholder label="" />}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-bold">{c.counterpart.displayName}</h1>
          <Link to="/listings/$id" params={{ id: c.listing.id }} className="block truncate text-sm text-brand-700 underline">
            {c.listing.title}
          </Link>
        </div>
        <div className="flex flex-col items-end gap-1">
          {c.deal && c.deal.status !== 'cancelled' ? (
            <Badge tone="info">{t(dealLabels[c.deal.status])}</Badge>
          ) : (
            <StatusBadge status={c.listing.status} />
          )}
        </div>
      </div>

      <DealActions conversation={c} />
      <ContactShare conversation={c} />

      <section aria-label={t('chat.history')} className="max-h-[60vh] min-h-64 overflow-y-auto rounded-xl bg-slate-100 p-3">
        {messages.isError && <Alert tone="error">{errorMessage(messages.error)}</Alert>}
        <ol className="space-y-2">
          {list.map((m) => (
            <MessageBubble key={m.id} message={m} mine={m.senderId === me?.id} onReport={() => setReportId(m.id)} />
          ))}
          {visiblePending.map((p) => (
            <li key={p.clientMsgId} className="flex flex-col items-end">
              <div className={cx('max-w-[85%] rounded-2xl px-3 py-2', p.state === 'failed' ? 'bg-red-50 text-red-900 ring-1 ring-red-300' : 'bg-brand-600/70 text-white')}>
                <p className="whitespace-pre-wrap break-words">{p.body}</p>
              </div>
              <p className="mt-0.5 text-xs text-slate-600">
                {p.state === 'sending' ? (
                  t('chat.sending')
                ) : (
                  <>
                    <span className="text-red-700">{p.error}</span>{' '}
                    <button type="button" className="underline" onClick={() => void deliver(p)}>
                      {t('chat.resend')}
                    </button>
                  </>
                )}
              </p>
            </li>
          ))}
        </ol>
        <div ref={endRef} />
      </section>
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>

      {c.blocked ? (
        <Alert tone="warning">{t('apiError.contact_not_possible')}</Alert>
      ) : (
        <form onSubmit={submit} className="space-y-1">
          <label htmlFor="chat-input" className="sr-only">
            {t('chat.message')}
          </label>
          <div className="flex gap-2">
            <textarea
              id="chat-input"
              rows={2}
              maxLength={2000}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }}
              aria-describedby="chat-counter"
              className="block flex-1 rounded-lg border border-slate-400 bg-white px-3 py-2 text-base"
              placeholder={t('chat.placeholder')}
            />
            <Button type="submit" disabled={!body.trim()}>
              {t('chat.send')}
            </Button>
          </div>
          <p id="chat-counter" className="text-right text-xs text-slate-600">
            {t('chat.counter', { count: body.length, max: 2000 })}
          </p>
        </form>
      )}

      <div className="flex flex-wrap gap-2">
        {!c.blocked && (
          <Button variant="ghost" busy={block.isPending} onClick={() => block.mutate({ userId: c.counterpart.id, blocked: true })}>
            {t('chat.block', { name: c.counterpart.displayName })}
          </Button>
        )}
      </div>
      <FormError error={block.isError ? errorMessage(block.error) : null} />
      <ReportDialog open={!!reportId} onClose={() => setReportId(null)} targetType="message" targetId={reportId ?? ''} />
    </div>
  );
}
