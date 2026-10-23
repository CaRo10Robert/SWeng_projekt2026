import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateListingBody,
  ListingAction,
  ListingCard,
  ListingDetail,
  SearchQuery,
  SearchResult,
  UpdateListingBody,
  UploadResult,
} from '@campusmarkt/contracts';
import { api, qs } from './client';

export type SearchFilters = Omit<SearchQuery, 'cursor' | 'limit'>;

export function useSearch(filters: SearchFilters) {
  return useInfiniteQuery({
    queryKey: ['listings', filters],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) =>
      api<SearchResult>(`/listings${qs({ ...filters, cursor: pageParam, limit: 24 })}`, { signal }),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}

export const useListing = (id: string) =>
  useQuery({ queryKey: ['listing', id], queryFn: () => api<ListingDetail>(`/listings/${id}`) });

export const useMyListings = () =>
  useQuery({ queryKey: ['myListings'], queryFn: () => api<ListingCard[]>('/me/listings') });

export const useFavorites = () =>
  useQuery({ queryKey: ['favorites'], queryFn: () => api<ListingCard[]>('/me/favorites') });

function useListingInvalidation() {
  const qc = useQueryClient();
  return (detail?: ListingDetail) => {
    if (detail) qc.setQueryData(['listing', detail.id], detail);
    void qc.invalidateQueries({ queryKey: ['listings'] });
    void qc.invalidateQueries({ queryKey: ['myListings'] });
    void qc.invalidateQueries({ queryKey: ['favorites'] });
  };
}

export function useCreateListing() {
  const done = useListingInvalidation();
  return useMutation({
    mutationFn: (body: CreateListingBody) => api<ListingDetail>('/listings', { method: 'POST', body }),
    onSuccess: done,
  });
}

export function useUpdateListing(id: string) {
  const done = useListingInvalidation();
  return useMutation({
    mutationFn: (body: UpdateListingBody) => api<ListingDetail>(`/listings/${id}`, { method: 'PATCH', body }),
    onSuccess: done,
  });
}

export function useListingAction(id: string) {
  const done = useListingInvalidation();
  return useMutation({
    mutationFn: (action: ListingAction) =>
      api<ListingDetail>(`/listings/${id}/status`, { method: 'POST', body: { action } }),
    onSuccess: done,
  });
}

export function useDeleteListing(id: string) {
  const done = useListingInvalidation();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api<void>(`/listings/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.removeQueries({ queryKey: ['listing', id] });
      done();
    },
  });
}

export function useToggleFavorite(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (favorite: boolean) =>
      api<void>(`/listings/${id}/favorite`, { method: favorite ? 'PUT' : 'DELETE' }),
    onMutate: (favorite) => {
      qc.setQueryData<ListingDetail>(['listing', id], (old) => (old ? { ...old, isFavorite: favorite } : old));
    },
    onError: (_err, favorite) => {
      qc.setQueryData<ListingDetail>(['listing', id], (old) => (old ? { ...old, isFavorite: !favorite } : old));
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: ['favorites'] }),
  });
}

export async function uploadImages(files: File[]): Promise<UploadResult> {
  const fd = new FormData();
  for (const f of files) fd.append('files', f, f.name);
  return api<UploadResult>('/uploads', { method: 'POST', body: fd });
}
