import { request } from './http.ts';
import type { Purchase, Sale } from './types.ts';

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
