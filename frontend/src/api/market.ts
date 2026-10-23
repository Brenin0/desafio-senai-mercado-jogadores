import { request, requestFile } from './http.ts';
import type {
  Purchase,
  Sale,
  TransactionHistory,
  TransactionType,
} from './types.ts';

export interface PurchaseInput {
  club_id: number;
  loyalty_until: string;
}

export function buyPlayer(
  playerId: number,
  input: PurchaseInput,
): Promise<Purchase> {
  return request<Purchase>(`/players/${playerId}/buy`, {
    method: 'POST',
    body: input,
  });
}

export function sellPlayer(playerId: number): Promise<Sale> {
  return request<Sale>(`/players/${playerId}/sell`, { method: 'POST' });
}

export interface TransactionFilters {
  types: TransactionType[];
  playerId?: number;
}

function transactionQuery({ types, playerId }: TransactionFilters) {
  return {
    type: types.length > 0 ? types.join(',') : undefined,
    player_id: playerId,
  };
}

export function listTransactions(
  clubId: number,
  filters: TransactionFilters,
): Promise<TransactionHistory> {
  return request<TransactionHistory>(`/clubs/${clubId}/transactions`, {
    query: transactionQuery(filters),
  });
}

export function exportTransactions(
  clubId: number,
  filters: TransactionFilters,
): Promise<Blob> {
  return requestFile(
    `/clubs/${clubId}/transactions/export`,
    transactionQuery(filters),
  );
}
