import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  Accepted,
  AdminUser,
  AuditEntry,
  BlockedUser,
  CreateReportBody,
  DecisionBody,
  JobOverview,
  ModerationCase,
  Role,
} from '@campusmarkt/contracts';
import { api, qs } from './client';

export const useCreateReport = () =>
  useMutation({ mutationFn: (body: CreateReportBody) => api<{ id: string }>('/reports', { method: 'POST', body }) });

export const useBlocks = () => useQuery({ queryKey: ['blocks'], queryFn: () => api<BlockedUser[]>('/me/blocks') });

export function useSetBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, blocked }: { userId: string; blocked: boolean }) =>
      api<void>(`/users/${userId}/block`, { method: blocked ? 'PUT' : 'DELETE' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['blocks'] });
      void qc.invalidateQueries({ queryKey: ['conversations'] });
      void qc.invalidateQueries({ queryKey: ['conversation'] });
      void qc.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}

export const useModerationCases = (status: 'open' | 'decided') =>
  useQuery({
    queryKey: ['moderation', status],
    queryFn: () => api<ModerationCase[]>(`/moderation/cases${qs({ status })}`),
  });

export function useDecide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: DecisionBody }) =>
      api<void>(`/moderation/cases/${id}/decision`, { method: 'POST', body }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['moderation'] }),
  });
}

export const useAdminUsers = (q: string) =>
  useQuery({ queryKey: ['admin', 'users', q], queryFn: () => api<AdminUser[]>(`/admin/users${qs({ q })}`) });

export function useSetRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) =>
      api<void>(`/admin/users/${id}/role`, { method: 'POST', body: { role } }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}

export const useAudit = () =>
  useQuery({ queryKey: ['admin', 'audit'], queryFn: () => api<AuditEntry[]>('/admin/audit') });

export const useJobs = () =>
  useQuery({ queryKey: ['admin', 'jobs'], queryFn: () => api<JobOverview>('/admin/jobs'), refetchInterval: 5_000 });

export function useRunDueJobs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api<Accepted>('/admin/demo/run-due-jobs', { method: 'POST' }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin', 'jobs'] }),
  });
}
