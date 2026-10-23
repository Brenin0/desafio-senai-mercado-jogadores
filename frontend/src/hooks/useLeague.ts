import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getLineup,
  getMatch,
  getStandings,
  listMatches,
  playMatch,
  saveLineup,
  type LineupInput,
} from '../api/league.ts';
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

export function usePlayMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: playMatch,
    onSuccess: () =>
      invalidate(queryClient, [queryKeys.matches, queryKeys.standings]),
  });
}

export function useMatches(clubId?: number) {
  return useQuery({
    queryKey: [...queryKeys.matches, { clubId }],
    queryFn: () => listMatches(clubId),
  });
}

export function useMatch(id: number) {
  return useQuery({
    queryKey: [...queryKeys.matches, id],
    queryFn: () => getMatch(id),
  });
}

export function useStandings() {
  return useQuery({
    queryKey: queryKeys.standings,
    queryFn: getStandings,
  });
}
