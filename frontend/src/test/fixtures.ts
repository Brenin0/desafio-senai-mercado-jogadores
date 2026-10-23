import type { Club, Paginated, Player } from '../api/types.ts';

export const AGUIAS: Club = {
  id: 1,
  name: 'Águias FC',
  acronym: 'AGU',
  cash: 261.15,
  squad_value: 37,
  net_worth: 298.15,
};

/** Meia Lua (id 2) dos exemplos de 2.1.2 do enunciado. */
export const MEIA_LUA: Player = {
  id: 2,
  name: 'Meia Lua',
  position: 'MEI',
  agility: 85,
  age: 25,
  condition: 'MAL_CONDICIONADO',
  base_value: 40,
  market_value: 37,
  pace: 70,
  shooting: 68,
  passing: 82,
  dribbling: 79,
  defending: 55,
  physical: 64,
  potential: 86,
  overall: 75,
  club_id: null,
};

export const OTTO_RANGEL: Player = {
  ...MEIA_LUA,
  id: 3,
  name: 'Otto Rangel',
  club_id: 1,
};

export function playersPage(data: Player[]): Paginated<Player> {
  return {
    data,
    meta: { page: 1, limit: 10, total_items: data.length, total_pages: 1 },
  };
}
