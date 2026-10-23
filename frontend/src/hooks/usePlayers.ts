import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  changePlayerCondition,
  createPlayer,
  deletePlayer,
  listPlayers,
  updatePlayer,
  type PlayerListQuery,
  type PlayerUpdate,
} from '../api/players.ts';
import type { Condition } from '../api/types.ts';
import { invalidate, queryKeys } from './query-keys.ts';

export function usePlayers(query: PlayerListQuery) {
  return useQuery({
    queryKey: [...queryKeys.players, query],
    queryFn: () => listPlayers(query),
    placeholderData: keepPreviousData,
  });
}

export function useCreatePlayer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPlayer,
    onSuccess: () => invalidate(queryClient, [queryKeys.players]),
  });
}

export function useUpdatePlayer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: PlayerUpdate }) =>
      updatePlayer(id, input),
    onSuccess: () =>
      invalidate(queryClient, [
        queryKeys.players,
        queryKeys.clubs,
        queryKeys.lineups,
      ]),
  });
}

export function useChangePlayerCondition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, condition }: { id: number; condition: Condition }) =>
      changePlayerCondition(id, condition),
    onSuccess: () =>
      invalidate(queryClient, [
        queryKeys.players,
        queryKeys.clubs,
        queryKeys.lineups,
      ]),
  });
}

export function useDeletePlayer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePlayer,
    onSuccess: () => invalidate(queryClient, [queryKeys.players]),
  });
}
