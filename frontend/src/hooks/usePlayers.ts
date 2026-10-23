import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  deletePlayer,
  listPlayers,
  type PlayerListQuery,
} from '../api/players.ts';
import { queryKeys } from './query-keys.ts';

export function usePlayers(query: PlayerListQuery) {
  return useQuery({
    queryKey: [...queryKeys.players, query],
    queryFn: () => listPlayers(query),
    placeholderData: keepPreviousData,
  });
}

export function useDeletePlayer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePlayer,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.players }),
  });
}
