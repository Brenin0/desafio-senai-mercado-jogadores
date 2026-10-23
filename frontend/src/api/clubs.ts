import { request } from './http.ts';
import type { Club } from './types.ts';

export type ClubSort = 'name' | 'net_worth_asc' | 'net_worth_desc';

export function listClubs(sort: ClubSort): Promise<Club[]> {
  return request<Club[]>('/clubs', { query: { sort } });
}
