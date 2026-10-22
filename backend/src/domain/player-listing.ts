import Decimal from 'decimal.js';
import { calculateMarketValue } from './market-value';
import { Page, paginate } from './pagination';
import { Player } from './player';
import { comparePositions } from './roster';
import { compareByNameAndId, compareNames, matchesSearch } from './text';

export const PLAYER_SORT_CRITERIA = [
  'name',
  'value_asc',
  'value_desc',
  'age_asc',
  'age_desc',
  'position',
] as const;
export type PlayerSortCriterion = (typeof PLAYER_SORT_CRITERIA)[number];
export const MAX_PLAYER_SORT_CRITERIA = 2;

/** O que a listagem faz na aplicação; os filtros que são colunas do banco já vêm aplicados. */
export interface PlayerListing {
  search?: string;
  minValue?: Decimal;
  maxValue?: Decimal;
  sort: PlayerSortCriterion[];
  page: number;
  limit: number;
}

interface ValuedPlayer {
  player: Player;
  marketValue: Decimal;
}

type Comparator = (a: ValuedPlayer, b: ValuedPlayer) => number;

/** RN07: critérios de `sort`; os de valor usam o valor de mercado, nunca o valor base. */
const COMPARATORS: Record<PlayerSortCriterion, Comparator> = {
  name: (a, b) => compareNames(a.player.name, b.player.name),
  value_asc: (a, b) => a.marketValue.comparedTo(b.marketValue),
  value_desc: (a, b) => b.marketValue.comparedTo(a.marketValue),
  age_asc: (a, b) => a.player.age - b.player.age,
  age_desc: (a, b) => b.player.age - a.player.age,
  position: (a, b) => comparePositions(a.player.position, b.player.position),
};

function isWithinValueRange(
  marketValue: Decimal,
  { minValue, maxValue }: PlayerListing,
): boolean {
  return (
    (minValue === undefined || marketValue.gte(minValue)) &&
    (maxValue === undefined || marketValue.lte(maxValue))
  );
}

/**
 * RN07: busca no nome, filtra pela faixa de valor de mercado, ordena pelos critérios (o segundo
 * desempata o primeiro; depois, nome e id crescente) e só então pagina.
 */
export function listPlayers(
  players: Player[],
  listing: PlayerListing,
): Page<Player> {
  const { search, sort, page, limit } = listing;
  const matching = players
    .filter(
      (player) => search === undefined || matchesSearch(player.name, search),
    )
    .map((player) => ({ player, marketValue: calculateMarketValue(player) }))
    .filter(({ marketValue }) => isWithinValueRange(marketValue, listing))
    .sort(
      (a, b) =>
        sort.reduce(
          (order, criterion) => order || COMPARATORS[criterion](a, b),
          0,
        ) || compareByNameAndId(a.player, b.player),
    );
  return paginate(
    matching.map(({ player }) => player),
    page,
    limit,
  );
}
