import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import type {
  ContactActionBody,
  ContactShare,
  ConversationSummary,
  Deal,
  DealActionBody,
  Message,
  StartConversationBody,
  StartConversationResult,
  UnreadCount,
} from '@campusmarkt/contracts';
import { api, qs } from './client';
import { useRealtimeConnected } from '../lib/realtime';

/** Polling nur im Degradationsmodus (WebSocket getrennt), ADR-0004. */
function usePollInterval() {
  return useRealtimeConnected() ? false : 10_000;
}

export function useConversations() {
  const refetchInterval = usePollInterval();
  return useQuery({
    queryKey: ['conversations'],
    queryFn: () => api<ConversationSummary[]>('/conversations'),
    refetchInterval,
  });
}

export const useConversation = (id: string) =>
  useQuery({ queryKey: ['conversation', id], queryFn: () => api<ConversationSummary>(`/conversations/${id}`) });

export function useMessages(id: string) {
  const qc = useQueryClient();
  const refetchInterval = usePollInterval();
  return useQuery({
    queryKey: ['messages', id],
    queryFn: async () => {
      const existing = qc.getQueryData<Message[]>(['messages', id]);
      const last = existing?.at(-1);
      if (!last) return api<Message[]>(`/conversations/${id}/messages${qs({ limit: 200 })}`);
      const newer = await api<Message[]>(`/conversations/${id}/messages${qs({ after: last.id, limit: 200 })}`);
      return mergeMessages(existing ?? [], newer);
    },
    refetchInterval,
  });
}

export function useUnread() {
  const refetchInterval = usePollInterval();
  return useQuery({
    queryKey: ['unread'],
    queryFn: () => api<UnreadCount>('/me/unread'),
    refetchInterval: refetchInterval || 60_000,
  });
}

export function mergeMessages(existing: Message[], incoming: Message[]): Message[] {
  const byId = new Map(existing.map((m) => [m.id, m]));
  for (const m of incoming) byId.set(m.id, m);
  return [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function addMessageToCache(qc: QueryClient, message: Message) {
  qc.setQueryData<Message[]>(['messages', message.conversationId], (old) =>
    old ? mergeMessages(old, [message]) : old,
  );
}

export function useStartConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: StartConversationBody) =>
      api<StartConversationResult>('/conversations', { method: 'POST', body }),
    onSuccess: (res) => {
      qc.setQueryData(['messages', res.conversationId], [res.message]);
      void qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export async function sendMessage(conversationId: string, body: string, clientMsgId: string) {
  return api<Message>(`/conversations/${conversationId}/messages`, { method: 'POST', body: { body, clientMsgId } });
}

export async function markRead(conversationId: string) {
  return api<void>(`/conversations/${conversationId}/read`, { method: 'POST' });
}

export function useDealAction(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: DealActionBody) =>
      api<Deal>(`/conversations/${conversationId}/deal`, { method: 'POST', body }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['conversation', conversationId] });
      void qc.invalidateQueries({ queryKey: ['conversations'] });
      void qc.invalidateQueries({ queryKey: ['messages', conversationId] });
      void qc.invalidateQueries({ queryKey: ['listing'] });
      void qc.invalidateQueries({ queryKey: ['myListings'] });
    },
  });
}

/** Kontaktfreigabe (REQ-CHAT-010): zustimmen, zurückziehen, ablehnen. */
export function useContactAction(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ContactActionBody) =>
      api<ContactShare>(`/conversations/${conversationId}/contact`, { method: 'POST', body }),
    onSuccess: (contact) => {
      qc.setQueryData<ConversationSummary>(['conversation', conversationId], (old) => (old ? { ...old, contact } : old));
      void qc.invalidateQueries({ queryKey: ['conversation', conversationId] });
      void qc.invalidateQueries({ queryKey: ['conversations'] });
      void qc.invalidateQueries({ queryKey: ['messages', conversationId] });
    },
  });
}
