import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getLineup, saveLineup, type LineupInput } from '../api/league.ts';
import { invalidate, queryKeys } from './query-keys.ts';

export function useLineup(clubId: number) {
  return useQuery({
    queryKey: [...queryKeys.lineups, clubId],
    queryFn: () => getLineup(clubId),
  });
}

export function useSaveLineup(clubId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LineupInput) => saveLineup(clubId, input),
    onSuccess: () => invalidate(queryClient, [queryKeys.lineups]),
  });
}
