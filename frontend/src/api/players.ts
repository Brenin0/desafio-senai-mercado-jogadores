import { request } from './http.ts';
import type { Condition, Paginated, Player, Position } from './types.ts';

export type PlayerSort =
  'name' | 'value_asc' | 'value_desc' | 'age_asc' | 'age_desc' | 'position';

export interface PlayerFilters {
  search?: string;
  position?: Position;
  condition?: Condition;
  free?: boolean;
  club_id?: number;
  min_age?: number;
  max_age?: number;
  min_value?: number;
  max_value?: number;
  sort?: PlayerSort;
}

export interface PlayerListQuery extends PlayerFilters {
  page: number;
  limit: number;
}

export function listPlayers(
  query: PlayerListQuery,
): Promise<Paginated<Player>> {
  return request<Paginated<Player>>('/players', { query: { ...query } });
}

export function deletePlayer(id: number): Promise<void> {
  return request<void>(`/players/${id}`, { method: 'DELETE' });
}
