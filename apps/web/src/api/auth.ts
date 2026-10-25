import { queryOptions, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import type {
  Accepted,
  DeleteAccountBody,
  LoginBody,
  Me,
  Meta,
  RegisterBody,
  ResetConfirmBody,
  UpdateMeBody,
} from '@campusmarkt/contracts';
import { api, ApiError } from './client';

export const meQuery = queryOptions({
  queryKey: ['me'],
  queryFn: async (): Promise<Me | null> => {
    try {
      return await api<Me>('/me');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return null;
      throw err;
    }
  },
  staleTime: 60_000,
});

export const metaQuery = queryOptions({
  queryKey: ['meta'],
  queryFn: () => api<Meta>('/meta'),
  staleTime: Infinity,
});

export const useMe = () => useQuery(meQuery);
export const useMeta = () => useQuery(metaQuery);

/**
 * Daten des vorherigen Kontos verwerfen, die `me`-Abfrage aber behalten und nur aktualisieren:
 * `clear()` würde sie entfernen, und Komponenten wie das Layout hingen dann an der entfernten Abfrage
 * (z. B. kein Zustimmungsdialog und keine Echtzeitverbindung bis zum Neuladen).
 */
function switchAccount(qc: QueryClient, me: Me | null) {
  qc.removeQueries({ predicate: (q) => q.queryKey[0] !== meQuery.queryKey[0] });
  qc.setQueryData(meQuery.queryKey, me);
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: LoginBody) => api<Me>('/auth/login', { method: 'POST', body }),
    onSuccess: (me) => switchAccount(qc, me),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api<void>('/auth/logout', { method: 'POST' }),
    onSettled: () => switchAccount(qc, null),
  });
}

export const useRegister = () =>
  useMutation({ mutationFn: (body: RegisterBody) => api<Accepted>('/auth/register', { method: 'POST', body }) });

export function useVerify() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => api<Me>('/auth/verify', { method: 'POST', body: { token } }),
    onSuccess: (me) => qc.setQueryData(meQuery.queryKey, me),
  });
}

export const useResendVerification = () =>
  useMutation({
    mutationFn: (email: string) => api<Accepted>('/auth/resend-verification', { method: 'POST', body: { email } }),
  });

export const useResetRequest = () =>
  useMutation({
    mutationFn: (email: string) => api<Accepted>('/auth/password-reset/request', { method: 'POST', body: { email } }),
  });

export const useResetConfirm = () =>
  useMutation({
    mutationFn: (body: ResetConfirmBody) => api<void>('/auth/password-reset/confirm', { method: 'POST', body }),
  });

export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateMeBody) => api<Me>('/me', { method: 'PATCH', body }),
    onSuccess: (me) => qc.setQueryData(meQuery.queryKey, me),
  });
}

/** Erneute Zustimmung zu einer neuen Fassung der Nutzungsbedingungen (REQ-LEGAL-003). */
export function useAcceptTerms() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (version: string) => api<Me>('/me/terms', { method: 'POST', body: { version } }),
    onSuccess: (me) => qc.setQueryData(meQuery.queryKey, me),
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: DeleteAccountBody) => api<Accepted>('/me/delete', { method: 'POST', body }),
    onSuccess: () => switchAccount(qc, null),
  });
}
