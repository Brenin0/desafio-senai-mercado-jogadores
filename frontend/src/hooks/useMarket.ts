import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  buyPlayer,
  exportTransactions,
  listTransactions,
  sellPlayer,
  type PurchaseInput,
  type TransactionFilters,
} from '../api/market.ts';
import { downloadFile } from '../lib/download.ts';
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

export function useSellPlayer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sellPlayer,
    onSuccess: () =>
      invalidate(queryClient, [
        queryKeys.players,
        queryKeys.clubs,
        queryKeys.transactions,
      ]),
  });
}

export function useTransactions(clubId: number, filters: TransactionFilters) {
  return useQuery({
    queryKey: [...queryKeys.transactions, clubId, filters],
    queryFn: () => listTransactions(clubId, filters),
    placeholderData: keepPreviousData,
  });
}

export function useExportTransactions(clubId: number) {
  return useMutation({
    mutationFn: async (filters: TransactionFilters) =>
      downloadFile(
        await exportTransactions(clubId, filters),
        `historico-clube-${clubId}.csv`,
      ),
  });
}
