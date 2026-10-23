import { request } from './http.ts';
import type {
  Formation,
  Lineup,
  Match,
  MatchDetail,
  Standing,
} from './types.ts';

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

interface MatchInput {
  home_club_id: number;
  away_club_id: number;
}

export function playMatch(input: MatchInput): Promise<MatchDetail> {
  return request<MatchDetail>('/matches', { method: 'POST', body: input });
}

export function listMatches(clubId?: number): Promise<Match[]> {
  return request<Match[]>('/matches', { query: { club_id: clubId } });
}

export function getMatch(id: number): Promise<MatchDetail> {
  return request<MatchDetail>(`/matches/${id}`);
}

export function getStandings(): Promise<Standing[]> {
  return request<Standing[]>('/standings');
}
