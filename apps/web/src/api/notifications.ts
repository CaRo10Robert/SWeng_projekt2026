import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { NotificationPage, UnreadCount } from '@campusmarkt/contracts';
import { api, qs } from './client';

/** Zähler ungelesener Benachrichtigungen (REQ-NOTI-008); der Echtzeit-Kanal setzt ihn direkt (lib/realtime). */
export const useUnreadNotifications = (enabled = true) =>
  useQuery({
    queryKey: ['notifications', 'unread'],
    enabled,
    queryFn: () => api<UnreadCount>('/me/notifications/unread'),
    // Fallback ohne Echtzeit-Kanal (REQ-CHAT-003 Degradation): beim Seitenwechsel aktuell
    staleTime: 30_000,
  });

export function useNotificationList() {
  return useInfiniteQuery({
    queryKey: ['notifications', 'list'],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) => api<NotificationPage>(`/me/notifications${qs({ cursor: pageParam, limit: 20 })}`, { signal }),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}

function useInvalidateNotifications() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: ['notifications'] });
  };
}

export function useMarkNotification() {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: ({ id, read }: { id: string; read: boolean }) => api<void>(`/me/notifications/${id}/read`, { method: 'PUT', body: { read } }),
    onSuccess: invalidate,
  });
}

export function useMarkAllNotifications() {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: () => api<void>('/me/notifications/read-all', { method: 'POST' }),
    onSuccess: invalidate,
  });
}
