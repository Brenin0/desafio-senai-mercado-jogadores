import { request } from './http.ts';
import type { Purchase } from './types.ts';

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
