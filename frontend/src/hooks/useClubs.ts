import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClub, getClub, listClubs, type ClubSort } from '../api/clubs.ts';
import { invalidate, queryKeys } from './query-keys.ts';

export function useClubs(sort: ClubSort = 'name') {
  return useQuery({
    queryKey: [...queryKeys.clubs, { sort }],
    queryFn: () => listClubs(sort),
  });
}

export function useClub(id: number) {
  return useQuery({
    queryKey: [...queryKeys.clubs, id],
    queryFn: () => getClub(id),
  });
}

export function useCreateClub() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createClub,
    onSuccess: () =>
      invalidate(queryClient, [queryKeys.clubs, queryKeys.standings]),
  });
}
