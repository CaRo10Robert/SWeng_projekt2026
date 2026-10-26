import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AnnouncementBody, EndSessionsBody, EndSessionsResult, MaintenanceBody, SystemStatus } from '@campusmarkt/contracts';
import { api } from './client';

/** Öffentlicher Systemstatus inkl. Ankündigung (REQ-OPS-006/007); auch im Wartungsmodus erreichbar. */
export const statusQuery = {
  queryKey: ['status'],
  queryFn: () => api<SystemStatus>('/status'),
  staleTime: 60_000,
  refetchInterval: 60_000,
} as const;

export const useSystemStatus = () => useQuery(statusQuery);

export function useSetMaintenance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: MaintenanceBody) => api<SystemStatus>('/admin/maintenance', { method: 'PUT', body }),
    onSuccess: (status) => qc.setQueryData(statusQuery.queryKey, status),
  });
}

export function useSetAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AnnouncementBody | null) =>
      body
        ? api<SystemStatus>('/admin/announcement', { method: 'PUT', body })
        : api<SystemStatus>('/admin/announcement', { method: 'DELETE' }),
    onSuccess: (status) => qc.setQueryData(statusQuery.queryKey, status),
  });
}

/** Notfall (Incident-Prozess): alle Sitzungen beenden; die eigene Sitzung endet mit. */
export function useEndAllSessions() {
  return useMutation({
    mutationFn: (body: EndSessionsBody) => api<EndSessionsResult>('/admin/security/end-sessions', { method: 'POST', body }),
  });
}
