import { useEffect, useSyncExternalStore } from 'react';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import type { Message, ServerEvent } from '@campusmarkt/contracts';

// Verbindungsstatus als kleiner externer Store, damit Queries im Degradationsmodus pollen können.
// `connecting` = erster Aufbau (noch kein Hinweis), `down` = Abbruch oder Fehlversuch (Hinweis zeigen).
type Status = 'connecting' | 'open' | 'down';
let status: Status = 'connecting';
const listeners = new Set<() => void>();
function setStatus(value: Status) {
  if (status === value) return;
  status = value;
  listeners.forEach((l) => l());
}

function useStatus(): Status {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => status,
  );
}

export function useRealtimeConnected(): boolean {
  return useStatus() === 'open';
}

export function useRealtimeDegraded(): boolean {
  return useStatus() === 'down';
}

function mergeInto(qc: QueryClient, conversationId: string, incoming: Message[]) {
  qc.setQueryData<Message[]>(['messages', conversationId], (old) => {
    if (!old) return old;
    const byId = new Map(old.map((m) => [m.id, m]));
    for (const m of incoming) byId.set(m.id, m);
    return [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  });
}

function handleEvent(qc: QueryClient, event: ServerEvent) {
  switch (event.type) {
    case 'message':
    case 'ack': {
      mergeInto(qc, event.message.conversationId, [event.message]);
      void qc.invalidateQueries({ queryKey: ['conversations'] });
      void qc.invalidateQueries({ queryKey: ['unread'] });
      break;
    }
    case 'read': {
      qc.setQueryData<Message[]>(['messages', event.conversationId], (old) =>
        old?.map((m) => (m.senderId !== event.readerId && !m.readAt ? { ...m, readAt: event.readAt } : m)),
      );
      void qc.invalidateQueries({ queryKey: ['conversations'] });
      void qc.invalidateQueries({ queryKey: ['unread'] });
      break;
    }
    case 'conversation': {
      void qc.invalidateQueries({ queryKey: ['conversations'] });
      void qc.invalidateQueries({ queryKey: ['conversation', event.conversationId] });
      void qc.invalidateQueries({ queryKey: ['messages', event.conversationId] });
      void qc.invalidateQueries({ queryKey: ['unread'] });
      break;
    }
    default:
      break;
  }
}

/** Nach einem Reconnect alle geöffneten Verläufe per `?after=` nachladen (ADR-0004). */
function catchUp(qc: QueryClient) {
  for (const query of qc.getQueryCache().findAll({ queryKey: ['messages'] })) {
    void qc.invalidateQueries({ queryKey: query.queryKey, exact: true });
  }
  void qc.invalidateQueries({ queryKey: ['conversations'] });
  void qc.invalidateQueries({ queryKey: ['unread'] });
}

/** Hält eine WebSocket-Verbindung für angemeldete Nutzer, mit exponentiellem Backoff (max. 30 s). */
export function useRealtime(enabled: boolean) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!enabled) return;
    let socket: WebSocket | null = null;
    let attempt = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let pingTimer: ReturnType<typeof setInterval> | undefined;
    let stopped = false;
    let hadConnection = false;

    const connect = () => {
      const url = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`;
      socket = new WebSocket(url);
      socket.onopen = () => {
        attempt = 0;
        setStatus('open');
        if (hadConnection) catchUp(qc);
        hadConnection = true;
        pingTimer = setInterval(() => socket?.send(JSON.stringify({ type: 'ping' })), 25_000);
      };
      socket.onmessage = (ev) => {
        try {
          handleEvent(qc, JSON.parse(String(ev.data)) as ServerEvent);
        } catch {
          // Unbekanntes Format ignorieren
        }
      };
      socket.onclose = () => {
        setStatus(stopped ? 'connecting' : 'down');
        clearInterval(pingTimer);
        if (stopped) return;
        const delay = Math.min(30_000, 1000 * 2 ** attempt) + Math.random() * 500;
        attempt += 1;
        timer = setTimeout(connect, delay);
      };
      socket.onerror = () => socket?.close();
    };

    connect();
    return () => {
      stopped = true;
      clearTimeout(timer);
      clearInterval(pingTimer);
      socket?.close();
      setStatus('connecting');
    };
  }, [enabled, qc]);
}
