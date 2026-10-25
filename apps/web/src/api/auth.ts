import { useEffect } from 'react';
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
import { clearSessionLocaleChoice, localeChosenThisSession, onLocaleChosen, useLocale } from '../i18n';

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

/** Kenntnisnahme einer neuen Datenschutzerklärung, keine Einwilligung (REQ-LEGAL-002, RV-R-08). */
export function useAcknowledgePrivacy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (version: string) => api<Me>('/me/privacy-ack', { method: 'POST', body: { version } }),
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

/**
 * Sprache und Konto abgleichen (ADR-0016, REQ-UX-007): Eine ausdrückliche Wahl wird im Profil gespeichert.
 * Beim Anmelden gilt die Sprache des Kontos. Nur eine in derselben Sitzung vor der Anmeldung getroffene Wahl wird ins
 * Konto übernommen; eine ältere Wahl auf einem geteilten Gerät ändert die Kontosprache nicht (RV-C-08).
 */
let pendingLocale: string | null = null;

export function useAccountLocale() {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const { locale, apply } = useLocale();

  useEffect(
    () =>
      onLocaleChosen((chosen) => {
        if (!qc.getQueryData(meQuery.queryKey)) return;
        pendingLocale = chosen;
        api<Me>('/me', { method: 'PATCH', body: { locale: chosen } })
          .then((updated) => qc.setQueryData(meQuery.queryKey, updated))
          .catch(() => undefined)
          .finally(() => {
            pendingLocale = null;
          });
      }),
    [qc],
  );

  const accountLocale = me?.locale;
  useEffect(() => {
    if (!accountLocale || pendingLocale) return;
    const chosen = localeChosenThisSession();
    clearSessionLocaleChoice();
    if (chosen && chosen !== accountLocale) {
      pendingLocale = chosen;
      api<Me>('/me', { method: 'PATCH', body: { locale: chosen } })
        .then((updated) => qc.setQueryData(meQuery.queryKey, updated))
        .catch(() => undefined)
        .finally(() => {
          pendingLocale = null;
        });
      return;
    }
    if (accountLocale !== locale) apply(accountLocale);
  }, [accountLocale, locale, apply, qc]);
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: DeleteAccountBody) => api<Accepted>('/me/delete', { method: 'POST', body }),
    onSuccess: () => switchAccount(qc, null),
  });
}
