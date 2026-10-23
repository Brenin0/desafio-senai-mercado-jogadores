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

export interface PlayerUpdate {
  name: string;
  position: Position;
  agility: number;
  age: number;
}

export interface PlayerInput extends PlayerUpdate {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  potential: number;
}

export function createPlayer(input: PlayerInput): Promise<Player> {
  return request<Player>('/players', { method: 'POST', body: input });
}

export function updatePlayer(id: number, input: PlayerUpdate): Promise<Player> {
  return request<Player>(`/players/${id}`, { method: 'PUT', body: input });
}

export function changePlayerCondition(
  id: number,
  condition: Condition,
): Promise<Player> {
  return request<Player>(`/players/${id}/condition`, {
    method: 'PATCH',
    body: { condition },
  });
}

export function deletePlayer(id: number): Promise<void> {
  return request<void>(`/players/${id}`, { method: 'DELETE' });
}
