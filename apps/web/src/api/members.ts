import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import type { ListingCardPage, MemberProfile } from '@campusmarkt/contracts';
import { api, qs } from './client';

/** Profil eines anderen Mitglieds (REQ-ACC-005); 404 `profile_not_found`, wenn es nicht sichtbar ist. */
export const useMemberProfile = (id: string) =>
  useQuery({ queryKey: ['profile', id], queryFn: () => api<MemberProfile>(`/users/${id}/profile`), retry: false });

/** Aktive und reservierte Anzeigen des Mitglieds, neueste zuerst, seitenweise. */
export function useMemberListings(id: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ['listings', 'member', id],
    enabled,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) => api<ListingCardPage>(`/users/${id}/listings${qs({ cursor: pageParam, limit: 12 })}`, { signal }),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}
