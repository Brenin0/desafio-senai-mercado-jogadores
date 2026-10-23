import { useMutation, useQueryClient } from '@tanstack/react-query';
import { buyPlayer, type PurchaseInput } from '../api/market.ts';
import { invalidate, queryKeys } from './query-keys.ts';

export function useBuyPlayer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      playerId,
      input,
    }: {
      playerId: number;
      input: PurchaseInput;
    }) => buyPlayer(playerId, input),
    onSuccess: () =>
      invalidate(queryClient, [
        queryKeys.players,
        queryKeys.clubs,
        queryKeys.transactions,
      ]),
  });
}
