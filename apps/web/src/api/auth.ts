import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: LoginBody) => api<Me>('/auth/login', { method: 'POST', body }),
    onSuccess: (me) => {
      qc.clear();
      qc.setQueryData(meQuery.queryKey, me);
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api<void>('/auth/logout', { method: 'POST' }),
    onSettled: () => {
      qc.clear();
      qc.setQueryData(meQuery.queryKey, null);
    },
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

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: DeleteAccountBody) => api<Accepted>('/me/delete', { method: 'POST', body }),
    onSuccess: () => {
      qc.clear();
      qc.setQueryData(meQuery.queryKey, null);
    },
  });
}
