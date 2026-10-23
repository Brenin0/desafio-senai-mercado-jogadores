import { request } from './http.ts';
import type { Formation, Lineup } from './types.ts';

export interface LineupInput {
  formation: Formation;
  player_ids: number[];
}

export function getLineup(clubId: number): Promise<Lineup> {
  return request<Lineup>(`/clubs/${clubId}/lineup`);
}

export function saveLineup(
  clubId: number,
  input: LineupInput,
): Promise<Lineup> {
  return request<Lineup>(`/clubs/${clubId}/lineup`, {
    method: 'PUT',
    body: input,
  });
}
