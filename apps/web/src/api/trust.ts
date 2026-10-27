import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  Accepted,
  AdminUser,
  Appeal,
  AppealDecisionBody,
  AppealReceipt,
  AuditPage,
  BlockedUser,
  CreateReportBody,
  Dac7Report,
  DecisionBody,
  EvidenceHoldPage,
  JobOverview,
  ModerationCase,
  ModerationNotice,
  Role,
  TokenAppealInfo,
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

/** Keyset-Paginierung (GL-14): weitere Seiten per `fetchNextPage`. */
export const useAudit = () =>
  useInfiniteQuery({
    queryKey: ['admin', 'audit'],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) => api<AuditPage>(`/admin/audit${qs({ cursor: pageParam, limit: 50 })}`, { signal }),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

export const useJobs = () =>
  useQuery({ queryKey: ['admin', 'jobs'], queryFn: () => api<JobOverview>('/admin/jobs'), refetchInterval: 5_000 });

export function useRunDueJobs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api<Accepted>('/admin/demo/run-due-jobs', { method: 'POST' }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin', 'jobs'] }),
  });
}

// ------------------------------------------------------------------ DSA: Mitteilungen und Widerspruch (REQ-LEGAL-006/007)

export const useNotices = (enabled = true) =>
  useQuery({
    queryKey: ['notices'],
    queryFn: () => api<ModerationNotice[]>('/me/notices'),
    enabled,
    refetchInterval: 60_000,
  });

export function useMarkNoticesRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api<void>('/me/notices/read', { method: 'POST' }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['notices'] }),
  });
}

export function useAppeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ decisionId, reason }: { decisionId: string; reason: string }) =>
      api<AppealReceipt>(`/moderation/decisions/${decisionId}/appeal`, { method: 'POST', body: { reason } }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['notices'] }),
  });
}

export const useTokenAppealInfo = (token: string | undefined) =>
  useQuery({
    queryKey: ['appeal-token', token],
    // Token im Body, nie in der URL (RV-C-07)
    queryFn: () => api<TokenAppealInfo>('/appeals/token/info', { method: 'POST', body: { token } }),
    enabled: !!token,
    retry: false,
  });

export const useTokenAppeal = () =>
  useMutation({
    mutationFn: (body: { token: string; reason: string }) => api<AppealReceipt>('/appeals/token', { method: 'POST', body }),
  });

export const useAppeals = (status: 'open' | 'decided') =>
  useQuery({
    queryKey: ['moderation', 'appeals', status],
    queryFn: () => api<Appeal[]>(`/moderation/appeals${qs({ status })}`),
  });

export function useDecideAppeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: AppealDecisionBody }) =>
      api<void>(`/moderation/appeals/${id}/decision`, { method: 'POST', body }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['moderation'] }),
  });
}

// ------------------------------------------------------------------ Administration (REQ-LEGAL-008/009)

export const dac7CsvUrl = (year: number) => `/api/v1/admin/reports/dac7${qs({ year, format: 'csv' })}`;

export const useDac7 = (year: number) =>
  useQuery({
    queryKey: ['admin', 'dac7', year],
    queryFn: () => api<Dac7Report>(`/admin/reports/dac7${qs({ year, format: 'json' })}`),
  });

export const useEvidenceHolds = () =>
  useInfiniteQuery({
    queryKey: ['admin', 'evidence-holds'],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) =>
      api<EvidenceHoldPage>(`/admin/evidence-holds${qs({ cursor: pageParam, limit: 50 })}`, { signal }),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

export function useReleaseHold() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/admin/evidence-holds/${id}/release`, { method: 'POST' }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin', 'evidence-holds'] }),
  });
}
